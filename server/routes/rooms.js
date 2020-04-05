var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var Account = require('../db/account');
var Room = require('../db/room');

module.exports = io => {

router.get('/', async function(req, res) {
	if (!req.user) {
		res.render('nouser');
		return;
	}
	
	res.render('rooms', { user: req.user });
});

return router;

};