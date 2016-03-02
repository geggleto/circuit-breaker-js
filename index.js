/**
 * Created by Glenn on 2016-03-01.
 */

var breaker = {};

/**
 * Array of states
 * @type {Array}
 * @private
 */
breaker._state = [];

/**
 * Array of failure counters
 * @type {Array}
 * @private
 */
breaker._failureCounter = [];

/**
 * Array of failure Threasholds
 * @type {Array}
 * @private
 */
breaker._failureThreshold = [];

/**
 * Array of retry Threasholds
 * @type {Array}
 * @private
 */
breaker._retryThreshold = [];

/**
 * An array of tripped handlers
 * @type {Array}
 * @private
 */
breaker._trippedHandlers = [];

/**
 *
 * @param service
 * @returns {boolean}
 */
breaker.isAvailable = function (service) {
    return this._state[service] !== 'OPEN';
};

/**
 *
 * @param service
 * @param state
 */
breaker.setState = function (service, state) {
    this._state[service] = state;
};

/**
 *
 * @param service
 * @returns {*}
 */
breaker.getRetry = function (service) {
    return this._retryThreshold[service];
};
/**
 *
 * @param service
 * @returns {*}
 */
breaker.getState = function (service) {
    return this._state[service];
};

/**
 * Registers a service
 * @param service string
 * @param threshold int
 * @param retry int
 */
breaker.registerService = function (service, threshold, retry) {
    this._state[service] = "CLOSED";
    this._failureCounter[service] = 0;
    this._retryThreshold[service] = retry;
    this._failureThreshold[service] = threshold;
    this._trippedHandlers[service] = [];
};

/**
 *
 * @param service
 * @param cb
 */
breaker.registerHandler = function (service, cb) {
    this._trippedHandlers[service] = cb;
};

/**
 *
 * @param service
 * @returns {*}
 */
breaker.getFailureCount = function (service) {
    return this._failureCounter[service];
};

/**
 *
 * @param service
 * @returns {*}
 */
breaker.getFailureThreshold = function (service) {
    return this._failureThreshold[service];
};

/**
 *
 * @param service
 */
breaker.getHandler = function (service) {
    return this._trippedHandlers[service];
};
/**
 * Provide a bool returning function to mark the attempt as successful or not
 * A timer will be started if the failure count has hit the threashold
 * If a Tripped Handler is provided then it will be executed immediately
 * @param service string
 * @param code function
 */
breaker.try = function (service, code) {
    if (this.isAvailable(service)) {
        if (!code()) {
            this._failureCounter[service]++;

            //check to see if its tripped
            if (this._failureCounter[service] == this._failureThreshold[service]) {
                this.setState(service, "OPEN");

                if (this._trippedHandlers[service]) {
                    this._trippedHandlers[service]();
                }

                (function (obj) {
                    setTimeout(function () {
                        obj.setState(service, "RETRY");
                    }, obj.getRetry(service));
                })(this);
            }

            return false;
        } else {
            //Yay
            this.setState(service, "CLOSED");
            this._failureCounter[service] = 0;
            return true;
        }
    } else {
        return false;
    }

};


module.exports = breaker;