var config = require('../config'),
    Twit = require('twit'),
    Tweet = require('./models').Tweet,
    twitter = new Twit(config.twitterConfig);

module.exports = function(phrases){
  var parser = require('./parser'),
  onProcessCallbacks = [],
  onMatchCallbacks = [],
  invokeOnProcess = function (tweet){
    onProcessCallbacks.forEach(function(item){ item(tweet); });
  },
  invokeOnMatch = function (tweet){
    onMatchCallbacks.forEach(function(item){ item(tweet); });
  },
  stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they', language: 'en'});

  console.info('starting stream');
  var count = 0;
  stream.on('tweet', function(tweet) {
    console.log(count++);
    var result = parser.parseTweet(phrases, tweet);
    invokeOnProcess(tweet);

    if (result.match) {
      var tweetModel = new Tweet(tweet, result.insults);
      invokeOnMatch(tweetModel);
    }
  });

  return {
    onMatch: function(callback) {
      onMatchCallbacks.push(callback);
    },
    onProcess: function(callback) {
      onProcessCallbacks.push(callback);
    }
  };
};

