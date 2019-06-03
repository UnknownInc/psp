import {
  createContainer,
  asClass,
  asFunction,
  asValue,
} from 'awilix';
const {scopePerRequest} = require('awilix-express');

import config from './config';
import logger from './infra/logging/logger';
import Database from './infra/database';
import Cache from './infra/cache';

import Application from './app/Application';
import Server from './interfaces/http/Server';
import router from './interfaces/http/Router';

import userAuthorization from './interfaces/http/userAuthorizationMiddleware';
import loggerMiddleware from './interfaces/http/loggingMiddleware';
import mailer from './infra/mailer';

const container = createContainer();

// System
container
    .register({
      app: asClass(Application).singleton(),
      server: asClass(Server).singleton(),

      loggerMiddleware: asFunction(loggerMiddleware).singleton(),
      containerMiddleware: asValue(scopePerRequest(container)),
      userAuthorizationMiddleware: asFunction(userAuthorization).singleton(),
    })
    .register({
      config: asValue(config),
    })
    .register({
      logger: asFunction(logger).singleton(),
      router: asFunction(router).singleton(),
    });

// Database
container
    .register({
      database: asClass(Database).singleton(),
      cache: asClass(Cache).singleton(),
      mailer: asFunction(mailer).singleton(),
    });


import UserController from './controllers/UserController';
import QuestionController from './controllers/QuestionController';
import TeamController from './controllers/TeamController';
container
    .register({
      userController: asClass(UserController),
      questionController: asClass(QuestionController),
      teamController: asClass(TeamController),
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
