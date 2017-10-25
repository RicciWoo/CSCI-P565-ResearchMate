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
    paperAbstract:{
        type: String
    },
    publishedAt:{
        type : String
    },
    publishDate:{
        type: Date
    },
    filePath:{
        type : String,
        default: null
    }
});

module.exports = mongoose.model('publicationInfo', publicationSchema);
