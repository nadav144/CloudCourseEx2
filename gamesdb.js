// Retrieve
var MongoClient = require('mongodb').MongoClient;
var gamesdb;
var collection;
var ready = 0;




// Connect to the db
MongoClient.connect("mongodb://13.69.82.120:27017/example_db", function(err, db) {
    if(err) {
        ready = -1;
        return console.dir(err);
    }
    gamesdb = db;
    collection = db.collection('test');
    // var collection = db.collection('test');
    // var doc = {mykey:1, fieldtoupdate:1};

    // collection.insert(doc, {w:1}, function(err, result) {
    //     collection.update({mykey:1}, {$set:{fieldtoupdate:2}}, {w:1}, function(err, result) {
    //         if (err) {
    //             console.dir(err);
    //         }
    //         collection.find().toArray(function(err, items) {
    //             console.log(items);
    //         });
    //     });
    // });
    //
    // var doc2 = {mykey:2, docs:[{doc1:1}]};
    //
    // collection.insert(doc2, {w:1}, function(err, result) {
    //     collection.update({mykey:2}, {$push:{docs:{doc2:1}}}, {w:1}, function(err, result) {
    //         collection.find().toArray(function(err, items) {
    //             console.log(items);
    //         });
    //     });
    // });

    // collection.remove();

    // printCollection(collection);
    // if (collection.find({mykey:1}))
    // collection.insert(doc, {w:1}, function(err, res) {
    //     printCollection(collection);
    // });
    
    ready = 1;


    // clearDB(); //TODO: THIS CALL CLEARS THE DB EVERY TIME THE SERVER RESTARTS
    // console.log("get rid of this db clear");
});

function getGames (callback) {
    if (ready === 1) {
        collection.find().toArray(function(err, items) {
            callback (err, items);
        })
    } else if (ready === 0){
        console.log("db still not up, could not retrieve games. retrying...");
        setTimeout(function() {
            getGames(callback);
        }, 200);
    } else {
        callback("db did not start properly. could not retrieve games", null);
    }
}

module.exports.getAllGames = getGames;


function printCollection (collection, callback) {
    if (collection) {
        collection.find().toArray(function(err, items) {
            console.log(items);
            if (callback) {
                callback(err, items);
            }
        });
    } else {
        console.log("db is down");
    }
}

module.exports.printGames = function(callback) {
    printCollection(collection, callback);
};

module.exports.addGame = function (game, callback) {
    if (collection) {
        collection.insert(game, {w:1}, function(err, result) {
            if (callback) {
                callback (err, result);
            }
        });
    } else {
        console.log("db is down");
    }

};

module.exports.deleteGame = function (id, callback) {
    if (collection) {
        collection.remove({gameID:id}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

module.exports.addMsgToGame = function (id, msg, callback) {
    if (collection) {
        collection.update({gameID:id}, {$push:{messages:msg}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

module.exports.setCurTurn = function (id, player, usernames, callback) {
    if (collection) {
        collection.update({gameID:id}, {$set:{curTurn:player, players: usernames}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

module.exports.addPlayerToGame = function (id, player, callback) {
    if (collection) {
        collection.update({gameID:id}, {$push:{players:player}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

module.exports.isUp = function (){
    return !ready == 0;
};

module.exports.delPlayerFromGame = function (id, player, callback) {
    if (collection) {
        collection.update({gameID:id}, {$pull:{players:player}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};


function clearDB() {
    if (collection) {
        collection.remove();
        console.log("collection was deleted");
    } else {
        console.log("collection was not deleted");
    }
}

module.exports.clearDB = clearDB;