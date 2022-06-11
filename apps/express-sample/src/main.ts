/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import { ExpressLRA, getLRAHeader } from '@node-lra/express';

const app = express();

app.get('/api', (req, res) => {
    res.send({ message: 'Welcome to express-sample!' });
});

const { LRA, LRAErrorHandler } = ExpressLRA({
    coordinatorURL: 'http://localhost:8080/lra-coordinator',
    baseUrl: 'http://localhost:3333',
});

app.use((req, res, next) => {
    console.log('request', req.method, req.path, req.body);
    next();
});

app.get(
    '/start',
    LRA({
        clientId: '1234',
        compensateUrl: '/compensate',
        completeUrl: '/complete',
    }),
    async (req, res) => {
        const lraId = getLRAHeader(req);
        console.log('LRA started...', lraId);

        //throw Error('AAAAAA');
        res.json({
            lraId,
        });
    },
);

app.put('/complete', (req, res) => {
    console.log('completing!', req.headers);
    res.status(204).send();
});

app.put('/compensate', (req, res) => {
    console.log('compensating....', req.headers);
    res.status(204).send();
});

app.put('/compensate2', (req, res) => {
    console.log('compensating2....', req.headers);
    res.status(204).send();
});

app.put('/undefined', (req, res) => {
    console.log('undefining....', req.headers);
    res.send('compensated');
});
app.use(LRAErrorHandler());

const port = process.env.port || 3333;
const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
