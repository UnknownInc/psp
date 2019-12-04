import VError from 'verror';
import APIResource from './APIResource';
import moment from 'moment';

const dataService = new APIResource({resourceName:'data'})

export default class Data {
  static async getUserSummary() {
    try {
      let url = `/u?v=1`;
      // if (startDate) {
      //   url+=`&startDate=${moment(startDate).format('YYYY-MM-DD')}`;
      // }
      // if (limit) {
      //   url+=`&limit=${limit}`;
      // }
      const {data} = await dataService.fetch(url);
      return data;

    }catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive summary of users.');
    }
  }

  static async getQuestionsSummary({startDate, limit}) {
    try {
      let url = `/q?v=1`;
      if (startDate) {
        url+=`&startDate=${moment(startDate).format('YYYY-MM-DD')}`;
      }
      if (limit) {
        url+=`&limit=${limit}`;
      }
      const {data} = await dataService.fetch(url);
      return data;
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive summary of questions.');
    }
  } 

  static async getTeamQuestionsSummary({uid, startDate, limit}) {
    try {
      let url = `/q?v=1&u=${uid}`;
      if (startDate) {
        url+=`&startDate=${moment(startDate).format('YYYY-MM-DD')}`;
      }
      if (limit) {
        url+=`&limit=${limit}`;
      }
      const {data} = await dataService.fetch(url);
      return data;
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive team summary of questions.');
    }
  } 
}