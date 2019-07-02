import VError from 'verror';
import APIResource from './APIResource';
import User from './User';
import uuidv1 from 'uuid/v1';

const teamService = new APIResource({resourceName:'team'})

export default class Team {
  constructor(data) {
    this.set(data);
  }
  
  set({_id, name, children=[], type, user}){
    this._id=_id||("new"+uuidv1());
    this.name=name
    this.children=children.map(c=>new User(c));
    this.type = type;
    this.user = new User(user);
    return this;
  }

  toObject() {
    return {
      _id: this._id,
      name: this.name,
      type: this.type,
      user: this.user?this.user._id:null,
      children: this.children.map(c=>c.toObject()._id),
    }
  }

  async addMember(email){
    try {
      let url = `/${this._id}`;
      const options = {
        method:'PUT',
        body:JSON.stringify({
          add:[email]
        })
      };
      const {data} = await teamService.fetch(url, options);
      return this.set(data)
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to add new member');
    }
  }


  async removeMember(email){
    try {
      let url = `/${this._id}`;
      const options = {
        method:'PUT',
        body:JSON.stringify({
          remove:[email]
        })
      };
      const {data} = await teamService.fetch(url, options);
      return this.set(data)
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to remove member');
    }
  }

  async save() {
    if (this._id.startsWith('new')) {
      const team=this.toObject();
      delete team._id;
      try {
        return this.set(await teamService.create(team));
      } catch (err) {
        throw new VError(err, 'Unable to create new team');
      }
    } else {
      try {
        return this.set(await teamService.save(this.toObject()));
      } catch(err) {
        throw new VError(err, 'Unable to update team')
      }
    }
  }

  async delete() {
    teamService.delete(this);
  }

  static async load({userid, type}){
    try {
      let url = `/?user=${userid}`;
      if (type) {
        url+=`&type=${type}`;
      }
      const {data} = await teamService.fetch(url);
      return data.map(d=>new Team(d));
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of teams.');
    }
  }
}