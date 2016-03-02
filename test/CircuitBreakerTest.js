/**
 * Created by Glenn on 2016-03-02.
 */
var assert = require("assert");
var breaker = require("../index.js");


var failBlock = function () {
    return false;
};

var successBlock = function () {
    return true;
};

describe('Circuit Breaker', function() {
    before(function() {
        breaker.registerService("test", 5, 100);

        breaker.registerHandler("test", function () {
        });
    });

    describe('#isAvailable', function() {
        it('should return true', function() {
            assert.equal(true, breaker.isAvailable("test"));
        });
    });

    describe('#getState', function() {
        it('should return CLOSED', function() {
            assert.equal("CLOSED", breaker.getState("test"));
        });
    });

    describe('#getFailureCount', function() {
        it('should return 0', function() {
            assert.equal(0, breaker.getFailureCount("test"));
        });
    });

    describe('#getFailureThreashold', function() {
        it('should return 5', function() {
            assert.equal(5, breaker.getFailureThreshold("test"));
        });
    });

    describe('#setState', function() {
        it('should return RETRY', function() {
            breaker.setState("test", "RETRY");
            assert.equal("RETRY", breaker.getState("test"));
        });
    });

    describe('#getRetry', function() {
        it('should return 100', function() {
            assert.equal(100, breaker.getRetry("test"));
        });
    });

    describe('#getHandler', function() {
        it('should return a function', function() {
            assert.equal(true, (breaker.getHandler("test") instanceof Function));
        });
    });

    describe('#try', function() {
        beforeEach(function() {
            breaker.setState("test", "CLOSED");
            breaker.try("test", successBlock);
        });

        it('should be available and failureCount should be 1', function() {
            breaker.try("test", failBlock);
            assert.equal(true, breaker.isAvailable("test"));
            assert.equal(1, breaker.getFailureCount("test"));
        });

        it('should be not available and failureCount should be 6', function() {
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);

            assert.equal(false, breaker.isAvailable("test"));
            assert.equal(5, breaker.getFailureCount("test"));
        });

        it('should be RETRY', function(done) {
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);

            (function (obj, done) {
                setTimeout(function () {
                    assert.equal("RETRY", obj.getState("test"));
                    done();
                }, 2*obj.getRetry("test"));
            })(breaker, done);
        });

        it('tripped handler should execute', function(done) {

            breaker.registerHandler("test", function () {
                assert.equal(true, true);
                done();
            });

            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
        });

        it('it should trip and fail then pass', function(done) {

            breaker.registerHandler("test", function () {
                assert.equal(false, breaker.isAvailable("test"));

                (function (obj, done) {
                    setTimeout(function () {
                        assert.equal("RETRY", obj.getState("test"));
                        assert.equal(true, obj.isAvailable("test"));

                        obj.try("test", successBlock);
                        assert.equal(true, obj.isAvailable("test"));
                        assert.equal(0, obj.getFailureCount("test"));

                        done();
                    }, 2*obj.getRetry("test"));
                })(breaker, done);
            });

            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
            breaker.try("test", failBlock);
        });
    });
});
