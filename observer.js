const CDP = require('chrome-remote-interface');
const jsonschema = require('jsonschema');
const eluEventSchema = require('./alert.schema.json');

class ELUNotifierOptions {
    /**
     * @type {number}
     */
    eluThreshold;
    /**
     * @type {number}
     */
    sampleIntervalMilliseconds;
}

function ELUNotifier(callback, options) {
    if (typeof callback !== 'function') {
        throw TypeError('\'callback\' must be a function');
    }
    const eluThreshold = typeof options?.eluThreshold === 'number' ? options.eluThreshold : 0.1;
    const sampleIntervalMilliseconds = typeof options?.sampleIntervalMilliseconds === 'number' ? options.sampleIntervalMilliseconds : 200;

    let previousELU = performance.eventLoopUtilization();
    const intervalId = setInterval(() => {
        const currentELU = performance.eventLoopUtilization();
        const deltaELU = performance.eventLoopUtilization(currentELU, previousELU);
        previousELU = currentELU;
        if (deltaELU.utilization >= eluThreshold) {
            callback(deltaELU);
        }
    }, sampleIntervalMilliseconds);

    return function clearObserver() {
        clearInterval(intervalId);
    };
}

exports.ELUObserver = class ELUObserver {
    /**
     * @type {Function}
     */
    #callback;
    /**
     * @type {Function[]}
     */
    #disconnectors = [];

    /**
     * @param {Function} callback 
     */
    constructor(callback) {
        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function');
        }

        this.#callback = callback;
    }

    /**
     * @param {ELUNotifierOptions} options 
     */
    observe(options) {
        this.#disconnectors.push(ELUNotifier(this.#callback, options));
    }

    disconnect() {
        this.#disconnectors.forEach(x => x());
        this.#disconnectors = [];
    }
}

exports.RemoteELUObserver = class RemoteELUObserver {
    #observerId;
    #callback;
    #options;

    /**
     * @type {CDP.Client}
     */
    #client;
    /**
     * @type {string}
     */
    #notifierFunctionName;
    /**
     * @type {string}
     */
    #callbackFunctionName;
    #initialized = false;
    /**
     * @type {Function[]}
     */
    #disconnectors = [];

    /**
     * @param {Function} callback
     * @param {CDP.Options} options 
     */
    constructor(callback, options) {
        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function');
        }

        this.#observerId = Math.random().toString(16).slice(2);
        this.#callback = callback;
        this.#options = options;
    }

    async initialize() {
        this.#client = await CDP(this.#options);
        await this.#client.Runtime.enable();

        await this.#initializeNotifier();
        await this.#initializeCallback();

        this.#initialized = true;
    }

    async #initializeNotifier() {
        this.#notifierFunctionName = `${ELUNotifier.name}_${this.#observerId}`;
        const deployNotifier = await this.#client.Runtime.evaluate({
            expression: ELUNotifier.toString().replace(ELUNotifier.name, this.#notifierFunctionName),
            objectGroup: 'console',
            silent: false,
            returnByValue: true,
            awaitPromise: false,
            replMode: true,
        });
        if (deployNotifier.exceptionDetails) {
            throw deployNotifier.exceptionDetails;
        }
    }

    async #initializeCallback() {
        this.#callbackFunctionName = `callback_${this.#observerId}`;
        const callbackDefinition = `
            function ${this.#callbackFunctionName}(elu) {
                console.debug(JSON.stringify({
                    type: 'elu-alert',
                    details: elu,
                }));
            }
        `;

        const deployCallback = await this.#client.Runtime.evaluate({
            expression: callbackDefinition,
            objectGroup: 'console',
            silent: false,
            returnByValue: false,
            awaitPromise: false,
            replMode: true,
        });

        if (deployCallback.exceptionDetails) {
            throw deployCallback.exceptionDetails;
        }
    }

    initialized() {
        return this.#initialized;
    }

    /**
     * @param {ELUNotifierOptions} options 
    */
    async observe(options) {
        if (!this.initialized()) {
            throw new Error('cannot observe using uninitialized observer');
        }

        const disconnectorUniqueName = `${this.#notifierFunctionName}_disconnector_${Math.random().toString(16).slice(2)}`;

        const observeCommand = `
            const ${disconnectorUniqueName} = ${this.#notifierFunctionName}(${this.#callbackFunctionName}, ${JSON.stringify(options)});
        `;

        const beginObservation = await this.#client.Runtime.evaluate({
            expression: observeCommand,
            objectGroup: 'console',
            silent: false,
            returnByValue: false,
            awaitPromise: false,
            replMode: true,
        });

        if (beginObservation.exceptionDetails) {
            throw beginObservation.exceptionDetails;
        }

        this.#disconnectors.push(async () => {
            const callDisconnectorOnRemote = await this.#client.Runtime.evaluate({
                expression: `${disconnectorUniqueName}()`,
                objectGroup: 'console',
                silent: false,
                returnByValue: false,
                awaitPromise: false,
                replMode: true,
            });

            if (callDisconnectorOnRemote.exceptionDetails) {
                throw callDisconnectorOnRemote.exceptionDetails;
            }
        });


        this.#client.Runtime.consoleAPICalled((logEvent) => {
            if (logEvent.type === 'debug') {
                logEvent.args.forEach(async arg => {
                    if (arg.type === 'string') {
                        try {
                            const event = JSON.parse(arg.value);
                            if (jsonschema.validate(event, eluEventSchema).valid) {
                                this.#callback(event.details);
                            }
                        } catch {}
                    }
                })
            }
        })
    }

    async disconnect() {
        for (const disconnector of this.#disconnectors) {
            await disconnector();
        }
        this.#disconnectors = [];

        if (this.initialized()) {
            await this.#client.close();
        }
    }
}

exports = module.exports;
