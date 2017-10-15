var mongoose = require('mongoose');

var userPublicationSchema = mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique:true
    },
    publicationID:{
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('userPublication', userPublicationSchema);
