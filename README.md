<div align="center">
<img src="https://github.com/fastify/graphics/raw/master/full-logo.png" width="650" height="auto"/>
</div>

<div align="center">

![](https://github.com/fastify/fastify/workflows/ci/badge.svg)
![](https://github.com/fastify/fastify/workflows/package-manager-ci/badge.svg)
![](https://github.com/fastify/fastify/workflows/website/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/fastify/fastify/badge.svg)](https://snyk.io/test/github/fastify/fastify)
[![Coverage Status](https://coveralls.io/repos/github/fastify/fastify/badge.svg?branch=master)](https://coveralls.io/github/fastify/fastify?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

</div>

<div align="center">

[![NPM version](https://img.shields.io/npm/v/fastify.svg?style=flat)](https://www.npmjs.com/package/fastify)
[![NPM downloads](https://img.shields.io/npm/dm/fastify.svg?style=flat)](https://www.npmjs.com/package/fastify)
[![Security Responsible
Disclosure](https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg)](https://github.com/nodejs/security-wg/blob/master/processes/responsible_disclosure_template.md)
[![Discord](https://img.shields.io/discord/725613461949906985)](https://discord.gg/D3FZYPy)

</div>

<br />

An efficient server implies a lower cost of the infrastructure, a better responsiveness under load and happy users.
How can you efficiently handle the resources of your server, knowing that you are serving the highest number of requests as possible, without sacrificing security validations and handy development?

Enter Fastify. Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture. It is inspired by Hapi and Express and as far as we know, it is one of the fastest web frameworks in town.

### Requirements

Node.js v10 LTS (10.16.0) or later.

### Quick start

Create a folder and make it your current working directory:

```sh
mkdir my-app
cd my-app
```

Generate a fastify project with `npm init`:

```sh
npm init fastify
```

Install dependencies:

```sh
npm install
```

To start the app in dev mode:

```sh
npm run dev
```

For production mode:

```sh
npm start
```

Under the hood `npm init` downloads and runs [Fastify Create](https://github.com/fastify/create-fastify),
which in turn uses the generate functionality of [Fastify CLI](https://github.com/fastify/fastify-cli).

### Install

If installing in an existing project, then Fastify can be installed into the project as a dependency:

Install with npm:

```sh
npm i fastify --save
```

Install with yarn:

```sh
yarn add fastify
```

### Example

```js
// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true
})

// Declare a route
fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' })
})

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})
```

with async-await:

```js
const fastify = require('fastify')({
  logger: true
})

fastify.get('/', async (request, reply) => {
  reply.type('application/json').code(200)
  return { hello: 'world' }
})

fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})
```

Do you want to know more? Head to the <a href="./docs/Getting-Started.md"><code><b>Getting Started</b></code></a>.

### Fastify v1.x and v2.x

Code for Fastify's **v1.x** is in [**`branch 1.x`**](https://github.com/fastify/fastify/tree/1.x), so all Fastify 1.x related changes should be based on **`branch 1.x`**.
In a similar way, all Fastify **v2.x** related changes should be based on [**`branch 2.x`**](https://github.com/fastify/fastify/tree/2.x).

> ## Note
> `.listen` binds to the local host, `localhost`, interface by default (`127.0.0.1` or `::1`, depending on the operating system configuration). If you are running Fastify in a container (Docker, [GCP](https://cloud.google.com/), etc.), you may need to bind to `0.0.0.0`. Be careful when deciding to listen on all interfaces; it comes with inherent [security risks](https://web.archive.org/web/20170711105010/https://snyk.io/blog/mongodb-hack-and-secure-defaults/).
> See [the documentation](./docs/Server.md#listen) for more information.

### Core features

- **Highly performant:** as far as we know, Fastify is one of the fastest web frameworks in town, depending on the code complexity we can serve up to 76+ thousand requests per second.
- **Extendible:** Fastify is fully extensible via its hooks, plugins and decorators.
- **Schema based:** even if it is not mandatory we recommend to use [JSON Schema](https://json-schema.org/) to validate your routes and serialize your outputs, internally Fastify compiles the schema in a highly performant function.
- **Logging:** logs are extremely important but are costly; we chose the best logger to almost remove this cost, [Pino](https://github.com/pinojs/pino)!
- **Developer friendly:** the framework is built to be very expressive and help the developer in their daily use, without sacrificing performance and security.

### Benchmarks

__Machine:__ EX41S-SSD, Intel Core i7, 4Ghz, 64GB RAM, 4C/8T, SSD.

__Method:__: `autocannon -c 100 -d 40 -p 10 localhost:3000` * 2, taking the second average

| Framework          | Version                    | Router?      |  Requests/sec |
| :----------------- | :------------------------- | :----------: | ------------: |
| Express            | 4.17.1                     | &#10003;     | 15,978        |
| hapi               | 19.1.0                     | &#10003;     | 45,815        |
| Restify            | 8.5.1                      | &#10003;     | 49,279        |
| Koa                | 2.13.0                     | &#10007;     | 54,848        |
| **Fastify**        | **3.0.0**                  | **&#10003;** | **78,956**    |
| -                  |                            |              |               |
| `http.Server`      | 12.18.2                   | &#10007;     | 70,380        |

Benchmarks taken using https://github.com/fastify/benchmarks. This is a
synthetic, "hello world" benchmark that aims to evaluate the framework
overhead. The overhead that each framework has on your application
depends on your application, you should __always__ benchmark if performance
matters to you.

## Documentation

* <a href="./docs/Getting-Started.md"><code><b>Getting Started</b></code></a>
* <a href="./docs/Server.md"><code><b>Server</b></code></a>
* <a href="./docs/Routes.md"><code><b>Routes</b></code></a>
* <a href="./docs/Encapsulation.md"><code><b>Encapsulation</b></code></a>
* <a href="./docs/Logging.md"><code><b>Logging</b></code></a>
* <a href="./docs/Middleware.md"><code><b>Middleware</b></code></a>
* <a href="./docs/Hooks.md"><code><b>Hooks</b></code></a>
* <a href="./docs/Decorators.md"><code><b>Decorators</b></code></a>
* <a href="./docs/Validation-and-Serialization.md"><code><b>Validation and Serialization</b></code></a>
* <a href="./docs/Fluent-Schema.md"><code><b>Fluent Schema</b></code></a>
* <a href="./docs/Lifecycle.md"><code><b>Lifecycle</b></code></a>
* <a href="./docs/Reply.md"><code><b>Reply</b></code></a>
* <a href="./docs/Request.md"><code><b>Request</b></code></a>
* <a href="./docs/Errors.md"><code><b>Errors</b></code></a>
* <a href="./docs/ContentTypeParser.md"><code><b>Content Type Parser</b></code></a>
* <a href="./docs/Plugins.md"><code><b>Plugins</b></code></a>
* <a href="./docs/Testing.md"><code><b>Testing</b></code></a>
* <a href="./docs/Benchmarking.md"><code><b>Benchmarking</b></code></a>
* <a href="./docs/Write-Plugin.md"><code><b>How to write a good plugin</b></code></a>
* <a href="./docs/Plugins-Guide.md"><code><b>Plugins Guide</b></code></a>
* <a href="./docs/HTTP2.md"><code><b>HTTP2</b></code></a>
* <a href="./docs/LTS.md"><code><b>Long Term Support</b></code></a>
* <a href="./docs/TypeScript.md"><code><b>TypeScript and types support</b></code></a>
* <a href="./docs/Serverless.md"><code><b>Serverless</b></code></a>
* <a href="./docs/Recommendations.md"><code><b>Recommendations</b></code></a>

中文文档[地址](https://github.com/fastify/docs-chinese/blob/master/README.md)

## Ecosystem

- [Core](./docs/Ecosystem.md#core) - Core plugins maintained by the _Fastify_ [team](#team).
- [Community](./docs/Ecosystem.md#community) - Community supported plugins.
- [Live Examples](https://github.com/fastify/example) - Multirepo with a broad set of real working examples.
- [Discord](https://discord.gg/D3FZYPy) - Join our discord server and chat with the maintainers.

## Support
Please visit [Fastify help](https://github.com/fastify/help) to view prior
support issues and to ask new support questions.

## Team

_Fastify_ is the result of the work of a great community.
Team members are listed in alphabetical order.

**Lead Maintainers:**

* [__Matteo Collina__](https://github.com/mcollina), <https://twitter.com/matteocollina>, <https://www.npmjs.com/~matteo.collina>
* [__Tomas Della Vedova__](https://github.com/delvedor), <https://twitter.com/delvedor>, <https://www.npmjs.com/~delvedor>

### Fastify Core team

* [__Tommaso Allevi__](https://github.com/allevo), <https://twitter.com/allevitommaso>, <https://www.npmjs.com/~allevo>
* [__Ethan Arrowood__](https://github.com/Ethan-Arrowood/), <https://twitter.com/arrowoodtech>, <https://www.npmjs.com/~ethan_arrowood>
* [__Harry Brundage__](https://github.com/airhorns/), <https://twitter.com/harrybrundage>, <https://www.npmjs.com/~airhorns>
* [__David Mark Clements__](https://github.com/davidmarkclements), <https://twitter.com/davidmarkclem>, <https://www.npmjs.com/~davidmarkclements>
* [__Matteo Collina__](https://github.com/mcollina), <https://twitter.com/matteocollina>, <https://www.npmjs.com/~matteo.collina>
* [__Tomas Della Vedova__](https://github.com/delvedor), <https://twitter.com/delvedor>, <https://www.npmjs.com/~delvedor>
* [__Dustin Deus__](https://github.com/StarpTech), <https://twitter.com/dustindeus>, <https://www.npmjs.com/~starptech>
* [__Ayoub El Khattabi__](https://github.com/AyoubElk), <https://twitter.com/ayoubelkh>, <https://www.npmjs.com/~ayoubelk>
* [__Denis Fäcke__](https://github.com/SerayaEryn), <https://twitter.com/serayaeryn>, <https://www.npmjs.com/~serayaeryn>
* [__Rafael Gonzaga__](https://github.com/rafaelgss), <https://twitter.com/_rafaelgss>, <https://www.npmjs.com/~rafaelgss>
* [__Vincent Le Goff__](https://github.com/zekth)
* [__Luciano Mammino__](https://github.com/lmammino), <https://twitter.com/loige>, <https://www.npmjs.com/~lmammino>
* [__Maksim Sinik__](https://github.com/fox1t), <https://twitter.com/maksimsinik>, <https://www.npmjs.com/~fox1t>
* [__Manuel Spigolon__](https://github.com/eomm), <https://twitter.com/manueomm>, <https://www.npmjs.com/~eomm>
* [__James Sumners__](https://github.com/jsumners), <https://twitter.com/jsumners79>, <https://www.npmjs.com/~jsumners>

### Fastify Plugins team

* [__Matteo Collina__](https://github.com/mcollina), <https://twitter.com/matteocollina>, <https://www.npmjs.com/~matteo.collina>
* [__Harry Brundage__](https://github.com/airhorns/), <https://twitter.com/harrybrundage>, <https://www.npmjs.com/~airhorns>
* [__Tomas Della Vedova__](https://github.com/delvedor), <https://twitter.com/delvedor>, <https://www.npmjs.com/~delvedor>
* [__Ayoub El Khattabi__](https://github.com/AyoubElk), <https://twitter.com/ayoubelkh>, <https://www.npmjs.com/~ayoubelk>
* [__Vincent Le Goff__](https://github.com/zekth)
* [__Salman Mitha__](https://github.com/salmanm), <https://www.npmjs.com/~salmanm>
* [__Maksim Sinik__](https://github.com/fox1t), <https://twitter.com/maksimsinik>, <https://www.npmjs.com/~fox1t>
* [__Manuel Spigolon__](https://github.com/eomm), <https://twitter.com/manueomm>, <https://www.npmjs.com/~eomm>

### Great Contributors
Great contributors on a specific area in the Fastify ecosystem will be invited to join this group by Lead Maintainers.

* [__dalisoft__](https://github.com/dalisoft), <https://twitter.com/dalisoft>, <https://www.npmjs.com/~dalisoft>
* [__Luciano Mammino__](https://github.com/lmammino), <https://twitter.com/loige>, <https://www.npmjs.com/~lmammino>
* [__Evan Shortiss__](https://github.com/evanshortiss), <https://twitter.com/evanshortiss>, <https://www.npmjs.com/~evanshortiss>

**Past Collaborators**

* [__Çağatay Çalı__](https://github.com/cagataycali), <https://twitter.com/cagataycali>, <https://www.npmjs.com/~cagataycali>
* [__Trivikram Kamat__](https://github.com/trivikr), <https://twitter.com/trivikram>, <https://www.npmjs.com/~trivikr>
* [__Cemre Mengu__](https://github.com/cemremengu), <https://twitter.com/cemremengu>, <https://www.npmjs.com/~cemremengu>
* [__Nathan Woltman__](https://github.com/nwoltman), <https://twitter.com/NathanWoltman>, <https://www.npmjs.com/~nwoltman>

## Hosted by

[<img src="https://github.com/openjs-foundation/cross-project-council/blob/master/logos/openjsf-color.png?raw=true" width="250px;"/>](https://openjsf.org/projects/#growth)

We are a [Growth Project](https://github.com/openjs-foundation/cross-project-council/blob/master/PROJECT_PROGRESSION.md#growth-stage) in the [OpenJS Foundation](https://openjsf.org/).

## Acknowledgements

This project is kindly sponsored by:

- [nearForm](https://nearform.com)

Past Sponsors:

- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).

For your convenience, here is a list of all the licenses of our production dependencies:

- MIT
- ISC
- BSD-3-Clause
- BSD-2-Clause
