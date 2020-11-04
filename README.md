[![banner](https://raw.githubusercontent.com/nevermined-io/assets/main/images/logo/banner_logo.png)](https://nevermined.io)

# Nevermined Faucet Server

> Nevermined Faucet micro-service that allows to get Ether for Ethereum networks
> [nevermined.io](https://nevermined.io)

![CI Build](https://github.com/nevermined-io/faucet/workflows/Build/badge.svg)

---

Table of Contents
=================

   * [Nevermined Faucet Server](#nevermined-faucet-server)
      * [Prerequisites](#prerequisites)
      * [Get Started](#get-started)
      * [Usage](#usage)
         * [POST /faucet](#post-faucet)
         * [GET /](#get-)
      * [Testing](#testing)
      * [Production build](#production-build)
      * [Deployment](#deployment)
      * [Attribution](#attribution)
      * [License](#license)

---

## Prerequisites

- Node.js v12 or later
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nevermined Tools](https://github.com/nevermined-io/tools)

## Get Started

Before starting to develop, you need to run a local Nevermined network using [Nevermined Tools](https://github.com/nevermined-io/tools):

```bash
git clone https://github.com/nevermined-io/tools.git
cd tools
./start_nevermined.sh --no-faucet --latest
```

Then, start the Faucet server in a live-reloading watch mode:

```bash
docker-compose up -d mongo
npm install
npm start
```

## Usage

### `POST /faucet`

To request Ether, a user can send an HTTP POST request to `http://localhost:3001/faucet` with an HTTP request body like:

```js
{
    "address": "<string>", //required
    "agent": "<string>",   //optional, Possible values - server, twitter, telegram, gitter
}
```

An example HTTP POST request using `wget`:

```bash
wget --header="Content-Type: application/json" \
--post-data '{"address": "0x0823876a9973a66e049a15E763c97CB726765f87", "agent": "twitter"}' \
http://localhost:3001/faucet
```

Sample Response Body:

```json
{
  "success": true,
  "message": "Successfully added 3 ETH to your account.",
  "ethTrxHash": "0xaacc762b870055deee924aeb33c08c162abdb6a71faa8531dbba84e985402b64"
}
```

An error response looks like this:

```json
{
  "success": false,
  "message": "Crypto is hard."
}
```

### `GET /`

Shows information about the software version, which will be returned as HTML by default to be more human-friendly when accessed from a browser.

To get a json response instead, set the `Accept` header to `application/json`:

```bash
wget --header="Accept: application/json" \
http://localhost:3001/
```

Sample Response Body:

```json
{
  "software": "faucet",
  "version": "0.1.0",
  "network": "Spree",
  "keeper": "http://keeper-node:8545"
}
```


## Testing

Before running the tests, configure your test environment variables if needed and make sure MongoDB service is running:

```bash
cp tests/.env.test.example tests/.env.test
docker-compose up -d mongo
```

Then start the unit tests:

```bash
npm test
```

To get a test coverage report:

```bash
npm run coverage
```

## Production build

To create a production build of the Faucet server, execute:

```bash
npm run build
```

This will create the build output into `./dist`. You can then run and serve from this build output with:

```bash
npm run serve
```

## Deployment

You can deploy the Faucet server using `docker-compose`. The Docker image will do a production build of the server and run it:

```bash
docker-compose up
```

## Attribution

This library is based in the [Ocean Protocol](https://oceanprotocol.com) [Faucet](https://github.com/oceanprotocol/faucet) library.
It keeps the same Apache v2 License and adds some improvements. See [NOTICE file](NOTICE).

## License

```
Copyright 2020 Keyko GmbH
This product includes software developed at
BigchainDB GmbH and Ocean Protocol (https://www.oceanprotocol.com/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
