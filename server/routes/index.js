module.exports = io => {

var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require("fs");
var Account = require('../db/account');
var Room = require('../db/room');
var RoomManager = require('../RoomManager')(io);

router.get('/', function(req, res) {
	res.render('index', { user: req.user });
});

router.get('/register', function(req, res) {
	res.render('register', { error: undefined });
});

router.post('/register', function(req, res, next) {
	if (req.body.username.trim().length > 16) {
		return res.render('register', { error: "Please limit your username to 16 characters" });
	}
	
	Account.register(new Account({ username: req.body.username.trim() }), req.body.password.trim(), function(err, account) {
		if (err) {
			return res.render('register', { error: err.message });
		}

		passport.authenticate('local')(req, res, function() {
			req.session.save(function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/');
			});
		});
	});
});

router.get('/login', function(req, res) {
	if (req.user) res.redirect('/');
	else res.render('login', { user: req.user, error: undefined });
});

router.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.render('login', { error: "Login Failed." });
		}
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			return res.redirect('/');
		});
	})(req, res, next);
});

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

router.get('/profile', function(req, res) {
	if (req.query.u) {
		Account.findOne({ username: req.query.u }, null, { lean: true }, function (err, profileuser) {
			res.render('profile',  { user: req.user, profileuser: profileuser });
		});
	} else if (!req.user) {
		res.render('nouser');
	} else {
		res.render('profile',  { user: req.user, profileuser: req.user });
	}
});

router.get('/about', function(req, res) {
	res.render('about',  { user: req.user });
});

router.get('/users', function(req, res) {
	Account.find({}, null, { lean: true }, function (err, users) {
		res.render('users', { user: req.user, users: users });
	});
});

router.get('/newroom', function(req, res) {
	if (!req.user) {
		res.render('nouser');
		return;
	}
	res.render('newroom', { user: req.user, error: undefined });
});

router.post('/newroom', async function(req, res) {
	if (!req.user) {
		res.render('nouser');
		return;
	}
	if (req.body.name.length < 1) {
		res.render('newroom', { user: req.user, error: "Please give the room a name" });
		return;
	}

	let invited = {};
	for (let invitedN of [req.body.invited1, req.body.invited2, req.body.invited3, req.body.invited4]) {
		if (!invitedN.trim().length) {
			continue;
		}
		if (invitedN == req.user.username) {
			res.render('newroom', { user: req.user, error: `You can't invite yourself!` });
			return;
		}
		let i = await Account.findOne({ username: invitedN });
		if (!i) {
			res.render('newroom', { user: req.user, error: `User ${invitedN} does not exist` });
			return;
		}

		invited[invitedN] = i;
	}

	const room = await RoomManager.initNewRoom(
		req.body.name,
		req.user,
		Object.values(invited).map(i => i._id),
		Boolean(req.body.inviteOnly),
		req.body.password);
	
	for (let i of Object.values(invited)) {
		i.invitedRooms.push(room._id);
		i.save();
	}

	room.save(err => {
		if (err) {
			console.error(err);
			res.render('newroom', { user: req.user, error: "There was an error when creating the room" });
		} else {
			req.user.ownedRooms.push(room._id);
			req.user.save(err => {
				if (err) {
					console.error(err);
					res.render('newroom', { user: req.user, error: "There was an error when creating the room" });
				} else {
					res.redirect('/r/' + room._id);
				}
			});
		}
	});
});

return router;

};