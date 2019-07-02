import VError from 'verror';
import {getHeaders} from '../config';

export default class APIResource {
  constructor({baseUrl, resourceName}) {
    this.baseUrl = baseUrl || '/api'
    this.resourceName = resourceName;
    this.apiurl =`${this.baseUrl}/${this.resourceName}`;
  }

  get Headers() {
    return getHeaders();
  }

  async create(item) {
    const headers = this.Headers;
    headers["Content-type"] = "application/json";
    const options={headers, body:JSON.stringify(item), method: 'POST'}

    const response = await fetch(`${this.apiurl}/`, options);
    let data;
    try {
      data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      this.checkAPIError(response, err)
    }

    return data;
  }

  async save(item) {
    const headers = this.Headers;
    headers["Content-type"] = "application/json";
    const options={headers, body:JSON.stringify(item), method: 'PUT'}

    const response = await fetch(`${this.apiurl}/${item._id}`, options);
    let data;
    try {
      data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      this.checkAPIError(response, err)
    }

    return data;
  }

  async delete(item) {
    const headers = this.Headers;
    headers["Content-type"] = "application/json";
    const options={headers, body:JSON.stringify(item), method: 'DELETE'}

    const response = await fetch(`${this.apiurl}/${item._id}`, options);

    if (response.ok) {
      this.isDeleted=true;
      return this;
    }

    let data;
    try {
      data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      this.checkAPIError(response, err)
    }

    return this;
  }

  async fetch(url, options={}) {
    const headers = this.Headers;
    // options.headers = Object.assign(options.headers||{}, headers);
    options.headers = options.headers||{};
    if (!options.headers['Authorization']){
      options.headers['Authorization'] = headers['Authorization']
    }
    if (!options.headers["Content-Type"]) {
      options.headers["Content-type"] = "application/json";
    }
    const response = await fetch(`${this.apiurl}${url}`, options);
    let data;
    try {
      data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      this.checkAPIError(response, err)
    }

    const totalCount = parseInt(response.headers.get('x-total-count')||'0');
    return {data, totalCount};
  }

  checkAPIError(response, err) {
    if (!response.ok) {
      throw new VError({
        name:'APIError',
        cause: err,
        info: {
          status: response.status,
        }
      }, 'API ERROR: %s', response.statusText);
    }
  }
}