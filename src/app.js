var timer = require('./timer')(),
    models = require('./models'),
    serviceProvider = require('./service'),
    parser = require('./parser'),
    config = require('./config');

if (config.isProduction)
  require('newrelic');

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
  console.log('Starting tweet stream in', config.environment, 'mode...');
  var streamer = require('./streamer')({ db: mdb, rdb: rdb });

  var webServer = require('./webserver')({ db: mdb, redis: rdb });
});
