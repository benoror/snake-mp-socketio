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
  constructor(dir, id, snakes, apples) {
    this.dir = dir; //direction
    this.id = id;
    this.snakes = snakes;
    this.apples = apples;
    this.respawn();
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
    // Update tail
    for(var i = this.tail.length-1; i >= 0; i--) {
      this.tail[i].x = (i===0) ? this.x : this.tail[i-1].x;
      this.tail[i].y = (i===0) ? this.y : this.tail[i-1].y;
    }

    // Move head
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

    // Check boundaries
    if(this.x > 30-1) this.x = 0;
    if(this.x < 0) this.x = 30-1;
    if(this.y > 30-1) this.y = 0;
    if(this.y < 0) this.y = 30-1;

    // Collission detection
    this._checkCollisions();
  }

  _checkCollisions() {
    // With other snakes (including ours)
    this.snakes.forEach((s) => {
      // Heads except ourself
      if(s !== this) {
        if(s.x === this.x && s.y === this.y) {
          // The bigger survives
          // ToDo: 3 outcomes
          // - Same length = both die
          if(s !== this && this.tail.length < s.tail.length) {
            this.respawn();
            s._addTail();
          } else {
            s.respawn();
            this._addTail();
          }
        }
      }
      // Tails
      s.tail.forEach((t) => {
        if(t.x === this.x && t.y === this.y) {
          // The bigger survives
          // ToDo: 3 outcomes
          // - Same length = both die
          if(s !== this && this.tail.length < s.tail.length) {
            this.respawn();
            s._addTail();
          } else {
            s.respawn();
            this._addTail();
          }
        }
      });
    });
    // With apples
    this.apples.forEach((a) => {
      if(a.x === this.x && a.y === this.y) {
        this._addPoint(1);
        this._addTail();
        a.respawn();
      }
    });
  }

  respawn() {
    this.tail = [];
    this.points = 0;
    this.x = Math.random() * 30 | 0;
    this.y = Math.random() * 30 | 0;
  }

  _addPoint(p) {
    this.points += p;
  }

  _addTail() {
    this.tail.push({x: this.x, y: this.y});
  }
}

/*
 * Apple class
 */
class Apple {
  constructor(snakes, apples) {
    this.snakes = snakes;
    this.apples = apples;
    this.respawn();
  }

  respawn() {
    this.x = Math.random() * 30 | 0;
    this.y = Math.random() * 30 | 0;

    this._checkCollisions();

    return this;
  }

  _checkCollisions() {
    // With snakes
    this.snakes.forEach((s) => {
      // Head
      if(s.x === this.x && s.y === this.y) {
        this.respawn();
      }
      // Tail
      s.tail.forEach((t) => {
        if(t.x === this.x && t.y === this.y) {
          this.respawn();
        }
      });
    });
    // With apples
    this.apples.forEach((a) => {
      // Except self
      if(this !== a) {
        if(a.x === this.x && a.y === this.y) {
          this.respawn();
        }
      }
    });
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
    // Create player
    id = ++autoId;
    player = new Snake('right', id, players, apples);
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

