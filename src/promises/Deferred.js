var Deferred = function ()
    {
        this.successes = [];
        this.errors = [];

        this.promise = new Promise(this);
    },
    Promise = require('./Promise');

Deferred.prototype.resolve = function ()
{
    var args = Array.prototype.slice.call(arguments, 0);

    this.successes.forEach(
        function (callback)
        {
            callback.apply(this, args);
        }
    );
};

Deferred.prototype.reject = function ()
{
    var args = Array.prototype.slice.call(arguments, 0);

    this.errors.forEach(
        function (callback)
        {
            callback.apply(this, args);
        }
    );
};

module.exports = Deferred;
