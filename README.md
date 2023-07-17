# Fuji oracle
A demo oracle service that produces cryptographic attestations for a given price feed to be consumed by Elements smart contracts. 

**THIS IS NOT MEANT TO BE USED IN PRODUCTION**


## Supported price feeds

The oracle provides a median average of the following price feeds

- CoinGecko
- Bitfinex
- Binance
- Kraken
- OKEx

## Documentation

For API documentation refer to the [Swagger JSON](./public/swagger.json) or use the live [Swagger UI](https://oracle.fuji-labs.io/docs)

For the **Oracle's signed price attestation** refer to the [FIP-2](https://github.com/fuji-money/fips/blob/main/02.md)

## Local Development

Below is a list of commands you will probably find useful.

### `yarn dev`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. 

### `yarn build`

Bundles the package to the `build`

### `yarn swagger`

Build swagger api defintions for the project
