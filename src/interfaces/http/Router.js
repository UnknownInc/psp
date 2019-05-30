const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// module.exports = ({ config, containerMiddleware,
// loggerMiddleware, errorHandler, swaggerMiddleware }) => {
module.exports = ({config, logger, cache, database,
  containerMiddleware,
  userController, questionController}) => {
  logger.trace('Router.start');
  // eslint-disable-next-line new-cap
  const router = express.Router();

  router.use(express.static('client/build'));
  router.use(bodyParser.json({limit: '50mb'}));
  router.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  router.use(containerMiddleware);

  // eslint-disable-next-line new-cap
  const apiRouter = express.Router();
  router.use('/api', apiRouter);

  apiRouter.use('/user', userController.router);
  apiRouter.use('/questions', questionController.router);

  router.get('/ping', (req, res)=> res.send('pong'));

  router.get('/_status', (req, res)=>{
    res.json({
      buildInfo: {...config.buildInfo},
      cache: {...cache.status},
      db: {...database.status},
    });
  });

  router.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/build', 'index.html'));
  });
  // router.use(errorHandler);

  logger.trace('Router.end');
  return router;
};
