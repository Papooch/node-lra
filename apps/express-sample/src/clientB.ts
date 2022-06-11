import { ExpressLRA, getParticipantId } from '@node-lra/express';
import express from 'express';
import { clientBPort, delay, Logger } from './common';

const app = express();

const logger = new Logger('ServiceB', 'magenta');

const { LRA, LRAErrorHandler, lraClient } = ExpressLRA({
    clientId: 'LRAclientB',
    coordinatorURL: 'http://localhost:8080/lra-coordinator',
    baseUrl: `http://localhost:${clientBPort}`,
    logger: logger,
});

app.get(
    '/workThatMightFail',
    LRA({
        compensateUrl: '/compensate',
        completeUrl: '/complete',
        participantUrl: 'http://what.com/what',
    }),
    async (req, res) => {
        const isBadRequest = Math.random() < 0.33;
        if (isBadRequest) {
            logger.log('You sent me bad payload, deal with it');
            const pid = getParticipantId(req);
            lraClient.leaveLRA(pid);
            res.status(400).send();
        } else {
            logger.log('Doing some work...');
            await delay(500);
            const shouldThrow = Math.random() > 0.5;
            if (shouldThrow) {
                logger.log('Oh no fatal error');
                throw new Error('Fatal error');
            } else {
                logger.log('Work done');
                res.send('OK');
            }
        }
    },
);

app.put('/complete', (req, res) => {
    logger.log('Service B completing!');
    res.status(204).send();
});

app.put('/compensate', (req, res) => {
    logger.log('Service B compensating...');
    res.status(204).send();
});

app.use(LRAErrorHandler());

app.listen(clientBPort, () => {
    logger.log(`Service B listening at http://localhost:${clientBPort}/api`);
});
