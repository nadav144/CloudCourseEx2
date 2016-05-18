$(function() {

    var rooms = $(".rooms");
    var socket = io();

    socket.emit('populateRoomsRequest');

    socket.on('populateRoomsResponse', function (roomIds) {
        roomIds.forEach(function(room) {
            var li = $(
                //'<li><p><a href="chat/'+ gameID.toString() +'">' + gameID.toString() + '</a></p></li>'

                '<a title="Join" href="chat/'+ room.gameID.toString() +'">' +
                '<div class="openchat">' +
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