const express = require('express');
const fs = require('fs');
const app = express();
try{
    app.secrets = JSON.parse(fs.readFileSync('secrets.json'));  
    console.info(`secrets:${Object.keys(app.secrets).join(', ')}`)
} catch (err) {
    console.error('Unable to read secrets file.', err)
}

const BUILDINFO={}
try{
    BUILDINFO.date = fs.readFileSync('BUILD_DATE',"utf-8").trim();
    BUILDINFO.id = fs.readFileSync('BUILD_ID',"utf-8").trim();
    BUILDINFO.commit = fs.readFileSync('COMMIT_ID',"utf-8").trim();
} catch (err) {
    console.error('Unable to read build info file.', err)
}

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/_status',(req, res) => {
  res.json({
      buildinfo: BUILDINFO
  })
})

app.get('/', (req, res) => {
  console.info('psp received a request.');

  const target = process.env.TARGET || 'World';
  res.send(`Hello ${target}!`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.info('psp listening on port', port);
  console.info(`Builddate: ${BUILDINFO.date} , ref: https://console.cloud.google.com/cloud-build/builds/${BUILDINFO.id}?project=ind-si-infra-managment-184960`)
});