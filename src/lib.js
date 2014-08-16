var moment = require('moment'),
regexp = require('node-regexp');

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
	this.phrases = phrases;
  this.parse = function(text){
    var tags = [];

    phrases.forEach(function(phrase){
      if (regexp().find("\\s" + phrase + "s?\\s").global().ignoreCase().toRegExp().test(text))  {
        tags.push(phrase);
      }
    });

    return tags.length > 0 ? tags : undefined;
  };
};

exports.Counter = function(runName, saveFunction, phrases, data){
  var dictionary = new exports.Dictionary(phrases.map(function(item) { return item.toLowerCase(); })),
	init = function (){ 
		var obj = {$name: runName};
		dictionary.phrases.forEach(function(insult) { obj[insult] = 0; }); 
		return obj;
	}, counters = data || init();

  this.increment = function(tweet){
    var insults = dictionary.parse(tweet.content.text);
    if (insults) {
      insults.forEach(function(insult){ counters[insult] += 1; });
      console.info("INSULT - ", insults.length, " insult(s) using ", "[", insults.join(', '), "]", " in ", tweet.content.text);
      tweet.insult_tags = insults;
      saveFunction(counters, tweet);
    }
  };
};

