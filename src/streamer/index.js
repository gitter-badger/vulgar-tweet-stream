var fs = require('fs'),
    config = require('../config'),
    counterName = config.isProduction ? 'live_counter' : 'dev_counter,'
    TWEETDUMP = config.isProduction ? 'tweetdump_live' : 'tweetdump_dev',
    redisAllTimeKey = config.isProduction ? 'all_time' : 'all_time_dev',
    counterCollection = undefined,
    tweetDump = undefined,
    context = require('./context');

module.exports.run = function(services){
  var rdb = services.rdb;
  counterCollection = services.db.collection('counter');
  tweetDump = services.db.collection(TWEETDUMP);

  context.setDumpCollection(tweetDump);

  initCounter(counterName, function(counterModel){

    // sync up redis
    Object.keys(counterModel.model).forEach(function(key){
      rdb.set(key, counterModel.model[key]);
    });

    var models = require('./models'),
    // create our database batchers
    tweetDumpBatcher = new models.Batcher(256, function(tweets){
      tweetDump.insert(tweets, {w:0}, function(err) { if(err) { console.error(err); throw err; } });
    }),
    counterBatcher = new models.Batcher(64, function(){
      counterCollection.save(counterModel, {w:0}, function(err){ if(err) { console.error(err); throw err; } });
    }),
    streamService = new require('./streamService')(counterModel.phrases());

    context.setCounterModel(counterModel);

    streamService.onMatch(function(tweetModel, insults){
      insults.forEach(function(term){
        var key = term;
        if (!config.isProduction)
          key = term + "_dev";

        // update counter model to new value
        counterModel.model[key] += 1;
        // add 1 to the existing value
        rdb.incr(key);
        rdb.publish('update', JSON.stringify({ key:key, value:counterModel.model[key] }));
      });

      counterBatcher.add(0);
      tweetDumpBatcher.add(tweetModel);

      context.updateMatchesPerSecond();
      context.updateLastMatch(tweetModel);

      if (insults.length > config.logLevel)
        console.log('MATCH -', insults, 'in', tweetModel.getContent(), tweetModel.getTweetLink());
    });

    streamService.onProcess(function(tweet){
      context.updateTweetsPerSecond();

      counterModel.all_time += 1;
      rdb.set(redisAllTimeKey, counterModel.all_time);
      rdb.publish('update', JSON.stringify({ key:'all_time', value:counterModel['all_time'] }));
    });

  });

  return context.serviceApi();
};


function initCounter(counterName, callback) {
  console.info('searching for', counterName);
  counterCollection.findOne({ name: counterName }, function(error, counterModel){
    if (error) throw error;
    console.log('reading in words_dictionary to bootstrap counters..');
    fs.readFile('./src/word_dictionary.txt', 'ascii', function (err, data) {
      var terms = data.trim().toLowerCase().split('\n');
      if (!counterModel) {
        counterModel = {
          name: counterName,
          all_time: 0,
          model: terms.reduce(function(acc, item) {
            acc[item] = 0;
            return acc;
          }, {})
        };
      } else if (Object.keys(counterModel.model).length !== terms.length){

        /* this check assumes that words are only added and not removed. When
         * words are removed it will still trigger this process.
         * i.e. this process will run every time because some words have been
         * removed from the production db
        */
        console.log('new terms found, adding new terms...');
        var words = Object.keys(counterModel.model);
        terms.forEach(function (term) {
          var wordExists = words.some(function (word) {
            return word === term;
          });
          if (!wordExists) {
            counterModel.model[term] = 0;
          }
        });
      }

      var phrases = Object.keys(counterModel.model);

      counterModel.phrases = function(){ return phrases; };

      callback(counterModel);
    });
  });
};


