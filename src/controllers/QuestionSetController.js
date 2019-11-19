/* eslint-disable new-cap */
const {Router} = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
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
    this._hasReadAccess = this._hasReadAccess.bind(this);
    this._hasWriteAccess = this._hasWriteAccess.bind(this);
  }

  /**
   * returns true if the user in role to modify questions
   * @param {user} user for which to check the role
   * @return {boolean} true if the user has right roles
   */
  _hasWriteAccess(user) {
    if (user.isInRole('admin')) return true;
    if (user.isInRole('qsadmin')) return true;
    if (user.isInRole('qs:write')) return true;
    return false;
  }

  /**
   * returns true if the user in role to read questions
   * @param {user} user for which to check the role
   * @return {boolean} true if the user has right roles
   */
  _hasReadAccess(user) {
    if (user.isInRole('admin')) return true;
    if (user.isInRole('qsadmin')) return true;
    if (user.isInRole('qs:read')) return true;
    return false;
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.use(this.userAuthorizationMiddleware);
    router.get('/', this.getQuestionSets);
    router.get('/:id', this.getQuestionSet);
    router.put('/', this.updateQuestionSets);
    router.post('/', this.addQuestionSets);
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

    if (!this._hasReadAccess(user)) {
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

    if (!this._hasReadAccess(user)) {
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
    if (req.params.id.toLowerCase()==='$distinct') {
      return this.getDistinctQuestionSets(req, res);
    }
    this.logger.trace('getQuestionSet');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!this._hasReadAccess(user)) {
      return res.sendStaus(403);
    }

    const QuestionSet = this.database.QuestionSet;
    try {
      const query = QuestionSet.find();

      if (ObjectId.isValid(req.params.id)) {
        query.where('_id', ObjectId(req.params.id));
      } else {
        query.where('name', new RegExp(req.params.id, 'i'));
      }

      const count = await query.estimatedDocumentCount();

      if (req.query.sort) {
        query.sort(req.query.sort);
      }

      if (req.query.offset) {
        const offset = parseInt(req.query.offset);
        query.skip(offset);
      }

      if (req.query.limit) {
        const limit = parseInt(req.query.limit);
        query.limit(limit);
      }

      const matches = await query.exec('find');
      const results = matches.map((qs)=>qs.toObject());
      res.set('X-Total-Count', ''+count);
      return res.json(results);
    } catch (err) {
      this.logger.error(err);
      return res.sendStaus(500);
    }
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

    if (!this._hasWriteAccess(user)) {
      return res.sendStaus(403);
    }

    if (!req.body.name) {
      return res.status(400).send({
        error: 'Missing name in body',
      });
    }

    const questionSetName = req.body.name.trim();
    const QuestionSet = this.database.QuestionSet;
    const Question = this.database.Question;
    try {
      const prevQs = await QuestionSet
          .find({name: questionSetName})
          .sort('-date').limit(1);
      let nextDate = moment().utc().startOf('day');
      console.log(prevQs);
      if (prevQs.length>0) {
        nextDate = moment(prevQs[0].date).add(1, 'd').startOf('day');
      }

      const qids=[];
      let i;
      for (i=0; i<req.body.questions.length; ++i) {
        qids.push(ObjectId(req.body.questions[i]));
      }

      const docs=[];
      const qlist = await Question.find({_id: {'$in': qids}});
      for (i=0; i<qlist.length; ++i) {
        docs.push({
          name: questionSetName,
          date: nextDate.toDate(),
          questions: [qlist[i].toObject()],
        });
        nextDate = nextDate.add(1, 'd');
      }

      const qs = await QuestionSet.insertMany(docs);

      return res.json(qs.map((d)=>d.toObject()));
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

    if (!this._hasWriteAccess(user)) {
      return res.sendStaus(403);
    }

    const updates=req.body.updates||[];
    const QuestionSet = this.database.QuestionSet;

    const bulk = QuestionSet.collection.initializeOrderedBulkOp();
    updates.forEach((qs)=>{
      bulk.find({'_id': ObjectId(qs._id)}).updateOne({$set: {
        questions: qs.questions,
        date: moment.utc(qs.date).startOf('day').toDate(),
        // modifiedBy: user.email,
        // modifiedAt: Date.now,
      }});
    });
    bulk.execute((error)=>{
      if (error) {
        this.logger.error(error);
        return res.sendStatus(500);
      }
      return res.json({});
    });
  }
}
