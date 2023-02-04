import { ELUNotifierCallback, ELUNotifierDisconnector, ELUNotifierOptions } from "./notifier";

export declare class ELUObserver {
    #callback: ELUNotifierCallback;
    #disconnectors: Array<ELUNotifierDisconnector>;

    constructor(callback: ELUNotifierCallback);
    observe(options: ELUNotifierOptions): void;
    disconnect(): void;
}
