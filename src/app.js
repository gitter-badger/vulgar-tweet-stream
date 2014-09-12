var config = require('./config');

if (config.isProduction)
  require('newrelic');

// Mongo and Redis setup
var mongo = require('mongodb').MongoClient,
    redis = require('then-redis'),
    rdb = redis.createClient(config.redisUrl);

// connnect to mongo and process tweets
mongo.connect(config.mongoUrl, function (err, mdb){
  console.log('Starting tweet stream in', config.environment, 'mode...');

  var streamer = require('./streamer');
  streamer.run({ db: mdb, rdb: rdb });

  var webServer = require('./webserver')({ db: mdb, redis: rdb });
});
