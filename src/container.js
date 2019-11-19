import {
  createContainer,
  asClass,
  asFunction,
  asValue,
} from 'awilix';
const {scopePerRequest} = require('awilix-express');

import config from './config';

import Application from './app/Application';
import Server from './interfaces/http/Server';
import router from './interfaces/http/Router';


// eslint-disable-next-line no-extend-native
Array.prototype.asyncForEach = async function asyncForEach(callback) {
  for (let index = 0; index < this.length; index++) {
    await callback(this[index], index, this);
  }
};

const container = createContainer();

// System
container
    .register({
      config: asValue(config),
    })
    .register({
      app: asClass(Application).singleton(),
    })
    .register({
      server: asClass(Server).singleton(),
      router: asFunction(router).singleton(),
    });

import loggerMiddleware from './interfaces/http/loggingMiddleware';
import userAuthorization from './interfaces/http/userAuthorizationMiddleware';
// Middleware
container
    .register({
      containerMiddleware: asValue(scopePerRequest(container)),
      loggerMiddleware: asFunction(loggerMiddleware).singleton(),
      userAuthorizationMiddleware: asFunction(userAuthorization).singleton(),
    });

import logger from './infra/logging/logger';
import Cache from './infra/cache';
import Database from './infra/database';
import EventsDatabase from './infra/database/events';
import mailer from './infra/mailer';
// infra
container
    .register({
      logger: asFunction(logger).singleton(),
      cache: asClass(Cache).singleton(),
      database: asClass(Database).singleton(),
      eventsdb: asClass(EventsDatabase).singleton(),
      mailer: asFunction(mailer).singleton(),
    });


import UserController from './controllers/UserController';
import QuestionController from './controllers/QuestionController';
import QuestionSetController from './controllers/QuestionSetController';
import TeamController from './controllers/TeamController';
import OptionsController from './controllers/OptionsController';
import DataController from './controllers/DataController';
container
    .register({
      userController: asClass(UserController),
      questionController: asClass(QuestionController),
      teamController: asClass(TeamController),
      optionsController: asClass(OptionsController),
      dataController: asClass(DataController),
      questionSetController: asClass(QuestionSetController),
    });
/*
// with `loadModules`
container.loadModules([
  [
    'controllers/*.js',
  ],
], {
  formatName: 'camelCase',
});
*/
// Load our modules!
// container.loadModules([
//   // Globs!
//   [
//     // To have different resolverOptions for specific modules.
//     'models/**/*.js',
//     {
//       register: awilix.asValue,
//       lifetime: Lifetime.SINGLETON
//     }
//   ],
//   'services/**/*.js',
//   'repositories/**/*.js'
// ], {
//     // We want to register `UserService` as `userService` -
//     // by default loaded modules are registered with the
//     // name of the file (minus the extension)
//     formatName: 'camelCase',
//     // Apply resolver options to all modules.
//     resolverOptions: {
//       // We can give these auto-loaded modules
//       // the deal of a lifetime! (see what I did there?)
//       // By default it's `TRANSIENT`.
//       lifetime: Lifetime.SINGLETON,
//       // We can tell Awilix what to register everything as,
//       // instead of guessing. If omitted, will inspect the
//       // module to determinw what to register as.
//       register: awilix.asClass
//     }
// )

export default container;
