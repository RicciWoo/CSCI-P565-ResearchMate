'use strict';

var express = require('express'),
    app = express(),
    cors = require('cors'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    http = require('http'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    randomstring = require("randomstring"),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    randomstring = require("randomstring");

var portNumber = 54545;
app.listen(portNumber);
console.log("Server running at silo.soic.indiana.edu:"+portNumber);

app.use(bodyParser.json());
app.use(cors());

mongoose.Promise = global.Promise;

// Connect to MongoDB on localhost:27017
var connection = mongoose.connect('mongodb://localhost:27017/researchMate', { useMongoClient: true });

//  importing pre-defined model
var User = require('./app/userModel');
var UserInfo = require('./app/userInfoModel');
var GroupInfo = require('./app/groupInfoModel');
var UserGroup = require('./app/userGroupInfoModel');
var Publications = require('./app/publicationsInfoModel');
var UserPublications = require('./app/userPublicationInfoModel');
//  basic response initialization
var response = {
    "status":"false",
    "msg" : ""
};

//          mundane functions
//  hashing function
/**
 * [Function used to generate hash for the password]
 * @param  {[String]} password [Password]
 * @return {[String]}          [Hash of the password]
 */
var myHasher = function(password) {
    if(password.trim()=="")
        return "";
    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    return hash;
};
//  nodemailer setup
/**
 * [transporter Create a sender object for email]
 * @type {[type]}
 */
var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secureConnection: true,
    auth: {
        user: 'se.researchmate@gmail.com',
        pass: 'agileteam'
    }
}));
//  sending mail using nodemailer
/**
 * [sendMaill Accept mail options and send email to the user]
 * @param  {[Object]} mailOptions [Recipient's Details]
 * @return {[type]}             [description]
 */
function sendMaill(mailOptions) {
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response +'\nto :' + mailOptions.to);
        }
    });
}



// basic function for testing
app.post('/sayHello',sayHello);
function sayHello(req,res,next){
//  setting up the header configurations
//    res.setHeader('Access-Control-Allow-Origin','*');
//    res.setHeader('Access-Control-Allow-Methods','GET,POST,JSONP');
//    res.setHeader('Access-Control-Allow-Headers','x-requested-with, Content-Type, origin, authorization, accept, client-security-token');
    console.log(req.body);
    res.send("Hello "+req.body.name);
    console.log("said hello");
}

/**
 * [checkSignupInput Function to verify if sign up input is valid]
 * @param  {[Obj]} resp      [Response object]
 * @param  {[string]} firstname [description]
 * @param  {[type]} username  [description]
 * @param  {[type]} email     [description]
 * @param  {[type]} password  [description]
 * @return {[type]}           [description]
 */
function checkSignupInput(resp, firstname, username, email, password){
  var msg = "";
  var result = true;
  if(firstname == undefined || firstname.trim()==""){
    msg+="First name is required\n";
    result = false;
  }
  if(username == undefined || username.trim() == ""){
    msg+="Username is required\n";
    result = false;
  }
  if(email == undefined || email.trim()==""){
    msg += "Email is required\n";
    result = false;
  }
  if(password == undefined || password.trim() == ""){
    msg += "Password is required";
    result = false;
  }
  if(!result){
    response["msg"] = msg;
    resp.send(response);
  }
  return result;
}

app.post('/signUp',signUp);
/**
 * [signUp Function to add user details on sign up]
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function signUp(req,res,next) {
//  creating a document

    var email = req.body.email;
    var username = req.body.username;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var pw = req.body.password;

    if(!checkSignupInput(res, firstname, lastname, username, email, pw))
      return;

    var maxCount = 1;
    User.findOne().sort('userID').exec(function(err, entry) {
        // entry.userID is the max value
        if(entry == null) {
            maxCount = 1;
//            console.log("if "+entry);
        }
        else {
            maxCount = entry.userID + 1;
//            console.log("else "+entry.userID);
//            console.log("maxcount : "+ maxCount);
        }

        var addUser = new User({
            userID: maxCount,
            emailID: email,
            userName: username,
            firstName: firstname,
            lastName: lastname,
            passWord: pw,
            sessionString: randomstring.generate(16)
        });

//  For sending mail
        var mailOptions = {
            from: 'se.researchmate@gmail.com',
            to: addUser.emailID,
            subject: 'Verification code',
            text: 'Your verification code :'+ addUser.verificationNumber
        };

//  encrypting password
        addUser.passWord = myHasher(addUser.passWord);

//  adding a document to database
        var query = {"userName": username};
        User.findOne(query, function (err, seeUser) {
            addUser.save(function (err) {
                if (err) {
                    console.log(err);
                    response["msg"] = "User already exists.";
                    console.log("User already exists, username = " + addUser.userName);
                    res.send(response);
                }
                else {
                    response["status"] = "true";
                    response["msg"] = "Account Added successfully. Please check your email to verify your account.";
                    sendMaill(mailOptions);
                    res.send(response);
                    console.log("New User Added : " + addUser.userName);
                }
            });
        });
    });
}

function checkVerifyUserInput(resp, username, verNum){
  var msg = "";
  var result = true;
  if(username == undefined || username.trim() == ""){
    msg += "Username is required\n";
    result = false;
  }
  if(verNum == undefined || verNum.trim() == ""){
    msg += "Verification Number is required";
    result = false;
  }
  if(!result){
    response["msg"] = msg;
    resp.send(response);
  }
  return result;
}

app.post('/verifyUser',verifyUser);
/**
 * [verifyUser Function to verify user. Accepts username and verification number]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function verifyUser(req,res,next) {
    var username = req.body.username;
    var verifNumber = req.body.verificationNumber;
    if(!checkVerifyUserInput(res, username, verifNumber))
      return;
    var query = {"userName": username};

    User.findOne(query, function(err, seeUser) {
        if (seeUser == null) {
            response["msg"] = "User does not exist";
            res.send(response);
            console.log(username+"doesn't exist.");
        }
        else{
            if(seeUser.verificationNumber == parseInt(verifNumber)) {
                User.findOneAndUpdate({userName: seeUser.userName}, {$set: {verificationNumber: 1}}, function (err, updatedUser) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "couldn't set verificationNumber to 1";
                        res.send(response);
                    }
                    else {

                        var maxCount = 1;
                        UserInfo.findOne().sort('userID').exec(function (err, entry) {
                            // entry.userID is the max value
                            if (entry == null) {
                                maxCount = 1;
                            }
                            else {
                                maxCount = entry.userID + 1;
                            }

                            var userInfo = new UserInfo({userID: maxCount});

                            userInfo.save(function (err) {
                                if (err) {
                                    response["msg"] = "unable to add into userInfo";
                                    res.send(response);
                                    console.log("unable to add into userInfo");
                                }
                                else {
                                    response["status"] = "true";
                                    response["msg"] = "Verification Successful.";
                                    res.send(response);
                                    console.log("added into userInfo");
                                }
                            });
                        });
                    }
                });
            }
            else{
                response["msg"] = "Incorrect Verification Number";
                res.send(response);
            }
        }
    });
}

/**
 * [checkLoginInput Function to check if login inputs are given properly]
 * @param  {[type]} resp     [description]
 * @param  {[type]} username [description]
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
function checkLoginInput(resp, username, password){
  var msg = "";
  var result = true;
  if(username == undefined || username.trim() == ""){
    msg += "Username is required\n";
    result = false;
  }
  if(password == undefined || password.trim()==""){
    msg += "Password is required";
    result = false;
  }
  if(!result){
    response["msg"] = msg;
    resp.send(response);
  }
  return result;
}

app.post('/login',login);
/**
 * [login Function to check the login for user.]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function login(req,res,next) {
    var username = req.body.username;
    var pw = req.body.password;
    if(!checkLoginInput(res, username, pw))
      return;
    var query = {'userName':username};
    User.findOne(query, function(err, seeUser) {
        if (seeUser == null) {
            response["msg"] = "User does not exist";
            res.send(response);
            console.log(username + "doesn't exist.");
        }
        else{
            if(seeUser.verificationNumber != 1){
                response["msg"] = "User not verified.";
                res.send(response);
                console.log(username + " is not verified.");
            }
            else{
                if (bcrypt.compareSync(pw, seeUser.passWord)){
                    User.findOne(query, function(err, seeUser) {
                        if (seeUser == null) {
                            response["msg"] = "User does not exist";
                            res.send(response);
                            console.log(username + "doesn't exist.");
                        }
                        else {
                            var sessionString = randomstring.generate(16);
                            User.findOneAndUpdate({userName:seeUser.userName}, { $set: { sessionString:sessionString}}, function(err,updatedUser){
                                if(err){
                                    response["msg"] = "Failed to update sessionString.";
                                    res.send(response);
                                    console.log(username + ": failed to update sessionSting");
                                }
                                else{
                                    response["status"] = "true";
                                    response["msg"] = sessionString;
                                    res.send(response);
                                    console.log(username + ": updated sessionSting");
                                }
                            });
                        }
                    });
                }
                else{

                    response["status"] = "false";
                    response["msg"] = "Incorrect password";
                    res.send(response);
                    console.log(username + ": incorrect password");
                }
            }
        }
    });
}

function checkUpdatePwdInput(resp, sessionString, password){
  var msg = "";
  var result = true;

  if(sessionString == undefined || sessionString.trim()==""){
    msg += "Session string is required\n";
    result = false;
  }
  if(password == undefined || password.trim()==""){
    msg += "Password is required";
    result = false;
  }

  if(!result){
    response["msg"] = msg;
    resp.send(response);
  }
  return result;
}

app.post('/updatePassword',updatePassword);
/**
 * [updatePassword Function to update the user after forget password]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function updatePassword(req, res, next){
    var sessionString = req.body.sessionString;
    var password = req.body.password;
    if(!checkUpdatePwdInput(res, sessionString, password))
      return;
    password = myHasher(password);
    var query = {'sessionString': sessionString};
    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["msg"] = "User does not exist";
            res.send(response);
        }
        else{
            if(UserObj.sessionString == sessionString){
                UserObj.set({passWord: password});
                UserObj.save(function(err, updatedUser) {
                    if (err) {
                        response["msg"] = "Failed to update password. Please try again";
                        console.log("Update Failed while saving.");
                        res.send(response);
                    } else {
                        response["msg"] = "Password reset successful.";
                        response["status"] = "true";
                        res.send(response);
                    }
                });
            }
            else{
                response["msg"] = "Session string does not match";
                res.send(response);
            }
        }
    });
}


function checkForgetUsernameInput(resp, email){
  var msg = "";
  var result = true;

  if(email == undefined || email.trim()==""){
    msg += "Email is required";
    result = false;
  }
  if(!result){
    response["msg"] = msg;
    resp.send(response);
  }
  return result;
}

app.post('/forgetUsername',forgetUsername);
/**
 * [forgetUsername Function that accepts email and sends username on email]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function forgetUsername(req, res, next){
    var email = req.body.email;
    if(!checkForgetUsernameInput(res, email))
      return;
    var query = {'emailID' : email};
    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["msg"] = "User does not exist";
            res.send(response);
        }
        else{
            var username = UserObj.userName;
            var firstname = UserObj.firstName;
            var mailOptions = {
                from: 'se.researchmate@gmail.com',
                to: email,
                subject: 'Hello '+ firstname +'. We have your username' ,
                text: 'Hello ' + firstname + '. This is your username for ResearchMate: ' + username
            };
            sendMaill(mailOptions);
            response["msg"] = "Username sent on your email. Please check your email";
            response["status"] = "true";
            res.send(response);
        }
    });
}

function checkForgetPasswordInput(resp, input){
  var msg = "";
  var result = true;

  if(input == undefined || input.trim() == ""){
    msg += "Either email or username is required";
    result = false;
  }
  if(!result){
    response["msg"] = msg;
    resp.send(response);
  }
  return result;
}

app.post('/forgetPassword',forgetPassword);
/**
 * [forgetPassword Function that accepts email or username, generates random string and allows user to update the password]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function forgetPassword(req, res, next){
    var input = req.body.input;
    if(!checkForgetPasswordInput(res, input))
      return;
    var query = {};
    if(input.indexOf('@')!=-1){
        query = {'emailID' : input};
    }
    else{
        query = {'userName':input};
    }

    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["msg"] = "User does not exist";
            res.send(response);
        }
        else{
            var rand = randomstring.generate(16);
            UserObj.set({sessionString: rand});
            UserObj.save(function(err, updatedUser) {
                if (err) {
                    response["msg"] = "Failed to update session key. Please try again";
                    console.log("Update Failed while saving.");
                    res.send(response);
                } else {
                    var firstname = UserObj.firstName;
                    var link = 'http://localhost/researchmate/components/login/updatepassword.html';
                    var mailOptions = {
                        from: 'se.researchmate@gmail.com',
                        to: UserObj.emailID,
                        subject: 'Hello '+ firstname +'. Please reset your password' ,
                        text: 'Hello ' + firstname + '. Please click the link to reset your password: ' + link + '?sessionStr=' + rand
                    };
                    sendMaill(mailOptions);
                    response["msg"] = "Password reset link sent on your email. Please check your email";
                    response["status"] = "true";
                    res.send(response);
                }
            });
        }
    });
}

// basic function to get userInfo
app.post('/getUserInfo', getUserInfo);
function getUserInfo(req,res,next) {
    // check sessionString in usertable & get userID
    var sessionString = req.body.sessionstring;
    var query = {"sessionString": sessionString};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["msg"] = "Error: User not found!";
            res.send(response);
            console.log("Error: User not found!");
        }
        else {
            var queryInfo = {"userID": user.userID};
            UserInfo.findOne(queryInfo, function(err, userInfo) {
                if (userInfo == null) {
                    response["msg"] = "Error: UserInfo not found, may due to verification not done!";
                    res.send(response);
                    console.log("Error: UserInfo not found, may due to verification not done!");
                }
                else {
                    response["msg"] = userInfo;
                    response["status"] = "true";
                    res.send(response);
                    console.log("Complete: UserInfo sent for user = "+user.userName);
                }
            });
        }
    });
}

// basic function to set userInfo
app.post('/setUserInfo', setUserInfo);
function setUserInfo(req,res,next) {
//  check sessionString in usertable & get userID
    var sessionString = req.body.sessionstring;
    var query = {"sessionString": sessionString};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: Update failed. User not found!")
        }
        else {
            var queryInfo = {"userID": user.userID};
            UserInfo.findOne(queryInfo, function(err, userInfo) {
                if (userInfo == null) {
                    response["msg"] = " Update failed.";
                    res.send(response);
                    console.log("Error: Update failed. UserInfo not found, may due to user not verified!");
                }
                else {
                    userInfo.set({university: req.body.university});
                    userInfo.set({
                        location: {
                            address: req.body.address,
                            city: req.body.city,
                            state: req.body.state,
                            country: req.body.country
                        }
                    });
                    var dobDate = new Date(req.body.dob);
                    userInfo.set({dob: dobDate});
                    userInfo.set({
                        advisor: {
                            primary: req.body.primaryAdvisor,
                            secondary: req.body.secondaryAdvisor
                        }
                    });
                    userInfo.set({picture: req.body.picture});
                    userInfo.save(function (err, updatedUser) {
                        if(err) {
                            response["msg"] = " Update failed while saving.";
                            res.send(response);
                            console.log("Error: Update failed while saving!");
                        } else {
                            response["msg"] = " Update successful.";
                            response["status"] = "true";
                            res.send(response);
                            console.log("Complete: Update successful.");
                        }
                    });
                }
            });
        }
    });
}

app.post('/getUserPublications', getUserPublications);     //sessionstring
function getUserPublications(req,res,next) {
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            query = {"userID":user.userID};
            UserPublications.find(query,function(err,publics){
                if(err||publics == null){
                    response["msg"] = "No entry found for this user in publications.";
                    res.send(response);
                    console.log("Error: User not found in publications!")
                }
                else{
                    response["status"] = "true";
                    response["msg"] = publics.publicationID;
                    res.send(response);
                }
            })
        }
    });
}

app.post('/setUserPublication', setUserPublication);      //sessionstring, publicationID   (not properly set yet)
function setUserPublication(req,res,next) {
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            var setUserPublicationDoc = new UserPublications({
               userID:user.userID,
               publicationID:req.body.publicationID
            });
            setUserPublicationDoc.save(function (err) {
                if(err){
                    response["msg"] = "unable to save";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    response["msg"] = "publication added.";
                    response["status"] = "true";
                    res.send(response);
                    console.log(response["msg"]);
                }
            });
        }

        });
}

app.post('/getUserGroups', getUserGroups);                  //sessionstring
function getUserGroups(req,res,next) {
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            query = {"userID":user.userID};
            UserGroup.find(query,function(err,groups){
                if(err||groups == null){
                    response["msg"] = "No entry found for this user in groups.";
                    res.send(response);
                    console.log("Error: User not found in groups!")
                }
                else{
                    response["status"] = "true";
                    response["msg"] = groups.groupID;
                    res.send(response);
                }
            })
        }
    });
}

app.post('/setUserGroup', setUserGroup);                   //sessionstring, groupname, membertype
function setUserGroup(req,res,next) {

}

app.post('/getUserFollowers', getUserFollowers);           //sessionstring
function getUserFollowers(req,res,next) {

}

app.post('/followSomeone', followSomeone);                 //sessionstring, username(user that needs to be followed by sessionstring holder)
function followSomeone(req,res,next) {

}
