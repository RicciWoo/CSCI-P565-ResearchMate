var mongoose = require('mongoose');

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
        type: Date,
        default: Date.now
    },
    verificationNumber:{
        type: Number
    },
    sessionString:{
        type: String
    },
    OTP:{
        type: Number
    },
    phone:{
        type: String
    },
    carrier:{
        type: String
    }
});

module.exports = mongoose.model('users', userSchema);
