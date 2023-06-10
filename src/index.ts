import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import express, { Application } from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';

import routerFactory from './routes';
import { Ticker } from './domain/ticker';
import { MedianPriceSource } from './domain/price-source';
import { BitfinexPriceSource } from './ports/bitfinex';
import { CoingeckoPriceSource } from './ports/coingecko';

// ENV vars
const PORT = process.env.PORT || 8000;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Missing PRIVATE_KEY env var');
  process.exit(1);
}

const ECPair = ECPairFactory(ecc);
const oracle = ECPair.fromPrivateKey(Buffer.from(PRIVATE_KEY, 'hex'));

const app: Application = express();

const router = routerFactory(
  oracle,
  [Ticker.BTCUSD],
  new MedianPriceSource(new BitfinexPriceSource(), new CoingeckoPriceSource())
);

app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(router);
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.json',
    },
  })
);

const server = app.listen(PORT, () => {
  console.log('Server is running on port', PORT);
});

function gracefulshutdown() {
  console.log('Shutting down');
  server.close(() => {
    console.log('HTTP server closed.');
    // When server has stopped accepting connections
    // exit the process with exit status 0
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulshutdown);
process.on('SIGINT', gracefulshutdown);
