var mongoose = require('mongoose');

var userGroupSchema = mongoose.Schema({
    userID:{
        type:Number,
        required: true
    },
    groupID:{
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('userGroupInfo', userGroupSchema);
