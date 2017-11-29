module.exports = {
  /**
   * Function to validate the user input for login
   * @param  {[type]} res      [response object]
   * @param  {[type]} username [description]
   * @param  {[type]} pwd      [description]
   * @return {[type]}          [boolean result]
   */
  checkLoginInput: function (res, username, pwd){
    var msg = "";
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
    var msg = "";
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




};
