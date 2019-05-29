const express = require('express');
const path = require('path');

// module.exports = ({ config, containerMiddleware,
// loggerMiddleware, errorHandler, swaggerMiddleware }) => {
module.exports = ({config, logger, cache, database}) => {
  logger.trace('Router.start');
  // eslint-disable-next-line new-cap
  const router = express.Router();

  router.use(express.static('client/build'));
  router.get('/ping', (req, res)=>{
    res.send('pong');
  });

  router.get('/_status', (req, res)=>{
    res.json({
      buildInfo: {...config.buildInfo},
      cache: {...cache.status},
      db: {...database.status},
    });
  });

  // eslint-disable-next-line new-cap
  const apiRouter = express.Router();
  router.use('/api', apiRouter);


  router.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '../../../client/build', 'index.html'));
  });
  // router.use(errorHandler);

  logger.trace('Router.end');
  return router;
};
