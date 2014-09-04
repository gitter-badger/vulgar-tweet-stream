module.exports.config = {
  environment: process.env['NODE_ENV'] || 'development',
  isProduction: this.environment === 'production',
  redisUrl: process.env['REDISCLOUD_URL'],
  mongoUrl: process.env['MONGOHQ_URL'],
  logLevel: this.isProduction ? 3 : 2,
  papertrail: process.env['PAPERTRAIL_API_TOKEN'],
  twitterConfig: {
    consumer_key: process.env['consumer_key'],
    consumer_secret: process.env['consumer_secret'],
    access_token: process.env['access_token'],
    access_token_secret: process.env['access_token_secret']
  }

};

