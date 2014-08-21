var regexp = require('node-regexp');

module.exports = function(context) { 
  var lut = context.counter.phrases();
  function buildRegex(term) { 
    return regexp().find("[\\s](" + term + ")[\\.es]{0,2}").global().ignoreCase().toRegExp();
  };

  return {
    parseTweet: function(tweet){
      var content = tweet.text,
      matchedInsults = lut.filter(function(insult){ 
        var regex = buildRegex(insult);
        return regex.test(content); 
      });
      return {
        match: matchedInsults.length > 0,
        insults: matchedInsults,
        tweet: tweet
      };
    }
  };
};
