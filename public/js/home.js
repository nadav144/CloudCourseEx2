$(function() {


    // cache some jQuery objects
    var rooms = $(".rooms");

    // connect to the socket
    var socket = io();

    socket.emit('populateRoomsRequest');

    socket.on('populateRoomsResponse', function (roomIds) {
       roomIds.forEach(function(id) {
           var li = $(
               '<li><p>' + id.toString() + '</p></li>'
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