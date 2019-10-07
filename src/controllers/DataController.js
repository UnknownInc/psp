const moment = require('moment');

const {Router} = require('express');

/**
 * Handle all the /data api's
 */
export default class DataController {
  /**
   * constructor for DataController called by the IoC
   * @param {IoCdepencencies} param0
   */
  constructor({logger, database, eventsdb,
    userAuthorizationMiddleware}) {
    this.logger = logger('DataController');

    this.database=database;
    this.eventsdb=eventsdb;
    this.uacheck = userAuthorizationMiddleware;

    this.getSummary = this.getSummary.bind(this);
    this.getQuestionsSummary = this.getQuestionsSummary.bind(this);
    this.getUsersSummary = this.getUsersSummary.bind(this);
  }

  /**
   * get the router for data api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.use(this.uacheck);
    router.get('/:eventType', this.getSummary);
    return router;
  }

  /**
   * Handle the  summary request
   * @param {express.request} req
   * @param {express.response} res
   * @return {any} json response
   */
  async getSummary(req, res) {
    this.logger.trace('getSummary');
    const eventType = req.params.eventType.toLowerCase();
    switch (eventType) {
      case 'q':
        return this.getQuestionsSummary(req, res);
      case 'u':
        return this.getUsersSummary(req, res);
      default:
        return res.status(400).json({
          error: `Bad value for event type: ${req.params.eventType}`,
        });
    }
  }

  /**
   * Handle the  summary request
   * @param {express.request} req
   * @param {express.response} res
   * @return {any} json response
   */
  async getQuestionsSummary(req, res) {
    this.logger.trace('getQuestionsSummary');
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          error: 'Unknown user',
        });
      }
      if (user.isInRole('dashboard')===false) {
        return res.status(403).json({
          error: 'Need dashboard access',
        });
      }

      const eventType = req.params.eventType.toLowerCase();
      if (eventType!=='q') {
        return res.status(400).json({
          error: `Bad value for event type: ${req.params.eventType}`,
        });
      }

      let startDate;
      if (req.query.startDate) {
        if (moment(req.query.startDate).isValid()===false) {
          return res.status(400).json({
            error: `Bad value for startDate: ${req.query.startDate}`,
          });
        }
        startDate = moment(req.query.startDate).format('YYYY-MM-DD');
      }

      let query =`SELECT 
          time::DATE as day, 
          COUNT(*) as count, 
          avg(value) as average,
          histogram(value, 20.0, 80.0, 3) as dist,
          event_ref as qsid
        FROM events 
        WHERE event_type='${req.params.eventType}'
        ${startDate?`AND time >'${startDate}'`:''}
        GROUP BY day, qsid
        ORDER BY day desc`;

      if (req.query.limit) {
        query += `LIMIT ${req.query.limit}`;
      }

      const results = await this.eventsdb.sh.query(query);

      const QuestionSet = this.database.QuestionSet;
      const questions = await QuestionSet.find({_id: {'$in': results.rows.map((r)=>r.qsid)}});
      results.rows.forEach((r)=>{
        const match = questions.filter((q)=>q._id==r.qsid);
        r.questionset=match[0];
      });
      return res.json(results.rows);
    } catch (err) {
      this.logger.error(err);
      return res.status(500).json({
        error: 'Unable to return summary',
      });
    }
  }

  /**
   * Handle the  summary request
   * @param {express.request} req
   * @param {express.response} res
   * @return {any} json response
   */
  async getUsersSummary(req, res) {
    this.logger.trace('getUsersSummary');
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          error: 'Unknown user',
        });
      }
      if (user.isInRole('dashboard')===false) {
        return res.status(403).json({
          error: 'Need dashboard access',
        });
      }

      const eventType = req.params.eventType.toLowerCase();
      if (eventType!=='u') {
        return res.status(400).json({
          error: `Bad value for event type: ${req.params.eventType}`,
        });
      }

      // let startDate;
      // if (req.query.startDate) {
      //   if (moment(req.query.startDate).isValid()===false) {
      //     return res.status(400).json({
      //       error: `Bad value for startDate: ${req.query.startDate}`,
      //     });
      //   }
      //   startDate = moment(req.query.startDate).format('YYYY-MM-DD');
      // }

      const User = this.database.User;

      const registeredUsers = await User.countDocuments({isVerified: true});
      return res.json({registeredUsers});
    } catch (err) {
      this.logger.error(err);
      return res.status(500).json({
        error: 'Unable to return users summary',
      });
    }
  }
}
