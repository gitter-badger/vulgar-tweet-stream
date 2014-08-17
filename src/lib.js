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
    username: tweet.user.screen_name,
    location: tweet.user.location
   };

  this.location = { 
    geo: tweet.geo,
    coordinates: tweet.coordinates,
    place: tweet.place
  };

  if (tweet.source && tweet.source != null ) {
    var sourceDevice = regexp().find("Twitter for (\\w+)").ignoreCase().toRegExp().exec(tweet.source);
    if (sourceDevice != null) 
      this.source = sourceDevice[2];
  }
  else {
    this.source = "unknown";
  }

  this.content = tweet.text;

  this.created = function(){ 
    return moment(this.time);
  };

  this.toString = function(){
    return this.user.name + ": " + this.content;
  };
};

exports.Counter = function(runName, saveFunction, phrases, data){
  var lut = phrases.map(function(item) { return item.toLowerCase(); }),
  counters = data ? data : {name: runName};

  this.parse = function(text){
    var tags = [];

    lut.forEach(function(phrase){
      if (regexp().find("\\s" + phrase + "(s?[es]?)\\s").global().ignoreCase().toRegExp().test(text)) {
        tags.push(phrase);
      }
    });

    return tags.length > 0 ? tags : undefined;
  };

  this.increment = function(tweet){
    var insults = this.parse(tweet.content);
    if (insults) {
      insults.forEach(function(insult){ 
        if (!counters[insult] || counters[insult] == null)
           counters[insult] = 1;
        else
          counters[insult] += 1;
      });
      console.info("INSULT - ", insults.length, " insult(s) using ", "[", insults.join(', '), "]", " in ", tweet.content);
      tweet.insult_tags = insults;
      saveFunction(counters, tweet);
    }
  };
};

