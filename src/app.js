var timer = require('./timer')(),
    models = require('./models'),
    serviceProvider = require('./service');

// Twitter Setup
var Twit = require('twit'),
    twitter = new Twit({
      consumer_key: process.env['consumer_key'], 
      consumer_secret: process.env['consumer_secret'], 
      access_token: process.env['access_token'], 
      access_token_secret: process.env['access_token_secret'] 
    }),
    stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they'});

// Mongo and Redis setup
var mongo = require('mongodb').MongoClient,
    redis = require('then-redis'),
    rdb = redis.createClient(process.env['REDISCLOUD_URL']);

// This is weird because the mongodb client you are using doesn't allow you to 
// just pass around the db object. Look at the mongoose and monk modules. They
// do this a bit differently.
mongo.connect(process.env['MONGOHQ_URL'], function (err, mdb){
  serviceProvider(mdb, rdb, function(interactionContext){
    var parser = require('./parser')(interactionContext);
    //timer.timer(function(tps) { console.info("Tweets Per Second:", tps); });
    console.info('Starting tweet stream...');
    stream.on('tweet', function(tweet) {
      var results = parser.parseTweet(tweet);
      interactionContext.counter.processedTweet();
      //timer.increment();
      if (results.match) {
        var tweetInfo = new models.Tweet(tweet, results.insults);
        if (results.insults.length > 3)
          console.info('MATCH -', results.insults, 'in', tweetInfo.content, tweetInfo.tweetLink);
        results.insults.forEach(function(term){ interactionContext.counter.put(term); });
        //interactionContext.persistTweet(tweetInfo);
      }
    });
  });
});
