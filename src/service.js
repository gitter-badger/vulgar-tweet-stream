
module.exports = function(callback) {
  var redis = require('then-redis'),
  mongo = require('mongodb').MongoClient,
  fs = require('fs'),
  REDIS = process.env['REDISCLOUD_URL'],
  MONGO = process.env['MONGOHQ_URL'],
  counterName = process.env['environment'] === 'production' ? 'live_counter' : 'dev_counter,'
  TWEETDUMP = process.env['environment'] === 'production' ? 'tweetdump_live' : 'tweetdump_dev';

  var mongoDb = mongo.connect(MONGO, function(err, db){
    if (err) throw err;

    var redisDb = redis.createClient(REDIS),
    counterCollection = db.collection('counter'),
    tweetDump = db.collection(TWEETDUMP);
    execute = function (callback, counterModel){
      var queue = new Queue(64, function(tweets){
       tweetDump.insert(tweets, {w:0}, function(err) { if(err) throw err; }); 
      }),
      counterQueue = new Queue(256, function(){
        counterCollection.save(counterModel, {w:0}, function(err){ if (err) throw err; });
      }),
      interactionContext = {
        counter: {
          processedTweet: function() { counterModel.all_time += 1; },
          put: function(key, value){
            if (key) 
            {
              // update counter model to new value 
              if (value || counterModel.model[key] === undefined) { 
                value = value || 0;
                counterModel.model[key] = value;
                redisDb.set(key, value);
              }
              // add 1 to the existing value
              else {
                counterModel.model[key] += 1;
                redisDb.incrby(key, 1);
              }
              redisDb.publish('update', JSON.stringify({ key:key, value:counterModel.model[key] }));
              counterQueue.add(0);
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
        persistTweet: function(tweet) { queue.add(tweet); }
      };
      callback(interactionContext);
    };

    counterCollection.findOne({ name: counterName }, function(error, counterModel){
      if (error) throw error;
      if (!counterModel) {
        console.info('reading in words_dictionary to bootstrap counters..');
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
          execute(callback, counterModel); 
        });
      }
      else
        execute(callback, counterModel);
    });
  });
};


var Queue = function(limit, callback) {
  var queue = [],
  queueSize = limit || 96;

  this.flush = function(){
    console.log("Flushing ", limit, " items..");
    callback(queue);
    queue = [];
  };
  this.add = function(item) {
    queue.push(item);
    if (queue.length >= queueSize)
      this.flush();
  };

};
