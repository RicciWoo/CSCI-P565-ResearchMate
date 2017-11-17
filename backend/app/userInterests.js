var mongoose = require('mongoose');

var userInterestsSchema = mongoose.Schema({
    tagID:{
        type: Number
    },
    userID:{
        type: Number
    },
    addedOn:{
        type: Date
    }
});

module.exports = mongoose.model('userInterests', userInterestsSchema);