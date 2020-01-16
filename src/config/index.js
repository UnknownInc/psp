/* eslint-disable max-len */

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
  creds: {
    // Required
    identityMetadata: 'https://login.microsoftonline.com/publicisgroupe.onmicrosoft.com/.well-known/openid-configuration',
    // or equivalently: 'https://login.microsoftonline.com/<tenant_guid>/.well-known/openid-configuration'
    //
    // or you can use the common endpoint
    // 'https://login.microsoftonline.com/common/.well-known/openid-configuration'
    // To use the common endpoint, you have to either set `validateIssuer` to false, or provide the `issuer` value.

    // Required, the client ID of your app in AAD
    clientID: process.env.PSB_MS_CLIENTID,

    // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
    responseType: 'code id_token',

    // Required
    responseMode: 'form_post',

    // Required, the reply URL registered in AAD for your app
    redirectUrl: `/auth/openid/return`,

    // Required if we use http for redirectUrl
    allowHttpForRedirectUrl: true,

    // Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
    // If app key contains '\', replace it with '\\'.
    clientSecret: process.env.PSB_MS_CLIENTSECRET,

    // Required to set to false if you don't want to validate issuer
    validateIssuer: true,

    // Required to set to true if you are using B2C endpoint
    // This sample is for v1 endpoint only, so we set it to false
    isB2C: false,

    // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
    issuer: null,

    // Required to set to true if the `verify` function has 'req' as the first parameter
    passReqToCallback: false,

    // Recommended to set to true. By default we save state in express session, if this option is set to true, then
    // we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
    // to be completely express session free.
    useCookieInsteadOfSession: true,

    // Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
    // rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
    // key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
    cookieEncryptionKeys: [
      {'key': '12345678901234567890123456789012', 'iv': '123456789012'},
      {'key': 'abcdefghijklmnopqrstuvwxyzabcdef', 'iv': 'abcdefghijkl'},
    ],

    // Optional. The additional scope you want besides 'openid', for example: ['email', 'profile'].
    scope: ['email', 'profile'],

    // Optional, 'error', 'warn' or 'info'
    loggingLevel: 'info',

    // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
    nonceLifetime: null,

    // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
    nonceMaxAmount: 5,

    // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
    clockSkew: null,
  },
  resourceURL: 'https://graph.windows.net',
  destroySessionUrl: 'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=http://localhost:3000',

}, envConfig);

module.exports = config;
