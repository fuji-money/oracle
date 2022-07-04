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
    },
    expected: {
      timestampUnix: '1656508635',
      priceTruncated: '20095',
      timestampBytes: 'db50bc6200000000',
      lastPriceBytes: '7f4e000000000000',
      message: 'db50bc62000000007f4e000000000000',
      messageHash:
        'e712152ffd387b4e8c0cb2e1c0db3d786ea9f792fadd164fffdaeeb6a5dc59bc',
      signature:
        '834d6f7c13d2502cf221c98ca90039daf5543fc26659d92036599c60cdf2e924fdc3fa5a3fff38e2877d5f30ec5825940fc0eeb2ec1f8e1714297589f1387d97',
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
    },
    expected: {
      timestampUnix: '1640991600',
      priceTruncated: '47169',
      timestampBytes: 'db50bc6200000000',
      lastPriceBytes: '7f4e000000000000',
      message: '708bcf610000000041b8000000000000',
      messageHash:
        'a2bb7e36b10851e8b305a5a91fdebec698d8b4013c4013cc577bcb1b9405445d',
      signature:
        '71a0b684d57c1a2b317b798e2caf21b840598e42d1c0d6966cfdb6266c536166b1a97157bef5eaaa6ee59f0be08986033e633afadd4bc12697d5ec8f38575cc6',
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

      const message = Buffer.from([...timpestampLE64, ...priceLE64]);
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
