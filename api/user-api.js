module.exports = function(options) {

  function GitHubReposApi(user,callback) {
    var github = require('./github-api')().github_client;
    this.callback = callback;
    this.repos = [];
    this.current_page = 1;
    this.pages = 4;

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
