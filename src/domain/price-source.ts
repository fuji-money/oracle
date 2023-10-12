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

// PriceSourceManager is a PriceSource that aggregates multiple PriceSource and returns the median value of all the prices
// it handles errors by banning a source for BAN_TIME_MS milliseconds
export class PriceSourceManager implements PriceSource {
  static BAN_TIME_MS = 60 * 1000; // 1 minute

  private bannedSources: { source: PriceSource; freeAt: number }[] = [];

  constructor(
    public priceSources: PriceSource[],
    private errorHandler: (err: unknown) => void,
    private banTimeMs = PriceSourceManager.BAN_TIME_MS
  ) {}

  async getPrice(ticker: Ticker): Promise<number> {
    this.freeBannedSources();

    if (this.priceSources.length === 0) {
      throw new Error('No price source available');
    }

    const pricesPromises = await Promise.allSettled(
      this.priceSources.map((priceSource) => priceSource.getPrice(ticker))
    );
    // print errors, will throw later if no price feed is available
    for (const [index, price] of pricesPromises.entries()) {
      if (price.status === 'rejected') {
        const source = this.priceSources[index];
        this.ban(source);
        this.deletePriceSource(index);
        this.errorHandler(price.reason);
      }
    }

    const fulfilledPrices = pricesPromises.filter(
      (price) => price.status === 'fulfilled'
    ) as PromiseFulfilledResult<number>[];
    if (fulfilledPrices.length === 0) {
      throw new Error(`No price source available for ticker ${ticker}`);
    }

    return median(fulfilledPrices.map((price) => price.value));
  }

  private deletePriceSource(index: number) {
    this.priceSources = this.priceSources.filter((_, i) => i !== index);
  }

  private ban(source: PriceSource) {
    this.bannedSources.push({
      source,
      freeAt: Date.now() + this.banTimeMs,
    });
  }

  private freeBannedSources() {
    const now = Date.now();
    this.bannedSources = this.bannedSources.filter(({ freeAt, source }) => {
      if (freeAt < now) {
        this.priceSources.push(source);
        return false;
      }
      return true;
    });
  }
}
