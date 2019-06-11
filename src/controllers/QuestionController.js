/* eslint-disable new-cap */
const {Router} = require('express');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;


/**
 * Controller class to handle all user related api's
 * /user/...
 */
export default class QuestionController {
  /**
   * constructor for QuestionController
   * @param {dependencies} logger for logging
   */
  constructor({logger,
    config, cache, database,
    userAuthorizationMiddleware}) {
    this.logger = logger('QuestionController');
    this.config = config;
    this.database = database;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.cache = cache;

    this.getQuestion = this.getQuestion.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.addQuestions = this.addQuestions.bind(this);
    this.updateQuestions = this.updateQuestions.bind(this);
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.get('/', this.userAuthorizationMiddleware, this.getQuestions);
    router.get('/:id', this.userAuthorizationMiddleware, this.getQuestion);
    router.put('/', this.userAuthorizationMiddleware, this.updateQuestions);
    router.post('/', this.userAuthorizationMiddleware, this.addQuestions);
    return router;
  }

  /**
   * gets the list of questions
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getQuestions(req, res) {
    this.logger.trace('getQuestions');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    const Question = this.database.Question;
    // TODO: validate the questions query parameters
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
      const count = await Question.find({query}).estimatedDocumentCount();
      let mq = Question.find(query);
      if (req.query.sort) {
        mq=mq.sort(req.query.sort);
      }
      const results = await mq.skip(offset).limit(limit);
      const questions=[];
      results.forEach((q) => {
        questions.push(q.toObject());
      });
      res.set('X-Total-Count', ''+count);
      return res.json(questions);
    } catch (err) {
      console.error(err);
      return res.status(500);
    }
  }

  /**
   * gets the a question identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getQuestion(req, res) {
    this.logger.trace('getQuestion:'+req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    const Question = this.database.Question;

    if (req.params.id==='current') {
      try {
        const results = await Question.find({})
            .skip(Math.trunc(Math.random()*400))
            .limit(1);
        return res.json(results[0].toObject());
      } catch (err) {
        console.error(err);
        return res.status(500);
      }
    }

    if (!user.isAdmin) {
      return res.sendStaus(403);
    }

    try {
      // eslint-disable-next-line new-cap
      const result = await Question.findOne({_id: ObjectId(req.params.id)});
      return res.json(result.toObject());
    } catch (err) {
      console.error(err);
      return res.status(500);
    }
  }

  /**
   * updates question identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async updateQuestions(req, res) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        error: 'Not authorized',
      });
    }

    const questions=req.body.questions||[];
    // TODO: validate the questions
    const Question = this.database.Question;

    const bulk = Question.collection.initializeOrderedBulkOp();
    questions.forEach((q)=>{
      bulk.find({'_id': ObjectId(q._id)}).updateOne({$set: {
        question: q.question,
        category: q.category,
        tags: q.tags,
        options: q.options,
        modifiedBy: user.email,
        modifiedAt: Date.now,
        targetlevels: q.targetlevels||'all',
        targetmintenure: q.targetmintenure||0,
      }});
    });
    bulk.execute((error)=>{
      if (error) {
        this.logger.error(error);
        return res.sendStatus(500);
      }
      return res.sendStatus(200);
    });
  }


  /**
   * adds new questions
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async addQuestions(req, res) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        error: 'Not authorized',
      });
    }

    const newQuestions=[];
    req.body.questions.forEach((q) => {
      newQuestions.push({
        question: q.question,
        category: q.category,
        tags: q.tags,
        options: q.options,
        createdBy: user.email,
        modifiedBy: user.email,
        targetlevels: q.targetlevels||'all',
        targetmintenure: q.targetmintenure||0,
      });
    });

    // TODO: validate the questions
    const Question = this.database.Question;

    Question.insertMany(newQuestions)
        .then((qlist)=>{
          return res.status(200).json(qlist);
        })
        .catch((err)=>{
          this.logger.error(err);
          return res.status(500);
        });
  }
}
