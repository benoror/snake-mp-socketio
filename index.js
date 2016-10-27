var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var autoId = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (client) => {
  console.log('new client connected');
  client.on('auth', (cb) => {
    const id = autoId++;
    console.log('player ' + id + ' authenticated');
    cb({ id });
  });

  client.on('key', (key) => {
    console.log(key);
  });

  client.on('disconnect', () => {
    console.log('player disconnected');
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

