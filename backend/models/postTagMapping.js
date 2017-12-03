var mongoose = require('mongoose');

var postTagMappingSchema = mongoose.Schema({
    tagID:{
        type: Number
    },
    postID:{
        type: Number
    }
});

module.exports = mongoose.model('postTagMapping', postTagMappingSchema);