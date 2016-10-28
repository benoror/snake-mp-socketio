// Use ES6
"use strict";

// Express & Socket.io deps
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Key maps
const KEYS = {
  up: 38,
  right: 39,
  down: 40,
  left: 37
};

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
 * Snake class
 */
class Snake {
  constructor(dir, x, y, id) {
    this.dir = dir; //direction
    this.x = x;
    this.y = y;
    this.id = id;
    this.points = 0;
  }

  changeDirection(key) {
    switch (key) {
      case KEYS.up:
        if (this.dir !== 'down')
          this.dir = 'up'; break;
      case KEYS.right:
        if (this.dir !== 'left')
          this.dir = 'right'; break;
      case KEYS.down:
        if (this.dir !== 'up')
          this.dir = 'down'; break;
      case KEYS.left:
        if (this.dir !== 'right')
          this.dir = 'left'; break;
    }
  }

  move() {
    switch(this.dir) {
      case 'right':
        this.x++; break;
      case 'left':
        this.x--; break;
      case 'up':
        this.y--; break;
      case 'down':
        this.y++; break;
    }

    // Boundaries
    if(this.x > 30-1) this.x = 0;
    if(this.x < 0) this.x = 30-1;
    if(this.y > 30-1) this.y = 0;
    if(this.y < 0) this.y = 30-1;
  }

  checkCollisions(objects) {
    for(let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if(obj.x === this.x && obj.y === this.y) {
        this.addPoint(1);
        obj.respawn();
      }
    }
  }

  addPoint(p) {
    this.points += p;
  }
}

/*
 * Apple class
 */
class Apple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  respawn() {
    this.x = Math.random() * 30 | 0;
    this.y = Math.random() * 30 | 0;
  }
}

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
    id = ++autoId;
    player = new Snake('right', 0, 1, id);
    players.push(player);
    cb({ id: autoId });
  });

  // Receive keystrokes
  client.on('key', (key) => {
    // and change direction accordingly
    if(player) {
      player.changeDirection(key);
    }
  });

  // Remove player on disconnect
  client.on('disconnect', () => {
    players.remove(player);
  });
});

// Create apples
apples.push(new Apple(15,15));

// Main loop
setInterval(() => {
  players.forEach((p) => {
    p.move();
    p.checkCollisions(apples);
  });
  io.emit('state', {
    players: players.map((p) => ({
      x: p.x,
      y: p.y ,
      id: p.id,
      points: p.points
    })),
    apples: apples
  });
}, 100);

