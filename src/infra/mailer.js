const nodemailer = require('nodemailer');

const mailer = ({config, logger})=>{
  // The credentials for the email account you want to send mail from.
  const credentials = {
    service: 'gmail',
    auth: {
      // These environment variables will be pulled from the env
      user: (process.env.MAIL_USER || '').trim(),
      pass: (process.env.MAIL_PASS || '').trim(),
    },
  };

  // setup Nodemailer with the credentials for when the 'sendEmail()'
  // function is called.
  const nmailer = nodemailer.createTransport(credentials);

  return nmailer;
};

module.exports = mailer;
