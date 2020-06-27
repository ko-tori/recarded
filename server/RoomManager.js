var express = require('express');
var router = express.Router();
var path = require('path');

var Account = require('./db/account');
var Room = require('./db/room');

var ObjectMap = require('../lib/util/ObjectMap');
var SocketMap = require('../lib/util/SocketMap');
var GameState = require('../lib/GameState');

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
        try {
            let game = await Game.load(room, room.game);
            res.set(room._id, game);
        } catch (e) {

        }
    }

    return res;
}

class Game {
    constructor(room, gameState = null) {
        this.room = room;
        this.connected = new SocketMap();
        this.gameState = gameState;
    }

    get players() {
        return [this.room.owner].concat(this.room.members);
    }

    async init() {
        var ready = new Set();

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

                if (!socket.request.user._id.equals(this.room.owner) && memberIndex == -1) {
                    if (this.room.members.length >= 4) {
                        socket.emit('err', 'This room is full');
                        return;
                    }

                    let isInvited = false;
                    if (inviteIndex >= 0) {
                        this.room.invited.splice(inviteIndex, 1);
                        isInvited = true;
                    }
                    this.room.members.push(socket.request.user._id);
                    socket.broadcast.emit('lobby-joined', {
                        username: socket.request.user.username,
                        invited: isInvited
                    });
                }

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
            } else if (this.room.status == 'started') {
                socket.emit('initGame', this.gameState.serializeForPlayer(socket.request.user.username));
            }

            let owner = await Account.findById(this.room.owner);
            let players = (await Promise.all(this.players.map(m => Account.findById(m)))).map(m => m.username);
            let invited = (await Promise.all(this.room.invited.map(m => Account.findById(m)))).map(m => m.username);

            socket.emit('initLobby', {
                roomName: this.room.name,
                inviteOnly: this.room.inviteOnly,
                owner: owner.username,
                players: players,
                invited: invited,
                you: socket.request.user.username,
                status: this.room.status
            });

            this.connected.push(socket.request.user._id, socket.id, socket.request.user.username);
            this.nsp.emit('connectedChange', this.connected.allInfo());

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
                this.connected.remove(socket.request.user._id, socket.id);

                this.nsp.emit('connectedChange', this.connected.allInfo());
            });

            socket.on('start', async () => {
                if (!socket.request.user._id.equals(this.room.owner)) {
                    socket.emit('start-error', 'Only the owner may start the game');
                // } else if (this.room.members.length != 4) {
                    // uncomment this to require 5 players to start
                //     socket.emit('start-error', 'You need 5 players to start');
                } else if (this.room.status == 'started') {
                    socket.emit('start-error', 'Game already started');
                } else if (this.room.status == 'finished') {
                    socket.emit('start-error', 'Game already finished');
                // } else if (this.connected.size != 5) {
                    // uncomment this to require everyone to be connected to start
                //    socket.emit('start-error', 'Everyone must be connected to start');
                } else {
                    let players = await Promise.all(this.players.map(m => Account.findById(m)));
                    let temp = new Array(5).fill('empty');
                    temp.splice(0, players.length, ...players);
                    this.gameState = new GameState(temp.sort(() => 0.5 - Math.random()).map(u => u.username));
                    this.playerOrder = temp.map(u => u._id);
                    this.room.status = 'started';
                    for (let i = 0; i < 5; i++) {
                        this.emitToPlayer(i, 'initGame', this.gameState.serializeForPlayer(i)); // change to serialize for player
                    }
                    this.save();
                }
            });

            socket.on('playCards', data => {
                let { play, turnN, valid, reason } = this.gameState.checkCards(data, socket.request.user.username, );

                if (!valid) {
                    if (turnN == 0) {
                        // initial play is invalid

                        // possible reasons:
                        // multiple play is not highest
                        // not single suit
                        // playing out of turn
                        // possible cheating reasons:
                        // playing cards that do not exist/are not in hand
                        // player not in game

                        // notify player(s) and wait for retry
                    } else {
                        // play is invalid, notify player

                        // possible reasons:
                        // play does not have the right number of cards
                        // play does not follow initial play when it can (suit, number)
                        // playing out of turn
                        // possible cheating reasons:
                        // playing cards that do not exist/are not in hand
                        // player not in game
                    }

                    return;
                }

                this.gameState.makePlay(play);
                if (turnN + 1 == this.gameState.numPlayers) {
                    let {winningPlayer, totalPoints, cardsLeft} = this.gameState.evaulateRound();

                    this.nsp.emit('roundResult', { winningPlayer, totalPoints });

                    if (cardsLeft == 0) {
                        this.gameState.phase = 'Score';
                        // do scoring phase
                    }
                }
                socket.broadcast.emit('playCards', data);
            });                

            socket.on('ready', force => {
                ready.add(socket.request.user.username);
                if (ready.size == 5 || force) {
                    if (this.gameState.phase == 'Draw') {
                        console.log('starting draw phase');
                        let drawCard = () => {
                            let { player, card } = this.gameState.drawCard();
                            // console.log(`player ${player} drew card ${card}. ${this.gameState.deck.cards.length} cards left`);
                            for (let p = 0; p < 5; p++) {
                                if (p == player) {
                                    this.emitToPlayer(p, 'drawCard', card.serialize());
                                } else {
                                    this.emitToPlayer(p, 'drawCard', null);
                                }
                            }

                            if (this.gameState.deck.cards.length > 8) {
                                setTimeout(drawCard, 500);
                            } else {
                                console.log('finished drawing');
                                if (!this.gameState.trumpCard || this.gameState.declaredPlayer == -1) {
                                    this.nsp.emit('info', {
                                        text: 'There will be a redraw if no one declares in %t',
                                        time: 10000
                                    });

                                    setTimeout(() => {
                                        this.gameState.restartDraw();
                                        this.nsp.emit('restartDraw');
                                    }, 10000);
                                } else {
                                    this.gameState.phase = 'Bottom';
                                    let remaining = this.gameState.giveBottom();
                                    this.emitToPlayer(this.gameState.declaredPlayer, 'giveBottom', remaining.map(card => card.serialize()));
                                }
                            }
                        };

                        setTimeout(drawCard, 500);
                    } else if (phase == 'Bottom') {
                        if (this.gameState.bottom) {
                            // bottom has not been declared, person is still picking
                            this.emitToPlayer(this.gameState.declaredPlayer, 'giveBottom', []);
                        }
                    }
                }
            });

            socket.on('declare', data => {
                let {card, player, n} = data;
                let turn = this.gameState.declare(player, card, n);
                socket.broadcast.emit('declare', {card, player, n, turn});
            });

            socket.on('bottom', cards => {
                this.gameState.createBottom(cards);
                this.gameState.phase = 'Play';
                this.nsp.emit('play');
            });
        });
    }

    emitToPlayer(i, msg, data) {
        if (!this.playerOrder[i]) {
            return;
        }
        for (let s of this.connected.getSockets(this.playerOrder[i])) {
            this.nsp.connected[s].emit(msg, data);
        }
    }

    save() {
        if (this.gameState && this.gameState.serialize) {
            this.room.game = this.gameState.serialize();
        } else {
            this.room.game = {};
        }
        this.room.markModified('game');
        this.room.save();
    }

    static async load(room, state) {
        let g = new Game(room, GameState.deserialize(state));
        let players = await Promise.all(g.players.map(m => Account.findById(m)));
        g.playerOrder = g.gameState.players.map(p => {
            let player = players.find(p2 => p.name == p2.username);
            if (player) {
                return player._id;
            }

            return null;
        });
        return g;
    }
}

// autosave each room every 5 seconds
setInterval(function() {
    for (let game of activeGames.values()) {
        game.save();
    }
}, 5000);

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
    let sockets = roomsSocketByUser.getSockets(user);

    for (let s of sockets) {
        let socket = roomsnsp.connected[s];

        if (socket) {
            socket.emit(message, data);
        } else {
            console.log('Socket missing');
        }
    }
};

var roomsSocketByUser = new SocketMap();
var roomsnsp;

var init = _io => {
    io = _io;

    initGames();

    // rooms page
    roomsnsp = io.of('/rooms');

    roomsnsp.on('connection', async function(socket) {
        roomsSocketByUser.push(socket.request.user._id, socket.id);
        
        socket.emit('owned', await getOwned(socket.request.user));
        socket.emit('joined', await getJoined(socket.request.user));
        socket.emit('invited', await getInvited(socket.request.user));

        socket.on('disconnect', () => {
            roomsSocketByUser.remove(socket.request.user._id, socket.id);
        });
    });
};

module.exports = {
    initNewRoom,
    getActiveRoomById,
    init
};