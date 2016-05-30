// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:gameID
// and listens for socket.io messages.
// Use the gravatar module, to turn email addresses into avatar images:
var gravatar = require('gravatar');
var game = require('./game.js');
var turnLen = 15;
// Export a function, so that we can pass 
// the app and io instances from the app.js file:


module.exports = function (app, io) {

    var gamesdb = require('./gamesdb.js');

    var games = {};

    function getGames() {
        gamesdb.getAllGames(function (err, result) {
            if (err) {
                console.log(err);
                games = {};
            } else {
                games = {};
                result.forEach(function (data) {
                    games[data.gameID] = new game.game(data.gameID, data.curTurn, data.maxLines, data.messages, data.players);
                });

                console.log("got all games from the database");

                //TODO: need to check which games no longer valid after being pulled from the db.
            }
        });
    }

    getGames();

    function removePlayerFromGame(id, username) {
        if (games[id]) {
            if (!games[id].removePlayer(username)) {

                delete games[id.toString()];
                // console.log("removing room: " + this.room.toString() + " from the db");
                gamesdb.deleteGame(id, function () {/*gamesdb.printGames();*/
                });
            } else {
                // console.log("removing player: " + this.username.toString() + " from room " + this.room.toString());
                gamesdb.delPlayerFromGame(id, username, function () {/*gamesdb.printGames();*/
                })
            }
        }
    }


    function nextTurn(chat, id, turnUser) {

        console.log("next room for room " + id.toString());
        console.log(turnUser);

        if (!games[id]){
            console.log("game " + id.toString() + " not in the db. killing turns");
            return;
        }

        var room = findClientsSocket(io, id);
        var curruser = games[id].curTurn;
        //if (turnUser != curruser) {
        //    // we were called before already
        //    return;
        //}

        var players = games[id].players;
        console.log(players);
        var onlineusernames = [];
        for (var i = 0; i < room.length; i++) {
            onlineusernames.push(room[i].username);
        }
        var nextUser = "";
        var currIndex = players.indexOf(curruser);

        console.log(onlineusernames);

        for (var i = 1; i <= players.length; i++) {
            nextUser = players[(currIndex + i) % players.length];
            if (onlineusernames.indexOf(nextUser) != -1) {
                break;
            } else {
                removePlayerFromGame(id, nextUser);
                nextUser = undefined;
            }
        }

        console.log(nextUser);

        if (nextUser == undefined) {
            console.log("no one is online, killing next turn timer");
            return;
        }

        games[id].curTurn = nextUser;
        gamesdb.setCurTurn(id, nextUser, players, function () {/* gamesdb.printGames();*/
        });

        //console.log(currIndex);
        //console.log(nextUser);
        chat.in(id).emit('nextturn', {
            boolean: true,
            gameID: id,
            nextUser: nextUser,
            users: players

        });


        games[id].clearTimer();
        games[id].timer = setTimeout(function () {
            var timeruser = nextUser;
            nextTurn(chat, id, timeruser);
        }, turnLen * 1000)
    }

    app.get('/', function (req, res) {
        // Render views/home.html
        res.render('home');
    });

    app.get('/kill', function (req, res) {
        require('reboot').rebootImmediately();
    });

    app.get('/create', function (req, res) {
        // Generate unique gameID for the room

        var id = Math.round((Math.random() * 1000000));
        while (games.hasOwnProperty(id)) {
            id = Math.round((Math.random() * 1000000));
        }
        // Redirect to the random room
        res.redirect('/game/' + id);
    });
    app.get('/game/:gameID', function (req, res) {
        // Render the chant.html view
        res.render('chat');
    });
    // Initialize a new socket.io application, named 'chat'
    var chat = io.on('connection', function (socket) {
        socket.on('populateRoomsRequest', function () {
            socket.emit('populateRoomsResponse', roomsAndUsersCount(games, io));
        });

        // When the client emits the 'load' event, reply with the
        // number of people in this chat room
        socket.on('load', function (data) {

            if (!gamesdb.isUp()){
                socket.emit('waitload');
                return
            }

            getGames();
            console.log("ON LOAD");
            console.log(data.id);
            console.log(games);
            console.log(games[data.id.toString()]);
            var room = findClientsSocket(io, data.id);

            console.log(games[data.id]);
            if (!games[data.id]) {

                if (room.length === 0) {
                    socket.emit('peopleinchat', {number: 0});
                }
                else if (room.length >= 1) {
                    socket.emit('peopleinchat', {
                        number: room.length,
                        user: room[0].username,
                        avatar: room[0].avatar,
                        gameID: data.id
                    });

                }


            } else {
                if (data.username != undefined && games[data.id].players.indexOf(data.username) != -1) {
                    console.log("GOT USERNAME ALREADAY! CoNNECTING")
                    socket.username = data.username;
                    socket.room = data.id;
                    console.log(socket.room);
                    socket.avatar = gravatar.url("", {s: '140', r: 'x', d: 'mm'});
                    socket.join(data.id);

                    chat.in(data.id).emit('startChat', {
                        boolean: true,
                        id: data.id,
                        users: games[data.id].players,
                        currUser: games[data.id].curTurn,
                        avatars: []
                    });
                    games[data.id].clearTimer();
                    games[data.id].timer = setTimeout(function () {
                        nextTurn(chat, data.id, socket.username);
                    }, turnLen * 1000)

                } else {
                    console.log("in people chat 2")
                    socket.emit('peopleinchat', {
                        number: games[data.id].players.length,
                        user: games[data.id].curTurn,
                        players: games[data.id].players,
                        avatar: "",
                        gameID: data.id
                    });
                }
            }
        });
        // When the client emits 'login', save his name and avatar,
        // and add them to the room
        socket.on('login', function (data) {
            console.log("in login");
            console.log(data);
            var room = findClientsSocket(io, data.id);

            if (!games[data.id]) {
                var newGame = new game.game(data.id, data.user, data.gameLines);
                games[data.id] = newGame;
                // console.log("adding game " + data.id.toString() + " to the db");
                gamesdb.addGame(newGame, function () {/*gamesdb.printGames()*/
                });
            } else {
                games[data.id].addPlayer(data.user);
                gamesdb.addPlayerToGame(data.id, data.user, function () {/*gamesdb.printGames();*/
                });
            }
            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.username = data.user;
            socket.room = data.id;
            socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});
            // Tell the person what he should use for an avatar
            socket.emit('img', socket.avatar);
            // Add the client to the room
            socket.join(data.id);
            console.log("here");
            console.log(room.length);
            if (games[data.id].players.length > 1) {
                var usernames = [],
                    avatars = [];

                chat.in(data.id).emit('startChat', {
                    boolean: true,
                    id: data.id,
                    users: games[data.id].players,
                    currUser: games[data.id].curTurn,
                    avatars: avatars
                });
                games[data.id].clearTimer();
                games[data.id].timer = setTimeout(function () {
                    nextTurn(chat, data.id, socket.username);
                }, turnLen * 1000)
            }
        });
        socket.on('receive', function (data) {
            //console.log("in socket.on recieve");
            //console.log(data);
            if (data.msg.trim().length) {
                createChatMessage(data.msg, data.user, data.img, moment());
                scrollToBottom();
            }
        });

        // Somebody left the chat
        socket.on('disconnect', function () {
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

            removePlayerFromGame(this.room, this.username);

        });





        // Handle the sending of messages
        socket.on('msg', function (data) {

            if (!games[socket.room]){
                return;
            }

            var game = games[socket.room];


            console.log(socket.room);
            game.addMsg({user: data.user, msg: data.msg});
            gamesdb.addMsgToGame(game.gameID, {user: data.user, msg: data.msg}, function () {/*gamesdb.printGames();*/
            });
            //TODO: ADD MONGO SUPPORT

            console.log(game);
            console.log(game.messages.length);
            console.log(game.maxLines);
            if (game.messages.length >= game.maxLines) {
                game.clearTimer();
                socket.emit('myend', {
                    messages: game.messages
                });
                socket.broadcast.to(socket.room).emit('myend', {
                    messages: game.messages
                });
                // game ended - delete the game
                delete games[socket.room];
                gamesdb.deleteGame(socket.room, function () {/*gamesdb.printGames();*/ });
            } else {
                nextTurn(chat, socket.room, data.user);
                socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
            }


            // console.log("msgs so far");
            // console.log(games[socket.room].messages);

            // When the server receives a message, it sends it to the other person in the room.

        });
    });
};

function roomsAndUsersCount(dbGames) {
    var res = [];
    for (var id in dbGames) {
        if (dbGames.hasOwnProperty(id)) {
            res.push({gameID: id, count: dbGames[id.toString()].players.length});
        }
    }
    return res;
}

function getRoomIds(io, namespace) {
    var res = [],
        ns = io.of(namespace || "/");    // the default namespace is "/"

    if (ns) {
        ns.sockets.forEach(function (sock) {
            if (sock.room) {
                res.push(sock.room);
            }
        });
    }
    var unqRes = [];
    var resLen = res.length;
    for (var i = 0; i < resLen; i++) {
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


