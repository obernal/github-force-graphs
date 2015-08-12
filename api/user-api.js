module.exports = function(options) {
  var GitHubApi = require("github");
  var username = options.user;
  var repository = options.repo;
  var config = require('./config.json');
  var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    timeout: 5000,
    headers: {
      "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    }
  });

  github.authenticate({
    type: "basic",
    username: config['github-user'],
    password: config['github-token']
  });

  function GitHubReposApi(user,callback) {

    this.callback = callback;
    this.repos = [];
    this.current_page = 1;
    this.pages = 2;

    var self = this;
    this.get_repos = function(user, page){
      github.repos.getFromOrg({
        org : user,
        page: page
      }, function(err, json) {
          if (json != undefined && json.length > 0){
            self.repos  = self.repos.concat(json);
            if (self.current_page >= self.pages){
              callback(self.repos);
            }else{
              self.current_page = self.current_page + 1;
              self.get_repos(user,self.current_page);
            }
          }
        });
      }
    }

    var get_repos = function(user, callback) {
      var graph = new GitHubReposApi(user, callback);
      graph.get_repos(user, 1);
    }

    return {
      get_repos: get_repos
    }
  }
