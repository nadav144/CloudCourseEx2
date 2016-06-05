Nadav Rotberg 300039468
Oded Abrams 203011226

We created the sentence game as specified in the exercise by using Node.js and socket.io to maintain a server with live
connections and push notifications. In addition, on a different server, we run a MongoDB server to act as a live backup
at all times.

On every action related to the games: creation of a game, a new player joins\leaves a game, a new message is added etc.
the relevant mongo entry is updated. This allows the server to sustain a crash, by always having the data available in the db.

In order to implement a /kill command, we used a nodejs' 'reboot' module (https://www.npmjs.com/package/reboot).
When invoked, the server completely reboots. In order to relaunch the application, we added a script to the (ubuntu)
server startup that would launch the application. we looked on the auto-scale feature of Azure - deployment time is
simply taking too long. as we searched for other options such as monitoring, scripts and automation it seems like
all of the scenarios are ok, but very hard or expensive (credit card was needed) to be implemented. as we understood
from the forum, the main part was to keep the data upon server failure, and the reboot npm module seems like
a good way to demonstrate this achievement.

The system can lose data when the server is failing before sending the update to the DB. in that case when the system
will be back online the user will see the updated data, not including the latest change and he will have to make that
change again. in addition, timing might cause in *rare* cases to lose a turn in the game since the timer of the
server checks if the user is currently online when the he is the next turn. if the server fails, and the user didn't
try to reconnect by race, then he will lose his turn. in order to avoid this issue as much as possible, we are setting
the timer only when at least one player is back online, otherwise the timer is frozen.