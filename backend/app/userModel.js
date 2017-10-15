var mongoose = require('mongoose');

var low = 10000000;
var high = 99999999;

function getRandom(low,high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var userSchema = mongoose.Schema({
    userID:{
        type:Number,
        required: true
    },
    emailID:{
        type: String,
        required: true,
        unique:true
    },
    userName: {
        type: String,
        required: true,
        unique:true
    },
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    passWord:{
        type: String,
        required: true
    },
    createdDate:{
        type:Date,
        default: Date.now
    },
    verificationNumber:{
        type:Number,
        default: getRandom(low,high)
    },
    sessionString:{
        type:String
    }
});

module.exports = mongoose.model('users', userSchema);
