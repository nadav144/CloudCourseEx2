TODO: Provide a readme file. Describe what you did and why you did it that way. Tell just the main things, and anything else that you want to share (cool features, bugs in your code, bugs in the used libraries, your thoughts, who killed JFK and etc.). Please include the way you implemented the “kill” feature, and did you succeed to not lose any data on system’s crash. Does there is a scenario that you still can lose some data? Why it would happen? Does there is some way to solve it?

We created the sentence game as specified in the exercise by using Node.js and socket.io to maintain a server with live connections.
In addition, on a different server, we run a MongoDB server to acts as a live backup at all times.

On every action related to the games: creation of a game, a new player joins\leaves a game, a new message is added etc.
the relevant mongo entry is updated. This allows the server to sustain a crash, by always having the data available in the db.

In order to implement a /kill command, we used a nodejs' 'reboot' module (https://www.npmjs.com/package/reboot).
When invoked, the server completely reboots. In order to relaunch the application, we added a script to the (ubuntu)
server startup that would launch the application.

Currently, the server running MongoDB does not implement any recovery functionality, but this can be easily remedied by
adding a script to launch the db on boot (same as the server)

The system can lose data when:
****************************************