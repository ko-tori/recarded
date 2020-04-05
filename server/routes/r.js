var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var Account = require('../db/account');
var Room = require('../db/room');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = io => {

router.get("/:id", async function (req, res) {
	if (!req.user) {
		res.render('nouser');
		return;
	}

    let room = await Room.findById(req.params.id);
	if (!room) {
		res.send('room not found');
		return;
	}

	let memberIndex = room.members.findIndex(u => u._id.equals(req.user._id));

	if (room.status == 'lobby') {
		let inviteIndex = room.invited.findIndex(u => u._id.equals(req.user._id));

		if (!req.user._id.equals(room.owner) && inviteIndex == -1 && memberIndex == -1) {
			if (room.inviteOnly) {
				res.send('this room is invite only');
				return;
			} else if (room.password) {
				res.send('this room requires a password');
			}
		}

		if (room.members.length >= 4) {
			res.send('this room is full');
			return;
		}

		if (inviteIndex >= 0) {
			room.invited.splice(inviteIndex, 1);
		}
		if (!req.user._id.equals(room.owner) && memberIndex == -1) {
			room.members.push(req.user._id);
		}
		room.save();

		if (!req.user._id.equals(room.owner)) {
			let uInvitedRoomsIndex = req.user.invitedRooms.indexOf(room._id);
			if (uInvitedRoomsIndex != -1) {
				req.user.invitedRooms.splice(uInvitedRoomsIndex, 1);
			}
			if (req.user.joinedRooms.findIndex(i => i.equals(room._id)) == -1) {
				req.user.joinedRooms.push(room._id);
			}
			req.user.save();
		}

		let owner = await Account.findById(room.owner);
		let members = (await Promise.all(room.members.map(m => Account.findById(m)))).map(m => m.username);
		let invited = (await Promise.all(room.invited.map(m => Account.findById(m)))).map(m => m.username);

		res.render('r/lobby', { room: room, owner: owner, members: members, invited: invited });
	} else if (room.status == 'started') {

	} else {
		res.send('game finished');
	}
});

// router.post("/:id", async function (req, res) {
// 	if (!req.user) {
// 		res.render('nouser');
// 		return;
// 	}

//     let room = await Room.findById(req.params.id);
// 	if (!room) {
// 		res.send('room not found');
// 		return;
// 	}

// 	if (req.user._id.equals(room.owner)) {

// 	}

// 	res.
// }

return router;

};