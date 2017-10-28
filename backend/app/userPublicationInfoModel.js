var mongoose = require('mongoose');

var userPublicationSchema = mongoose.Schema({
    userID:{
        type:Number,
        required: true
    },
    publicationID:{
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('userPublicationInfo', userPublicationSchema);