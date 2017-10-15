var mongoose = require('mongoose');

var publicationSchema = mongoose.Schema({
    publicationID:{
        type: Number,
        required: true,
        autoincrement: true
    },
    name:{
        type: String,
        required : true
    },
    ISSN:{
        type: Number,
        required : true
    },
    abstract:{
        type: String
    },
    publishedAt:{
        type : String
    },
    publishDate:{
        type: Date
    },
    link:{
        type : String,
        default: null
    }
});

module.exports = mongoose.model('publicationInfo', publicationSchema);