import axios, { Axios } from 'axios';

type URI = `${string}://${string}`;
export interface JoinLRAOptions {
    compensateUrl: URI;
    participantUrl?: URI;
    completeUrl?: URI;
    statusUrl?: URI;
    forgetUrl?: URI;
}

const log = (...what: unknown[]) =>
    console.log(`${new Date().toISOString()} [LRAClient]`, ...what);
export class LRAClient {
    private httpClient: Axios;

    constructor(private readonly coordinatorUrl: URI) {
        this.httpClient = axios.create({
            baseURL: coordinatorUrl,
            headers: {
                'Narayana-LRA-API-version': '1.0',
            },
        });
    }

    async startLRA(clientID = '', timeout = 0): Promise<string> {
        const params = new URLSearchParams({ ClientId: clientID });
        if (timeout > 0) params.set('TimeLimit', timeout.toString());
        log('Starting lra');
        log('PARAMS', params.toString());

        const startResult = await this.httpClient.post(
            `start?${params.toString()}`,
        );
        log('HEADERS', startResult.headers);
        log('BODY', startResult.data);
        return startResult.data as string;
    }

    async joinLRA(lraId: string, options: JoinLRAOptions) {
        const result = await this.httpClient.put(
            `${encodeURIComponent(lraId)}`,
            '',
            {
                headers: {
                    Link:
                        `<${options.participantUrl}>; rel="participant",` +
                        `<${options.completeUrl}>; rel="complete",` +
                        `<${options.compensateUrl}>; rel="compensate",` +
                        `<${options.statusUrl}>; rel="status",` +
                        `<${options.forgetUrl}>; rel="forget",`,
                },
            },
        );

        log('JOINED');
        log('HEADERS', result.headers);
        log('BODY', result.data);
    }

    async cancelLRA(lraId: string) {
        return this.endLRA(lraId, false);
    }

    async closeLRA(lraId: string) {
        return this.endLRA(lraId, true);
    }

    private async endLRA(lraId: string, confirm: boolean) {
        const endAction = confirm ? 'close' : 'cancel';
        const result = await this.httpClient
            .put(`${encodeURIComponent(lraId)}/${endAction}`)
            .catch((reason) => {
                log(reason);
            });
        log(result?.data);
    }
}
