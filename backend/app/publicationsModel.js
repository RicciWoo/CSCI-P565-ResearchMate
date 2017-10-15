var mongoose = require('mongoose');

var publicationSchema = mongoose.Schema({
    name:{
        type: String,
        required : true
    },
    ID:{
        type: Number,
        required: true
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
