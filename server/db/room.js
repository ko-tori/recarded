var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = require('./account');

var Room = new Schema({
    name: String,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'Account'}],
    invited: [{type: mongoose.Schema.Types.ObjectId, ref: 'Account'}],
    password: String,
    inviteOnly: Boolean,
    status: String, // lobby, started, finished
    game: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Room', Room);