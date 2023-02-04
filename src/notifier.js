const { performance } = require('node:perf_hooks');

exports.ELUNotifierOptions = class ELUNotifierOptions {
    /**
     * @type {number}
     */
    eluThreshold;
    /**
     * @type {number}
     */
    sampleIntervalMilliseconds;
}

exports.ELUNotifier = function ELUNotifier(callback, options) {
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
