const {Router} = require('express');
import {getEmailParts} from '../common/helpers';
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;


/**
 * Controller class to handle all user related api's
 * /user/...
 */
export default class UserController {
  /**
   * construtor for UserController
   * @param {dependencies} logger for logging
   */
  constructor({logger,
    config, cache, database, mailer,
    userAuthorizationMiddleware}) {
    this.logger = logger;
    this.config = config;
    this.database = database;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.mailer = mailer;
    this.cache = cache;

    this.getUser = this.getUser.bind(this);
    this.register = this.register.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.verify = this.verify.bind(this);
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.get('/', this.userAuthorizationMiddleware, this.getUsers);
    router.post('/register', this.register);
    router.post('/verify', this.verify);
    router.get('/:id', this.userAuthorizationMiddleware, this.getUser);
    // router.post('/', inject('createUser'), this.create);
    // router.put('/:id', inject('updateUser'), this.update);
    // router.delete('/:id', inject('deleteUser'), this.delete);

    return router;
  }

  /**
   * gets the list of users
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  getUsers(req, res) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }
  }

  /**
   * returns the user by the specified id or email
   * @param {*} req request object
   * @param {*} res response object
   * @return {*} if successful returns the matched user
   */
  getUser(req, res) {
    this.logger.trace('UserController.getUser', req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }
    if (req.params.id!=='current') {
      if (!user.isAdmin) {
        return res.sendStaus(403);
      }
    }
    res.set('Cache-Control', 'public, max-age=60');
    return res.json(user);
  }

  /**
   * register by email
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async register(req, res) {
    this.logger.trace('UserController.register');
    const email = (req.body.email||'').trim().toLowerCase();
    const payload = getEmailParts(email);
    const companyUrl = `${req.protocol}://${req.get('host')}`;

    this.logger.debug('UserController.register payload', payload);
    if (!payload.isValid || payload.company==='') {
      res.status(400).json({
        error: 'Invalid email.',
      });
    }

    const Company = this.database.Company;
    const User = this.database.User;
    const Token = this.database.Token;

    try {
      const company = await Company.findByName(payload.companyname);
      if (!company) {
        return res.status(404).json({
          error: `Unable to find company: ${payload.companyname}`,
        });
      }

      this.logger.debug(company.toObject());
      if (company.domain.indexOf(payload.domain)!=-1) {
        return res.status(400).json({
          error: `Invalid domain: ${payload.domain} for company ${payload.companyname}`,
        });
      }

      const user = await User.findByEmail(payload.address);
      if (!user) {
        /*
        return res.status(409).json({
          Error: `User: ${email.accountname} is already registered.`
        })
        */
        await User.create({email: payload.address, company: company._id});
      }

      const token = await Token.create({
        token: uuidv4(),
        email: payload.address,
        returnUrl: req.body.returnUrl,
        state: req.body.state,
      });

      const data = {
        to: payload.address,
        token: token.token,
        companyUrl: companyUrl,
        appName: 'psp',
      };
      const emailContent = require('../emails/templates/verify').confirm(data);
      emailContent.from=process.env.MAIL_FROM;
      await this.mailer.sendMail(emailContent);
      return res.json({
        message: `Thanks for registering. Please verify as per the instructions sent to ${payload.address}`,
      });
    } catch (ex) {
      this.logger.error('Exception registering ', ex);
      return res.status(500).json({
        error: 'Unknown server error.',
      });
    }
  }

  /**
   * verify the token
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async verify(req, res) {
    this.logger.trace('UserController.verify');

    const token = (req.body.token||'').trim().toLowerCase();
    const email = (req.body.email||'').trim().toLowerCase();

    if (token==='' || email==='') {
      return res.status(400).json({
        error: 'Expects a valid email and token in the body',
      });
    }

    const User = this.database.User;
    const Token = this.database.Token;

    try {
      const trecord = await Token.findOne({token});

      this.logger.debug(trecord);
      if (!trecord) {
        return res.status(400).json({
          error: `Invalid token or email`,
        });
      }


      if (trecord.email!== email) {
        return res.status(400).json({
          Error: `Invalid token or email`,
        });
      }

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(400).json({
          error: `Invalid token or email`,
        });
      }

      user.isVerified = true;

      await user.save();

      await trecord.delete();

      const userObj = {email, username: email.substr(0, email.indexOf('@'))};
      const authtoken = jwt.sign(userObj,
          this.config.jwtsecret,
          {
            expiresIn: '365d',
          }
      );

      const Node= this.database.Node;
      try {
        // eslint-disable-next-line new-cap
        const n = await Node.findOne({user: ObjectId(user._id)});
        if (!n) {
          // eslint-disable-next-line new-cap
          const n = new Node({user: ObjectId(user._id)});
          await n.save();
        }
      } catch (ex) {
        this.logger.error('UserController.verify exception', ex);
      }
      return res.status(200).json({
        message: 'Successfully verified.',
        token: authtoken,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        Error: 'Unexpected error on the server.',
      });
    }
  }
}
