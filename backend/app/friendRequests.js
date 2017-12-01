var mongoose = require('mongoose');

var friendRequestSchema = mongoose.Schema({
    requesterID:{
        type: Number
    },
    userID:{
        type: Number
    },
    requestedOn:{
        type: Date
    }
});

module.exports = mongoose.model('friendRequest', friendRequestSchema);
