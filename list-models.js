const fs = require('fs');
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyD2L881ZQtYP5LojOLykmFGHukP3Yqq7aA')
  .then(res => res.json())
  .then(data => fs.writeFileSync('models.json', JSON.stringify(data, null, 2)))
  .catch(console.error);
