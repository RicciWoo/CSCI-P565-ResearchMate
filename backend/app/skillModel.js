var mongoose = require('mongoose');

var skillSchema = mongoose.Schema({
    skillID:{
        type: Number
    },
    skillName:{
        type: String
    }
});

module.exports = mongoose.model('skill', skillSchema);
