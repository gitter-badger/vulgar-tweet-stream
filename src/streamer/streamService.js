var config = require('../config'),
    Twit = require('twit'),
    twitter = new Twit(config.twitterConfig),
    Tweet = require('./models').Tweet;

module.exports = function(phrases){
  var parser = require('./parser'),
  onProcessCallbacks = [],
  onMatchCallbacks = [],
  onMatch = function(callback) {
    onMatchCallbacks.push(callback);
  },
  onProcess = function(callback) {
    onProcessCallbacks.push(callback);
  },
  invokeOnProcess = function (tweet){
    onProcess.forEach(function(item){ item(tweet); });
  },
  invokeOnMatch = function (tweet, terms){
    onMatch.forEach(function(item){ item(tweet, terms); });
  },
  stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they', language: 'en'});

  stream.on('tweet', function(tweet) {
    var result = parser.parseTweet(phrases, tweet);
    invokeOnProcess(tweet);

    if (result.match){
      var tweetModel = new Tweet(tweet, result.insults);
      invokeOnMatch(tweetModel, result.insults);
    }
  });
};
