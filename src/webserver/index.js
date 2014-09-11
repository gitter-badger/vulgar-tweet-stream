var config = require('./config'),
    express = require('express'),
    bodyParser = require('body-parser');

module.exports = function(services){
  var app = express();

  app.set('views', __dirname + '/webserver/views');
  app.set('view engine', 'jade');

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static('public'));

  var routes = require('./routes')(services, app);

  app.listen(config.port);
  console.log('The admin magic happens on port', config.port);
};
