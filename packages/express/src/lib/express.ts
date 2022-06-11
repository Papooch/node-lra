import {
    JoinLRAOptions,
    LRAClient,
    LRAClientOptions,
    LRA_HEADER,
} from '@node-lra/core';
import { ErrorRequestHandler, Request, RequestHandler } from 'express';
import 'express-async-errors';

export interface LRAMiddlewareOptions extends JoinLRAOptions {
    /**
     * Whether to close the LRA once the request finishes.
     * Defaults to `true` if the request starts a new LR, defaults to `false` if the request contains a `LRA_HEADER`
     */
    closeOnFinish?: boolean;
}

export const getLRAHeader = (req: Request) => req.headers[LRA_HEADER] as string;
const FAILED_SYMBOL = Symbol('FAILED_SYMBOL');
const markAsFailed = (req: Request) => ((req as any)[FAILED_SYMBOL] = true);
const isFailed = (req: Request) => (req as any)[FAILED_SYMBOL] === true;

const PARTICIPANT_ID = Symbol('PARTICIPANT_ID');
const setParticipantId = (req: Request, participantId: string) =>
    ((req as any)[PARTICIPANT_ID] = participantId);
export const getParticipantId = (req: Request) => (req as any)[PARTICIPANT_ID];

export const ExpressLRA = (options: LRAClientOptions) => {
    const lraClient = new LRAClient(options);

    /**
     * Starts a new LRA or joins an existing one
     * if the `LRA_HEADER` is present
     *
     * @param options.closeOnFinish Whether to close the LRA once the request finishes.
     * Defaults to `true` if the request starts a new LR, defaults to `false` if the request contains a `LRA_HEADER`
     * @returns LRA Middleware
     */
    const LRA =
        (options: LRAMiddlewareOptions): RequestHandler =>
        async (req, res, next) => {
            let lraId = getLRAHeader(req);
            options.closeOnFinish ??= !lraId;
            if (!lraId) {
                lraId = await lraClient.startLRA();
                req.headers[LRA_HEADER] = lraId;
            }
            const id = await lraClient.joinLRA(lraId, options);
            setParticipantId(req, id);
            if (options.closeOnFinish) {
                res.on('finish', () => {
                    if (isFailed(req)) return;
                    lraClient.closeLRA(lraId);
                });
            }
            next();
        };

    const LRAErrorHandler =
        (): ErrorRequestHandler => async (err, req, res, next) => {
            const lraId = getLRAHeader(req);

            if (lraId) {
                markAsFailed(req);
                await lraClient.cancelLRA(lraId);
            }
            next(err);
        };

    return {
        LRA,
        LRAErrorHandler,
        lraClient,
    };
};

export {};
