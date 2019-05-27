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