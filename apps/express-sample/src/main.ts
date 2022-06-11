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

const lraClient = new LRAClient('http://localhost:8080/lra-coordinator');

app.use((req, res, next) => {
    console.log('request', req.method, req.path, req.body);
    next();
});

app.get('/start', async (req, res) => {
    const lraId = await lraClient.startLRA('12358', 10_000);
    const result = await lraClient.joinLRA(lraId, {
        compensateUrl: 'http://localhost:3333/compensate',
        completeUrl: 'http://localhost:3333/complete',
    });
    setTimeout(() => lraClient.closeLRA(lraId), 12_000);
    res.json({
        //result,
    });
});

app.put('/complete', (req, res) => {
    console.log('completing!', req.headers);
    res.status(204).send();
});

app.put('/compensate', (req, res) => {
    console.log('compensating....', req.headers);
    res.status(204).send();
});

app.put('/undefined', (req, res) => {
    console.log('undefining....', req.headers);
    res.send('compensated');
});

const port = process.env.port || 3333;
const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
