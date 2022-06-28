import { Get, Route, Tags } from 'tsoa';
import axios from 'axios';
import crypto from 'crypto';
import { ECPairInterface } from 'ecpair';
import { extractErrorMessage } from '../utils/axiosError';
import { uint8LE } from '../utils/bufferutils';

type BitfinexResponse = {
  timestamp: string;
  last_price: string;
};

export type OracleResponse = {
  timestamp: string;
  lastPrice: string;
  attestation: {
    signature: string;
    publicKey: string;
    message: string;
    messageHash: string;
  };
};

@Route('oracle')
@Tags('Oracle')
export default class OralceController {
  constructor(
    private keyPair: ECPairInterface,
    private availableTickers: string[],
    private url: string
  ) {}

  @Get('/:ticker')
  public async getAttestationForTicker(
    ticker: string
  ): Promise<OracleResponse | null> {
    if (!this.availableTickers.includes(ticker)) return null;

    let data: BitfinexResponse;
    try {
      const response = await axios.get(`${this.url}/${ticker}`);
      if (response.status !== 200) throw new Error(response.data);
      data = response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }

    try {
      const timpestampLE64 = uint8LE(Math.trunc(Number(data.timestamp)));
      const priceLE64 = uint8LE(Math.trunc(Number(data.last_price)));
      const message = Buffer.from([...timpestampLE64, ...priceLE64]);
      const hash = crypto.createHash('sha256').update(message).digest();
      const signature = this.keyPair.signSchnorr(hash);
      return {
        timestamp: data.timestamp,
        lastPrice: data.last_price,
        attestation: {
          signature: signature.toString('hex'),
          publicKey: this.keyPair.publicKey.toString('hex'),
          message: message.toString('hex'),
          messageHash: hash.toString('hex'),
        },
      };
    } catch (e) {
      throw new Error('Bitfinex: An error occurred while signing the message');
    }
  }
}
