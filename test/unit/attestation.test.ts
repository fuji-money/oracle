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
      assetPair:
        '25b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a184f95df51d642435c1c516b81b297c4db95785b81d54d2e8760eaa770b7e496',
      privateKey:
        '97abcd30d2cac1c96271711e567ee13ec27ce4360def5f58caea31eb7c926062',
      publicKey:
        '03f03225c0efa4da141b7ed4b1d2368732719c9430bd329ed8a757fa0022833d3f',
    },
    expected: {
      timestampUnix: '1656508635',
      priceTruncated: '20095',
      timestampBytes: 'db50bc6200000000',
      lastPriceBytes: '7f4e000000000000',
      message:
        'db50bc62000000007f4e00000000000025b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a184f95df51d642435c1c516b81b297c4db95785b81d54d2e8760eaa770b7e496',
      messageHash:
        'b7369aa5ce10c29c8199d4ee3229e7549183e98ebe0090e8ab513e66b934312f',
      signature:
        '1aabc3c98e7034985d7f35a6a45485c5d57d752503fc22bc906e42b46edfa505bfab0f3dc6534dd300ccafa0d442c94cb310deb8ae32a0ea3ef81699f67eff3b',
    },
  },
  {
    name: 'attestation',
    fixture: {
      timestamp: 'Fri Dec 31 2021 23:00:00 GMT+0000',
      lastPrice: '47169.37	',
      assetPair:
        '25b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a184f95df51d642435c1c516b81b297c4db95785b81d54d2e8760eaa770b7e496',
      privateKey:
        '97abcd30d2cac1c96271711e567ee13ec27ce4360def5f58caea31eb7c926062',
      publicKey:
        '03f03225c0efa4da141b7ed4b1d2368732719c9430bd329ed8a757fa0022833d3f',
    },
    expected: {
      timestampUnix: '1640991600',
      priceTruncated: '47169',
      timestampBytes: 'db50bc6200000000',
      lastPriceBytes: '7f4e000000000000',
      message:
        '708bcf610000000041b800000000000025b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a184f95df51d642435c1c516b81b297c4db95785b81d54d2e8760eaa770b7e496',
      messageHash:
        '28cd27d8f653bb657d5701f2ee3529faeef153412d4b61a8448932de2be31c18',
      signature:
        '9466e320da47e51daae185199e79c57231485c6731d1ca544f03729e5ca42758f7ac8799a2d3c2313855da1c12c6fd2bfef7423c2f7b1b83a1d03b324a411ae2',
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
        ...Buffer.from(t.fixture.assetPair, 'hex'),
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
