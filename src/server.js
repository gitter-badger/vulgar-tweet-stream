var Twit = require('twit'),
mongo = require('mongodb').MongoClient,
redis = require('then-redis'),
lib = require('./lib'),
fs = require('fs');

var database = mongo.connect(process.env['MONGOHQ_URL'], function(err, db){
  if (err) throw err;

  var twitter = new Twit({
    consumer_key: process.env['consumer_key'], 
    consumer_secret: process.env['consumer_secret'], 
    access_token: process.env['access_token'], 
    access_token_secret: process.env['access_token_secret'] 
  }),
  redisClient = redis.createClient(process.env['REDISCLOUD_URL']),
  counterStore = db.collection('counter'),
  tweetDumpStore = db.collection('tweetdump'),
  stream = twitter.stream('statuses/sample', {lang: 'en'});

  fs.readFile('src/word_dictionary.txt', 'ascii', function(err, data) {
    if (err) 
      throw err;

    var counter = new lib.Counter(function(input){
      
    }, data.trim().split('\n'));

    stream.on('tweet', function(tweet) {
      var tweetInfo = new lib.Tweet(tweet);
      counter.increment(tweetInfo);
    });

  });
});
