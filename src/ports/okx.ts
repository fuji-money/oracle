import axios from 'axios';
import axiosThrottle from 'axios-request-throttle';
import { PriceSource } from '../domain/price-source';
import { Ticker } from '../domain/ticker';

axiosThrottle.use(axios, { requestsPerSecond: 5 });

type OkxResponse = {
  data: Array<{
    buyLmt?: string;
    sellLmt?: string;
  }>;
};

function isOkxResponse(obj: any): obj is OkxResponse {
  return obj && Array.isArray(obj.data);
}

function toInstrumentID(ticker: Ticker): string {
  switch (ticker) {
    case Ticker.BTCUSD:
      return 'BTC-USDT-SWAP';
    default:
      throw new Error(`(okx) unsupported ticker ${ticker}`);
  }
}

export class OkxPriceSource implements PriceSource {
  static URL = 'https://www.okx.com/api/v5/public/price-limit';

  async getPrice(ticker: Ticker): Promise<number> {
    const response = await axios.get<OkxResponse>(
      `${OkxPriceSource.URL}?instId=${toInstrumentID(ticker)}`
    );

    if (!isOkxResponse(response.data)) {
      throw new Error(`Invalid response from ${OkxPriceSource.URL}/${ticker}`);
    }

    const tickerData = response.data.data[0];
    if (!tickerData) {
      throw new Error(
        `Invalid response from ${
          OkxPriceSource.URL
        }/${ticker} (missing ${toInstrumentID(ticker)} in object)`
      );
    }

    const sellPrice = tickerData.sellLmt;
    const buyPrice = tickerData.buyLmt;

    if (!sellPrice || !buyPrice) {
      throw new Error(
        `Invalid response from ${OkxPriceSource.URL}/${ticker} (missing sell or buy price)`
      );
    }

    return Math.min(Number(sellPrice), Number(buyPrice));
  }
}
