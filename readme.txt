TODO: Provide a readme file. Describe what you did and why you did it that way. Tell just the main things, and anything else that you want to share (cool features, bugs in your code, bugs in the used libraries, your thoughts, who killed JFK and etc.). Please include the way you implemented the “kill” feature, and did you succeed to not lose any data on system’s crash. Does there is a scenario that you still can lose some data? Why it would happen? Does there is some way to solve it?

We created the sentence game as specified in the exercise by using Node.js and socket.io to maintain a server with live connections and push notifications.
In addition, on a different server, we run a MongoDB server to acts as a live backup at all times.

On every action related to the games: creation of a game, a new player joins\leaves a game, a new message is added etc.
the relevant mongo entry is updated. This allows the server to sustain a crash, by always having the data available in the db.

In order to implement a /kill command, we used a nodejs' 'reboot' module (https://www.npmjs.com/package/reboot).
When invoked, the server completely reboots. In order to relaunch the application, we added a script to the (ubuntu)
server startup that would launch the application. we looked on the auto-scale feature of Azure - deployment time is simply taking too long.
as we searched for other options such as monitoring, scripts and automation it seems like all of the cenerios are ok, but very hard or expensive (credit card was needed)
to be implimented. as we understood from the forum, the main part was to keep the data upon server failure, and the reebot npm module seems like
a good way to demonstrate this achievement.

The system can lose data when the server is failing before sening the update to the DB. in that case when the system will be back online
the user will se the updated data, not including the latest change and he will have to that again. in addition, timing might cuase in *rare* cases to loose a turn in the game
since the timer of the server checks if the user is currently online when the he is the next turn. if the server fails, and the user didn't try to reconnect by race, then he
will loose his turn. in order to avoid this issue as much as possible, we are setting the timer only when at least one player is back online.
****************************************