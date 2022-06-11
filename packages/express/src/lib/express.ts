import {
    JoinLRAOptions,
    LRAClient,
    LRAClientOptions,
    LRA_HEADER,
} from '@node-lra/core';
import { ErrorRequestHandler, Request, RequestHandler } from 'express';
import 'express-async-errors';

export interface LRAMiddlewareOptions extends JoinLRAOptions {
    clientId?: string;
    closeOnFinish?: boolean;
}

export const getLRAHeader = (req: Request) => req.headers[LRA_HEADER] as string;

export const ExpressLRA = (options: LRAClientOptions) => {
    const lraClient = new LRAClient(options);

    const LRA =
        (options: LRAMiddlewareOptions): RequestHandler =>
        async (req, res, next) => {
            options.closeOnFinish ??= true;
            let lraId = getLRAHeader(req);
            if (!lraId) {
                lraId = await lraClient.startLRA(options.clientId);
                req.headers[LRA_HEADER] = lraId;
            }
            await lraClient.joinLRA(lraId, options);
            if (options.closeOnFinish) {
                res.on('finish', () => {
                    lraClient.closeLRA(lraId);
                });
            }
            next();
        };

    const LRAErrorHandler =
        (): ErrorRequestHandler => async (err, req, res, next) => {
            const lraId = getLRAHeader(req);
            if (lraId) {
                await lraClient.cancelLRA(lraId);
            }
            next(err);
        };

    return {
        LRA,
        LRAErrorHandler,
    };
};

export {};
