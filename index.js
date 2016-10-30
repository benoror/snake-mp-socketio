// Use ES6
"use strict";

// Express & Socket.io deps
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const Snake = require('./snake');
const Apple = require('./apple');

// Handy remove method for arrays
Array.prototype.remove = function(e) {
  let p, _;
  if ((p = this.indexOf(e)) > -1) {
    return ([].splice.apply(this, [p, p - p + 1].concat(_ = [])), _);
  }
};

// ID's seed
let autoId = 0;

// Remote players 🐍
let players = [];

// Apples 🍎
let apples = [];

/*
 * Serve client
 */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

/*
 * Listen for incoming clients
 */
io.on('connection', (client) => {
  let player;
  let id;

  client.on('auth', (cb) => {
    // Create player
    id = ++autoId;
    player = new Snake(id, 'right', players, apples);
    players.push(player);
    // Callback with id
    cb({ id: autoId });
  });

  // Receive keystrokes
  client.on('key', (key) => {
    // and change direction accordingly
    if(player) {
      player.changeDirection(key);
    }
  });

  // Remove players on disconnect
  client.on('disconnect', () => {
    players.remove(player);
  });
});

// Create apples
for(var i=0; i < 3; i++) {
  apples.push(new Apple(players, apples));
}

// Main loop
setInterval(() => {
  players.forEach((p) => {
    p.move();
  });
  io.emit('state', {
    players: players.map((p) => ({
      x: p.x,
      y: p.y ,
      id: p.id,
      points: p.points,
      tail: p.tail
    })),
    apples: apples.map((a) => ({
      x: a.x,
      y: a.y
    }))
  });
}, 100);

