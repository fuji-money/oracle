import * as ecc from 'tiny-secp256k1';
import { Get, Route, Tags, Path, Query } from 'tsoa';
import crypto from 'crypto';
import { ECPairInterface } from 'ecpair';
import { uint64LE } from '../utils/bufferutils';
import { PriceSource } from '../domain/price-source';
import { Ticker } from '../domain/ticker';

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
    private priceSource: PriceSource,
    private isDevelopment: boolean = false,
  ) {}

  @Get('/')
  public getInfo(): OracleInfo {
    return {
      publicKey: this.keyPair.publicKey.toString('hex'),
      availableTickers: this.availableTickers,
    };
  }

  private getTimestampNowMs(): number {
    return Math.trunc(Date.now());
  }

  private isTickerAvailable(ticker: string): ticker is Ticker {
    return this.availableTickers.includes(ticker);
  }

  @Get('/:ticker')
  public async getAttestationForTicker(
    @Path() ticker: string,
    @Query() timestamp: string,
    @Query() lastPrice: string
  ): Promise<OracleAttestation | null> {
    if (!this.isTickerAvailable(ticker)) return null;

    // DEVELOPMENT ONLY: provide timestamp and lastPrice via querystring to "simulate" the oracle signing the message
    let timestampToUse = Number(timestamp);
    let lastPriceToUse = Number(lastPrice);

    // PRODUCTION: use the price source to get the timestamp and last price
    if (!this.isDevelopment) {
      const price = await this.priceSource.getPrice(ticker);
      timestampToUse = this.getTimestampNowMs();
      lastPriceToUse = Math.trunc(price);
    }

    try {
      const timpestampLE64 = uint64LE(timestampToUse);
      const priceLE64 = uint64LE(lastPriceToUse);
      const iso4217currencyCode = Buffer.from(ticker.replace('BTC', ''));
      const message = Buffer.from([
        ...timpestampLE64,
        ...priceLE64,
        ...iso4217currencyCode,
      ]);
      const hash = crypto.createHash('sha256').update(message).digest();
      if (!this.keyPair.privateKey) throw new Error('No private key found');
      const signature = Buffer.from(
        ecc.signSchnorr(hash, this.keyPair.privateKey, Buffer.alloc(32))
      );
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
