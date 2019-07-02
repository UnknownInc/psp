import VError from 'verror';
import APIResource from './APIResource';
import uuidv1 from 'uuid/v1'
const userService = new APIResource({resourceName:'user'})

export default class User {
  constructor(data){
    this.set(data);
  }

  set({ _id, name, email, title, capability, industry, primarySkill, skills, clients, careerStage, oid, tags, details}) {
    this._id=_id||('new'+uuidv1());
    this.name=name
    this.email=email;
    this.title = title;
    this.capability = capability;
    this.industry = industry;
    this.primarySkill = primarySkill;
    this.skills = skills||[];
    this.clients = clients||[];
    this.careerStage = careerStage;
    this.oid = oid;
    this.tags = tags;
    this.details = details;
    return this;
  }

  toObject() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      title: this.title,
      capability: this.capability,
      industry: this.industry,
      primarySkill: this.primarySkill,
      skills: this.skills,
      clients: this.clients,
      careerStage: this.careerStage,
      oid: this.oid,
      tags: this.tags,
      details: this.details
    }
  }

  async save() {
    if (this._id.startsWith('new')) {
      const user=this.toObject();
      delete user._id;
      try {
        return this.set(await userService.create(user));
      } catch (err) {
        throw new VError(err, 'Unable to create new user');
      }
    } else {
      try {
        return this.set(await userService.save(this.toObject()));
      } catch(err) {
        throw new VError(err, 'Unable to update user')
      }
    }

  }

  static async getByEmail(email){
    try {
      const url = `/?email=${email}`;
      const {data} = await userService.fetch(url);
      if (data.length<=0) {
        return null;
      }
      return new User(data[0]);
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of available users');
    }
  }

  static async load({_id}){
    try {
      const url = `/${_id||'current'}`;
      const {data} = await userService.fetch(url);
      return new User(data);
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of available users');
    }
  }
}