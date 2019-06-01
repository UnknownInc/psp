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
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.get('/', this.userAuthorizationMiddleware, this.getQuestions);
    router.get('/:id', this.userAuthorizationMiddleware, this.getQuestion);
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
      const results = await Question.find(query);
      const questions=[];
      results.forEach((q) => {
        questions.push(q.toObject());
      });
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
      const result = await Question.findOne({_id: ObjectId(req.params.id)})
      return res.json(result.toObject());
    } catch (err) {
      console.error(err);
      return res.status(500);
    }
  }
}
