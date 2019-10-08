/* eslint-disable new-cap */
import moment from 'moment';
const {Router} = require('express');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

/**
 * Utility function
 * @param {*} str
 * @return {boolean} true is str is null, undefined or empty
 */
function IsNullOrEmpty(str) {
  if (str===null) return true;
  if (str===undefined) return true;
  if (str==='') return true;
  return false;
}
/**
 * Controller class to handle all question related api's
 * /question/...
 */
export default class QuestionController {
  /**
   * constructor for QuestionController
   * @param {dependencies} logger for logging
   */
  constructor({logger,
    config, cache, database, eventsdb,
    userAuthorizationMiddleware}) {
    this.logger = logger('QuestionController');
    this.config = config;
    this.database = database;
    this.eventsdb = eventsdb;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.cache = cache;

    this.getQuestion = this.getQuestion.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.addQuestions = this.addQuestions.bind(this);
    this.updateQuestions = this.updateQuestions.bind(this);
    this.submitResponse = this.submitResponse.bind(this);
    this.replayEvents = this.replayEvents.bind(this);

    this._addQEvent = this._addQEvent.bind(this);
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.use(this.userAuthorizationMiddleware);
    router.get('/', this.getQuestions);
    router.get('/:id', this.getQuestion);
    router.put('/', this.updateQuestions);
    router.post('/', this.addQuestions);
    router.post('/submit', this.submitResponse);
    router.post('/replay', this.replayEvents);
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
      if (req.query.q) {
        query.question=new RegExp(req.query.q, 'i');
      }
      if (req.query.c) {
        query.category=new RegExp(req.query.c, 'i');
      }
      if (req.query.t) {
        query.tags={'$in': req.query.t.split(',')};
      }
      const count = await Question.where({query}).countDocuments();
      this.logger.debug(count);
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
   * submit response tp the a questionSet identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async submitResponse(req, res) {
    this.logger.trace('submitResponse');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    const {questionSet, question, response} = req.body;
    const rdate = req.body.date? moment(req.body.date).utc():moment().utc();
    if (IsNullOrEmpty(questionSet) ||
          IsNullOrEmpty(question) || IsNullOrEmpty(response)) {
      this.logger.warn('bad submittion', req.body);
      return res.sendStatus(400);
    }

    const QuestionSet = this.database.QuestionSet;
    const Response = this.database.Response;

    try {
      const qs=await QuestionSet.findOne({_id: ObjectId(questionSet)});
      if (!qs) {
        this.logger.trace(qs);
        return res.sendStatus(404);
      }

      // TODO: search in array when multiple questions
      if ( qs.questions[0]._id.toString() !== question) {
        this.logger.trace(qs);
        return res.sendStatus(404);
      }

      const match = await Response.findOne({
        user: user._id,
        date: rdate.clone().startOf('day'),
        set: ObjectId(questionSet),
        question: ObjectId(question),
      });

      if (match) {
        return res.sendStatus(403);
      } else {
        const todaysResponse = new Response({
          user: user._id,
          date: rdate.clone().startOf('day'),
          set: ObjectId(questionSet),
          question: ObjectId(question),
          response: response,
        });

        await todaysResponse.save();
      }


      await this._addQEvent(qs, response, user._id, rdate);

      return res.sendStatus(200);
    } catch (err) {
      this.logger.error(err);
      return res.sendStatus(500);
    }
  }
  /**
   * replay events
   * @param {*} req
   * @param {*} res
   */
  async replayEvents(req, res) {
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

    const QuestionSet = this.database.QuestionSet;
    const Response = this.database.Response;
    try {
      const allRes=await Response.find({});
      allRes.forEach(async (r)=>{
        const qs = await QuestionSet.findOne({_id: ObjectId(r.set)});
        await this._addQEvent(qs, r.response, r.user, moment(r.date));
      });
      return res.sendStatus(200);
    } catch (err) {
      this.logger.error(err);
      return res.sendStatus(500);
    }
  }

  /**
   * add question answer events to events table
   * @param {questionSet} qs
   * @param {string} response response for the question, (option selected)
   * @param {ObjectId} userid
   * @param {moment} rdate
   */
  async _addQEvent(qs, response, userid, rdate) {
    const q = qs.questions[0];
    const category = q.category;
    let resIdx=0;
    switch (response.toLowerCase()) {
      case 'a': resIdx=0; break;
      case 'b': resIdx=1; break; // 80
      case 'c': resIdx=2; break; // 60
      case 'd': resIdx=3; break; // 40
      case 'e': resIdx=4; break; // 20
      default:
        resIdx=q.options.length;
        break;
    }
    const responseValue=(1- (resIdx/q.options.length))*100;

    let edata={};
    edata.response=response;
    edata = JSON.stringify(edata);

    const Node = this.database.Node;

    const groups={};
    let parents = await Node.find({children: {'$in': userid}, type: 'Reportees'});
    groups.reportees = parents.map((n)=>`${n.user}`);

    parents = await Node.find({children: {'$in': userid}, type: 'Mentees'});
    groups.mentees = parents.map((n)=>`${n.user}`);
    
    parents = await Node.find({children: {'$in': userid}, type: 'ProjectTeam'});
    groups.projectteam = parents.map((n)=>`${n.user}`);

    const iquery = `
      INSERT INTO events ("source_id", "groups", "event_type", "event_ref",
      "time", "event_data", "value", "category")
      VALUES 
      ('${userid.toString()}', '${JSON.stringify(groups)}', 'q', 
        '${qs._id.toString()}','${rdate.format('YYYY-MM-DD hh:mm:ss')}', 
        '${edata}','${responseValue}','${category}')
      ON CONFLICT DO NOTHING;
    `;
    // this.logger.info(iquery);
    this.eventsdb.sh.query(iquery);
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

    const QuestionSet = this.database.QuestionSet;

    if (req.params.id==='current') {
      try {
        const result = await QuestionSet
            .findOne({name: 'default', date: (moment().utc().startOf('day'))});

        // const match = await Response.findOne({
        //   user: user._id,
        //   date: moment().utc().startOf('day'),
        //   set: ObjectId(result._id),
        //   question: ObjectId(result.questions[0]._id),
        // });

        // if (match) {
        // }

        if (result) {
          return res.json(result.toObject());
        } else {
          return res.sendStatus(404);
        }
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
