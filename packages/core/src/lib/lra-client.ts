export interface LRAClientOptions {
    coordinatorUrl: string;
}

export class LRAClient {
    private coordinatorUrl: string;

    constructor(options: LRAClientOptions) {
        this.coordinatorUrl = options.coordinatorUrl;
    }
}
