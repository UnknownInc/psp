import {
  createContainer,
  asClass,
  asFunction,
  asValue,
} from 'awilix';
// const {scopePerRequest} = require('awilix-express');

import config from '../config';
import logger from './infra/logging/logger';
import Database from './infra/database';

import Application from './app/Application';
import Server from './interfaces/http/Server';
import router from './interfaces/http/Router';


const container = createContainer();

// System
container
    .register({
      app: asClass(Application).singleton(),
      server: asClass(Server).singleton(),
    })
    .register({
      config: asValue(config),
    })
    .register({
      router: asFunction(router).singleton(),
      logger: asFunction(logger).singleton(),
    });

// Database
container
    .register({
      database: asClass(Database).singleton(),
    });

export default container;
