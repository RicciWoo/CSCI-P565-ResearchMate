var mongoose = require('mongoose');

var groupJoinRequestSchema = mongoose.Schema({
    groupID:{
        type: Number
    },
    adminID:{
        type: Number
    },
    requesterID:{
        type:Number
    },
    requestedOn:{
        type:Date
    }
});

module.exports = mongoose.model('groupJoinRequest', groupJoinRequestSchema);
