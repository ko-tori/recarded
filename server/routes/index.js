var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require("fs");
var Account = require('../db/account');

router.get('/', function(req, res) {
	res.render('index', { user: req.user });
});

router.get('/register', function(req, res) {
	res.render('register', { error: undefined });
});

router.post('/register', function(req, res, next) {
	Account.register(new Account({ username: req.body.username.trim(), rooms: [] }), req.body.password.trim(), function(err, account) {
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
	else res.render('login', { user: req.user, error: req.query.err });
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

router.get('/rooms', function(req, res) {
	if (!req.user) {
		res.render('nouser');
		return;
	}
	res.render('rooms', { user: req.user });
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

module.exports = router;