var http = require('http'),
    promise = require('q'),
    Visit = require('./entities/Visit'),
    Action = require('./entities/Action'),
    Visitor = require('./entities/Visitor'),

    modules = [],
    dataStore,
    logger,
    deferrals = {
        connection: promise.defer(),
        recognizeVisitor: promise.defer(),
        isKnownVisitor: promise.defer(),
        newVisit: promise.defer(),
        knownVisit: promise.defer(),
        registerAction: promise.defer(),
        end: promise.defer()
    },
    deferralsKeys = Object.keys(deferrals);

var registerDeferralsForAllModules = function ()
{
    modules.forEach(
        function (module)
        {
            logger.info('--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ', 'debug');
            logger.info('Register %s module.', module.name, 'debug');

            deferralsKeys.forEach(
                function (key)
                {
                    var methodName = 'on' + key.charAt(0).toUpperCase() + key.slice(1),
                        deferred = deferrals[key];

                    if (typeof module.module[methodName] === 'function') {
                        logger.info('Register for %s callback %s.', module.name, key, 'debug');

                        module.module[methodName](deferred.promise);
                    }
                }
            );
        }
    );
};

module.exports.setLogger = function (_logger)
{
    logger = _logger;
};

module.exports.setDataStore = function (_dataStore)
{
    dataStore = _dataStore;
};

module.exports.init = function ()
{
    logger.info('Initialize tracker.', 'debug');

    modules.forEach(
        function (module)
        {
            if (typeof module.module.setDataStore === 'function') {
                module.module.setDataStore(dataStore);
            }

            if (typeof module.module.setLogger === 'function') {
                module.module.setLogger(logger);
            }

            if (typeof module.module.init === 'function') {
                module.module.init();
            }
        }
    );

    logger.success('Tracker initialized.\n', 'info');
};

module.exports.register = function (name, module)
{
    modules.push(
        {
            name: name,
            module: module
        }
    );

    logger.info('Module %s registered', name, 'debug');
};

module.exports.run = function (domain, port)
{
    port = port || 8080;
    domain = domain || 'localhost';

    logger.info('Start register deferrals. Modules number: %d.', modules.length, 'info');

    registerDeferralsForAllModules();

    logger.success('Start HTTP server.', 'info');

    http.createServer(
        function (request, response)
        {
            var startTime = new Date(),
                endTime,
                persistStartTime,
                persistEndTime,

                visitor = new Visitor(),
                visit = new Visit(visitor),
                action = new Action(visit);

            logger.success('New connection. [%s]', startTime, 'debug');
            deferrals.connection.resolve(
                {
                    request: request,
                    response: response
                }
            );

            logger.info('Recognize visitor.', 'debug');
            deferrals.recognizeVisitor.resolve(
                {
                    visitor: visitor,
                    request: request,
                    response: response
                }
            );

            deferrals.isKnownVisitor.resolve(
                {
                    visitor: visitor,
                    request: request,
                    response: response
                }
            );

            if (!visitor.isKnown) {
                deferrals.newVisit.resolve(
                    {
                        visit: visit,
                        visitor: visitor,
                        request: request,
                        response: response
                    }
                );

                logger.info('New visit. [%s]', visit.getId(), 'debug');
            } else {
                deferrals.knownVisit.resolve(
                    {
                        visit: visit,
                        visitor: visitor,
                        request: request,
                        response: response
                    }
                );

                logger.info('Visit known. [%s]', visit.getId(), 'debug');
            }

            deferrals.registerAction.resolve(
                {
                    action: action,
                    request: request,
                    response: response
                }
            );
            logger.info('Action registered. [%s]', action.getId(), 'debug');

            endTime = new Date();

            logger.success('Request handled in %d ms.', endTime.getTime() - startTime.getTime(), 'debug');

            logger.info('Persist to data store.', 'debug');

            persistStartTime = new Date();
            dataStore.persist(visit, action);
            persistEndTime = new Date();

            logger.success('Persisted in %d ms.', persistEndTime.getTime() - persistStartTime.getTime(), 'debug');

            deferrals.end.resolve(
                {
                    request: request,
                    response: response
                }
            );
        }
    ).listen(port, domain);

    logger.success('Server is running on domain %s and port %d.', domain, port);
};
