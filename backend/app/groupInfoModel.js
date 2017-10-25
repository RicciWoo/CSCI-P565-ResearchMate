var mongoose = require('mongoose');

var groupSchema = mongoose.Schema({
    groupName:{
        type: String,
        required: true
    },
    groupID:{
        type: Number,
        required: true
    },
    createdOn:{
        type: Date
    },
    admin:{
        type: String
    },
    description:{
        type: String
    }
});

module.exports = mongoose.model('groupInfo', groupSchema);
