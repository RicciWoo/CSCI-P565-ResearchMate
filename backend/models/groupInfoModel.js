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
        type: Number
    },
    description:{
        type: String,
	    default: ""
    },
    isPrivate:{
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('groupInfo', groupSchema);
