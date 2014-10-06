// this is the object that the web site will use to make changes to the running streamer
var config = require('../config'),
tps = 0,
mps = 0,
lastMatch = undefined,
phrases = [],
stats = {};

module.exports.serviceApi = function(wordCollection, dumpCollection, counterModel, services) {
  var wordCollection = wordCollection,
  tweetDumpCollection = dumpCollection,
  counterModel = counterModel,
  termContext= {
    addTerm: function(term){},
    removeTerm: function(term){},
    listTerms: function(callback){
      wordCollection.find().toArray(function(error, terms){
        callback(terms);
      });
    }
  },
  tweetDumpContext= {
    clear: function(){},
    items: function(){},
    download: function(){},
    exportToBQ: function(){}
  },
  counterContext = stats;

  return function environmentSelection(dev){
    return {
      termContext: termContext,
      tweetDumpContext: tweetDumpContext,
      counterContext: counterContext
    };
  };
};

setInterval(function(){
  stats.tweetsPerSecond = tps;
  stats.matchesPerSecond = mps;
  tps = 0;
  mps = 0;
}, 1000);

exports.updateMatchesPerSecond = function(){ mps++; };
exports.updateTweetsPerSecond = function(){ tps++; };
exports.updateLastMatch = function(tweet){ stats.lastMatch = tweet; };
exports.phrases = function(){ return phrases; };

