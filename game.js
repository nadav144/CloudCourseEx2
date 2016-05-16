
module.exports.game = function (roomid, player, gamelines) {
    this.id = roomid;
    this.messages = [];
    this.curTurn = player;
    this.maxLines = gamelines;
    this.gameLines = 0;
    this.timer = null;

    this.addMsg = function (player, msg) {
        this.messages.push({player: player, msg: msg});
        this.gameLines += 1;
    };

    this.clearTimer = function(){
        if (this.timer != null){
            clearTimeout(this.timer);
            this.timer = null;
        }
    };

    return this;
};

