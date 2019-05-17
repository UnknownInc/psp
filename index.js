const express = require('express');
const fs = require('fs');
const app = express();

app.secrets = JSON.parse(fs.readFileSync('secrets.json'));  
app.get('/', (req, res) => {
  console.log('psp received a request.');

  const target = process.env.TARGET || 'World';
  res.send(`Hello ${target}!\nDB:${app.secrets.DB}`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('psp listening on port', port);
});