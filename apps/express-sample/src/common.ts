import chalk from 'chalk';

export const clientAPort = 3333;
export const clientBPort = 3334;

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type FuncKeys<T> = {
    [K in keyof T]: T[K] extends (str: string) => any ? K : never;
}[keyof T];

export class Logger {
    constructor(
        private readonly name: string,
        private readonly color: FuncKeys<typeof chalk> = 'green',
    ) {
        chalk.level;
    }

    log(...messages: string[]) {
        console.log(
            `${chalk.gray(new Date().toISOString())} ${chalk[this.color](
                `[${this.name}]`,
            )} `,
            ...messages,
        );
    }
}
