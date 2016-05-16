$(function() {

    var rooms = $(".rooms");
    var socket = io();

    socket.emit('populateRoomsRequest');

    socket.on('populateRoomsResponse', function (roomIds) {
        roomIds.forEach(function(room) {
            var li = $(
                //'<li><p><a href="chat/'+ id.toString() +'">' + id.toString() + '</a></p></li>'

                '<a title="Join" href="chat/'+ room.id.toString() +'">' +
                '<div class="openchat">' +
                '<div id="big">' + room.id.toString() + '</div>' +
                '<div id="small">Users: ' + room.count.toString() + '</div>' +
                '</a>'
           );
           rooms.append(li);
       })
    });

    // // on connection to server get the id of person's room
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