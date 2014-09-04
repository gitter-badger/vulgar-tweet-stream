var timer = require('./timer')(),
    models = require('./models'),
    serviceProvider = require('./service'),
    parser = require('./parser'),
    config = require('./config').config;

// Twitter Setup
var Twit = require('twit'),
    twitter = new Twit(config.twitterConfig),
    stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they', language: 'en'});

// Mongo and Redis setup
var mongo = require('mongodb').MongoClient,
    redis = require('then-redis'),
    rdb = redis.createClient(config.redisUrl);

// connnect to mongo and process tweets
mongo.connect(config.mongoUrl, function (err, mdb){
  serviceProvider(mdb, rdb, function(interactionContext){
    //timer.timer(function(tps) { console.log("Tweets Per Second:", tps); });
    console.log('Starting tweet stream...');
    stream.on('tweet', function(tweet) {
      var results = parser.parseTweet(interactionContext.counter.phrases(), tweet);
      interactionContext.counter.processedTweet();
      //timer.increment();
      if (results.match) {
        var tweetInfo = new models.Tweet(tweet, results.insults);
        if (results.insults.length > config.logLevel)
          console.log('MATCH -', results.insults, 'in', tweetInfo.getContent(), tweetInfo.getTweetLink());
        results.insults.forEach(function(term){ interactionContext.counter.put(term); });
        interactionContext.persistTweet(tweetInfo);
      }
    });
  });
});
