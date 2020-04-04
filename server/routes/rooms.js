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

var nsp = io.of('/rooms');

//io.

router.get('/owned', async function(req, res) {
	if (!req.user) {
		res.send({});
		return;
	}

	let ownedRooms = (await Promise.all(req.user.ownedRooms.map(id => Room.findById(id)))).map(room => {
		return {
			name: room.name,
			id: room._id
		}
	}).reverse();
	
	res.send(JSON.stringify(ownedRooms));
});

router.get('/joined', async function(req, res) {
	if (!req.user) {
		res.send({});
		return;
	}

	let joinedRooms = (await Promise.all(req.user.joinedRooms.map(id => Room.findById(id)))).map(room => {
		return {
			name: room.name,
			id: room._id
		}
	}).reverse();
	
	res.send(JSON.stringify(joinedRooms));
});

router.get('/invited', async function(req, res) {
	if (!req.user) {
		res.send({});
		return;
	}

	let invitedRooms = (await Promise.all(req.user.invitedRooms.map(id => Room.findById(id)))).reverse();
	let inviters = await Promise.all(invitedRooms.map(room => Account.findById(room.owner)));

	invitedRooms = invitedRooms.map((r, i) => {
		return {
			name: r.name,
			id: r._id,
			ownerName: inviters[i].username
		}
	});
	
	res.send(JSON.stringify(invitedRooms));
});

return router;

};