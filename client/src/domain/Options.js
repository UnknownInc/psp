import VError from 'verror';
import APIResource from './APIResource';

const optionsService = new APIResource({resourceName:'options'})

export default class Options {
  constructor({name, options}){
    this.name=name
    this.options=options;
  }

  toObject() {
    return {
      name: this.name,
      options: [...this.options],
    }
  }

  static async load({name='', onlynames=false}){
    try {
      const url = '/' + name + (onlynames?'?onlynames=1':'');
      const {data} = await optionsService.fetch(url);
      return new Options(data);
    } catch (err) {
      console.error(err);
      throw new VError(err,'Unable to retrive a list of available options.');
    }
  }
}