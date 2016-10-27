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
  function Snake(id, dir) {
    this.id = id;
    this.dir = dir;
  }

  Snake.prototype.move = function(key) {
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

  return Snake;
})();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (client) => {
  const id = autoId++;
  var player = new Snake(id, 'right');
  players.push(player);

  client.on('auth', (cb) => {
    console.log('>>> player ' + player.id + ' authenticated');
    cb({ id });
  });

  client.on('key', (key) => {
    player.move(key);
  });

  client.on('disconnect', () => {
    players.remove(player);
    console.log('<<< player ' + player.id + ' disconnected');
  });
});

var tick = function() {
  io.emit('board', players.map((p) => p.dir));
};

setInterval(tick, 100);

http.listen(3000, () => {
  console.log('listening on *:3000');
});

