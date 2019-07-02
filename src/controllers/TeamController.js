/* eslint-disable new-cap */
import {getEmailParts, AsyncHelper} from '../common/helpers';
const {Router} = require('express');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;


/**
 * Controller class to handle all team related api's
 * /team/...
 */
export default class TeamController {
  /**
   * constructor for QuestionController
   * @param {dependencies} logger for logging
   */
  constructor({logger,
    config, cache, database,
    userAuthorizationMiddleware}) {
    this.logger = logger('TeamController');
    this.config = config;
    this.database = database;
    this.userAuthorizationMiddleware = userAuthorizationMiddleware;
    this.cache = cache;

    this.getTeam = this.getTeam.bind(this);
    this.getTeams = this.getTeams.bind(this);
    this.updateTeam = this.updateTeam.bind(this);
    this.createTeam = this.createTeam.bind(this);
    this.deleteTeam = this.deleteTeam.bind(this);
  }

  /**
   * get the router for user api's
   */
  get router() {
    // eslint-disable-next-line new-cap
    const router = Router();
    router.use(this.userAuthorizationMiddleware);
    router.get('/', this.getTeams);
    router.get('/:teamid', this.getTeam);
    router.put('/:teamid', this.updateTeam);
    router.post('/', this.createTeam);
    router.delete('/:teamid', this.deleteTeam);
    return router;
  }


  /**
   * gets the team identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async createTeam(req, res) {
    this.logger.trace('createTeam');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    let userid=user._id;
    if (req.body.user && userid!==req.body.user) {
      if (!user.isAdmin) {
        return res.sendStaus(403);
      }
      userid=req.body.user;
    }

    const nodeType = req.body.type || 'ProjectTeam';
    const nodeName = (req.body.name||'').trim();

    const Node = this.database.Node;
    try {
      const query={user: ObjectId(userid), type: nodeType};
      if (nodeType!=='Reportees') {
        query.name=nodeName;
      }
      const matches = await Node.find(query);
      if (matches.length>0) {
        return res.status(400).json({
          error: `Cannot create Team of the type ${nodeType}. already exists.`,
        });
      }
      let n=new Node({user: ObjectId(userid)});
      n.name=nodeName;
      n.type=nodeType;
      n.tags=[...(req.body.tags||[])];
      n = await n.save();
      return res.json(n.toObject());
    } catch (err) {
      this.logger.error('Unable to create a node', err);
      return res.sendStatus(500);
    }
  }

  /**
   * gets the team identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getTeam(req, res) {
    this.logger.trace('getTeam', req.params.teamid);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    const Node = this.database.Node;

    try {
      const query={_id: ObjectId(req.params.teamid)};
      const teamNode = await Node.findOne(query).populate({
        path: 'user', select: ['name', 'email', 'title'],
      });
      if (!teamNode) {
        return res.sendStatus(404);
      }
      const result = teamNode.toObject();
      return res.json(result);
    } catch (err) {
      this.logger.error('Unable to retrive Node by id');
      return res.sendStatus(500);
    }
  }

  /**
   * Add new members to the team
   * @param {*} team to which new members will be added to
   * @param {*} members to add to the team
   */
  async addTeamMembers(team, members) {
    const User = this.database.User;
    // const users = await User.find({email: {'$in': members}});
    await members.forEach(async (email)=>{
      let user = await User.findByEmail(email);
      if (!user) {
        user = new User({email: email});
        user = await user.save();
      }
      team.children.addToSet(user._id);
    });
  }

  /**
   * updates the team identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async updateTeam(req, res) {
    this.logger.trace('updateTeam', req.params.teamid);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    let userid=user._id;
    if (req.body.user) {
      if (!user.isAdmin && userid!==req.body.user) {
        return res.sendStaus(403);
      }
      userid=req.body.user;
    }
    const User = this.database.User;
    const Node = this.database.Node;

    const add = req.body.add||[];
    const remove = req.body.remove||[];

    try {
      // check if a similar node laready exists
      let query;
      let teamNode;

      if (req.body.name) {
        query= {_id: {'$ne': ObjectId(req.params.teamid)}, user: ObjectId(userid)};
        query.name = req.body.name.trim();
        teamNode = await Node.findOne(query);
        if (teamNode) {
          return res.status(400).json({
            error: `Team of name ${req.body.name} already exists`,
          });
        }
      }

      query={_id: ObjectId(req.params.teamid)};
      teamNode = await Node.findOne(query).populate({
        path: 'user',
        select: 'email',
      });
      if (!teamNode) {
        return res.sendStatus(404);
      }

      let teamOwner = teamNode.user;
      if (req.body.user) {
        if (user._id!==teamNode.user._id && !user.isAdmin) {
          return res.status(403).send({
            error: 'Not the team owner',
          });
        }
        teamOwner=await User.findOne({_id: ObjectId(req.body.user)});
        teamNode.user=teamOwner;
      }

      const userParts = getEmailParts(teamOwner.email);

      // // only owner user or admin can update
      // if (!teamNode.user.equals(user._id) && !user.isAdmin) {
      //   return res.sendStatus(403);
      // }

      if (req.body.name) {
        teamNode.name = req.body.name.trim();
      }

      if (req.body.type) {
        teamNode.type = req.body.type.trim();
      }

      const newemails=[];
      let error;
      add.forEach((newuseremail) => {
        newuseremail=newuseremail.trim().toLowerCase();
        const nParts = getEmailParts(newuseremail);
        if (nParts.domain === userParts.domain) {
          newemails.push(newuseremail);
        } else {
          error='Invalid user email. Wrong company';
        }
      });

      if (error) {
        return res.status(400).json({error});
      }

      this.logger.trace('adding team members: ', newemails);
      // await this.addTeamMembers(teamNode, newemails);

      const ah=new AsyncHelper();
      await ah.each(newemails,
          async (email) => {
            let user = await User.findByEmail(email);
            if (!user) {
              user = new User({email: email});
              user = await user.save();
            }
            teamNode.children.addToSet(user._id);
          });
      this.logger.trace('team members: ', teamNode.children);

      const oldemails=[];
      remove.forEach((olduseremail) => {
        oldemails.push(olduseremail.trim().toLowerCase());
      });

      const oldusers = await User.find({email: {'$in': oldemails}});
      for (let i=0; i<oldusers.length; ++i) {
        const ou=oldusers[i];
        teamNode.children.remove(ou._id);
      }

      teamNode = await teamNode.save();
      teamNode = await Node.populate(teamNode, {
        'path': 'children',
        'select': ['email', 'name', 'title'],
      });
      return res.json(teamNode.toObject());
    } catch (err) {
      console.error(err);
      return res.sendStatus(500);
    }
  }

  /**
   * gets the list of teams
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async getTeams(req, res) {
    this.logger.trace('getTeams');
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    let userid=user._id;
    if (req.query.user) {
      // if (!user.isAdmin) {
      //   return res.sendStatus(403);
      // }
      userid=req.query.user;
    }

    const Node = this.database.Node;
    const query={user: ObjectId(userid)};

    if (req.query.name) {
      query.name=name;
    }

    if (req.query.id) {
      query._id=ObjectId(req.query.id);
    }

    if (req.query.type) {
      query.type=req.query.type.trim();
    }

    this.logger.debug('getTeams query', query);
    try {
      const nl = await Node.find(query);

      if (nl.length==0) {
        // let n = new Node({user: ObjectId(userid)});
        // n = await n.save();
        // nl.push(n);
      }

      const teams=[];
      for (let i=0; i<nl.length; i++) {
        const t = await Node.populate(nl[i],
            [
              {'path': 'user', 'select': ['email', 'name', 'title']},
              {'path': 'children', 'select': ['email', 'name', 'title']},
            ]);
        const node= t.toObject();
        // const children= await nl[i].getImmediateChildren({});
        // node.children=children;
        teams.push(node);
      }
      return res.json(teams);
    } catch (err) {
      this.logger.error('getTeams exception:', err);
      return res.sendStatus(500);
    }
  }

  /**
   * delete the team identified by the id
   * @param {express.request} req request object
   * @param {express.response} res response object
   * @return {any} nothing
   */
  async deleteTeam(req, res) {
    this.logger.trace('updateTeam', req.params.teamid);
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unknown user',
      });
    }

    const Node = this.database.Node;

    try {
      const query={_id: ObjectId(req.params.teamid)};
      const teamNode = await Node.findOne(query);

      if (teamNode.user!==ObjectId(user._id) && !user.isAdmin) {
        return res.sendStatus(403);
      }

      await Node.deleteOne({_id: teamNode._id});

      return res.sendStatus(200);
    } catch (err) {
      this.logger.error('delete exception:', err);
      return res.sendStatus(500);
    }
  }
}
