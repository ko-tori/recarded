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

nsp.on('connection', async function(socket) {
	socket.emit('owned', await getOwned(socket.request.user));
	socket.emit('joined', await getJoined(socket.request.user));
	socket.emit('invited', await getInvited(socket.request.user));
});

async function getOwned(user) {
	return (await Promise.all(user.ownedRooms.map(id => Room.findById(id))))
		.map(room => {
			return {
				name: room.name,
				id: room._id
			}
		}).reverse();
}

async function getJoined(user) {
	return (await Promise.all(user.joinedRooms.map(id => Room.findById(id))))
		.map(room => {
			return {
				name: room.name,
				id: room._id
			}
		}).reverse();
}

async function getInvited(user) {
	let invitedRooms = (await Promise.all(user.invitedRooms.map(id => Room.findById(id)))).reverse();
	let inviters = await Promise.all(invitedRooms.map(room => Account.findById(room.owner)));

	invitedRooms = invitedRooms.map((r, i) => {
		return {
			name: r.name,
			id: r._id,
			ownerName: inviters[i].username
		}
	});

	return invitedRooms;
}

return router;

};