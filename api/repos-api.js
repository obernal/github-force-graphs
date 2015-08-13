module.exports = function(options) {
  var github = require('./github-api')().github_client;

  function GitHubRepoGraph(user, repo, callback) {
    this.commits = [];
    this.nodes = [];
    this.links = [];
    this.pages = 4;
    this.max_users = 30;
    this.users_processed = 0;
    this.current_page = 1;
    this.repo_user = user;
    this.repo = repo;
    this.callback = callback;

    var self = this;

    this.find_user = function(login){
      for (var idx in this.nodes) {
        var node = this.nodes[idx];
        if (node.login && node.login == login)
          return node;
      }
      return null;
    };

    this.find_link = function(a, b) {
      for (var idx in this.links) {
        var link = this.links[idx];
        if (a == link.source && b == link.target
        ||  b == link.source && a == link.target)
          return link;
      }
      return null;
    }

    this.get_commits = function(user, repo, page){
      //console.log(user);
    github.repos.getCommits({
        user : user,
        repo: repo,
        page: page
    }, function(err, json) {

        self.commits = json;
        if (self.commits != undefined){
          for (var i=0;i<self.commits.length;i++){
            //console.log(self.commits.length);
            //console.log(self.commits[i]);
            if (self.commits[i].author != null){
              var index = self.nodes.map(function(e) { return e.login; }).indexOf(self.commits[i].author.login);
              if (index < 0){
                self.nodes.push(self.commits[i].author);
              }
            }
          }
          //console.log("self.nodes" + self.nodes);

          self.get_commit_detail(user, repo, 0);

        }//else{
          //do nothing for now
        //}

    });
    };

    this.get_commit_detail = function(user, repo, commit_index){
      //console.log("Getting commit " + commit_index);
      if (self.commits.length < 1){
        self.write_response();
      }else{
        var commit = self.commits[commit_index].sha;
        github.repos.getCommit({
            user : user,
            repo: repo,
            sha: commit
        }, function(err, json) {
            //console.log("hello");
            //console.log(JSON.stringify(json));
            var commit = json;
            console.log(commit.sha)
            for (var file in commit.files){

              if (commit.author != null){
                var index = self.nodes.map(function(e) { return e.filename; }).indexOf(commit.files[file].filename);
                if (index < 0){
                  self.nodes.push(commit.files[file]);
                }

                self.linkUserToFile(commit.author,commit.files[file]);
              }
            }

            if (commit_index >= self.commits.length -1){
              if (self.current_page >= self.pages){
                self.write_response();
              }else{
                self.current_page = self.current_page + 1;
                console.log(self.current_page);
                self.get_commits(self.repo_user, self.repo, self.current_page);
              }

            }else{
              console.log("commit index" + commit_index);
              var newindex = commit_index + 1;

              self.get_commit_detail(user, repo, newindex);
            }

        });
      }
    };

    this.write_response = function(){
      var today = new Date();
      var json = {"date": today.getTime() ,"nodes":this.nodes, "links":this.links}
      //console.log(JSON.stringify(json));
      var fs = require('fs');

      fs.writeFile("data/" + this.repo_user + "-" + this.repo + ".json",JSON.stringify(json) , function(err) {
        if(err) {
          return console.log(err);
        }

        console.log("The file was saved!");
      });
      this.callback(json);
    }

    this.linkUserToFile = function(user, file){
      var link = null;
      if (link = this.find_link(user, file))
        return;

      //link = {source: follower.login, target: following.login};
      var source = self.nodes.map(function(e) { return e.login; }).indexOf(user.login);
      var target = self.nodes.map(function(e) { return e.filename; }).indexOf(file.filename);
      link = {source: source, target: target};
      if (link.source >=0 && link.target >=0){
          this.links.push(link);
      }
    }
  }

  var graph_gh_repo = function(user, repo, callback) {
    var fs = require('fs');
    var filename = "data/" + user + "-" + repo + ".json";
    if (fs.existsSync(filename)) {
      fs.readFile(filename, 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        var ONE_HOUR = 60 * 60 * 1000;
        var json = JSON.parse(data);
        var expiry_date = new Date(json.date + ONE_HOUR);
        var today = new Date();
        if (expiry_date > today){
          callback(json);
        }else{
          graph(user,repo, callback);
        }
      });
    }else{
      graph(user, repo, callback);
    }
  }

  var graph = function(user, repo, callback){
    var graph = new GitHubRepoGraph(user, repo, callback);
    graph.get_commits(user, repo ,1);
  }

  return {
    graph_gh_repo: graph_gh_repo
  }
}
