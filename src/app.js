var timer = require('./timer')(),
    models = require('./models'),
    serviceProvider = require('./service'),
    parser = require('./parser'),
    logLevel = process.env['environment'] === 'production' ? 3 : 2;

// Twitter Setup
var Twit = require('twit'),
    twitter = new Twit({
      consumer_key: process.env['consumer_key'], 
      consumer_secret: process.env['consumer_secret'], 
      access_token: process.env['access_token'], 
      access_token_secret: process.env['access_token_secret'] 
    }),
    stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they', language: 'en'});

// Mongo and Redis setup
var mongo = require('mongodb').MongoClient,
    redis = require('then-redis'),
    rdb = redis.createClient(process.env['REDISCLOUD_URL']);

// connnect to mongo and process tweets
mongo.connect(process.env['MONGOHQ_URL'], function (err, mdb){
  serviceProvider(mdb, rdb, function(interactionContext){
    //timer.timer(function(tps) { console.log("Tweets Per Second:", tps); });
    console.log('Starting tweet stream...');
    stream.on('tweet', function(tweet) {
      var results = parser.parseTweet(interactionContext.counter.phrases(), tweet);
      interactionContext.counter.processedTweet();
      //timer.increment();
      if (results.match) {
        var tweetInfo = new models.Tweet(tweet, results.insults);
        if (results.insults.length > logLevel)
          console.log('MATCH -', results.insults, 'in', tweetInfo.content, tweetInfo.tweetLink);
        results.insults.forEach(function(term){ interactionContext.counter.put(term); });
        //interactionContext.persistTweet(tweetInfo);
      }
    });
  });
});
