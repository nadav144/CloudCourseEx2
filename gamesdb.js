// Retrieve
var MongoClient = require('mongodb').MongoClient;
var gamesdb;
var collection;
var ready = false;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(err) {
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
    clearDB(); //TODO: THIS CALL CLEARS THE DB EVERY TIME THE SERVER RESTARTS
    ready = true;
});

function getGames (callback) {
    if (ready) {
        collection.find().toArray(function(err, items) {
            callback (err, items);
        })
    } else {
        setTimeout(function(cback) {
            getGames(cback);
        })
    }
}


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

function clearDB() {
    if (collection) {
        collection.remove();
        console.log("collection was deleted");
    } else {
        console.log("collection was not deleted");
    }
}

module.exports.clearDB = clearDB;