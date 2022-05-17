import axios from 'axios';

export interface LRAClientOptions {
    coordinatorUrl: string;
    compensateUrl: string;
}

export class LRAClient {
    private coordinatorUrl: string;
    private compensateUrl: string;

    constructor(options: LRAClientOptions) {
        this.coordinatorUrl = options.coordinatorUrl;
        this.compensateUrl = options.compensateUrl;
    }

    async startLRA(clientID: string) {
        const result = await axios
            .post(`${this.coordinatorUrl}/start?ClientID=${clientID}`, '', {
                headers: {
                    Link: `<${this.compensateUrl}>; rel="compensate"`,
                },
            })
            .catch((reason) => {
                console.log(reason);
                return { status: 0, headers: 0, data: 0 };
            });
        console.log('headers', result.headers);
        return {
            status: result.status,
            headers: result.headers,
            body: encodeURIComponent(result.data),
        };
    }
}
