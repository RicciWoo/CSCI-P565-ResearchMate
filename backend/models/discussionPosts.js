var mongoose = require('mongoose');

var discussionPostsSchema = mongoose.Schema({
    postID:{
        type: Number
    },
    postString:{
        type: String
    },
    userID:{
        type: Number
    },
    groupID:{
        type: Number
    },
    postedOn:{
        type: Date
    }
});

module.exports = mongoose.model('discussionPosts', discussionPostsSchema);
