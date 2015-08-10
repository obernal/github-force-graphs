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

  function GitHubRepoGraph(user, repo, callback) {
    this.commits = [];
    this.nodes = [];
    this.links = [];
    this.pages = 2;
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
      console.log(user);
    github.repos.getCommits({
        user : user,
        repo: repo,
        page: page
    }, function(err, json) {

        self.commits = json;
        for (var i=0;i<self.commits.length;i++){
          var index = self.nodes.map(function(e) { return e.login; }).indexOf(self.commits[i].author.login);
          if (index < 0){
            self.nodes.push(self.commits[i].author);
          }
        }
        console.log("self.nodes" + self.nodes);

        self.get_commit_detail(user, repo, 0);

    });
    };

    this.get_commit_detail = function(user, repo, commit_index){
      console.log("Getting commit " + commit_index);
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

            var index = self.nodes.map(function(e) { return e.filename; }).indexOf(commit.files[file].filename);
            if (index < 0){
              self.nodes.push(commit.files[file]);
            }
            self.linkUserToFile(commit.author,commit.files[file]);
          }

          if (commit_index >= self.commits.length -1){
            if (self.current_page >= self.pages){
              var json = {"nodes":self.nodes, "links":self.links}
              console.log(JSON.stringify(json));
              var fs = require('fs');

              fs.writeFile("data/" + self.repo_user + "-" + self.repo + ".json",JSON.stringify(json) , function(err) {
                if(err) {
                  return console.log(err);
                }

                console.log("The file was saved!");
                self.callback(json);
              });
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
    };

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

      //this.update();
    }


    this.follow = function(follower, following){
      var link = null;
      if (link = this.find_link(follower, following))
        return;

      //link = {source: follower.login, target: following.login};
      var source = self.nodes.map(function(e) { return e.login; }).indexOf(follower.login);
      var target = self.nodes.map(function(e) { return e.login; }).indexOf(following.login);
      link = {source: source, target: target};
      //link = {source: self.nodes.indexOf({"name":follower.login, "group":"users"}), target: self.nodes.indexOf({"name":following.login,"group":"users"})};
      if (link.source >=0 && link.target >=0){
          this.links.push(link);
      }

      //this.update();
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
        callback(JSON.parse(data));
      });
    }else{
      var graph = new GitHubRepoGraph(user, repo, callback);
      graph.get_commits(user, repo ,1);
    }

  }

  return {
    graph_gh_repo: graph_gh_repo
  }
}
