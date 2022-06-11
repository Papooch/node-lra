# Node LRA

Example "Long Running Action" client implementation for Node.js. Inspired by [Micropofile LRA](https://github.com/eclipse/microprofile-lra) specification.

This repository aims to implement a compatible Node LRA.js Client (`@node-lra/core`), while also providing integration libraries for various Node frameworks like express (`@node-lra/express`) and hopefully NestJS (`@node/lra-nestjs`).

This is done mainly as an excercise and personal interest in the technology, but it might actually become useful one day.

## Install
The package manager of choice is `pnpm`, so if you don't have it, install it first
```sh
npm i -g pnpm
```
Install dependencies
```
pnpm install
```

## The `express` example

### Preparation
Execute the `express` example by runing
```
pnpm nx serve express-sample
```

For sucessful running of the examples, you need a running "LRA Coordinator" on port 8080. The coordinator must also see your running apps. You can use `docker` or `podman` in the `network host` mode to achieve that:

```sh
podman run -it --rm --name lra-coordinator --network host  docker.io/jbosstm/lra-coordinator
```
Verify that the coordinator container can see your running apps with:
```sh
podman exec lra-coordinator curl http://localhost:3333/ping
```
You shoud get `pong` back.

### Running the example

The express example app consists of 2 services, running on ports `3333` and `3334` respectively.

To run the example, send a GET request to `http://localhost:3333/start` and watch the console where the sample app is running
```sh
curl -X GET http://localhost:3333/start
```

Service A starts a LRA, then calls Service B, which joins the LRA.

Now, 3 random events could happen:
1) Service B returns successfully, in which case Service A closes the LRA and the Coordinator calls the `complete` endpoint of both services

2) Service B throws error, and in turn cancels the LRA. The Coordinator calls the `compensate` endpoint of both services

3) Service B simulates "Bad Request" error and leaves the LRA. This causes Service A to cancel the LRA. The Coordinator only calls the `compensate` endpoint of Service A
