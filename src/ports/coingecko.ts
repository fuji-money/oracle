import axios from 'axios';
import axiosThrottle from 'axios-request-throttle';
import { PriceSource } from '../domain/price-source';
import { Ticker } from '../domain/ticker';

axiosThrottle.use(axios, { requestsPerSecond: 1 });

type CoingeckoParameters = {
  id: string;
  currency: string;
};

export class CoingeckoPriceSource implements PriceSource {
  static URL = 'https://api.coingecko.com/api/v3/simple/price';

  private getCoingeckoParameters(ticker: Ticker): CoingeckoParameters {
    switch (ticker) {
      case Ticker.BTCUSD:
        return { id: 'bitcoin', currency: 'usd' };
      default:
        throw new Error(`(coingecko) unsupported ticker ${ticker}`);
    }
  }

  async getPrice(ticker: Ticker): Promise<number> {
    const { id, currency } = this.getCoingeckoParameters(ticker);
    const response = await axios.get(
      `${CoingeckoPriceSource.URL}?ids=${id}&vs_currencies=${currency}`
    );
    const price = response.data[id][currency];
    if (typeof price !== 'number') {
      throw new Error(
        `(coingecko) invalid price ${price} for ticker ${ticker}`
      );
    }
    return price;
  }
}
