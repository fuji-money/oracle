import { BitfinexPriceSource } from '../../src/ports/bitfinex';
import { CoingeckoPriceSource } from '../../src/ports/coingecko';
import { MedianPriceSource } from '../../src/domain/price-source';
import { Ticker } from '../../src/domain/ticker';

function makeMockPriceSource(price: number) {
  return {
    getPrice: () => Promise.resolve(price),
  };
}

describe('Price Source', () => {
  it('Bitfinex BTC/USD', async () => {
    const priceSource = new BitfinexPriceSource();
    const price = await priceSource.getPrice(Ticker.BTCUSD);
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThan(0);
  });

  it('CoinGecko BTC/USD', async () => {
    const priceSource = new CoingeckoPriceSource();
    const price = await priceSource.getPrice(Ticker.BTCUSD);
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThan(0);
  });

  describe('MedianPriceSource', () => {
    it('should return the median price (even number of sources)', async () => {
      const priceSource = new MedianPriceSource(
        makeMockPriceSource(300),
        makeMockPriceSource(200),
        makeMockPriceSource(100),
        makeMockPriceSource(400)
      );

      const price = await priceSource.getPrice(Ticker.BTCUSD);
      expect(price).toBe(250);
    });

    it('should return the median price (odd number of sources)', async () => {
      const priceSource = new MedianPriceSource(
        makeMockPriceSource(300),
        makeMockPriceSource(200),
        makeMockPriceSource(100)
      );

      const price = await priceSource.getPrice(Ticker.BTCUSD);
      expect(price).toBe(200);
    });
  });
});
