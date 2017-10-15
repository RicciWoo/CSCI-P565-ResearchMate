var mongoose = require('mongoose');

var userInfoSchema = mongoose.Schema({
    userID:{
        type:Number,
        required: true,
        unique:true
    },
    university:{
        type: String
    },
    location:{
        city:{
            type: String
        },
        state:{
            type: String
        },
        country:{
            type: String
        }
    },
    dob:{
        type:String
    },
    advisor: {
        primary: {
            type: String
        },
        secondary: {
            type: String
        }
    }
});

module.exports = mongoose.model('userInfo', userInfoSchema);
