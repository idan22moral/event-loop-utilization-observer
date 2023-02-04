import { EventLoopUtilization } from 'node:perf_hooks';

export declare type ELUNotifierCallback = (elu: EventLoopUtilization) => void;
export declare type ELUNotifierDisconnector = () => void;
export declare class ELUNotifierOptions {
    eluThreshold: number;
    sampleIntervalMilliseconds: number;
}

export declare function ELUNotifier(callback: ELUNotifierCallback, options: ELUNotifierOptions): ELUNotifierDisconnector;
