const {Router} = require('express');

// module.exports = ({ config, containerMiddleware,
// loggerMiddleware, errorHandler, swaggerMiddleware }) => {
module.exports = ({config, logger}) => {
  logger.trace('Router start');
  // eslint-disable-next-line new-cap
  const router = Router();

  router.get('/ping', (req, res)=>{
    res.send('pong');
  });

  router.get('/_status', (req, res)=>{
    res.json({
      buildInfo: {...config.buildInfo},
    });
  });

  // eslint-disable-next-line new-cap
  const apiRouter = Router();
  router.use('/api', apiRouter);

  // router.use(errorHandler);

  logger.trace('Router end');
  return router;
};
