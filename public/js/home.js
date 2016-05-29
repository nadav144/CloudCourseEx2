$(function() {

    var rooms = $(".rooms");
    var socket = io();

    socket.emit('populateRoomsRequest');

    socket.on('populateRoomsResponse', function (roomIds) {
        roomIds.forEach(function(room) {
            var li = $(


                '<a title="Join" href="game/'+ room.gameID.toString() +'">' +
                '<div class="openroom">' +
                '<div gameID="big">' + room.gameID.toString() + '</div>' +
                '<div gameID="small">Users: ' + room.count.toString() + '</div>' +
                '</a>'
           );
           rooms.append(li);
       })
    });

    // // on connection to server get the gameID of person's room
    // socket.on('connect', function(){
    //
    //     socket.emit('mytest', 8);
    // });
    //
    // socket.on('backtoyou', function(data){
    //     console.log(data);
    // })

    }
);