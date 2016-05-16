
module.exports.game = function (roomid, player) {
    this.id = roomid;
    this.messages = [];
    this.curTurn = player;

    this.addMsg = function (player, msg) {
        this.messages.push({player: player, msg: msg});
    };

    return this;
};

