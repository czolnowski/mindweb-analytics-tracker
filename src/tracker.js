var logger = require('mindweb-logger'),
    http = require('http'),
    modules = [],
    promise = require('q');

module.exports.init = function ()
{
    logger.success('Tracker initialized');
};

module.exports.register = function (name, module)
{
    modules.push(
        {
            name: name,
            module: module
        }
    );

    logger.success('Module %s registered', name);
};

module.exports.run = function ()
{
    var deferred = promise.defer();

    http.createServer(
        function ()
        {
            deferred.resolve();
        }
    );

    return deferred.promise;
};
