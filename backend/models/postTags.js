var mongoose = require('mongoose');

var postTagSchema = mongoose.Schema({
    tagID:{
        type: Number
    },
    tagName:{
        type: String
    }
});

module.exports = mongoose.model('postTag', postTagSchema);