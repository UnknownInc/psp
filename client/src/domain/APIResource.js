import VError from 'verror';
import {getHeaders} from '../config';

export default class APIResource {
  constructor({baseUrl, resourceName}) {
    this.baseUrl = baseUrl || '/api'
    this.resourceName = resourceName;
    this.apiurl =`${this.baseUrl}/${this.resourceName}`;
  }

  async fetch(url, options={}) {
    const headers = getHeaders();
    // options.headers = Object.assign(options.headers||{}, headers);
    options.headers = options.headers||{};
    if (!options.headers['Authorization']){
      options.headers['Authorization'] = headers['Authorization']
    }
    if (!options.headers["Content-Type"]) {
      options.headers["Content-type"] = "application/json";
    }
    const response = await fetch(`${this.apiurl}${url}`, options);

    this.checkAPIError(response);

    const data = await response.json();
    const totalCount = parseInt(response.headers.get('x-total-count')||'0');
    return {data, totalCount};
  }

  checkAPIError(response) {
    if (!response.ok) {
      throw new VError({
        name:'APIError',
        cause: response.statusText,
        info:{
          statusCode: response.statusCode,
        }
      });
    }
  }
}