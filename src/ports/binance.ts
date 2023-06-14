import axios from 'axios';
import axiosThrottle from 'axios-request-throttle';
import { PriceSource } from '../domain/price-source';
import { Ticker } from '../domain/ticker';

axiosThrottle.use(axios, { requestsPerSecond: 5 });

type BinanceResponse = {
  bidPrice?: string;
  askPrice?: string;
};

function isBinanceResponse(obj: any): obj is BinanceResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.bidPrice === 'string' &&
    typeof obj.askPrice === 'string'
  );
}

function toBinanceSymbol(ticker: Ticker): string {
  switch (ticker) {
    case Ticker.BTCUSD:
      return 'BTCUSDT';
    default:
      throw new Error(`(binance) unsupported ticker ${ticker}`);
  }
}

export class BinancePriceSource implements PriceSource {
  static URL = 'https://data.binance.com/api/v3/ticker/24hr';

  async getPrice(ticker: Ticker): Promise<number> {
    const symbol = toBinanceSymbol(ticker);
    const response = await axios.get<BinanceResponse>(
      `${BinancePriceSource.URL}?symbol=${symbol}`
    );

    if (!isBinanceResponse(response.data)) {
      throw new Error(
        `Invalid response from ${BinancePriceSource.URL}/${ticker}`
      );
    }

    const bidPrice = response.data.bidPrice;
    const askPrice = response.data.askPrice;

    if (!bidPrice || !askPrice) {
      throw new Error(
        `Invalid response from ${BinancePriceSource.URL}/${ticker} (missing bid or ask price)`
      );
    }

    return Math.min(Number(bidPrice), Number(askPrice));
  }
}
