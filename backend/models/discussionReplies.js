var mongoose = require('mongoose');

var discussionRepliesSchema = mongoose.Schema({
    postID:{
        type: Number
    },
    replyString:{
        type: String
    },
    replyID:{
        type: Number
    },
    userID:{
        type: Number
    },
    postedOn:{
        type: Date
    }
});

module.exports = mongoose.model('discussionReplies', discussionRepliesSchema);
