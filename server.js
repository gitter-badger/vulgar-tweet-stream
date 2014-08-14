var Twit = require('twit'),
mongo = require('mongodb').MongoClient,
redis = require('then-redis'),
Queue = require('./queue').Queue;

var T = new Twit({
  consumer_key: process.env['consumer_key'], 
  consumer_secret: process.env['consumer_secret'], 
  access_token: process.env['access_token'], 
  access_token_secret: process.env['access_token_secret'] 
});

var redisClient = redis.createClient({
  host: 'pub-redis-14678.us-east-1-4.1.ec2.garantiadata.com',
  port: 14678,
  database: 'redis-tweetscraper',
  password: 'rCH8ARtgXRXhiCug'
});

var database = mongo.connect(process.env['MONGOHQ_URL'], function(err, db){
  if (err) throw err;

  var stream = T.stream('statuses/filter', { language: 'en',  });
  var streamQueue = new Queue(function(){ 
    tweetScrape.insert(queue, {w:1}, function(err){ if (err) throw err; queue = [];});
  }, 10);

  stream.on('tweet', function(tweet) {
    var tweetInfo = tweet.user.name + ": " + tweet.text;
    console.log(tweetInfo);
    streamQueue.add({ 
      run: scrapeName, 
      name: tweet.user.name, 
      text: tweet.text
    });
  });

});
