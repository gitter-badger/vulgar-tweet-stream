var regexp = require('node-regexp');

exports.parseTweet = function(phrases, tweet){
  var content = tweet.text,
  matchedInsults = phrases.filter(function(insult){ 
    var regex = buildRegex(insult);
    return regex.test(content); 
  });
  return {
    match: matchedInsults.length > 0,
    insults: matchedInsults,
    tweet: tweet
  };
};

function buildRegex(term) { 
  return regexp().find("(" + term + ")(?:[\\b\\ss]|es|ing|in|ed){1}").global().ignoreCase().toRegExp();
};