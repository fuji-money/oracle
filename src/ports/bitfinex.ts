import axios from 'axios';
import axiosThrottle from 'axios-request-throttle';
import { PriceSource } from '../domain/price-source';
import { Ticker } from '../domain/ticker';

axiosThrottle.use(axios, { requestsPerSecond: 5 });

type BitfinexResponse = {
  last_price: string;
};

function isBitfinexResponse(obj: any): obj is BitfinexResponse {
  return obj && typeof obj.last_price === 'string';
}

export class BitfinexPriceSource implements PriceSource {
  static URL = 'https://api.bitfinex.com/v1/pubticker';

  public async getPrice(ticker: Ticker): Promise<number> {
    const response = await axios.get<BitfinexResponse>(
      `${BitfinexPriceSource.URL}/${ticker}`
    );

    if (!isBitfinexResponse(response.data)) {
      throw new Error(
        `Invalid response from ${BitfinexPriceSource.URL}/${ticker}`
      );
    }
    return Number(response.data.last_price);
  }
}
