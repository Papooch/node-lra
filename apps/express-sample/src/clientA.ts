import { LRA_HEADER } from '@node-lra/core';
import { ExpressLRA, getLRAHeader } from '@node-lra/express';
import axios from 'axios';
import express from 'express';
import { clientAPort, clientBPort, delay, Logger } from './common';

export const app = express();

const logger = new Logger('ServiceA');

const { LRA, LRAErrorHandler } = ExpressLRA({
    clientId: 'LRAclientA',
    coordinatorURL: 'http://localhost:8080/lra-coordinator',
    baseUrl: `http://localhost:${clientAPort}`,
    logger: logger,
});

app.get(
    '/start',
    LRA({
        compensateUrl: '/compensate',
        completeUrl: '/complete',
    }),
    async (req, res) => {
        const lraId = getLRAHeader(req);
        logger.log('LRA started...', lraId);
        await delay(1_000);
        logger.log('Calling service B');
        const result = await axios.get(
            `http://localhost:${clientBPort}/workThatMightFail`,
            {
                headers: {
                    [LRA_HEADER]: getLRAHeader(req),
                },
            },
        );
        logger.log(`Service B says "${result.data}"`);

        res.json({
            lraId,
        });
    },
);

app.put('/complete', (req, res) => {
    logger.log('Service A completing!');
    res.status(204).send();
});

app.put('/compensate', (req, res) => {
    logger.log('Service A compensating...');
    res.status(204).send();
});

app.use(LRAErrorHandler());

app.listen(clientAPort, () => {
    logger.log(`Service A listening at http://localhost:${clientAPort}/api`);
});
