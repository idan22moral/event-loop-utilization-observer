import CDP from 'chrome-remote-interface';
import { EventLoopUtilization } from 'node:perf_hooks';

export declare type ELUNotifierCallback = (elu: EventLoopUtilization) => void;
export declare type ELUNotifierDisconnector = () => void;
export declare class ELUNotifierOptions {
    eluThreshold: number;
    sampleIntervalMilliseconds: number;
}

export declare function ELUNotifier(callback: ELUNotifierCallback, options: ELUNotifierOptions): ELUNotifierDisconnector;

export declare class ELUObserver {
    #callback: ELUNotifierCallback;
    #disconnectors: Array<ELUNotifierDisconnector>;

    constructor(callback: ELUNotifierCallback);
    observe(options: ELUNotifierOptions): void;
    disconnect(): void;
}

export declare class RemoteELUObserver {
    #observerId: string;
    #callback: ELUNotifierCallback;
    #options: ELUNotifierOptions;
    #notifierFunctionName: string;
    #callbackFunctionName: string;
    #client: CDP.Client;
    #initialized: boolean;
    #disconnectors: Array<ELUNotifierDisconnector>;

    constructor(callback: ELUNotifierCallback, options: ELUNotifierOptions);
    async initialize(): Promise<void>;
    initialized(): boolean;
    async observe(options: ELUNotifierOptions): Promise<void>;
    async disconnect(): Promise<void>;
}
