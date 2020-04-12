var express = require('express');
var router = express.Router();
var path = require('path');

var Account = require('./db/account');
var Room = require('./db/room');

var ObjectMap = require('../lib/util/ObjectMap');

var activeGames = new ObjectMap();
var io;

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

async function loadRooms(condition = { status: { $in: ['lobby', 'started'] } }) {
    let res = new ObjectMap();
    for (let room of await Room.find(condition)) {
        res.set(room._id, await Game.fromJSON(room.game));
    }

    return res;
}

class Game {
    constructor(room, playerPositions = [0, 1, 2, 3, 4].sort(() => 0.5 - Math.random()), state = 'placeholder') {
        this.room = room;
    }

    init() {
        this.nsp = io.of('/r/' + this.room._id);

        this.nsp.on('connection', async socket => {
            let memberIndex = this.room.members.findIndex(u => u._id.equals(req.user._id));

            if (this.room.status == 'lobby') {
                let inviteIndex = this.room.invited.findIndex(u => u._id.equals(socket.request.user._id));

                if (!socket.request.user._id.equals(this.room.owner) && inviteIndex == -1 && memberIndex == -1) {
                    if (this.room.inviteOnly) {
                        socket.emit('err', 'This room is invite only');
                        return;
                    }
                }

                if (this.room.members.length >= 4) {
                    socket.emit('err', 'This room is full');
                    return;
                }

                if (inviteIndex >= 0) {
                    this.room.invited.splice(inviteIndex, 1);
                }
                if (!socket.request.user._id.equals(this.room.owner) && memberIndex == -1) {
                    this.room.members.push(socket.request.user._id);
                }
                this.room.save();

                if (!socket.request.user._id.equals(this.room.owner)) {
                    let uInvitedRoomsIndex = socket.request.user.invitedRooms.indexOf(this.room._id);
                    if (uInvitedRoomsIndex != -1) {
                        socket.request.user.invitedRooms.splice(uInvitedRoomsIndex, 1);
                    }
                    if (socket.request.user.joinedRooms.findIndex(i => i.equals(this.room._id)) == -1) {
                        socket.request.user.joinedRooms.push(this.room._id);
                    }
                    socket.request.user.save();
                }

                let owner = await Account.findById(this.room.owner);
                let players = (await Promise.all(this.room.members.map(m => Account.findById(m)))).map(m => m.username);
                let invited = (await Promise.all(this.room.invited.map(m => Account.findById(m)))).map(m => m.username);

                socket.emit('initLobby', {
                    roomName: this.room.name,
                    inviteOnly: this.room.inviteOnly,
                    owner: owner.username,
                    players: [owner.username].concat(players),
                    invited: invited,
                    you: socket.request.user.username,
                    status: 'lobby'
                });   
            }
        });
    }

    save() {
        this.room.game = this.toJSON();
        this.room.markModified('game');
        this.room.save();
    }

    toJSON() {
        return {
            roomID: this.room._id.toString(),
            playerPositions: this.playerPositions,
            state: this.state//.toJSON()
        };
    }

    static async fromJSON(json) {
        var g = new Game(await Room.findById(json.roomID), json.players, json.playerPositions, json.state);

        return g;
    }
}

async function initGames() {
    activeGames = await loadRooms();
    for (let g of activeGames.values()) {
        g.init();
    }

    initialized = true;
}

function getActiveRoomById(id){
    let game = activeGames.get(id);
    if (game && game.room) {
        return game.room;
    }
    return null;
}

async function initNewRoom(name, owner, invited, inviteOnly) {
    let room = new Room({
        name,
        owner: owner._id,
        members: [],
        invited,
        inviteOnly,
        status: "lobby",
        game: {}
    });

    // console.log('making room', name, 'with owner', owner.username);

    let g = new Game(room);
    g.init();
    room.game = g.toJSON();

    for (let id of room.invited) {
        let sockets = roomsSocketByUser.get(id);

        if (sockets) {
            for (let s of sockets) {
                let socket = roomsnsp.connected[s];
                // console.log('updating invited of', id);
                socket.emit('newInvite', {
                    id: room._id,
                    name: name,
                    ownerName: owner.username
                });
            }
        }
    }

    // console.log(room.owner, owner._id, roomsSocketByUser._map);

    let sockets = roomsSocketByUser.get(room.owner);
    if (sockets) {
        for (let s of sockets) {
            let socket = roomsnsp.connected[s];
            // console.log('updating owned of', room.owner, 'via', s);
            socket.emit('newOwned', {
                id: room._id,
                name: room.name
            });
        }
    }

    activeGames.set(room._id, g);

    return room;
}

var roomsSocketByUser = new ObjectMap();

var init = _io => {
    io = _io;

    initGames();

    // rooms page
    var roomsnsp = io.of('/rooms');

    roomsnsp.on('connection', async function(socket) {
        let sockets;
        if (roomsSocketByUser.has(socket.request.user._id)) {
            sockets = roomsSocketByUser.get(socket.request.user._id);
        } else {
            sockets = [];
            roomsSocketByUser.set(socket.request.user._id, sockets);
        }
        sockets.push(socket.id);
        
        socket.emit('owned', await getOwned(socket.request.user));
        socket.emit('joined', await getJoined(socket.request.user));
        socket.emit('invited', await getInvited(socket.request.user));

        socket.on('disconnect', () => {
            let sockets = roomsSocketByUser.get(socket.request.user._id);
            sockets.splice(sockets.indexOf(socket.id), 1);

            if (sockets.length == 0) {
                roomsSocketByUser.delete(socket.request.user._id);
            }
        });
    });
};

module.exports = {
    initNewRoom,
    getActiveRoomById,
    init
};