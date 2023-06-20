import axios from 'axios';
import axiosThrottle from 'axios-request-throttle';
import { PriceSource } from '../domain/price-source';
import { Ticker } from '../domain/ticker';

axiosThrottle.use(axios, { requestsPerSecond: 1 });

type KrakenResponse = {
  error: unknown[];
  result: {
    [key: string]: {
      a: [string, string, string];
      b: [string, string, string];
    };
  };
};

type KrakenTicker = {
  pair: string;
  keyInResult: string;
};

function isKrakenResponse(obj: any): obj is KrakenResponse {
  return obj && Array.isArray(obj.error) && typeof obj.result === 'object';
}

function toKrakenTicker(ticker: Ticker): KrakenTicker {
  switch (ticker) {
    case Ticker.BTCUSD:
      return { keyInResult: 'XXBTZUSD', pair: 'XBTUSD' };
    default:
      throw new Error(`(kraken) unsupported ticker ${ticker}`);
  }
}

export class KrakenPriceSource implements PriceSource {
  static URL = 'https://api.kraken.com/0/public/Ticker';

  async getPrice(ticker: Ticker): Promise<number> {
    const { pair, keyInResult } = toKrakenTicker(ticker);
    const response = await axios.get<KrakenResponse>(
      `${KrakenPriceSource.URL}?pair=${pair}`
    );

    if (!isKrakenResponse(response.data)) {
      throw new Error(
        `Invalid response from ${KrakenPriceSource.URL}/${ticker}`
      );
    }

    const tickerData = response.data.result[keyInResult];
    if (!tickerData) {
      throw new Error(
        `Invalid response from ${KrakenPriceSource.URL}/${ticker} (missing ${keyInResult} in object)`
      );
    }
    const sellPrice = tickerData.a[0];
    const buyPrice = tickerData.b[0];
    if (!sellPrice || !buyPrice) {
      throw new Error(
        `Invalid response from ${KrakenPriceSource.URL}/${ticker} (missing sell or buy price)`
      );
    }

    return Math.min(Number(sellPrice), Number(buyPrice));
  }
}
