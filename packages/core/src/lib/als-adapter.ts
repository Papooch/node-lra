import type { AsyncLocalStorage } from 'async_hooks';

export class AlsAdapter {
    constructor(private readonly als: AsyncLocalStorage<any>) {}

    set(key: any, value: any) {
        const store = this.als.getStore();
        if (!store)
            throw new Error(
                `Cannot se the key "${String(key)}". No context available`,
            );
        store[key] = value;
    }

    get(key: any) {
        const store = this.als.getStore();
        return store?.[key];
    }

    run<T = any>(callback: () => T) {
        return this.als.run({}, callback);
    }
}
