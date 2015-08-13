module.exports = function() {
  var GitHubApi = require("github");
  var config = require('./config.json');
  var github = new GitHubApi({
      // required
      version: "3.0.0",
      // optional
      debug: false,
      protocol: "https",
      host: "api.github.com", // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
          "user-agent": "GitHub-Force-Graphs" // GitHub is happy with a unique user agent
      }
  });

  // OAuth2 Key/Secret
  if (config['oauth-token']!= undefined){
    github.authenticate({
        type: "oauth",
        token: config['oauth-token']
    })
  }else{
    github.authenticate({
        type: "basic",
        username: config['github-user'],
        password: config['github-token']
    });

  }

  return {
    github_client: github
  }
}
