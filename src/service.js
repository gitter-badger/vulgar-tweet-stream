var fs = require('fs'),
    config = require('./config'),
    counterName = config.isProduction ? 'live_counter' : 'dev_counter,'
    TWEETDUMP = config.isProduction ? 'tweetdump_live' : 'tweetdump_dev',
    redisKey = config.isProduction ? 'all_time' : 'all_time_dev';

module.exports = function(mdb, rdb, callback) {
    counterCollection = mdb.collection('counter'),
    tweetDump = mdb.collection(TWEETDUMP);

    counterCollection.findOne({ name: counterName }, function(error, counterModel){
      if (error) throw error;
      if (!counterModel) {
        console.log('reading in words_dictionary to bootstrap counters..');
        fs.readFile('./src/word_dictionary.txt', 'ascii', function(err, data) {
          var terms = data.trim().toLowerCase().split('\n');
          counterModel = { 
            name: counterName, 
            all_time: 0,
            model: terms.reduce(function(acc, item) { 
              acc[item] = 0; 
              return acc; 
            }, {}) 
          };
          execute(counterModel, rdb, callback); 
        });
      }
      else
        execute(counterModel, rdb, callback);
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
        rdb.set(redisKey, counterModel.all_time);
      },
      put: function(key, value){
        if (key) 
        {
          // update counter model to new value 
          if (value || counterModel.model[key] === undefined) { 
            value = value || 0;
            counterModel.model[key] = value;
            rdb.set(redisKey, value);
          }
          // add 1 to the existing value
          else {
            counterModel.model[key] += 1;
            rdb.incrby(redisKey);
          }
          rdb.publish('update', JSON.stringify({ key:key, value:counterModel.model[key] }));
          counterBatch.add(0);
        }
      },
      get: function(key) { 
        return counterModel.model[key]; 
      },
      phrases: function() { 
        var keys = [];
        for (key in counterModel.model) keys.push(key);
        return keys; 
      }
    },
    persistTweet: function(tweet) { tweetBatch.add(tweet); }
  };
  callback(interactionContext);
};

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
