
module.exports.game = function (roomid, player, gamelines) {
    this.gameID = roomid;
    this.messages = [];
    this.curTurn = player;
    this.maxLines = gamelines;
    this.timer = null;

    this.players = [player];
    this.latestUpdate = Date.now(); //todo: maybe redundant


    this.addMsg = function (player, msg) {
        this.messages.push({player: player, msg: msg});

        this.latestUpdate = Date.now();
    };

    this.clearTimer = function(){
        if (this.timer != null){
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.latestUpdate = Date.now();
    };

    this.addPlayer = function(player) {
        this.players.push(player);

        this.latestUpdate = Date.now();
    };
    /**
     * remove a player from the game.
     * @param player
     * @returns true iff there are still players in the game.
     */
    this.removePlayer = function(player) {
        var idx = this.players.indexOf(player);
        if (idx >= 0) {
            this.players.splice(idx, 1);
        }


        this.latestUpdate = Date.now();
        return this.players.length !== 0;
    };

    this.getTime = function () {
        return this.latestUpdate;
    };
    

    return this;
};


