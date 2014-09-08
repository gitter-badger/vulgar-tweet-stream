var fs = require('fs'),
    config = require('./config'),
    counterName = config.isProduction ? 'live_counter' : 'dev_counter,'
    TWEETDUMP = config.isProduction ? 'tweetdump_live' : 'tweetdump_dev',
    redisAllTimeKey = config.isProduction ? 'all_time' : 'all_time_dev';

module.exports = function(mdb, rdb, callback) {
  // These two variables are leaky but it works in our favor
  counterCollection = mdb.collection('counter'),
  tweetDump = mdb.collection(TWEETDUMP);

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
      execute(counterModel, rdb, callback);
    });
  });
};


function execute (counterModel, rdb, callback){
  var tweetBatch = new Batcher(256, function(tweets){
   tweetDump.insert(tweets, {w:0}, function(err) { if(err) throw err; });
  }),
  counterBatch = new Batcher(64, function(){
    counterCollection.save(counterModel, {w:0}, function(err){ if (err) throw err; });
  }),
  interactionContext = {
    counter: {
      processedTweet: function() {
        counterModel.all_time += 1;
        rdb.set(redisAllTimeKey, counterModel.all_time);
      },
      put: function(key){
        if (key)
        {
          if (!config.isProduction)
            key = key + "_dev";

          // update counter model to new value
          // add 1 to the existing value
          counterModel.model[key] += 1;
          rdb.incr(key);

          rdb.publish('update', JSON.stringify({ key:key, value:counterModel.model[key] }));
          counterBatch.add(0);
        }
      },
      get: function(key) {
        return counterModel.model[key];
      },
      phrases: function() {
        return Object.keys(counterModel.model);
      }
    },
    persistTweet: function(tweet) { tweetBatch.add(tweet); }
  };
  callback(interactionContext);
}

var Batcher = function(limit, callback) {
  var batch = [],
  batchSize = limit || 96;

  this.flush = function(){
    callback(batch);
    batch = [];
  };
  this.add = function(item) {
    batch.push(item);
    if (batch.length >= batchSize)
      this.flush();
  };
};
