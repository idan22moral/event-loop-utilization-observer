import CDP from 'chrome-remote-interface';
import { ELUNotifierCallback, ELUNotifierDisconnector, ELUNotifierOptions } from './notifier';

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
