/* eslint-disable new-cap */
const {Router} = require('express');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;


/**
 * Controller class to handle all user related api's
 * /questionset/...
 */
export default class QuestionSetController {
  /**
   * constructor for QuestionSetController
   * @param {dependencies} logger for logging
   */
  constructor({logger,
    config, cache, database,
    userAuthorizationMiddleware}) {
    this.logger = logger('QuestionSetController');
    this.config = config;
    this.database = database;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.cache = cache;

    this.getDistinctQuestionSets = this.getDistinctQuestionSets.bind(this);
    this.getQuestionSet = this.getQuestionSet.bind(this);
    this.getQuestionSets = this.getQuestionSets.bind(this);
    this.addQuestionSets = this.addQuestionSets.bind(this);
    this.updateQuestionSets = this.updateQuestionSets.bind(this);
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.get('/', this.userAuthorizationMiddleware, this.getQuestionSets);
    router.get('/distinct', this.userAuthorizationMiddleware, this.getDistinctQuestionSets);
    router.get('/:id', this.userAuthorizationMiddleware, this.getQuestionSet);
    router.put('/:id', this.userAuthorizationMiddleware, this.updateQuestionSets);
    router.post('/', this.userAuthorizationMiddleware, this.addQuestionSets);
    return router;
  }

  /**
   * gets the list of question sets names
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getDistinctQuestionSets(req, res) {
    this.logger.trace('getDistinctQuestionSets');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const QuestionSet = this.database.QuestionSet;
    try {
      const list = await QuestionSet.distinct('name');
      return res.json(list);
    } catch (err) {
      this.logger.error(err);
      return res.status(500);
    }
  }
  /**
   * gets the list of question sets
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getQuestionSets(req, res) {
    this.logger.trace('getQuestionSets');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const QuestionSet = this.database.QuestionSet;
  }


  /**
   * gets a question set identified by id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getQuestionSet(req, res) {
    this.logger.trace('getQuestionSet');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const QuestionSet = this.database.QuestionSet;
  }


  /**
   * add a list of question sets
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async addQuestionSets(req, res) {
    this.logger.trace('addQuestionSets');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const QuestionSet = this.database.QuestionSet;
    try{
      const qs = QuestionSet.create({name: req.body.name})
    } catch (err) {
      this.logger.error('Unable to create a new question set', err);
      return res.status(500).json({
        error: 'Unknown server error.',
      });
    }
  }

  /**
   * updates a list of question sets
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async updateQuestionSets(req, res) {
    this.logger.trace('updateQuestionSets');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const QuestionSet = this.database.QuestionSet;
  }
}
