const jwt = require('jsonwebtoken');
// const {parseCompany} = require('./common/helpers');

const userAuthorizationMiddleware = ({config, logger, cache, database}) => {
  return (req, res, next) => {
    const log=logger('UA');
    // Express headers are auto converted to lowercase
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
    }

    if (token) {
      jwt.verify(token, config.jwtsecret, (err, decoded) => {
        if (err) {
          log.error('Invalid token', err.message);
          return res.sendStatus(403); // Token is not valid
        }

        req.user = decoded;
        const email = req.user.email.toLowerCase();
        cache.get(email, async function(err, result) {
          if (err) {
            log.error('CACHE error retriving user by email from cache.',
                err);
          }
          if (!result) {
            // const company = (parseCompany(email)||'').trim();
            const User = database.User;
            try {
              const u=await User.findOne({email: email}).populate('company');
              result=u.toObject();
              if (u.company && u.company.admins.indexOf(u._id)!==-1) {
                result.isAdmin=true;
              }
              // set to expire after 1 hour
              cache.set(email, JSON.stringify(result), 'EX', 3600);
            } catch (ex) {
              log.error('userAuthorization error reading from db', ex);
              return res.sendStatus(401);
            }
          } else {
            result = JSON.parse(result);
          }
          result.roles=result.roles||[];
          req.user = result;
          req.user.isInRole=(role)=>(result.roles.indexOf(role)!==-1);
          req.user.isAdmin = req.user.isInRole('admin');
          next();
        });
      });
    } else {
      return res.sendStatus(401); // Auth token is not supplied.
    }
  };
};

module.exports = userAuthorizationMiddleware;
