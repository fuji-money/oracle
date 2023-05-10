import { uint64LE } from '../../src/utils/bufferutils';
import crypto from 'crypto';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

const ECPair = ECPairFactory(ecc);

const tests = [
  {
    name: 'attestation',
    fixture: {
      timestamp: 'Wed Jun 29 2022 13:17:15 GMT+0000',
      lastPrice: '20095.56',
      privateKey:
        '97abcd30d2cac1c96271711e567ee13ec27ce4360def5f58caea31eb7c926062',
      publicKey:
        '03f03225c0efa4da141b7ed4b1d2368732719c9430bd329ed8a757fa0022833d3f',
      assetPair: 'BTCUSD',
    },
    expected: {
      timestampUnix: '1656508635',
      priceTruncated: '20095',
      timestampBytes: 'db50bc6200000000',
      lastPriceBytes: '7f4e000000000000',
      message: 'db50bc62000000007f4e000000000000555344',
      messageHash:
        '8d276e5b86bcfa2b29834aae9aca8eb592fa67ce618528b800e4fa06414b1235',
      signature:
        '0843c8851aecdacc456edbe5d8a832acde88913ddf3d217452ebc7d06cbfd7cb7418778d2276b60c4b72ea722c4180d6808240ec646a64b37e49747e93d3d91d',
    },
  },
  {
    name: 'attestation',
    fixture: {
      timestamp: 'Fri Dec 31 2021 23:00:00 GMT+0000',
      lastPrice: '47169.37	',
      privateKey:
        '97abcd30d2cac1c96271711e567ee13ec27ce4360def5f58caea31eb7c926062',
      publicKey:
        '03f03225c0efa4da141b7ed4b1d2368732719c9430bd329ed8a757fa0022833d3f',
      assetPair: 'BTCUSD',
    },
    expected: {
      timestampUnix: '1640991600',
      priceTruncated: '47169',
      timestampBytes: 'db50bc6200000000',
      lastPriceBytes: '7f4e000000000000',
      message: '708bcf610000000041b8000000000000555344',
      messageHash:
        '7c2ae676d8150104371e025f77eeba9a2c639cfc3e42696ea8053e81c5212949',
      signature:
        '56598aa9cc8d3063055b0365461cbd88cde682203e6622ab533ab6f359e9e3b8cd52eb04ef5d82e790f82ad688bddb1f36a62dc3786a1108209ad6d1b82fee82',
    },
  },
];

describe('attestation', () => {
  for (const t of tests) {
    it(t.name, () => {
      const keyPair = ECPair.fromPrivateKey(
        Buffer.from(t.fixture.privateKey, 'hex')
      );

      const timestampUnix = new Date(t.fixture.timestamp).getTime() / 1000;
      const priceTruncated = Math.trunc(Number(t.fixture.lastPrice));

      const timpestampLE64 = uint64LE(timestampUnix);
      const priceLE64 = uint64LE(priceTruncated);

      const message = Buffer.from([
        ...timpestampLE64,
        ...priceLE64,
        ...Buffer.from(t.fixture.assetPair.replace('BTC', '')),
      ]);
      const hash = crypto.createHash('sha256').update(message).digest();
      const signature = keyPair.signSchnorr(hash);

      /* 
        console.log(
          timestampUnix,
          priceTruncated,
          timpestampLE64.toString('hex'),
          priceLE64.toString('hex'),
          message.toString('hex'),
          hash.toString('hex'),
          signature.toString('hex')
        ); 
      */

      expect(priceTruncated.toString()).toStrictEqual(
        t.expected.priceTruncated
      );
      expect(timestampUnix.toString()).toStrictEqual(t.expected.timestampUnix);
      expect(message.toString('hex')).toStrictEqual(t.expected.message);
      expect(hash.toString('hex')).toStrictEqual(t.expected.messageHash);
      expect(signature.toString('hex')).toEqual(t.expected.signature);
    });
  }
});
