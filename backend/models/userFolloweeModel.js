var mongoose = require('mongoose');

var userFolloweeSchema = mongoose.Schema({
    userID:{
        type: Number
    },
    followeeID:{
        type: Number
    },
    follwingFrom:{
        type: Date
    }
});

module.exports = mongoose.model('userFollowee', userFolloweeSchema);
