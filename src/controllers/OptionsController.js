/* eslint-disable new-cap */
const {Router} = require('express');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;


/**
 * Controller class to handle all user related api's
 * /options/...
 */
export default class OptionsController {
  /**
   * constructor for QuestionController
   * @param {dependencies} logger for logging
   */
  constructor({logger,
    config, cache, database,
    userAuthorizationMiddleware}) {
    this.logger = logger('OptionsController');
    this.config = config;
    this.database = database;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.cache = cache;

    this.getOption = this.getOption.bind(this);
    this.getOptions = this.getOptions.bind(this);
    this.addOption = this.addOption.bind(this);
    this.updateOptions = this.updateOptions.bind(this);
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.get('/', this.userAuthorizationMiddleware, this.getOptions);
    router.get('/:id', this.userAuthorizationMiddleware, this.getOption);
    router.put('/:id', this.userAuthorizationMiddleware, this.updateOptions);
    router.post('/', this.userAuthorizationMiddleware, this.addOption);
    return router;
  }

  /**
   * gets a option identified by name or id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getOption(req, res) {
    this.logger.trace('getOption');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    try {
      const query={_id: ObjectId(req.params.id)};
      const Options = this.database.Options;
      const op = await Options.findOne(query);
      if (!op) {
        return res.sendStatus(404);
      }
      return res.json(op.toObject());
    } catch (err) {
      this.logger.error(err);
      return res.sendStatus(500);
    }
  }


  /**
   * gets the list of options
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getOptions(req, res) {
    this.logger.trace('getOptions');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const Options = this.database.Options;
    const query={};
    if (req.query.name) {
      query.name=req.query.name;
    }
    if (req.query.namex) {
      query.name=RegExp(req.query.namex, 'i');
    }
    try {
      const op = await Options.find(query);
      const results=[];
      op.forEach((op) => results.push(op.toObject()) );
      return res.json(results);
    } catch (err) {
      this.logger.error(err);
      return res.sendStatus(500);
    }
  }


  /**
   * a new option
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async addOption(req, res) {
    this.logger.trace('addOption');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    this.logger.debug(req.body);
    const newop={};
    if (req.body.name) {
      newop.name=req.body.name.trim();
    } else {
      return res.status(400).json({error: 'name missing'});
    }

    if (req.body.options) {
      newop.options=[...req.body.options];
    } else {
      return res.status(400).json({error: 'options missing'});
    }

    const Options = this.database.Options;

    try {
      let op = new Options(newop);
      op = await op.save();
      return res.json(op.toObject());
    } catch (err) {
      this.logger.error(err);
      if (err.code===11000) {
        return res.status(400).json({
          error: `Invalid name. ${req.body.name} already exists.`,
        });
      }
      return res.sendStatus(500);
    }
  }


  /**
   * update an option
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async updateOptions(req, res) {
    this.logger.trace('updateOption', req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    this.logger.debug(req.body);
    const Options = this.database.Options;
    try {
      let op = await Options.findOne({_id: ObjectId(req.params.id)});

      if (!op) {
        return res.sendStatus(404);
      }

      if (req.body.name) {
        op.name = req.body.name;
      }

      if (req.body.options) {
        op.options=req.body.options;
      }

      op = await op.save();

      return res.json(op.toObject());
    } catch (err) {

    }
  }
}
