var config = require('../config'),
    word_list_collection = config.isProduction ? 'live_list' : 'dev_list',
    TWEETDUMP = config.isProduction ? 'tweetdump_live' : 'tweetdump_dev',
    redisAllTimeKey = config.isProduction ? 'all_time' : 'all_time_dev',
    counterCollection = undefined,
    tweetDump = undefined,
    wordCollection = undefined,
    context = require('./context');

module.exports.run = function(services){
  var rdb = services.rdb;
  tweetDump = services.db.collection(TWEETDUMP);
  wordCollection = services.db.collection(word_list_collection);


  initCounter(function(counterModel){

    // sync up redis
    Object.keys(counterModel).forEach(function(key){
      rdb.set(key, counterModel[key].count);
    });

    var models = require('./models'),
    // create our database batchers
    tweetDumpBatcher = new models.Batcher(256, function(tweets){
      tweetDump.insert(tweets, {w:0}, function(err) { if(err) { console.error(err); throw err; } });
    }),
    counterBatcher = new models.Batcher(128, function(terms){
      terms.forEach(function(term) {
        wordCollection.save(term, { w:0 }, function(err){ if(err) { console.error(err); throw err; } });
      });
    }),
    streamService = new require('./streamService')(counterModel.phrases);

    context.setCounterModel(counterModel);
    context.setDumpCollection(tweetDump);

    streamService.onMatch(function(tweetModel, insults){
      insults.forEach(function(term){
        counterModel[term].count += 1;
        counterBatcher.add(counterModel[term]);

        var key = term;
        if (!config.isProduction)
          key = term + "_dev";
        // update counter model to new value
        rdb.incr(key);
        rdb.publish('update', '{"key":' + key + '}');
      });

      tweetDumpBatcher.add(tweetModel);

      context.updateMatchesPerSecond();
      context.updateLastMatch(tweetModel);

      if (insults.length > config.logLevel)
        console.log('MATCH -', insults, 'in', tweetModel.getContent(), tweetModel.getTweetLink());
    });

    streamService.onProcess(function(tweet){
      context.updateTweetsPerSecond();
      rdb.incr(redisAllTimeKey);
      rdb.publish('update', '{"key":"all_time"}');
    });

  });

  return context.serviceApi();
};


function initCounter(callback) {
  // idea
  // remove counter model concept entirely, replace it with an entire collection of words
  // where each document is { term: string, count: number, enabled: bool }
  // just need to figure out where to save the all time tweet count
  console.log('reading in words collection to bootstrap counters..');
  wordCollection.find().toArray(function(error, terms){
    if (error) throw error;
    var counterModel = terms.filter(function(item) { return item.enabled; })
                        .reduce(function(acc, item){
                            acc[item.term] = item;
                            return acc;
                        });

    counterModel.phrases = terms.map(function(item) { return item.term; });
    console.info('loaded counter');
    callback(counterModel);
  });
};
