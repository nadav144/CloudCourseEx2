// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:gameID
// and listens for socket.io messages.
// Use the gravatar module, to turn email addresses into avatar images:
var gravatar = require('gravatar');
var game = require('./game.js');
var turnLen = 30;
// Export a function, so that we can pass 
// the app and io instances from the app.js file:

var gamesdb = require('./gamesdb.js');


var games;
gamesdb.getAllGames(function(err, result) {
    if (err) {
        console.log(err);
        games = {};
    } else {
        games = result;
        console.log("got all games from the database");
        console.log(games);
        //TODO: need to check which games no longer valid after being pulled from the db.
    }
});




module.exports = function(app,io){


    function nextTurn(chat, id, turnUser){
        var room = findClientsSocket(io, id);
        var curruser = games[id].curTurn;
        if (turnUser != curruser){
            // we were called before already
            return;
        }
        var usernames = [];
        for (var i=0; i< room.length; i++){
            usernames.push(room[i].username);
        }
        var nextUser = "";
        var currIndex = usernames.indexOf(curruser);
        if (currIndex == usernames.length - 1){
            nextUser = usernames[0];
        } else { // if index is -1, we will choose 0
            nextUser = usernames[currIndex + 1];
        }

        games[id].curTurn = nextUser;
        gamesdb.setCurTurn(id, nextUser, function() {
            console.log("updated cur turn of game: " + console.log(id) + " to be player " + console.log(nextUser));
            // gamesdb.printGames();
        });

        //console.log(currIndex);
        //console.log(nextUser);
        chat.in(id).emit('nextturn', {
            boolean: true,
            gameID: id,
            nextUser: nextUser,
            users: usernames
        });
        games[id].clearTimer();
        games[id].timer = setTimeout(function(){
            var timeruser = nextUser;
            nextTurn(chat, id, timeruser);
        }, turnLen * 1000)
    }
    app.get('/', function(req, res){
        // Render views/home.html
        res.render('home');
    });
    app.get('/create', function(req,res){
        // Generate unique gameID for the room
        var id = Math.round((Math.random() * 1000000));
        // Redirect to the random room
        res.redirect('/chat/'+id);
    });
    app.get('/chat/:gameID', function(req,res){
        // Render the chant.html view
        res.render('chat');
    });
    // Initialize a new socket.io application, named 'chat'
    var chat = io.on('connection', function (socket) {
        socket.on('populateRoomsRequest', function () {
            socket.emit('populateRoomsResponse', roomsAndUsersCount(io));
        });
        // When the client emits the 'load' event, reply with the
        // number of people in this chat room
        socket.on('load',function(data){
            var room = findClientsSocket(io,data);
            if(room.length === 0 ) {
                socket.emit('peopleinchat', {number: 0});
            }
            else if(room.length >= 1) {
                socket.emit('peopleinchat', {
                    number: room.length,
                    user: room[0].username,
                    avatar: room[0].avatar,
                    gameID: data
                });
            }
        });
        // When the client emits 'login', save his name and avatar,
        // and add them to the room
        socket.on('login', function(data) {
            var room = findClientsSocket(io, data.gameID);
            // Only two people per room are allowed
            //console.log(room.length);
            if (!games[data.gameID]) {
                var newGame = new game.game(data.gameID, data.user, data.gamelines);
                games[data.gameID] = newGame;
                console.log("adding game " + data.gameID.toString() + " to the db");
                gamesdb.addGame(newGame, function() {gamesdb.printGames()});
            } else {
                games[data.gameID].addPlayer(data.user);
                gamesdb.addPlayerToGame(data.gameID, data.user, function () {gamesdb.printGames()});
            }
            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.username = data.user;
            socket.room = data.gameID;
            socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});
            // Tell the person what he should use for an avatar
            socket.emit('img', socket.avatar);
            // Add the client to the room
            socket.join(data.gameID);
            if (room.length >= 1) {
                var usernames = [],
                    avatars = [];
                //console.log("room");
                //console.log(room.length);
                for (var i=0; i< room.length; i++){
                    //console.log("user");
                    usernames.push(room[i].username);
                }
                usernames.push(socket.username);
                //console.log(usernames);
                avatars.push(room[0].avatar);
                avatars.push(socket.avatar);
                // Send the startChat event to all the people in the
                // room, along with a list of people that are in it.
                chat.in(data.gameID).emit('startChat', {
                    boolean: true,
                    gameID: data.gameID,
                    users: usernames,
                    currUser: games[data.gameID].curTurn,
                    avatars: avatars
                });
                games[data.gameID].clearTimer();
                games[data.gameID].timer = setTimeout(function(){
                    nextTurn(chat, data.gameID, socket.username);
                }, turnLen * 1000)
            }
        });
        socket.on('receive', function(data){
            //console.log("in socket.on recieve");
            //console.log(data);
            if(data.msg.trim().length) {
                createChatMessage(data.msg, data.user, data.img, moment());
                scrollToBottom();
            }
        });
        
        // Somebody left the chat
        socket.on('disconnect', function() {
            // Notify the other person in the chat room
            // that his partner has left
            socket.broadcast.to(this.room).emit('leave', {
                boolean: true,
                room: this.room,
                user: this.username,
                avatar: this.avatar
            });
            // leave the room
            socket.leave(socket.room);

            if (games[this.room]) {
                if (!games[this.room].removePlayer(this.username)) {

                    delete games[this.room.toString()];

                    console.log("removing room: " + this.room.toString() + " from the db");
                    gamesdb.deleteGame(this.room, function () {
                        gamesdb.printGames();
                    });
                } else {
                    console.log("removing player: " + this.username.toString() + " from room " + this.room.toString());
                    gamesdb.delPlayerFromGame(this.room, this.username, function() {
                        gamesdb.printGames();
                    })
                }
            } else {
                console.log("in socket.on(disconnect) invalidly.");
                // console.log(games);
            }
        });


        // Handle the sending of messages
        socket.on('msg', function(data){
            var game = games[socket.room];
            var msg = {player: data.user, msg:data.msg};
            game.addMsg(msg);
            gamesdb.addMsgToGame(game.gameID, msg, function() {
                gamesdb.printGames();
            });
            //TODO: ADD MONGO SUPPORT

            if (game.messages.length >= game.maxLines){
                socket.emit('end', {
                    messeages: game.messages
                });
            } else {
                nextTurn(chat,socket.room,data.user);
            }
            // console.log("msgs so far");
            // console.log(games[socket.room].messages);
            // When the server receives a message, it sends it to the other person in the room.
            socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
        });
    });
};


function roomsAndUsersCount (io, namespace) {
    var roomIds = getRoomIds(io, namespace);
    var res = [];
    roomIds.forEach(function(room) {
        res.push({gameID: room, count: findClientsSocket(io, room, namespace).length})
    });
    return res;
}


function getRoomIds(io, namespace) {
    var res = [],
        ns = io.of(namespace || "/");    // the default namespace is "/"
    if (ns) {
        ns.sockets.forEach(function(sock) {
            if (sock.room) {
                res.push(sock.room);
            }
        });
    }
    var unqRes = [];
    var resLen = res.length;
    for (var i = 0 ; i < resLen ; i++) {
        var curRoom = res.pop();
        if (res.indexOf(curRoom) < 0) {
            unqRes.push(curRoom);
        }
    }
    return unqRes;
}


function findClientsSocket(io, roomId, namespace) {
    var res = [],
        ns = io.of(namespace || "/");    // the default namespace is "/"
    if (ns) {
        for (var id in ns.connected) {
            if (roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId);
                if (index !== -1) {
                    res.push(ns.connected[id]);
                }
            }
            else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}