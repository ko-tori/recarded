var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    ownedRooms: [{type: mongoose.Schema.Types.ObjectId, ref: 'Room'}],
    joinedRooms: [{type: mongoose.Schema.Types.ObjectId, ref: 'Room'}],
    invitedRooms: [{type: mongoose.Schema.Types.ObjectId, ref: 'Room'}]
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);