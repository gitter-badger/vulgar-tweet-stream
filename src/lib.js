var moment = require('moment');

exports.Queue = function(flushTarget, limit) {
  var queue = [],
  queueSize = limit || 96;

  this.add = function(item) {
    queue.push(item);
    if (queue.length >= queueSize)
      this.flush();
  };

  this.flush = function(){
    console.log("Flushing ", limit, " items..");
    flushTarget(queue);
    queue = [];
  };
};

exports.Tweet = function(tweet){
  this.time = new Date(tweet.created_at);
  this.tweetId = tweet.id_str;

  this.user = { 
    name: tweet.user.name, 
    username: tweet.user.screen_name
   };

  this.location = { 
    geo: tweet.geo,
    coordinates: tweet.coordinates,
    place: tweet.place
  };

  this.source = tweet.source

  this.content = {
    text: tweet.text,
    favorites: tweet.favorite_count,
    retweets: tweet.retweet_count
  };

  this.created = function(){ 
    return moment(this.time);
  };

  this.toString = function(){
    return this.user.name + ": " + this.content.text;
  };
};

exports.Dictionary = function(phrases){
  this.parse = function(text){
    phrases.forEach(function(phrase){
      var regex = ".*\s?(" + phrase + ")\s+";
      if (text.match(regex)) {
        console.info("found an insult using ", phrase, " in ", text);
        return phrase;
      }
    });
  };
};

exports.Counter = function(saveFunction, phrases, data){
  console.info(phrases);
  var dictionary = new exports.Dictionary(phrases.map(function(item) { return item.toLowerCase(); }));
  this.counters = data || {};
  this.increment = function(tweet){
    var phrase = dictionary.parse(tweet.content.text);
    if (phrase) {
      console.info('found an insult!');
      this.counters[phrase] += 1;
      tweet.phrase_id = phrase;
      saveFunction(tweet);
    }
  };
};

