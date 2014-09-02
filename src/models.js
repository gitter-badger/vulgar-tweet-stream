var regexp = require('node-regexp');

exports.Tweet = function(tweet, matchedTerms){
  this.tweetId = tweet.id_str;
  this.matchedTerms = matchedTerms;

  if(tweet.place || tweet.coordinates)
    this.tweet_location = { 
      geo: tweet.geo,
      coordinates: tweet.coordinates,
      place: tweet.place
    };

  if (tweet.source && tweet.source != null ) {
    var sourceDevice = regexp().find("Twitter for (\\w+)").ignoreCase().toRegExp().exec(tweet.source);
    if (sourceDevice != null) this.source = sourceDevice[2];
  }

  this.getTime = function() { return new Date(tweet.created_at); };
  this.getContent = function() { return tweet.text.trim(); };
  this.getUsername = function() { return tweet.user.screen_name.trim(); };
  this.getTweetLink = function() { return "http://twitter.com/" + tweet.user.screen_name +"/status/"+ tweet.id_str; };

  this.toString = function(){
    return this.user.name + ": " + this.content;
  };
};
