<h1 align="center">Fastify</h1>

# Getting Started

Fastify is a Web Framework for Node.js that focuses on performance and developer experience. Before you get started, Make sure you have [Node.js](https://nodejs.org/) installed to be able to use fastify framework. Get familiar with the command line depending on which operating system you use, see instructions for [Mac](https://blog.teamtreehouse.com/introduction-to-the-mac-os-x-command-line), [Windows](https://www.ionos.com/digitalguide/server/know-how/windows-cmd-commands/) and [Linux](https://www.howtogeek.com/140679/beginner-geek-how-to-start-using-the-linux-terminal/).

## Installation
Create a directory where you want fastify installed. It will be the primary directory for building your application.

```shell
mkdir my-app && cd my-app
```

Next, create a package.json file using [`npm init`](https://docs.npmjs.com/cli/v6/commands/npm-init) which prompts you to type in the information for your application such as the package name, description and version, or you can also leave the rest as default except for the `entry point`.

```shell
npm init
```

Once you get to the entry point, Use app.js or any name you want to give your main file. The suggested default name for is index.js, it's okay to leave it that way as well. 

```
entry point: (index.js) app.js
```

There are two ways to install fastify framework:

**Install with yarn**:
```shell
yarn add fastify
```

**Install with npm**:
```shell
npm i fastify --save
```

Using `--save` in your app directory saves fastify to your package.json dependency list.  

## Require Framework and Listen for HTTP request

Require fastify framework in your main file, in this case, will be our app.js.

```javascript
// Require the framework and instantiate it 
const fastify = require('fastify')({
  logger: true 
}) 

```

Next thing is to run a new server that listens for HTTP request on port 3000.

```javascript
// Run the server
fastify.listen(3000, function (err, address) { 
  if (err) { 
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`)
})
``` 

> Note that the above examples, and subsequent examples in this document, 
> default to listening only on the localhost `127.0.0.1` interface.
> To listen on all available IPv4 interfaces examples should be modified to listen on 0.0.0.0 like this:
> ```Javascript
>fastify.listen(3000, '0.0.0.0', function (err, address) {
>  if (err) {
>    fastify.log.error(err) 
>	 process.exit(1) 
>  }
>  fastify.log.info(`server listening on ${address}`)
>  })
>```


Similarly, specify `::` 1 to accept only local connections via IPv6. You can also indicate `::` to accept connections on all IPv6 addresses if the operating system also supports it on all IPv4 addresses.
When deploying to a Docker, or other types of containers which will be the easiest method for exposing the application.


## Adding your first route

Use the code below to create a new route.

```Javascript
// Declare a route
fastify.get('/', async (request, reply) => {
  reply.type('application/json').code(200)
  return { hello: 'world' }
})
```

We recommend going with *async-await* but you can also use callback as well:

```javascript
// Declare a route
fastify.get('/', function (request, reply){
  reply.send({ hello: 'world' })
})
```

The first route you create is usually the root URL (/) as shown in this example. 
> Note that the `request` and `reply` object used in this example are the same as `req` (request) and `res` (response) object in Node. 

Finally, run application from your terminal using this command:

```shell

node app.js

```

Once you run the following command, your application load on `http://localhost:3000` which you can open in a browser to see output.

> The application responds with `{hello:world}`, due to the request on the root URL (/). Any other path that does not have a delacred route will result to an error: **404 Not Found**. 

<!-- Note: More work to be done after Season of Docs is Over -->