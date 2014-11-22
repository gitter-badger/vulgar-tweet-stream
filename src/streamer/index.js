var config = require('../config'),
    word_list_collection = config.isProduction ? 'live_list' : 'dev_list',
    TWEETDUMP = config.isProduction ? 'tweetdump_live' : 'tweetdump_dev',
    redisAllTimeKey = config.isProduction ? 'all_time' : 'all_time_dev',
    counterCollection = undefined,
    tweetDump = undefined,
    wordCollection = undefined;

module.exports.run = function(services){
  var streamerMetricCollector = require('./context'),
  models = require('./models'),
  tweetDump = services.db.collection(TWEETDUMP),
  wordCollection = services.db.collection(word_list_collection),
  tweetDumpBatcher = new models.Batcher(256, function(tweets){
    tweetDump.insert(tweets, {w:0}, function(err) { if(err) { console.error(err); throw err; } });
  }),
  counterBatcher = new models.Batcher(128, function(terms){
    terms.forEach(function(term) {
      wordCollection.save(term, { w:0 }, function(err) {
        if(err) { 
          console.error(err); 
          throw err; 
        } 
      });
    });
  });

  initCounter(wordCollection, { 
                metrics: streamerMetricCollector, 
                redis: services.rdb,
                saveTweet: function(tweet){ tweetDumpBatcher.add(tweet); },
                saveCount: function(counter) { counterBatcher.add(counter); }
              }, app);
  return streamerMetricCollector.serviceApi(wordCollection, tweetDump, services);
};

function initCounter(wordCollection, services, callback) {
  wordCollection.find().toArray(function(error, terms){
    if (error) throw error;
    var counterModel = terms.filter(function(item) { return item.enabled; })
                            .reduce(function(acc, item){ acc[item.term] = item; return acc; }, {});
     services.phrases = Object.keys(counterModel).map(function(item) { return item; });

     callback(services, counterModel);
  });
};

function app(services, counterModel){
  var redis = services.redis, 
  streamService = new require('./streamService')(services.phrases),
  metrics = services.metrics;

  // sync up redis
  Object.keys(counterModel).forEach(function(key){ redis.set(key, counterModel[key].count); });


  // runs on every tweet match
  streamService.onMatch(function(tweetModel){
    var insults = tweetModel.matchedTerms;

    insults.forEach(function(term){
      counterModel[term].count += 1;
      services.saveCount(counterModel[term]);

      var key = term;
      if (!config.isProduction)
        key = term + "_dev";
      // update counter model to new value
      redis.incr(key);
      redis.publish('update', key);
    });

    services.saveTweet(tweetModel);

    // update our statistics
    metrics.updateMatchesPerSecond();
    metrics.updateLastMatch(tweetModel);

    if (insults.length > config.logLevel)
      console.log('MATCH -', insults, 'in', tweetModel.getContent(), tweetModel.getTweetLink());
  });

  streamService.onProcess(function(tweet){
    metrics.updateTweetsPerSecond();
    redis.incr(redisAllTimeKey);
    redis.publish('update', redisAllTimeKey);
  });

};
