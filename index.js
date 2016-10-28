var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const KEYS = {
  up: 38,
  right: 39,
  down: 40,
  left: 37
};

Array.prototype.remove = function(e) {
  var t, _ref;
  if ((t = this.indexOf(e)) > -1) {
    return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
  }
};

var autoId = 0;
var players = [];

Snake = (function() {
  function Snake(id, dir, x, y) {
    this.id = id;
    this.dir = dir;
    this.x = x;
    this.y = y;
  }

  Snake.prototype.changeDirection = function(key) {
    switch (key) {
      case KEYS.up:
        if (this.dir !== 'down') {
          this.dir = 'up';
        }
        break;
      case KEYS.right:
        if (this.dir !== 'left') {
          this.dir = 'right';
        }
        break;
      case KEYS.down:
        if (this.dir !== 'up') {
          this.dir = 'down';
        }
        break;
      case KEYS.left:
        if (this.dir !== 'right') {
          this.dir = 'left';
        }
        break;
    }
  }

  Snake.prototype.move = function() {
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

    if(this.x > 30-1) this.x = 0;
    if(this.x < 0) this.x = 30-1;
    if(this.y > 30-1) this.y = 0;
    if(this.y < 0) this.y = 30-1;
  }

  return Snake;
})();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (client) => {
  const id = autoId++;
  var player = new Snake(id, 'right', 0, 1);
  players.push(player);

  client.on('auth', (cb) => {
    console.log('>>> player ' + player.id + ' authenticated');
    cb({ id });
  });

  client.on('key', (key) => {
    player.changeDirection(key);
  });

  client.on('disconnect', () => {
    players.remove(player);
    console.log('<<< player ' + player.id + ' disconnected');
  });
});

var tick = function() {
  players.forEach((p) => { p.move(); });
  io.emit('state', players.map((p) => {
    return {
      x: p.x,
      y: p.y
    }
  }));
};

setInterval(tick, 100);

http.listen(3000, () => {
  console.log('listening on *:3000');
});

