module.exports = io => {

var express = require('express');
var router = express.Router();
var path = require('path');

var Account = require('./db/account');
var Room = require('./db/room');

var ObjectMap = require('../lib/util/ObjectMap');

var io = io;

var activeGames = new ObjectMap();

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
        this.nsp = io.of('/' + this.room._id);

        this.nsp.on('connection', socket => {
            // stuff
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

async function initNewRoom(name, owner, invited, inviteOnly, password) {
    let room = new Room({
        name,
        owner: owner._id,
        members: [],
        invited,
        inviteOnly,
        password,
        status: "lobby",
        game: {}
    });

    // console.log('making room', name, 'with owner', owner.username);

    let g = new Game(room);
    room.game = g.toJSON();

    for (let id of room.invited) {
        let sockets = roomsSocketByUser.get(id);

        if (sockets) {
            for (let s of sockets) {
                let socket = roomsnsp.connected[s];
                // console.log('updating invited of', id);
                socket.emit('newInvite', {
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
            socket.emit('newOwned', { name: room.name });
        }
    }

    activeGames.set(room._id, g);

    return room;
}

(async function initGames() {
    activeGames = await loadRooms();
    for (let g of activeGames.values()) {
        g.init();
    }
})();

// rooms page

var roomsnsp = io.of('/rooms');
var roomsSocketByUser = new ObjectMap();

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

return {
    initNewRoom
};

};