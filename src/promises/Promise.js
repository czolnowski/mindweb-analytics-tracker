var Promise = function (deferred)
    {
        this.deferred = deferred;
    };

Promise.prototype.then = function then(success, error)
{
    if (typeof success === 'function') {
        this.deferred.successes.push(success);
    }

    if (typeof error === 'function') {
        this.deferred.errors.push(success);
    }
};

module.exports = Promise;
