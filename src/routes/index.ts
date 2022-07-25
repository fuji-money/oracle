import express from 'express';
import OralceController from '../controllers/oracle';
import PingController from '../controllers/ping';

import { ECPairInterface } from 'ecpair';

export default function routerFactory(
  keyPair: ECPairInterface,
  availableTickers: string[],
  url: string
) {
  const router = express.Router();

  router.get('/ping', async (_req, res) => {
    const controller = new PingController();
    const response = await controller.getMessage();
    return res.send(response);
  });

  router.get('/oracle', (_req, res) => {
    const controller = new OralceController(keyPair, availableTickers, url);
    const response = controller.getInfo();
    return res.send(response);
  });

  router.get('/oracle/:ticker', async (req, res) => {
    const controller = new OralceController(keyPair, availableTickers, url);
    try {
      const response = await controller.getAttestationForTicker(
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
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      return res.status(500).send({ message });
    }
  });

  return router;
}
