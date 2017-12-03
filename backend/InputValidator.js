module.exports = {
  /**
   * Function to validate the user input for login
   * @param  {[type]} res      [response object]
   * @param  {[type]} username [description]
   * @param  {[type]} pwd      [description]
   * @return {[type]}          [boolean result]
   */
  checkLoginInput: function (res, username, pwd){
    var msg = "checkLoginInput\n";
    var result = true;

    if(username == undefined || username.trim() == "")
      {
        msg += "Username cannot be blank\n";
        result = false;
    }
    if(pwd == undefined || pwd.trim() == ""){
      msg += "Password cannot be blank";
      result = false;
    }
    if(!result){
      res.send({"status":"false", "msg": msg});
    }
    return result;
  },

  /**
   * Function to validate input for sign up
   * @param  {[type]} res       [description]
   * @param  {[type]} firstname [description]
   * @param  {[type]} lastname  [description]
   * @param  {[type]} username  [description]
   * @param  {[type]} email     [description]
   * @param  {[type]} pwd       [description]
   * @param  {[type]} phone     [description]
   * @param  {[type]} carrier   [description]
   * @return {[type]}           [description]
   */
  checkSignupInput: function (res, firstname, lastname, username, email, pwd, phone, carrier){
    var msg = "checkSignupInput\n";
    var result = true;
    if(firstname == undefined || firstname.trim() == ""){
      msg += "First name cannot be blank\n";
      result = false;
    }
    if(username == undefined || username.trim() == ""){
      msg += "Last name cannot be blank\n";
      result = false;
    }
    if(email == undefined || email.trim() == ""){
      msg += "Email cannot be blank\n";
      result = false;
    }
    if(pwd == undefined || pwd.trim() == ""){
      msg +=  "Password cannot be blank\n";
      result = false;
    }
    if(phone == undefined || phone.trim() == ""){
      msg += "Phone number cannot be blank\n";
      result = false;
    }
    if(carrier == undefined || carrier.trim() == ""){
      msg += "Carrier cannot be blank\n";
      result = false;
    }
    if(!result){
      res.send({"status":"false", "msg": msg});
    }
    return result;
  },

  /**
   * Function to check the inputs for verfication of user
   * @param  {[type]} res          [description]
   * @param  {[type]} username     [description]
   * @param  {[type]} verification [description]
   * @return {[type]}              [description]
   */
  checkVerifyUserInput: function(res, username, verification){
    var msg = "checkVerifyUserInput\n";
    var result = true;

    if(username == undefined || username.trim() == ""){
      msg += "Username cannot be blank\n";
      result = false;
    }
    if(verfication == undefined || verficiation.trim() == ""){
      msg += "Verification number cannot be blank\n";
      result = false;
    }

    if(!result){
      res.send({"status":"false", "msg": msg});
    }
    return result;
  },

/**
 * Function to check input for update password
 * @param  {[type]} res        [description]
 * @param  {[type]} sessionStr [description]
 * @param  {[type]} pwd        [description]
 * @return {[type]}            [description]
 */
checkUpdatePwdInput:function(res, sessionStr, pwd){
    var msg = "checkUpdatePwdInput\n";
    var result = true;

    if(sessionStr == undefined || sessionStr.trim() == ""){
      msg += "Sesison string is required\n";
      result =false;
    }
    if(pwd == undefined || pwd.trim() == ""){
      msg += "Password cannot be blank\n";
      result =false;
    }


    if(!result){
      res.send({"status":"false", "msg": msg});
    }
    return result;
},

/**
 * Function to check input for forget username
 * @param  {[type]} res   [description]
 * @param  {[type]} email [description]
 * @return {[type]}       [description]
 */
checkForgetUsernameInput: function(res, email){
    var msg = "checkForgetUsernameInput\n";
    var result = true;
    if(email == undefined || email.trim() == ""){
      msg +=  "Email cannot be blank\n";
      result = false;
    }

    if(!result){
      res.send({"status":"false", "msg": msg});
    }
    return result;
},

/**
 * Funcion to check input for forget password
 * @param  {[type]} res   [description]
 * @param  {[type]} input [description]
 * @return {[type]}       [description]
 */
checkForgetPwdInput: function(res, input){
  var msg = "checkForgetPwdInput\n";
  var result = true;

  if(input == undefined || input.trim()==""){
    msg += "Username or email required\n"
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},

/**
 * Function to check if get user info has valid input
 * @param  {[type]} username [description]
 * @return {[type]}          [description]
 */
checkGetUserInfo: function (username){
  var msg = "checkGetUserInfo\n";
    var result = true;

    if(username == undefined || username.trim() == ""){
      msg += "Username cannot be blank to get user info\n";
      result = false;
    }

    if(!result){
      res.send({"status":"false", "msg": msg});
    }
    return result;
},

/**
 * Function to check if session string is provided wherever requrired
 * @param  {[type]} res        [description]
 * @param  {[type]} sessionStr [description]
 * @return {[type]}            [description]
 */
checkSessionString: function(res, sessionStr){
  var msg = "checkSessionString\n";
  var result = true;

  if(sessionStr == undefined || sessionStr.trim() == ""){
    msg += "Session string required to perform the action\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},

/**
 * Check input to while creating a new group
 * @param  {[type]} res           [description]
 * @param  {[type]} sessionString [description]
 * @param  {[type]} groupName     [description]
 * @return {[type]}               [description]
 */
checkCreateGroupInput: function (res, sessionString, groupName){
  var msg = "checkCreateGroupInput\n";
  var result = true;

  if(sessionString == undefined || sessionString.trim() == ""){
    msg += "Session required to create a new group\n";
    result = false;
  }
  if(groupName == undefined || groupName.trim() == ""){
    msg += "Group name required\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},

/**
 * Function to check input while adding user to group
 * @param  {[type]} res           [description]
 * @param  {[type]} sessionString [description]
 * @param  {[type]} groupID       [description]
 * @return {[type]}               [description]
 */
checkSetUserGroupInput: function(res, sessionString, groupID){
  var msg = "checkSetUserGroupInput\n";
  var result = true;

  if(sessionString == undefined || sessionString.trim() == ""){
    msg += "Session string required to add user to group\n";
    result = false;
  }
  if(groupID == undefined){
    msg += "Group ID required\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},

/**
 * Function to check if input is correct while adding a new publication
 * @param  {[type]} res        [description]
 * @param  {[type]} sessionStr [description]
 * @param  {[type]} name       [description]
 * @param  {[type]} issn       [description]
 * @return {[type]}            [description]
 */
checkAddPublication: function(res, sessionStr, name, issn){
  var msg = "checkAddPublication\n";
  var result = true;

  if(sessionStr == undefined || sessionStr.trim() == ""){
    msg += "Session string required to perform any action\n";
    result = false;
  }
  if(name == undefined || name.trim() == ""){
    msg += "Publicaition name cannot be blank\n";
    result = false;
  }
  if(issn == undefined){
    msg += "ISSN cannot be blank\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},

/**
 * Check the input for getting a publcation by Publication ID
 * @param  {[type]} res   [description]
 * @param  {[type]} pubID [description]
 * @return {[type]}       [description]
 */
checkPublicationByID: function(res, pubID){
  var msg = "checkPublicationByID\n";
  var result = true;

  if(pubID == undefined){
    msg += "Publication ID is required to get the details\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},

/**
 * Function to check input while adding a new skill
 * @param  {[type]} res           [description]
 * @param  {[type]} sessionString [description]
 * @param  {[type]} skillName     [description]
 * @return {[type]}               [description]
 */
checkAddSkill: function(res, sessionString, skillName){
  var msg = "checkAddSkill\n";
  var result = true;

  if(sessionString == undefined || sessionString.trim() == ""){
    msg += "Session string is required to perform this action\n";
    result = false;
  }
  if(skillName == undefined || skillName.trim() == ""){
    msg += "Blank skill name cannot be added\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},


checkSearchQuery: function(res, searchQuery){
  var msg = "checkSearchQuery\n";
  var result = true;

  if(searchQuery == undefined || searchQuery.trim() == ""){
    msg += "Cannot search for blank search query\n";
    result = false;
  }
  if(searchQuery.indexOf("=")!=-1){
    msg += "Attempt of SQL Injection. Request blocked\n";
    result = false;
  }

  if(!result){
    res.send({"status":"false", "msg": msg});
  }
  return result;
},


};
