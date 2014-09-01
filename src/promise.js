var Deferred = require('./promises/Deferred');

module.exports = {
    defer: function ()
    {
        return new Deferred();
    }
};
