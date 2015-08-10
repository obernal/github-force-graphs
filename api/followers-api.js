module.exports = function(options) {
  var config = require('./config.json');
  var GitHubApi = require("github");
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


  function GitHubFollowGraph(user, callback) {
    this.nodes = [];
    this.links = [];
    this.max_users = 30;
    this.users_processed = 0;
    this.callback = callback;
    this.username = user;
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

    this.add_user = function(login, add_to_nodes){
      var user = null;

    github.user.getFrom({
        user: login
    }, function(err, json) {
        var user = json;
        if (add_to_nodes){
          self.nodes.push(user);
        }

        self.add_followers(user);


    });
    };

    function add_followers(followers, user) {
      for (var idx in followers) {
        var follower = self.find_user(followers[idx].login);
        if (!follower) {
          follower = followers[idx];
          //self.nodes.push(follower.login);
          if (follower.login != undefined){
              self.nodes.push(follower);
          }

        }
        self.follow(follower, user);
      }
      console.log(self.users_processed)
      console.log(self.nodes.length)
      if (self.users_processed + 1 == self.max_users){
          var json = {"nodes":self.nodes, "links":self.links}
          console.log(JSON.stringify(json));
          var fs = require('fs');
          fs.writeFile("data/" + self.username + ".json",JSON.stringify(json) , function(err) {
            if(err) {
              return console.log(err);
            }

            console.log("The file was saved!");
          });
          self.callback(json);
      }else{
          self.users_processed ++;
          //console.log(self.nodes);
          var newuser = self.nodes[self.users_processed].login
          console.log("adding " + newuser)

          if (newuser != undefined){
              self.add_user(self.nodes[self.users_processed].login,false);
          }
      }
    }

    this.add_followers = function(user){
      if (user.followers_added)
        return;
        github.user.getFollowers({
            user: user.login
        }, function(err, json) {
        add_followers(json, user);
        user.followers_added = true;
        //self.update();
      });
    }

    this.add_repo = function(repo, add_watchers){
      self.nodes.push(repo);

      if (add_watchers)
        this.add_watchers(repo);
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
    }
  }

  var graph_gh_followers = function(user,callback) {
    var fs = require('fs');

    if (fs.existsSync("data/" + user + ".json")) {
      fs.readFile("data/" + user + ".json", 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        callback(JSON.parse(data));
      });

    }else{
      var graph = new GitHubFollowGraph(user, callback);
      graph.add_user(user, true);
    }
  }

  return {
    graph_gh_followers: graph_gh_followers
  }
}
