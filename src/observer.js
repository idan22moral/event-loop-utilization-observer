const { ELUNotifier, ELUNotifierOptions } = require('./notifier');

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
