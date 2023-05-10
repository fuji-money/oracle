import { Get, Route, Tags, Path, Query } from 'tsoa';
import axios from 'axios';
import crypto from 'crypto';
import { ECPairInterface } from 'ecpair';
import { extractErrorMessage } from '../utils/axiosError';
import { uint64LE } from '../utils/bufferutils';

type BitfinexResponse = {
  timestamp: string;
  last_price: string;
};

export type OracleAttestation = {
  timestamp: string;
  lastPrice: string;
  attestation: {
    signature: string;
    message: string;
    messageHash: string;
  };
};

export type OracleInfo = {
  publicKey: string;
  availableTickers: string[];
};

@Route('oracle')
@Tags('Oracle')
export default class OracleController {
  constructor(
    private keyPair: ECPairInterface,
    private availableTickers: string[],
    private url: string
  ) {}

  @Get('/')
  public getInfo(): OracleInfo {
    return {
      publicKey: this.keyPair.publicKey.toString('hex'),
      availableTickers: this.availableTickers,
    };
  }

  @Get('/:ticker')
  public async getAttestationForTicker(
    @Path() ticker: string,
    @Query() timestamp: string,
    @Query() lastPrice: string,
    @Query() assetPair: string
  ): Promise<OracleAttestation | null> {
    if (!this.availableTickers.includes(ticker)) return null;

    // if we pass the timestamp and lastPrice via querystring we "simulate" the oracle and skip calling the price feed
    let timestampToUse = Number(timestamp);
    let lastPriceToUse = Number(lastPrice);
    if (!timestamp || !lastPrice) {
      try {
        const response = await axios.get(`${this.url}/${ticker}`);
        if (response.status !== 200) throw new Error(response.data);
        const data: BitfinexResponse = response.data;
        timestampToUse = Math.trunc(Number(data.timestamp) * 1000); //bitfinex returns it in seconds
        lastPriceToUse = Math.trunc(Number(data.last_price));
      } catch (error: unknown) {
        throw new Error(extractErrorMessage(error));
      }
    }

    try {
      const timpestampLE64 = uint64LE(timestampToUse);
      const priceLE64 = uint64LE(lastPriceToUse);
      const message = Buffer.from([
        ...timpestampLE64,
        ...priceLE64,
        ...Buffer.from(assetPair, 'hex'),
      ]);
      const hash = crypto.createHash('sha256').update(message).digest();
      const signature = this.keyPair.signSchnorr(hash);
      return {
        timestamp: timestampToUse!.toString(),
        lastPrice: lastPriceToUse!.toString(),
        attestation: {
          signature: signature.toString('hex'),
          message: message.toString('hex'),
          messageHash: hash.toString('hex'),
        },
      };
    } catch (e) {
      throw new Error('Bitfinex: An error occurred while signing the message');
    }
  }
}
