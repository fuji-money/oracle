import { BitfinexPriceSource } from '../../src/ports/bitfinex';
import { CoingeckoPriceSource } from '../../src/ports/coingecko';
import { KrakenPriceSource } from '../../src/ports/kraken';
import { OkxPriceSource } from '../../src/ports/okx';
import { BinancePriceSource } from '../../src/ports/binance';
import { PriceSourceManager, PriceSource } from '../../src/domain/price-source';
import { Ticker } from '../../src/domain/ticker';

const toTest: [PriceSource, string][] = [
  [new BitfinexPriceSource(), 'Bitfinex'],
  [new CoingeckoPriceSource(), 'CoinGecko'],
  [new KrakenPriceSource(), 'Kraken'],
  [new OkxPriceSource(), 'OKX'],
  [new BinancePriceSource(), 'Binance'],
];

describe('PriceSource services', () => {
  for (const [priceSource, name] of toTest) {
    it(`should return a price for ${name}`, async () => {
      const price = await priceSource.getPrice(Ticker.BTCUSD);
      expect(price).toBeGreaterThan(0);
    });
  }
});

function makeMockPriceSource(price: number | 'error') {
  return {
    getPrice: () =>
      price === 'error' ? Promise.reject('error') : Promise.resolve(price),
  };
}

const mockErrHandler = () => jest.fn(); // () => {};

jest.setTimeout(10 * 1000);

describe('PriceSourceManager', () => {
  it('should return the median price (even number of sources)', async () => {
    const errHandler = mockErrHandler();
    const priceSource = new PriceSourceManager(
      [
        makeMockPriceSource(300),
        makeMockPriceSource(200),
        makeMockPriceSource(100),
        makeMockPriceSource(500),
      ],
      errHandler
    );

    const price = await priceSource.getPrice(Ticker.BTCUSD);
    expect(price).toBe(250);
    expect(errHandler).not.toHaveBeenCalled();
  });

  it('should return the median price (odd number of sources)', async () => {
    const errHandler = mockErrHandler();
    const priceSource = new PriceSourceManager(
      [
        makeMockPriceSource(500),
        makeMockPriceSource(200),
        makeMockPriceSource(100),
      ],
      errHandler
    );

    const price = await priceSource.getPrice(Ticker.BTCUSD);
    expect(price).toBe(200);
    expect(errHandler).not.toHaveBeenCalled();
  });

  it('should ban for a minute if a source throws an error', async () => {
    const errHandler = mockErrHandler();
    const banTime = 3000; // 3 seconds

    const priceSource = new PriceSourceManager(
      [
        makeMockPriceSource(300),
        makeMockPriceSource('error'),
        makeMockPriceSource(100),
      ],
      errHandler,
      banTime
    );

    const firstCall = await priceSource.getPrice(Ticker.BTCUSD);
    expect(firstCall).toBe(200);
    expect(errHandler).toHaveBeenCalledTimes(1);

    const secondCall = await priceSource.getPrice(Ticker.BTCUSD);
    expect(secondCall).toBe(200);
    // should not call errHandler again (banned for 1 minute)
    expect(errHandler).toHaveBeenCalledTimes(1);

    // wait banTime + 1 second
    await new Promise((resolve) => setTimeout(resolve, banTime));

    const thirdCall = await priceSource.getPrice(Ticker.BTCUSD);
    expect(thirdCall).toBe(200);
    // should call errHandler again (error price source is unbanned)
    expect(errHandler).toHaveBeenCalledTimes(2);
  });
});
