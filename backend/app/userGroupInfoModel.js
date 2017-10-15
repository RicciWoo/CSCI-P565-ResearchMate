var mongoose = require('mongoose');

var userGroupSchema = mongoose.Schema({
    userID:{
        type:Number,
        required: true,
        unique:true
    },
    userType: {
        type: String,
        required: true
    },
    groupID:{
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('userGroupInfo', userGroupSchema);
