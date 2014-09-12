var regexp = require('node-regexp');

exports.Tweet = function(tweet, matchedTerms){
  this.tweetId = tweet.id_str;
  this.matchedTerms = matchedTerms;
  this.username = tweet.user.screen_name;

  if(tweet.place || tweet.coordinates)
    this.tweet_location = {
      geo: tweet.geo,
      coordinates: tweet.coordinates,
      place: tweet.place
    };

  if (tweet.source && tweet.source !== null ) {
    var sourceDevice = regexp().find("Twitter for (\\w+)").ignoreCase().toRegExp().exec(tweet.source);
    if (sourceDevice !== null) this.source = sourceDevice[2];
  }

  this.getTime = function() { return new Date(tweet.created_at); };
  this.getContent = function() { return tweet.text.trim(); };
  this.getTweetLink = function() { return "http://twitter.com/" + tweet.user.screen_name +"/status/"+ tweet.id_str; };

  this.toString = function(){
    return [this.tweetId,this.username,this.getContent,this.matchedTerms].join(',');
  };
};

exports.Batcher = function(limit, callback) {
  var batch = [],
  batchSize = limit || 96;

  this.flush = function(){
    callback(batch);
    batch = [];
  };
  this.add = function(item) {
    batch.push(item);
    if (batch.length >= batchSize)
      this.flush();
  };
};
