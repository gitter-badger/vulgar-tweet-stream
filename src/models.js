var regexp = require('node-regexp');

exports.Tweet = function(tweet){
  this.time = new Date(tweet.created_at);
  this.tweetId = tweet.id_str;

  this.username= tweet.user.screen_name;

  if (tweet.user.location && tweet.user.location !== "")
    this.user_location= tweet.user.location;

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
  else { this.source = "unknown"; }

  this.content = tweet.text;
  this.toString = function(){
    return this.user.name + ": " + this.content;
  };
};
