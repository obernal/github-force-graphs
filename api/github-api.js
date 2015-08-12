module.exports = function() {
  var GitHubApi = require("github");
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

  return {
    github_client: github
  }
}
