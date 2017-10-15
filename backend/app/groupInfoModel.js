var mongoose = require('mongoose');

var groupSchema = mongoose.Schema({
    groupName:{
        type: String,
        required: true
    },
    groupID:{
        type: Number,
        required: true,
        autoincrement: true
    }
});

module.exports = mongoose.model('groupInfo', groupSchema);