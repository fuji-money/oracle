# Encoding


## Price Attestation
Encoding of the Oracle's signed price attestation


#### JavaScript

```js
// the message is a concatenation of <pair, timestamp, price>
const message = Buffer.from([...pair, ...timpestampLE64, ...priceLE64]);

// make the SHA256 hash of the message 
const hash = crypto.createHash('sha256').update(message).digest();

// make Schnorr signature of the hash
const signature = signSchnorr(hash);
```
