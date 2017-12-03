var mongoose = require('mongoose');

var messagesSchema = mongoose.Schema({
    senderID:{
        type: Number
    },
    receiverID:{
        type: Number
    },
    msg:{
        type: String
    },
    sentOn:{
        type: Date
    }
});

module.exports = mongoose.model('messages', messagesSchema);
