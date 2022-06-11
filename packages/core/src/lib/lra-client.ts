import axios, { Axios } from 'axios';

export const LRA_HEADER = 'long-running-action';

export type URI = `${string}://${string}`;

export interface LRAClientOptions {
    coordinatorURL: URI;
    baseUrl?: string;
}
export interface JoinLRAOptions {
    compensateUrl: string;
    participantUrl?: string;
    completeUrl?: string;
    statusUrl?: string;
    forgetUrl?: string;
}

const log = (...what: unknown[]) =>
    console.log(`${new Date().toISOString()} [LRAClient]`, ...what);
export class LRAClient {
    private coordinatorUrl: URI;
    private httpClient: Axios;
    private baseUrl?: string;

    constructor(coordinatorUrl: URI);
    constructor(options: LRAClientOptions);
    constructor(optionsOrCoordinatorUrl: URI | LRAClientOptions) {
        if (typeof optionsOrCoordinatorUrl === 'string') {
            this.coordinatorUrl = optionsOrCoordinatorUrl;
        } else {
            this.coordinatorUrl = optionsOrCoordinatorUrl.coordinatorURL;
            this.baseUrl = optionsOrCoordinatorUrl.baseUrl;
            if (this.baseUrl && this.baseUrl.endsWith('/')) {
                this.baseUrl = this.baseUrl.slice(0, -1);
            }
        }

        this.httpClient = axios.create({
            baseURL: this.coordinatorUrl,
            headers: {
                'Narayana-LRA-API-version': '1.0',
            },
        });
    }

    async startLRA(clientID = '', timeout = 0): Promise<string> {
        const params = new URLSearchParams({ ClientID: clientID });
        if (timeout > 0) params.set('TimeLimit', timeout.toString());
        log('Starting lra');
        log('PARAMS', params.toString());

        const startResult = await this.httpClient.post('start', '', { params });
        log('HEADERS', startResult.headers);
        log('BODY', startResult.data);
        return startResult.data as string;
    }

    async joinLRA(lraId: string, urls: JoinLRAOptions) {
        const linksHeader = [
            this.makeLink('participant', urls.participantUrl),
            this.makeLink('compensate', urls.compensateUrl),
            this.makeLink('complete', urls.completeUrl),
            this.makeLink('status', urls.statusUrl),
            this.makeLink('forget', urls.forgetUrl),
        ]
            .filter((l): l is string => l !== null)
            .join(',');

        const result = await this.httpClient.put(
            `${encodeURIComponent(lraId)}`,
            '',
            {
                headers: {
                    Link: linksHeader,
                },
            },
        );

        log('JOINED');
        log('HEADERS', result.headers);
        log('BODY', result.data);
    }

    private makeLink(rel: string, url?: string) {
        if (!url) return null;
        if (this.baseUrl && !url.includes('://')) {
            if (url.startsWith('/')) {
                url = url.slice(1);
            }
            url = `${this.baseUrl}/${url}`;
        }
        return url ? `<${url}>; rel="${rel}"` : null;
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
