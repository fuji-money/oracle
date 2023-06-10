import { Ticker } from './ticker';

export type PriceSource = {
  getPrice(ticker: Ticker): Promise<number>;
};

function median(numbers: number[]): number {
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export class MedianPriceSource implements PriceSource {
  private priceSources: PriceSource[];

  constructor(...priceSources: PriceSource[]) {
    this.priceSources = priceSources;
  }

  async getPrice(ticker: Ticker): Promise<number> {
    const prices = await Promise.allSettled(
      this.priceSources.map((priceSource) => priceSource.getPrice(ticker))
    );
    // print errors, will throw later if no price feed is available
    for (const price of prices) {
      if (price.status === 'rejected') {
        console.error(price.reason);
      }
    }

    const fulfilledPrices = prices.filter(
      (price) => price.status === 'fulfilled'
    ) as PromiseFulfilledResult<number>[];
    if (fulfilledPrices.length === 0) {
      throw new Error(`No price source available for ticker ${ticker}`);
    }

    return median(fulfilledPrices.map((price) => price.value));
  }
}
