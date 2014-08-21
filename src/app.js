var serviceProvider = require('./service');

serviceProvider(function(interactionContext){
    var Twit = require('twit'),
    parser = require('./parser')(interactionContext),
    models = require('./models');

    var twitter = new Twit({
      consumer_key: process.env['consumer_key'], 
      consumer_secret: process.env['consumer_secret'], 
      access_token: process.env['access_token'], 
      access_token_secret: process.env['access_token_secret'] 
    }),
    stream = twitter.stream('statuses/filter', {track: 'I,you,me,him,us,they,the,girl,she,he,they'});

    stream.on('tweet', function(tweet) {
      var results = parser.parseTweet(tweet);
      interactionContext.counter.processedTweet();
      if (results.match) {
        var tweetInfo = new models.Tweet(tweet, results.insults);
        if (!interactionContext.env.production || results.insults.length > 2)
          console.info('MATCH -', results.insults, 'in', tweetInfo.content);
        results.insults.forEach(function(term){ interactionContext.counter.put(term); });
        interactionContext.persistTweet(tweetInfo);
      }
    });
});
