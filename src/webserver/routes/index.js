var config = require('../../config');

module.exports = function(services, app){

  app.get('/', function(req, res){
    res.render('index', config.page_options);
  });
  app.get('/api/heartbeat', function(req, res){
    res.json({ 'status' : 'ok' });
  });

  var dataExport = require('./dataExport')(services);
  app.get('/api/export', dataExport.index);
  app.get('/api/export/json', dataExport.json);
  app.get('/api/export/csv', dataExport.csv);
  app.get('/api/export/bigQuery', dataExport.bigQuery);

  var data = require('./data')(services);
  app.get('/api/data', data.index);
  app.get('/api/data/reset/counter', data.resetCounter);
  app.get('/api/data/reset/dump', data.resetDump);

  var wordlist = require('./wordlist')(services);
  app.get('/api/wordlist', wordlist.index);
  app.get('/api/wordlist/add', wordlist.add);
  app.get('/api/wordlist/remove', wordlist.remove);
};
