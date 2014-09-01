var Visitor = function ()
    {
        this.isKnown = false;
    };

Visitor.prototype.isKnown = function isKnown()
{
    return this.isKnown;
};

module.exports = Visitor;
