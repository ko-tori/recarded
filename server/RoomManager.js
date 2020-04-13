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

class Player {
    constructor(name, pos) {
        this.name = name;
        this.hand = [];
        this.pos = pos;
    }
}

class Game {
    constructor(room, playerPositions = [0, 1, 2, 3, 4].sort(() => 0.5 - Math.random()), state = 'placeholder') {
        this.room = room;
        this.state = state;
        this.playerPositions = playerPositions;
        this.connected = [];
        this.players = {};
    }

    async init() {
        if (this.room.status == 'started') {
            let owner = await Account.findById(this.room.owner);
            let players = [owner.username].concat((await Promise.all(this.room.members.map(m => Account.findById(m)))).map(m => m.username));

            for (let i = 0; i < players.length; i++) {
                let player = players[i];
                this.players[player] = new Player(player, playerPositions[i]);
            }
        }

        this.nsp = io.of('/r/' + this.room._id);

        this.nsp.on('connection', async socket => {
            let memberIndex = this.room.members.findIndex(u => u._id.equals(socket.request.user._id));

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

                let isInvited = false;
                if (inviteIndex >= 0) {
                    this.room.invited.splice(inviteIndex, 1);
                    isInvited = true;
                }
                if (!socket.request.user._id.equals(this.room.owner) && memberIndex == -1) {
                    this.room.members.push(socket.request.user._id);
                    socket.broadcast.emit('lobby-joined', {
                        username: socket.request.user.username,
                        invited: isInvited
                    });
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
            } else if (this.room.status == 'started') {
                socket.init('initGame', this.serializeForPlayer(socket.request.user.username));
            }

            this.connected.push(socket.request.user.username);
            this.nsp.emit('connectedChange', this.connected);

            socket.on('invite', async username => {
                if (this.room.members.length >= 4) {
                    socket.emit('lobby-inviteError', 'This room is already full');
                    return;
                }
                let acc = await Account.findOne({ username: username });
                if (acc) {
                    let id = acc._id.toString();
                    if (acc._id.equals(this.room.owner)) {
                        socket.emit('lobby-inviteError', 'You cannot invite the owner');
                    } else if (this.room.invited.map(i => i.toString()).includes(id)) {
                        socket.emit('lobby-inviteError', 'User already invited');
                    } else if (this.room.members.map(i => i.toString()).includes(id)) {
                        socket.emit('lobby-inviteError', 'User already joined');
                    } else {
                        this.room.invited.push(id);
                        this.room.save();
                        acc.invitedRooms.push(this.room._id);
                        acc.save();
                        this.nsp.emit('lobby-invited', {
                            username: username
                        });
                        updateRoomsPageforUser(acc._id, 'newInvite', {
                            id: this.room._id,
                            name: this.room.name,
                            ownerName: (await Account.findById(this.room.owner)).username
                        });
                    }
                } else {
                    socket.emit('lobby-inviteError', 'User does not exist');
                }
            });

            socket.on('disconnect', () => {
                let i = this.connected.indexOf(socket.request.user.username);
                if (i >= 0) {
                    this.connected.splice(i, 1);
                }

                this.nsp.emit('connectedChange', this.connected);
            });

            socket.on('start', () => {
                this.players = 
                this.room.status = 'started';
                for (let player of this.players) {
                    this.nsp.emit('initGame', this.serializeForPlayer(player)); // game init stuff
                }
                this.room.save();

                // actual logic below
                // if (this.room.status != 'lobby') {
                //     socket.emit('start-error', 'Game already started');
                // } else if (this.room.members.length < 4) {
                //     socket.emit('start-error', 'You need 5 players to start');
                // } else if (new Set(this.connected).size < 5) {
                //     socket.emit('start-error', 'Everyone must be connected to start');
                // } else {
                //     this.room.status = 'started';
                //     this.nsp.emit('initGame', {}); // game init stuff
                //     this.room.save();
                // }
            });

            socket.on('playCards', data => {
                socket.emit('playedCards')
            });
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

    serializeForPlayer(playerName) {
        return {

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
        updateRoomsPageforUser(id, 'newInvite', {
            id: room._id,
            name: name,
            ownerName: owner.username
        });
    }

    // console.log(room.owner, owner._id, roomsSocketByUser._map);

    updateRoomsPageforUser(room.owner, 'newOwned', {
        id: room._id,
        name: room.name
    });

    activeGames.set(room._id, g);

    return room;
}

var updateRoomsPageforUser = function(user, message, data) {
    let sockets = roomsSocketByUser.get(user);

    if (sockets) {
        for (let s of sockets) {
            let socket = roomsnsp.connected[s];

            socket.emit(message, data);
        }
    }
};

var roomsSocketByUser = new ObjectMap();
var roomsnsp;

var init = _io => {
    io = _io;

    initGames();

    // rooms page
    roomsnsp = io.of('/rooms');

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