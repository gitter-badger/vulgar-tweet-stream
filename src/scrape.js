var Twit = require('twit'),
mongo = require('mongodb').MongoClient,
redis = require('then-redis'),
lib = require('./lib'),
fs = require('fs');


function runName() {
  return "vulgar_words_counter" + (process.env['environment'] ? "" : "_debug")
};

exports.start = function(){
  var database = mongo.connect(process.env['MONGOHQ_URL'], function(err, db){
    if (err) throw err;

    var twitter = new Twit({
      consumer_key: process.env['consumer_key'], 
      consumer_secret: process.env['consumer_secret'], 
      access_token: process.env['access_token'], 
      access_token_secret: process.env['access_token_secret'] 
    }),
    redisDb = redis.createClient(process.env['REDISCLOUD_URL']),
    counterStore = db.collection('counter'),
    tweetDumpStore = db.collection('tweetdump' + (process.env['environment'] ? '' : '_debug')),
    stream = twitter.stream('statuses/filter', {track: 'the,girl,she,he,they,a,e,i,o,u,y'});

    fs.readFile('./src/word_dictionary.txt', 'ascii', function(err, data) {
      if (err) throw err;

      counterStore.findOne({ name: runName() }, function(err, counterModel){
        if (err) throw err;
        var counter = new lib.Counter(runName(), function(updatedCounter, input){
          queue.add(input);
          redisDb.publish('counter-update', JSON.stringify(updatedCounter));
          counterStore.save(updatedCounter, {w:1}, function(err) { if (err) throw err; });
        }, data.trim().split('\n'), counterModel.name ? counterModel : undefined),
        queue = new lib.Queue(function(payload){
          tweetDumpStore.insert(payload, {w: 1}, function(err) { if (err) throw err; });
        });

        stream.on('tweet', function(tweet) {
          var tweetInfo = new lib.Tweet(tweet);
          counter.increment(tweetInfo);
        });
      });

    });
  });
};
