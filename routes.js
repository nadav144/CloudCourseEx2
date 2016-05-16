// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');
var games = {};
var game = require('./game.js');

var r

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){


    function nextTurn(chat, id, turnUser){

        var room = findClientsSocket(io, id);
        var curruser = games[id].curTurn;
        if (turnUser != curruser){
            // we were called before already
            return;
        }
        console.log(curruser);
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


        console.log(currIndex);
        console.log(nextUser);
        chat.in(id).emit('nextturn', {
            boolean: true,
            id: id,
            nextUser: nextUser,
            users: usernames

        });

        setTimeout(function(){
            var timeruser = nextUser;
            nextTurn(chat, id, timeruser);
        }, 10 * 1000)
    }

	app.get('/', function(req, res){

		// Render views/home.html
		res.render('home');
	});

	app.get('/create', function(req,res){

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/chat/'+id);
	});

	app.get('/chat/:id', function(req,res){

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
					id: data
				});
			}
		});

		// When the client emits 'login', save his name and avatar,
		// and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.id);
			// Only two people per room are allowed

			console.log(room.length);
			if (! game[data.id]) {
				games[data.id] = new game.game(data.id, data.user, data.gamelines);
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

			if (room.length >= 1) {

				var usernames = [],
					avatars = [];


                console.log("room");
                console.log(room.length);

				for (var i=0; i< room.length; i++){
                    console.log("user");
                    usernames.push(room[i].username);
                }
				usernames.push(socket.username);

                console.log(usernames);

				avatars.push(room[0].avatar);
				avatars.push(socket.avatar);

				// Send the startChat event to all the people in the
				// room, along with a list of people that are in it.

				chat.in(data.id).emit('startChat', {
					boolean: true,
					id: data.id,
					users: usernames,
					avatars: avatars
				});


                setTimeout(function(){
                    nextTurn(chat, data.id, socket.username);
                }, 10 * 1000)


			}
		});

        socket.on('receive', function(data){
			console.log("in socket.on recieve");
			console.log(data);
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
		});


		// Handle the sending of messages
		socket.on('msg', function(data){
			// console.log("games so far:");
			// console.log(games);
            //
			// console.log("in socket.on msg");
			// console.log(data);
			// console.log(socket.room);
			games[socket.room].addMsg(data.user, data.msg);


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
		res.push({id: room, count: findClientsSocket(io, room, namespace).length})
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


