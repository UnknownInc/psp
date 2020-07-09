/* eslint-disable new-cap */
const {Router} = require('express');
import {getEmailParts} from '../common/helpers';
import moment from 'moment';
import request from 'request';
import {v4 as uuidv4} from 'uuid';
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
    this.logger = logger('UserController');
    this.config = config;
    this.database = database;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.mailer = mailer;
    this.cache = cache;

    this.getUser = this.getUser.bind(this);
    this.register = this.register.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.verify = this.verify.bind(this);
    this.verifyADtoken = this.verifyADtoken.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.createUser = this.createUser.bind(this);

    this._hasReadAccess = this._hasReadAccess.bind(this);
    this._hasWriteAccess = this._hasWriteAccess.bind(this);
  }

  /**
   * returns true if the user in role to modify users
   * @param {user} user for which to check the role
   * @return {boolean} true if the user has right roles
   */
  _hasWriteAccess(user) {
    if (user.isInRole('admin')) return true;
    if (user.isInRole('useradmin')) return true;
    if (user.isInRole('user:write')) return true;
    return false;
  }

  /**
   * returns true if the user in role to read users
   * @param {user} user for which to check the role
   * @return {boolean} true if the user has right roles
   */
  _hasReadAccess(user) {
    if (user.isInRole('admin')) return true;
    if (user.isInRole('useradmin')) return true;
    if (user.isInRole('user:read')) return true;
    return false;
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
    router.put('/:id', this.userAuthorizationMiddleware, this.updateUser);
    router.post('/', this.userAuthorizationMiddleware, this.createUser);
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
  async getUsers(req, res) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!this._hasReadAccess(user)) {
      console.log(user);
      return res.sendStatus(403);
    }

    const User = this.database.User;
    const Response = this.database.Response;
    const query={};
    try {
      let offset = 0;
      if (req.query.offset) {
        offset = parseInt(req.query.offset);
      }
      let limit = 0;
      if (req.query.limit) {
        limit = parseInt(req.query.limit);
      }

      if (req.query.name) {
        query.name=new RegExp(req.query.name, 'i');
      }

      if (req.query.email) {
        query.email=new RegExp(req.query.email, 'i');
      }
      if (req.query.c) {
        query.capability=new RegExp(req.query.c, 'i');
      }
      if (req.query.i) {
        query.industry=new RegExp(req.query.i, 'i');
      }
      if (req.query.t) {
        query.title=new RegExp(req.query.t, 'i');
      }


      const count = await User.find({query}).estimatedDocumentCount();
      let mq = User.find(query);
      if (req.query.sort) {
        mq=mq.sort(req.query.sort);
      }
      const users = await mq.skip(offset).limit(limit);

      let results=[];
      await users.asyncForEach(async (u)=>{
        const uo = u.toObject();
        const resMatches = await Response.find({'user': u._id})
            .sort({date: '-1'})
            .limit(1);
        if (resMatches.length>0) {
          uo.lastresponsedate = moment(resMatches[0].date).toDate();
          u.lastresponsedate = uo.lastresponsedate;
        }
        uo.roles=uo.roles||[];
        results.push(uo);
      });

      if (req.query.sort==='lastresponsedate') {
        results=results.sort((a, b)=> (
          new Date(b.lastresponsedate) - new Date(a.lastresponsedate)));
      } else if (req.query.sort==='-lastresponsedate') {
        results=results.sort((a, b)=>(
          new Date(b.lastresponsedate) - new Date(a.lastresponsedate)));
      }

      res.set('X-Total-Count', ''+count);
      return res.json(results);
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * returns the user by the specified id or email
   * @param {*} req request object
   * @param {*} res response object
   * @return {*} if successful returns the matched user
   */
  async getUser(req, res) {
    this.logger.trace('getUser', req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }
    const User = this.database.User;
    let result;
    if (req.params.id!=='current') {
      if ((req.params.id!==user._id) && !(this._hasReadAccess(user))) {
        return res.sendStaus(403);
      }
      const u = await User.findOne({_id: ObjectId(req.params.id)});
      result = u.toObject();
    } else {
      result = user;
    }
    // delete result.roles;
    res.set('Cache-Control', 'public, max-age=60');
    return res.json(result);
  }

  /**
   * update user
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async updateUser(req, res) {
    this.logger.trace('updateUser', req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }
    const uid = req.params.id||user._id;

    if (uid!==user._id) {
      if (!this._hasWriteAccess(user)) {
        return res.sendStaus(403);
      }
    }

    const User = this.database.User;

    try {
      const u = await User.findOne({_id: uid});
      if (!u) {
        return res.sendStaus(404);
      }

      this.logger.debug(req.body);
      if (req.body.name) {
        u.name = req.body.name.trim();
      }

      if (req.body.title) {
        u.title = req.body.title.trim();
      }

      if (req.body.careerStage) {
        u.careerStage = req.body.careerStage.trim();
      }

      if (req.body.primarySkill) {
        u.primarySkill = req.body.primarySkill.trim();
      }

      if (req.body.capability) {
        u.capability = req.body.capability.trim();
      }

      if (req.body.industry) {
        u.industry = req.body.industry.trim();
      }

      if (req.body.oid) {
        u.oid = req.body.oid.trim();
      }

      if (req.body.tags) {
        u.tags = req.body.tags;
      }

      if (req.body.skills) {
        u.skills = req.body.skills;
      }

      if (req.body.clients) {
        u.clients = req.body.clients;
      }

      // details: {type: Object},

      await u.save();

      const result = u.toObject();
      result.isAdmin = (u.roles.indexOf('admin')!==-1);
      // set to expire after 1 hour
      this.cache.set(u.email.toLowerCase(), JSON.stringify(result), 'EX', 3600);
      // delete result.roles;
      return res.json(result);
    } catch (err) {
      this.logger.error('updateUser exception:', err);
      return res.sendStaus(500);
    }
  }


  /**
   * create user
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async createUser(req, res) {
    this.logger.trace('createUser');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!(this._hasWriteAccess(user))) {
      return res.sendStaus(403);
    }

    const User = this.database.User;

    try {
      // this.logger.debug(req.body);
      if (!req.body.email) {
        return res.status(400).json({
          error: 'Missing email',
        });
      }

      const eparts = getEmailParts(req.body.email);
      if (!eparts.isValid) {
        return res.status(400).json({
          error: 'Inavlid email: '+req.body.email,
        });
      }

      const u = new User({email: req.body.email});

      if (req.body.name) {
        u.name = req.body.name.trim();
      }

      if (req.body.title) {
        u.title = req.body.title.trim();
      }

      if (req.body.careerStage) {
        u.careerStage = req.body.careerStage.trim();
      }

      if (req.body.primarySkill) {
        u.primarySkill = req.body.primarySkill.trim();
      }

      if (req.body.capability) {
        u.capability = req.body.capability.trim();
      }

      if (req.body.industry) {
        u.industry = req.body.industry.trim();
      }

      if (req.body.oid) {
        u.oid = req.body.oid.trim();
      }

      if (req.body.tags) {
        u.tags = req.body.tags;
      }

      if (req.body.skills) {
        u.skills = req.body.skills;
      }

      if (req.body.clients) {
        u.clients = req.body.clients;
      }

      if (req.body.company) {
        u.company = req.body.company;
      } else {
        u.company = user.company._id;
      }

      // details: {type: Object},

      await u.save();

      const result = u.toObject();
      // set to expire after 1 hour
      this.cache.set(u.email.toLowerCase(), JSON.stringify(result), 'EX', 3600);
      // delete result.roles;
      return res.json(result);
    } catch (err) {
      this.logger.error('createUser exception:', err);
      return res.sendStaus(500);
    }
  }

  /**
   * register by email
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async register(req, res) {
    this.logger.trace('register');
    const email = (req.body.email||'').trim().toLowerCase();
    const payload = getEmailParts(email);
    const companyUrl = `${req.get('host')}`;

    this.logger.debug('register payload', payload);
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
          // eslint-disable-next-line max-len
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
        appName: process.env['K_SERVICE'],
      };
      const emailContent = require('../emails/templates/verify').confirm(data);
      emailContent.from=process.env.MAIL_FROM;
      if (process.env.SKIP_EMAIL) {
        this.logger.trace(data);
      } else {
        await this.mailer.sendMail(emailContent);
      }
      return res.json({
        // eslint-disable-next-line max-len
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
   * verify the ms graph accessToken
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async verifyADtoken(req, res) {
    const token = (req.body.accessToken||'');
    if (token==='') {
      return res.status(400).json({
        error: 'Expects a valid accessToken in the body',
      });
    }

    const bearer = `Bearer ${token}`;
    this.logger.trace(bearer);
    const headers = {
      'Authorization': bearer,
    };
    const graphEndpoint = 'https://graph.microsoft.com/v1.0/me';
    const options = {
      url: graphEndpoint,
      headers: headers,
    };

    request(options, async (err, response, body)=>{
      if (err) {
        console.error(err);
        return res.status(500).json({
          Error: 'Unexpected error on the server.',
        });
      }
      this.logger.info(response && response.statusCode);
      if (!body) {
        return res.status(500).json({
          Error: 'Unexpected error on the server.',
        });
      }

      const Company = this.database.Company;
      const User = this.database.User;
      try {
        const profile=JSON.parse(body);
        this.logger.trace(profile);
        const email=profile.mail.toLowerCase();
        const payload = getEmailParts(email);

        console.log(payload);
        const company = await Company.findOne({
          domains: {'$regex': payload.domain, '$options': 'i'}});
        if (!company) {
          return res.status(404).json({
            error: `Unable to find company: ${payload.companyname}`,
          });
        }

        this.logger.debug(company.toObject());
        if (company.domain.indexOf(payload.domain)!=-1) {
          return res.status(400).json({
            // eslint-disable-next-line max-len
            error: `Invalid domain: ${payload.domain} for company ${payload.companyname}`,
          });
        }

        let user = await User.findByEmail(payload.address);
        if (!user) {
          /*
          return res.status(409).json({
            Error: `User: ${email.accountname} is already registered.`
          })
          */
          user = await User.create({
            email: payload.address,
            company: company._id,
          });
        }
        user.isVerified = true;
        user.name = profile.displayName;
        // user.title=profile.jobTitle;

        await user.save();

        const userObj = {email, username: email.substr(0, email.indexOf('@'))};
        const authtoken = jwt.sign(userObj,
            this.config.jwtsecret,
            {
              expiresIn: '365d',
            },
        );
        return res.status(200).json({
          message: 'Successfully verified.',
          token: authtoken,
        });
      } catch (ex) {
        return res.status(500).json({
          Error: 'Unexpected error on the server.',
        });
      }
      // return res.json({});
    });
  }

  /**
   * verify the token
   * @param {*} req request object
   * @param {*} res response object
   * @return {any} nothing
   */
  async verify(req, res) {
    this.logger.trace('verify');

    if (req.body.accessToken) {
      await this.verifyADtoken(req, res);
      return;
    }
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
          },
      );

      // const Node= this.database.Node;
      // try {
      //   // eslint-disable-next-line new-cap
      //   const n = await Node.findOne({user: ObjectId(user._id),
      // type: 'default'});
      //   if (!n) {
      //     // eslint-disable-next-line new-cap
      //     const n = new Node({user: ObjectId(user._id), type: 'default'});
      //     await n.save();
      //   }
      // } catch (ex) {
      //   this.logger.error('verify exception', ex);
      // }
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
