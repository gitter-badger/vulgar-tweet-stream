var config = require('../config'),
    Twit = require('twit'),
    twitter = new Twit(config.twitterConfig),
    Tweet = require('./models').Tweet;

module.exports = function(phrases){
  var parser = require('./parser'),
  onProcessCallbacks = [],
  onMatchCallbacks = [],
  invokeOnProcess = function (tweet){
    onProcessCallbacks.forEach(function(item){ item(tweet); });
  },
  invokeOnMatch = function (tweet, terms){
    onMatchCallbacks.forEach(function(item){ item(tweet, terms); });
  },
  stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they', language: 'en'});

  console.info('starting stream');
  stream.on('tweet', function(tweet) {
    var result = parser.parseTweet(phrases, tweet);
    invokeOnProcess(tweet);

    if (result.match){
      var tweetModel = new Tweet(tweet, result.insults);
      invokeOnMatch(tweetModel, result.insults);
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
