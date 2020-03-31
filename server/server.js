var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require("socket.io")(server);
var path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render('index');
});

app.use('/g', require('./routes/games'));
app.use('/r', require('./routes/rooms'));

server.listen(3000, function() {
    console.log(`Running on port 3000...`);
});