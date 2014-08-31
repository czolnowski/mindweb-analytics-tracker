var logger = require('mindweb-logger'),
    http = require('http'),
    modules = [],
    promise = require('q'),
    dataStore;

module.exports.init = function ()
{
    logger.success('Tracker initialized');

    for (var moduleIndex = 0; moduleIndex < modules.length; ++moduleIndex) {
        if (modules.hasOwnProperty(moduleIndex)) {
            var module = modules[moduleIndex];

            if (typeof module.module.init === 'function') {
                logger.log('Initialize %s module.', module.name);

                module.module.init();
            }
        }
    }
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

module.exports.setDataStore = function (_dataStore)
{
    dataStore = _dataStore;
};

module.exports.run = function (domain, port)
{
    var deferreds = {
            connection: promise.defer(),
            recognizeVisitor: promise.defer(),
            isKnownVisitor: promise.defer(),
            newVisit: promise.defer(),
            knownVisit: promise.defer(),
            registerAction: promise.defer(),
            end: promise.defer()
        },
        deferredsKeys = Object.keys(deferreds);

    port = port | 8080;
    domain = domain | 'localhost';

    logger.success('Start register deferreds. Modules number: %d.', modules.length);

    for (var moduleIndex = 0; moduleIndex < modules.length; ++moduleIndex) {
        if (modules.hasOwnProperty(moduleIndex)) {
            var module = modules[moduleIndex];

            logger.log('--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ');
            logger.log('Register %s module.', module.name);

            deferredsKeys.forEach(
                function (key)
                {
                    var methodName = 'on' + key.charAt(0).toUpperCase() + key.slice(1);

                    if (typeof module.module[methodName] === 'function') {
                        logger.log('Register for %s callback %s.', module.name, key);

                        module.module[methodName](deferreds[key].promise);
                    }
                }
            );
        }
    }

    logger.success('Start server.');

    http.createServer(
        function (request, response)
        {
            var startTime = new Date().getTime(),
                endTime,
                visitor = null,
                isKnownVisitor = false;
            logger.success('New connection. [%d]', startTime);
            deferreds.connection.resolve(request, response);

            deferreds.recognizeVisitor.resolve(visitor, dataStore, request, response);
            logger.success('Recognize visitor.');

            deferreds.isKnownVisitor.resolve(
                isKnownVisitor,
                visitor,
                dataStore,
                request,
                response
            );

            if (!isKnownVisitor) {
                deferreds.newVisit.resolve(visitor, request, response);

                logger.success('New visit.');
            } else {
                deferreds.knownVisit.resolve(visitor, request, response);

                logger.success('Visit known.');
            }

            deferreds.registerAction.resolve(visitor, request, response);
            logger.success('Register action.');

            endTime = new Date().getTime();

            logger.success('Action end. [%d]', endTime);
            logger.success('Request handled in %d ms seconds.', endTime - startTime);
        }
    ).listen(port, domain);

    logger.success('Server is running on domain %s and port %d.', domain, port);
};
