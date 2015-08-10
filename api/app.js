var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/followers-graph', function (req, res) {
  res.header('Access-Control-Allow-Origin', "*");
  var followers_api = require('./followers-api')({
    user: req.query.user,
  });
  console.log(followers_api);
  followers_api.graph_gh_followers(req.query.user,function(json){
    console.log(json);
    res.json(json);
  });
});

app.get('/repo-graph', function (req, res) {
  res.header('Access-Control-Allow-Origin', "*");
  var repos_api = require('./repos-api')({
    user: req.query.user,
    repo: req.query.repo
  });
  repos_api.graph_gh_repo(req.query.user, req.query.repo, function(json){
    console.log(json);
    res.json(json);
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
