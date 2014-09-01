var Visit = function (visitor)
    {
        this.id = false;
        this.visitor = visitor;
    };

Visit.prototype.getId = function getId()
{
    return this.id;
};

module.exports = Visit;
