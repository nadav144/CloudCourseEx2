
module.exports.game = function (roomid, player, gamelines) {
    this.id = roomid;
    this.messages = [];
    this.curTurn = player;
    this.maxLines = gamelines;
    this.gameLines = 0;

    this.addMsg = function (player, msg) {
        this.messages.push({player: player, msg: msg});
        this.gameLines += 1;
    };

    return this;
};

