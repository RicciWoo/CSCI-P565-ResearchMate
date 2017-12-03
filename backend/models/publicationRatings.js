var mongoose = require('mongoose');

var publicationRatingsSchema = mongoose.Schema({
    publicationID:{
        type: Number
    },
    userID:{
        type: Number
    },
    ratings:{
        type: Number
    },
    givenOn:{
        type: Date
    }
});

module.exports = mongoose.model('publicationRatings',publicationRatingsSchema);
