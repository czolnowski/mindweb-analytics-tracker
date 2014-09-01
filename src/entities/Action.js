var Action = function (visit)
    {
        this.visit = visit;
        this.id = false;
    };

Action.prototype.getId = function getId()
{
    return this.id;
};

module.exports = Action;
