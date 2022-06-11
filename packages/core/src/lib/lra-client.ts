import axios, { Axios, AxiosError } from 'axios';
import chalk from 'chalk';
export const LRA_HEADER = 'long-running-action';

export type URI = `${string}://${string}`;
const isURI = (str: string): str is URI => str.includes('://');

export interface ILogger {
    log(...messages: string[]): void;
}

const defaultLogger: ILogger = {
    log: console.log,
};

export interface LRAClientOptions {
    clientId?: string;
    coordinatorURL: URI;
    baseUrl?: string;
    logger?: ILogger;
}
export interface JoinLRAOptions {
    compensateUrl: string;
    participantUrl?: string;
    completeUrl?: string;
    statusUrl?: string;
    forgetUrl?: string;
}

export class LRAClient {
    private clientId: string;
    private coordinatorUrl: URI;
    private httpClient: Axios;
    private baseUrl?: string;
    private logger: ILogger;

    constructor(options: LRAClientOptions) {
        this.coordinatorUrl = options.coordinatorURL;
        this.baseUrl = options.baseUrl;
        this.clientId = options.clientId ?? '';
        this.logger = options.logger ?? defaultLogger;

        if (this.baseUrl && this.baseUrl.endsWith('/')) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }

        this.httpClient = axios.create({
            baseURL: this.coordinatorUrl,
            headers: {
                'Narayana-LRA-API-version': '1.0',
            },
        });
    }

    async startLRA(timeout = 0): Promise<string> {
        const params = new URLSearchParams({ ClientID: this.clientId });
        if (timeout > 0) params.set('TimeLimit', timeout.toString());

        this.log(`Starting LRA...`);
        const startResult = await this.httpClient.post('start', '', { params });
        const lraId = startResult.data as string;
        this.log(`LRA started: "${lraId}"`);

        return lraId;
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

        this.log(`LRA joined: "${lraId}"`);
        const participantId = result.headers['location'];
        return participantId;
    }

    async leaveLRA(participantId: string) {
        const lraId = participantId.match(
            /coordinator%2F([^/]+)/,
        )?.[1] as string;
        this.log(`Leaving LRA: "${lraId}"`);
        const result = await this.httpClient.put(
            `${lraId}/remove`,
            participantId,
        );
        return true;
    }

    async cancelLRA(lraId: string) {
        return this.endLRA(lraId, false);
    }

    async closeLRA(lraId: string) {
        return this.endLRA(lraId, true);
    }

    private async endLRA(lraId: string, confirm: boolean) {
        const endAction = confirm ? 'close' : 'cancel';
        this.log(`Calling "${endAction}" on LRA: "${lraId}"`);
        try {
            await this.httpClient.put(
                `${encodeURIComponent(lraId)}/${endAction}`,
            );
            return true;
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                if (e.response?.status === 404) {
                    this.log(
                        `LRA "${lraId}" does not exist or has already ended`,
                    );
                }
                return false;
            } else {
                throw e;
            }
        }
    }

    private makeLink(rel: string, url?: string) {
        if (!url) return null;
        if (this.baseUrl && !isURI(url)) {
            if (url.startsWith('/')) {
                url = url.slice(1);
            }
            url = `${this.baseUrl}/${url}`;
        }
        return url ? `<${url}>; rel="${rel}"` : null;
    }

    private log(...messages: string[]) {
        this.logger.log(
            `${chalk.green('[LRAClient]')} ${chalk.yellow(
                `[ClientID=${this.clientId}]`,
            )}`,
            ...messages,
        );
    }
}
