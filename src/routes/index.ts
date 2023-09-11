import express from 'express';
import apicache from 'apicache';
import OracleController from '../controllers/oracle';
import PingController from '../controllers/ping';

const CACHE_DURATION = '30 seconds';

export default function routerFactory(
  oracleController: OracleController,
  pingController: PingController
) {
  const router = express.Router();

  router.get('/ping', async (_req, res) => {
    const response = await pingController.getMessage();
    return res.send(response);
  });

  router.get('/oracle', (_req, res) => {
    const response = oracleController.getInfo();
    return res.send(response);
  });

  router.get(
    '/oracle/:ticker',
    apicache.middleware(CACHE_DURATION),
    async (req, res) => {
      try {
        const response = await oracleController.getAttestationForTicker(
          req.params.ticker,
          req.query.timestamp as string,
          req.query.lastPrice as string
        );
        if (!response)
          return res.status(404).send({
            message: `no attestation available for ticker ${req.params.ticker}`,
          });
        return res.send(response);
      } catch (err: any) {
        const message =
          err instanceof Error ? err.message : JSON.stringify(err);
        return res.status(500).send({ message });
      }
    }
  );

  return router;
}
