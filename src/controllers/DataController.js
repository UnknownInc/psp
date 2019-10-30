/* eslint-disable max-len */
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

    this._getScores = this._getScores.bind(this);
    this._getChildren = this._getChildren.bind(this);

    this.getSummary = this.getSummary.bind(this);
    this.getQuestionsSummary = this.getQuestionsSummary.bind(this);
    this.getUsersSummary = this.getUsersSummary.bind(this);
    this.getTeamQuestionsSummary = this.getTeamQuestionsSummary.bind(this);
  }

  /**
   * get the teams of the user
   * @param {*} uid user id of the team manager
   * @param {*} options query options
   */
  async _getChildren(uid, {
    startDate=(onemonthback.format('YYYY-MM-DD')),
    endDate=(today.format('YYYY-MM-DD')),
    groupname='reportees',
  }) {
    console.time('get children on date');
    const query=`
      WITH RECURSIVE team AS (
        SELECT
          source_id as user,
          time::Date as day
        FROM
          events e
        WHERE
          '${uid}' = ANY( ARRAY(SELECT jsonb_array_elements_text(groups->'${groupname}')) ) AND
          e.time::DATE >'${startDate}' AND e.time::DATE <'${endDate}'
        UNION
        SELECT
            e.source_id as user,
            time::Date as day
        FROM
            events e
        INNER JOIN team t ON t.user = ANY ( ARRAY(SELECT jsonb_array_elements_text(e.groups->'${groupname}')) ) AND e.time::DATE > '${startDate}' AND e.time::DATE < '${endDate}'
      ) SELECT t.day, array_agg(t.user) as users  from team t group by t.day;
    `;
    this.logger.trace(query);
    const result = await sh.query(query);
    console.timeEnd('get children on date');
    return result;
  }

  /**
   * get aggregate scores of the team
   * @param {*} uid user id of the team manager
   * @param {*} options query options
   */
  async _getScores(uid, {
    eventType='q',
    startDate=(onemonthback.format('YYYY-MM-DD')),
    endDate=(today.format('YYYY-MM-DD')),
    interval='1 day',
    groupName='reportees',
  }) {
    console.time('team aggregate');
    const query = `
      SELECT 
        time_bucket('${interval}', time) AS interval,
        category, 
        histogram(value, 20.0, 80.0, 3) as dist, 
        avg(value) as average,
        count(e.source_id) as count
      FROM events e
      INNER JOIN (
        WITH RECURSIVE team AS (
          SELECT
            source_id as user,
            time::Date as day
          FROM
            events
          WHERE
            '${uid}' = ANY( ARRAY(SELECT jsonb_array_elements_text(groups->'${groupName}')) )
          UNION
            SELECT
              e.source_id as user,
              time::Date as day
            FROM
              events e
            INNER JOIN team t ON t.user = ANY( ARRAY(SELECT jsonb_array_elements_text(e.groups->'${groupName}')) ) AND e.time::DATE = t.day
          )
          select t.day, array_agg(t.user) as users  from team t group by t.day
      ) ta
      ON e.time::DATE = ta.day AND e.source_id = ANY(ta.users)

      WHERE e.event_type='${eventType}' AND
          e.time>'${startDate}' AND e.time<'${endDate}' 
      GROUP by category, interval
      ORDER by interval;
    `;

    this.logger.trace('\n');
    this.logger.trace(query);
    this.logger.trace('\n');
    const result = await this.eventsdb.sh.query(query);
    console.timeEnd('team aggregate');
    return result;
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
   * Handle the  team questions summary request
   * @param {express.request} req
   * @param {express.response} res
   * @return {any} json response
   */
  async getTeamQuestionsSummary(req, res) {
    this.logger.trace('getTeamQuestionsSummary');
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          error: 'Unknown user',
        });
      }
    } catch (ex) {
      this.logger.error(err);
      return res.status(500).json({
        error: 'Unable to return team quetsion summary',
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
      let endDate;
      if (req.query.endDate) {
        if (moment(req.query.endDate).isValid()===false) {
          return res.status(400).json({
            error: `Bad value for endDate: ${req.query.endDate}`,
          });
        }
        endDate = moment(req.query.endDate).format('YYYY-MM-DD');
      } else {
        endDate = moment().format('YYYY-MM-DD');
      }

      let query =`SELECT 
          time::DATE as day, 
          COUNT(*) as count, 
          avg(value) as average,
          histogram(value, 20.0, 80.0, 3) as dist,
          event_ref as qsid
        FROM events 
        WHERE event_type='${req.params.eventType}'
        ${startDate?`AND time >='${startDate}'`:''}
        ${endDate?`AND time <='${endDate}'`:''}
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
