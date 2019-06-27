
const fs = require('fs');
const path = require('path');

const ENV = process.env.NODE_ENV || 'development';

let secrets = {};
try {
  secrets = JSON.parse(fs.readFileSync('secrets.json'));
} catch (err) {
  console.error('Unable to read secrets file.', err);
  secrets={};
}

const buildInfo={};
try {
  buildInfo.date = fs.readFileSync('BUILD_DATE', 'utf-8').trim();
  buildInfo.id = fs.readFileSync('BUILD_ID', 'utf-8').trim();
  buildInfo.commit = fs.readFileSync('COMMIT_ID', 'utf-8').trim();
  buildInfo.version = fs.readFileSync('VERSION', 'utf-8').trim();
} catch (err) {
  console.error('Unable to read build info file.', err);
}

const envConfig = require(path.join(__dirname, 'environments', ENV));

const config =Object.assign({
  [ENV]: true,
  env: ENV,
  secrets: {...secrets},
  buildInfo: {...buildInfo},
  jwtsecret: process.env.JWT_KEY,
}, envConfig);

module.exports = config;
