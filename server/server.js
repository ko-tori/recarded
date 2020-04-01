var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require("socket.io")(server);
var cookieParser = require('cookie-parser');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

app.use(cookieParser());
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: false
}));

app.use(require('express-session')({
    secret: 's00per s3cr3t',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('static'));

app.use('/', require('./routes/index'));
app.use('/r', require('./routes/rooms'));

var Account = require('./db/account');
passport.use(Account.createStrategy());
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

mongoose.connect('mongodb://localhost/zpy', { useNewUrlParser: true, useUnifiedTopology: true });

const PORT = 3003;

server.listen(3003, function() {
    console.log(`Running on port ${PORT}...`);
});