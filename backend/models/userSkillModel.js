var mongoose = require('mongoose');

var userSkillSchema = mongoose.Schema({
    userID:{
        type: Number
    },
    skillID:{
        type: Number
    }
});

module.exports = mongoose.model('userSkill', userSkillSchema);
