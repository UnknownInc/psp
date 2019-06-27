import VError from 'verror';
import moment from 'moment';

import APIResource from './APIResource';

const questionService = new APIResource({resourceName:'questionSet'})

export default class QuestionSet {
  constructor({_id, name, date=(moment().utc()), questions=[]}){
    this._id = _id;
    this.name = name;
    this.date = moment.utc(date);
    this.questions = [...questions];
  }

  toObject() {
    return {
      _id: this._id,
      name: this.name,
      date: this.date,
      questions: [...this.questions]
    }
  }

  static async update(items) {
    console.log(items);
    try {
      const {data} = await questionService.fetch('/',{
        method:'PUT',
        body:JSON.stringify({updates:[...items]})
      });
      return data;
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of available questionsets.');
    }
  }

  static async getAvailableSets() {
    try {
      const {data} = await questionService.fetch('/$distinct');
      return data;
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of available questionsets.');
    }
  }

  static async getSet(name,{offset=0, limit, sort}) {
    try {
      let url=`/${name}?offset=${offset}`;
      if (limit) {
        url+=`&limit=${limit}`;
      }
      if (sort) {
        url+=`&sort=${sort}`;
      }
      const {data, totalCount} = await questionService.fetch(url,{});

      const items = data.map(q=>new QuestionSet(q));
      return {items, totalCount};
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of available questionsets.');
    }
  }
}