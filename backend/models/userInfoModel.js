var mongoose = require('mongoose');

var userInfoSchema = mongoose.Schema({
    userID:{
        type:Number,
        required: true,
        unique:true
    },
    university:{
        type: String,
	    default: "(University)"
    },
    location:{
        address:{
            type: String,
	        default: "(Location)"
        },
        city:{
            type: String,
	        default: "(City)"
        },
        state:{
            type: String,
	        default: "(State)"
        },
        country:{
            type: String,
	        default: "(Country)"
        }
    },
    dob:{
        type:Date,
	    default: "10/15/2017"
    },
    advisor: {
        primary: {
            type: String,
	        default: "(Primary Advisor)"
        },
        secondary: {
            type: String,
	        default: "(Secondary Advisor)"
        }
    },
    picture:{
        type : String,
	    default: ""
    },
    summary:{
        type : String,
	    default: "(summary)"
    }
});

module.exports = mongoose.model('userInfo', userInfoSchema);
