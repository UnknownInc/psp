const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');
const statusMonitor = require('express-status-monitor');
const cors = require('cors');
const methodOverride = require('method-override');

// module.exports = ({ config, containerMiddleware,
// loggerMiddleware, errorHandler, swaggerMiddleware }) => {
module.exports = ({config, logger, cache, database, eventsDb,
  containerMiddleware, loggerMiddleware,
  userController, questionController, teamController,
  optionsController, questionSetController,
}) => {
  const log=logger('Router');
  log.trace('setup');
  // eslint-disable-next-line new-cap
  const router = express.Router();

  /* istanbul ignore if */
  if (config.env === 'development') {
    router.use(statusMonitor());
  }

  /* istanbul ignore if */
  if (config.env !== 'test') {
    router.use(loggerMiddleware);
  }

  router.use(methodOverride('X-HTTP-Method-Override'));
  router.use(cors());
  router.use(compression());
  router.use(express.static('client/build'));
  router.use(bodyParser.json({limit: '50mb'}));
  router.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  router.use(containerMiddleware);

  // eslint-disable-next-line new-cap
  const apiRouter = express.Router();
  router.use('/api', apiRouter);

  apiRouter.use('/user', userController.router);
  apiRouter.use('/question', questionController.router);
  apiRouter.use('/questionset', questionSetController.router);
  apiRouter.use('/team', teamController.router);
  apiRouter.use('/options', optionsController.router);

  router.get('/ping', (req, res)=> res.send('pong'));

  router.get('/_status', (req, res)=>{
    res.json({
      buildInfo: {...config.buildInfo},
      cache: {...cache.status},
      db: {...database.status},
      edb: {...eventsDb.status},
    });
  });

  router.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/build', 'index.html'));
  });
  // router.use(errorHandler);
  return router;
};
