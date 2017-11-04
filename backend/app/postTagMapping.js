var mongoose = require('mongoose');

var postTagMappingSchema = mongoose.Schema({
    tagID:{
        type: Number
    },
    postID:{
        type: String
    }
});

module.exports = mongoose.model('postTagMapping', postTagMappingSchema);