/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import { LRAClient } from '@node-lra/core';

const app = express();

app.get('/api', (req, res) => {
    res.send({ message: 'Welcome to express-sample!' });
});

const lraClient = new LRAClient({
    coordinatorUrl: 'http://localhost:8081/lra-coordinator',
    compensateUrl: 'http://host.docker.internal/compensate',
});

app.use((req, res, next) => {
    console.log('request', req.method, req.path);
    next();
});

app.get('/start', async (req, res) => {
    const result = await lraClient.startLRA('123');
    res.json({
        result,
    });
});

app.put('/compensate', (req, res) => {
    console.log('compensating....', req.headers);
    res.send('compensated');
});

const port = process.env.port || 3333;
const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
