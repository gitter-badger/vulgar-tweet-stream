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
  redisDb = redis.createClient(process.env['REDISCLOUD_URL']),
  counterStore = db.collection('counter'),
  tweetDumpStore = db.collection('tweetdump'),
  stream = twitter.stream('statuses/filter', {track: 'they,them,those,girl'});

  fs.readFile('src/word_dictionary.txt', 'ascii', function(err, data) {
    if (err) 
      throw err;

		counterStore.find({ $name: "vulgar_words_counter" }, function(err, counterModel){

			var counter = new lib.Counter("vulgar_words_counter", function( counterModel, input){
				// write to db and redis here
				queue.add(input);
				redisDb.publish('counter-update', JSON.stringify(counterModel));
			}, data.trim().split('\n')),
			queue = new lib.Queue(function(payload){
				tweetDumpStore.insert(payload, {w: 1}, function(err) { if (err) throw err; });
				counterStore.save(counter, {w:1}, function(err) { if (err) throw err; });
			});

			stream.on('tweet', function(tweet) {
				var tweetInfo = new lib.Tweet(tweet);
				counter.increment(tweetInfo);
			});
		});

  });
});
