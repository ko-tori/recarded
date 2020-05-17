module.exports = io => {

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var RoomManager = require('../RoomManager');

router.get("/:id", async function (req, res) {
	if (!req.user) {
		res.render('nouser');
		return;
	}

    let room = RoomManager.getActiveRoomById(req.params.id);
	if (!room) {
		res.send('room not found');
		return;
	}

	res.render('game');
	// res.render('game', { room: room, owner: owner, members: members, invited: invited });
	
	// } else {
	// 	res.send('<p>Game finished.</p><a href="/">Return Home</a>');
	// }
});

return router;

};