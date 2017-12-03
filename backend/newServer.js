'use strict';

var express = require('express'),
    app = express(),
    cors = require('cors'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    http = require('http').createServer(app),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    randomstring = require("randomstring"),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    multipart = require('connect-multiparty'),
    path = require('path'),
    async = require('async'),
    morgan = require('morgan'),
    io = require('socket.io')(http);

var portNumber = 54545;
http.listen(portNumber,function (err) {
    if(err){
        response["status"] = "false";
        response["msg"] = err;
        console.log(response);
    }
    else{
        console.log("Server running at silo.soic.indiana.edu: " + portNumber);
    }
});

//  chat test
/*
app.get('/test1', function(req, res){
    res.sendFile(__dirname + '/index1.html');
});
app.get('/test2', function(req, res){
    res.sendFile(__dirname + '/index2.html');
});
app.get('/test3', function(req, res){
    res.sendFile(__dirname + '/index3.html');
});
*/


// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream('./backend/log/access.log', {flags: 'a'});

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('../app/'));
app.use(express.static('public/'));

/*
app.use(express.static('public/images/profilePics/'));
app.use(express.static('public/papers/'));
app.use(express.static('public/images/skillIcons/'));
*/

mongoose.Promise = global.Promise;
// Connect to MongoDB on localhost:27017
var connection = mongoose.connect('mongodb://silo.soic.indiana.edu:27018/researchMate2', { useMongoClient: true });

//  importing pre-defined model
var User = require('./models/userModel'),
    UserInfo = require('./models/userInfoModel'),
    GroupInfo = require('./models/groupInfoModel'),
    UserGroup = require('./models/userGroupInfoModel'),
    Publications = require('./models/publicationsInfoModel'),
    UserPublications = require('./models/userPublicationInfoModel'),
    UserFollowee = require('./models/userFolloweeModel'),
    UserSkills = require('./models/userSkillModel'),
    Skills = require('./models/skillModel'),
    PublicationRatings = require('./models/publicationRatings'),
    DiscussionPosts = require('./models/discussionPosts'),
    DiscussionReplies = require('./models/discussionReplies'),
    PostTags = require('./models/postTags'),
    PostTagsMapping = require('./models/postTagMapping'),
    GroupJoinRequest = require('./models/groupJoinRequests'),
    UserInterests = require('./models/userInterests'),
    Messages = require('./models/messages'),
    FriendRequest = require('./models/friendRequests'),
    inputValidator = require('./InputValidator');

//  mundane accessory functions
//  basic response initialization
var response = {
    "status":"false",
    "msg" : ""
};

//  hashing function
var myHasher = function(password) {
    if(password.trim()=="")
        return "";
    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    return hash;
};

//  nodemailer setup
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
function sendMaill(mailOptions) {
  if(mailOptions.to == undefined || mailOptions.to == "")
    return;
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response +'\nto :' + mailOptions.to);
        }
    });
}


//  function which returns random values
function getRandom(low,high) {
    return Math.floor(Math.random() * (high - low) + low);
}
var low = 10000000;
var high = 99999999;

app.post('/signUp',signUp);
/**
 * Function to create new user in database
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
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
    var phone = req.body.phone;
    var carrier = req.body.carrier;

    if(!checkSignupInput(res, firstname, lastname, username, email, pw, phone, carrier))
      return;

    var maxCount = 1;
    User.findOne().sort('-userID').exec(function(err, entry) {
        // entry.userID is the max value
        if(entry == null) {
            maxCount = 1;
        }
        else {
            maxCount = entry.userID + 1;
        }

        var addUser = new User({
            userID: maxCount,
            emailID: email,
            userName: username,
            firstName: firstname,
            lastName: lastname,
            passWord: pw,
            sessionString: randomstring.generate(16),
            verificationNumber : getRandom(low,high),
            phone:phone,
            carrier:carrier,
            createdDate:Date.now()
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
            if(seeUser==null||seeUser==undefined) {
                addUser.save(function (err) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "User already exists.";
                        res.send(response);
                        console.log("User already exists with username : " + addUser.userName);
                    }
                    else {
                        response["status"] = "true";
                        response["msg"] = "Account Added successfully. Please check your email to verify your account.";
                        sendMaill(mailOptions);
                        res.send(response);
                        console.log("New User Added : " + addUser.userName);
                    }
                });
            }
            else{
                response["status"] = "false";
                response["msg"] = "User already exists.";
                res.send(response);
                console.log("User already exists with username : " + addUser.userName);
            }
        });
    });
}

app.post('/verifyUser',verifyUser);
/**
 * Function to check the verfication of user (Dual authentication)
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function verifyUser(req,res,next) {
    var username = req.body.username;
    var verifNumber = req.body.verificationNumber;
    if(!inputValidator.checkVerifyUserInput(res, username, verifNumber))
      return;
    var query = {"userName": username};

    User.findOne(query, function(err, seeUser) {
        if (seeUser == null) {
            response["status"] = "false";
            response["msg"] = "User does not exist: " + username;
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            if(seeUser.verificationNumber == parseInt(verifNumber)&&parseInt(verifNumber) != -565) {
                User.findOneAndUpdate({userName: seeUser.userName}, {$set: {verificationNumber: 1}}, function (err, updatedUser) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "unable to set verificationNumber: "+username;
                        res.send(response);
                        console.log(response["msg"]);
                    }
                    else {
                        var pic = "http://silo.soic.indiana.edu:" + portNumber.toString() + "/public/userIcon.jpg";

                        var userInfo = new UserInfo({
                            userID: seeUser.userID,
                            university: "",
                            location: {
                                address: "",
                                city: "",
                                state: "",
                                country: ""
                            },
                            dob: Date.now(),
                            advisor: {
                                primary: "",
                                secondary: ""
                            },
                            picture: pic,
                            summary: ""
                        });
                        userInfo.save(function (err) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = "unable to add userInfo for: " + username;
                                res.send(response);
                                console.log(response["msg"]);
                            }
                            else {
                                response["status"] = "true";
                                response["msg"] = "Verification Successful for: " + username;
                                res.send(response);
                                console.log(response["msg"]);
                            }
                        });
                    }
                });
            }
            else{
                response["status"] = "false";
                response["msg"] = "Incorrect Verification Number for: " + username;
                res.send(response);
                console.log(response["msg"]);
            }
        }
    });
}

app.post('/login',login);
/**
 * Function to verify the user credentials for input and generate OTP
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function login(req,res,next) {
    var username = req.body.username;
    var pw = req.body.password;
    if(!inputValidator.checkLoginInput(res, username, pw)){
        return;
    }

    if(username==null||pw==null||pw==undefined||username==undefined||username==""||pw==""){
        response["status"] = "false";
        response["msg"] = "Invalid input for:" + username;
        res.send(response);
        console.log(response["msg"]);
        return;
    }
    var query = {'userName':username};
    User.findOne(query, function(err, seeUser) {
        if (seeUser == null) {
            response["status"] = "false";
            response["msg"] = "User does not exist:" + username;
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            if(seeUser.verificationNumber != 1){
                response["status"] = "false";
                response["msg"] = "User not verified: " + username;
                res.send(response);
                console.log(response["msg"]);
            }
            else if(seeUser.verificationNumber == -565){
                response["status"] = "false";
                response["msg"] = "User Blocked. Contact admin. username: "+ username;
                res.send(response);
                console.log(response["msg"]);
            }
            else{
                if (bcrypt.compareSync(pw, seeUser.passWord)){
                    User.findOne(query, function(err, seeUser) {
                        if (seeUser == null) {
                            response["status"] = "false";
                            response["msg"] = "User does not exist: "+ username;
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            var sessionString = randomstring.generate(16);
                            User.findOneAndUpdate({userName:seeUser.userName}, {$set:{sessionString:sessionString,active:true}}, function(err,updatedUser){
                                if(err){
                                    response["status"] = "false";
                                    response["msg"] = "Failed to update sessionString: " + username;
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else{
                                    response["status"] = "true";
                                    response["msg"] = sessionString;
                                    res.send(response);
                                    console.log("sessionString updated: " + username);
                                    sendOTP(sessionString);
                                }
                            });
                        }
                    });
                }
                else{
                    response["status"] = "false";
                    response["msg"] = "Incorrect password: "+ username;
                    res.send(response);
                    console.log(response["msg"]);
                }
            }
        }
    });
}

app.post('/updatePassword',updatePassword);
/**
 * Function to update the user password
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function updatePassword(req, res, next){
    var sessionString = req.body.sessionString;
    var password = myHasher(req.body.password);
    if(!inputValidator.checkUpdatePwdInput(res, sessionString, password))
      return;
    var query = {'sessionString': sessionString};
    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["status"] = "false";
            response["msg"] = "User does not exist.";
            res.send(response);
            console.log(response["msg"] + "sessionString: " + sessionString);

        }
        else{
            if(UserObj.sessionString == sessionString){
                UserObj.set({passWord: password});
                UserObj.save(function(err, updatedUser) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "Failed to update password. Please try again. ";
                        res.send(response);
                        console.log(response["msg"]+ "sessionString: " + sessionString);
                    }
                    else {
                        response["msg"] = "Password reset successful.";
                        response["status"] = "true";
                        res.send(response);
                        console.log(response["msg"] + "sessionString: " + sessionString);
                    }
                });
            }
            else{
                response["status"] = "false";
                response["msg"] = "Session string does not match";
                res.send(response);
                console.log(response["msg"] + "sessionString: " + sessionString);
            }
        }
    });
}

app.post('/forgetUsername',forgetUsername);
/**
 * Function to send username to user using email
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function forgetUsername(req, res, next){
    var email = req.body.email;
    if(!inputValidator.checkForgetUsernameInput(res, email))
      return;
    var query = {'emailID' : email};
    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["status"] = "false";
            response["msg"] = "User does not exist.";
            res.send(response);
            console.log(response["msg"] + "email: " + email);
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
            console.log("username sent at: " + email);
        }
    });
}

app.post('/forgetPassword',forgetPassword);
/**
 * Function to generate a URL that allows the user to reset password
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function forgetPassword(req, res, next){
    var input = req.body.input;
    if(!inputValidator.checkForgetPwdInput(res, input))
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
            response["status"] = "false";
            response["msg"] = "User does not exist.";
            res.send(response);
            console.log(response["msg"]);
            console.log(input);
        }
        else{
            var rand = randomstring.generate(16);
            UserObj.set({sessionString: rand});
            UserObj.save(function(err, updatedUser) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "Failed to update session key. Please try again.";
                    res.send(response);
                    console.log(response["msg"] + " username: " + UserObj.userName);
                }
                else {
                    var firstname = UserObj.firstName;
                    var link = 'http://silo.soic.indiana.edu:54545/#/updatepassword';
                    var mailOptions = {
                        from: 'se.researchmate@gmail.com',
                        to: UserObj.emailID,
                        subject: 'Hello '+ firstname +'. Please reset your password' ,
                        text: 'Hello ' + firstname + '. Please click the link to reset your password: ' + link + '?sessionString=' + rand
                    };
                    sendMaill(mailOptions);
                    response["msg"] = "Password reset link sent on your email. Please check your email";
                    response["status"] = "true";
                    res.send(response);
                    console.log("password reset link sent for: " + UserObj.userName);
                }
            });
        }
    });
}

app.post('/getUserInfo', getUserInfo);
/**
 * Function to return the basic user information
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function getUserInfo(req,res,next) {
    // check sessionString in usertable & get userID
    var sessionString = req.body.sessionstring;
    var username = req.body.username;
    if(!inputValidator.checkGetUserInfo(res, username))
      return;
    var query = {"userName": username};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Error: User not found.";
            res.send(response);
            console.log(response["msg"] + " username: "+ username);
        }
        else {
            var queryInfo = {"userID": user.userID};
            UserInfo.findOne(queryInfo, function(err, userInfo) {
                if (userInfo == null) {
                    response["status"] = "false";
                    response["msg"] = "Error: UserInfo not found, may due to verification not done!";
                    res.send(response);
                    console.log(response["msg"] + " username: "+ username);
                }
                else {
                    response["msg"] = {"user":user,"userInfo":userInfo};
                    response["status"] = "true";
                    res.send(response);
                    console.log("userInfo sent for user: " + user.userName);
                }
            });
        }
    });
}

app.post('/setUserInfo', setUserInfo);
/**
 * Function to set the user information
 * @param {[type]}   req  [description]
 * @param {[type]}   res  [description]
 * @param {Function} next [description]
 */
function setUserInfo(req,res,next) {
//  check sessionString in usertable & get userID
    var sessionString = req.body.sessionstring;
    if(!inputValidator.checkSessionString(res, sessionString))
      return;
    var query = {"sessionString": sessionString};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Invalid sessionString: " + sessionString);
        }
        else{
            user.set({firstName: req.body.firstname, lastName: req.body.lastname});
            user.save(function(err, userSaveObj){});
            var queryInfo = {"userID": user.userID};
            UserInfo.findOne(queryInfo, function(err, userInfo) {
                if (userInfo == null) {
                    response["status"] = "false";
                    response["msg"] = " User has not verified.";
                    res.send(response);
                    console.log("Unverified user. sessionString: " + sessionString);
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
                    userInfo.set({summary: req.body.summary});
                    userInfo.save(function (err, updatedUser) {
                        if(err) {
                            response["status"] = "false";
                            response["msg"] = " update failed while saving at setUserInfo for user: " + user.userName;
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["msg"] = "Update successful. for user: " + user.userName;
                            response["status"] = "true";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

// basic function for testing
app.post('/sayHello',sayHello);                         //username and (opt)sessionString
function sayHello(req,res,next){
    console.log(req.body);
    response["status"] = "true";
    response["msg"] = "Hello "+req.body.name;
    res.send("Hello "+req.body.name);
    console.log("said hello");
}

app.post('/getUserPublications', getUserPublications);     //username and (opt)sessionString
/**
 * Function to return user publication data
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function getUserPublications(req,res,next) {
    var sessionString = req.body.sessionString;
    if(!inputValidator.checkGetUserInfo(res, req.body.username))
      return
    var query = {"userName": req.body.username};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid username: " + req.body.username;
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            var userID = user.userID;
            UserPublications.find({"userID": userID},{'_id':0}).select("publicationID").exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "No publications for user: " + req.body.username;
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var ids = [];
                    for(var i = 0;i<docs.length;i++){
                        ids.push(docs[i].publicationID)
                    }
                    Publications.find({'publicationID':{$in:ids}}, function(err,publications){
                        if(sessionString == undefined || sessionString == "")
                            response["msg"] = {"sessionString": "", "publicationInfo": publications};
                        else
                            response["msg"] = {"sessionString": user.sessionString, "publicationInfo": publications};
                        response["status"] = "true";
                        res.send(response);
                        console.log("publicationInfo sent for user: " + req.body.username);
                    });
                }
            });
        }
    });
}

app.post('/setUserPublication', setUserPublication);      //sessionstring, publicationID   (not properly set yet)
/**
 * Function to add publication data into database
 * @param {[type]}   req  [description]
 * @param {[type]}   res  [description]
 * @param {Function} next [description]
 */
function setUserPublication(req,res,next) {
    if(!inputValidator.checkSessionString(res, req.body.sessionstring))
      return;
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid sessionString: " + req.body.sessionstring;
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            var setUserPublicationDoc = new UserPublications({
                userID:user.userID,
                publicationID:req.body.publicationID
            });
            setUserPublicationDoc.save(function (err) {
                if(err){
                    response["status"] = "false";
                    response["msg"] = "unable to save new publication.";
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

app.post('/createGroup', createGroup);                  //groupname, sessionString, isPrivate
/**
 * Function to create a new group
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function createGroup(req,res,next) {
    var maxCount = 1;
    var groupPrivate = req.body.isPrivate;
    if(!inputValidator.checkCreateGroupInput(res, req.body.sessionString))
      return;

    if(groupPrivate==null){
        groupPrivate = 0;
    }

    GroupInfo.findOne().sort('-groupID').exec(function (err, entry) {
        // entry.userID is the max value
        if (entry == null) {
            maxCount = 1;
        }
        else {
            maxCount = entry.groupID + 1;
        }
        var query = {"sessionString": req.body.sessionString};
        User.findOne(query, function (err, user) {
            if (user == null) {
                response["status"] = "false";
                response["msg"] = "Invalid Session String";
                res.send(response);
                console.log(response["msg"] + " sessionString: " + req.body.sessionString);
            }
            else {
                var newGroupDoc = new GroupInfo({
                    groupName: req.body.groupname,
                    groupID: maxCount,
                    createdOn: Date.now(),
                    admin: user.userID,
                    description: req.body.description,
                    isPrivate:groupPrivate
                });
                GroupInfo.findOne({"groupName": req.body.groupname}, function (err, group) {
                    if (group==null) {
                        newGroupDoc.save(function (err) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = "unable to new save group";
                                res.send(response);
                                console.log(response["msg"] + "groupname: " + req.body.groupname);
                            }
                            else {
                                var newGroupDoc = new UserGroup({
                                    groupID: maxCount,
                                    userID: user.userID
                                });

                                newGroupDoc.save(function (err, saved) {
                                    if(err){
                                        response["status"] = "false";
                                        response["msg"] = "unable to add user in group.";
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                    else{
                                        response["msg"] = "group created and added creator.";
                                        response["status"] = "true";
                                        res.send(response);
                                        console.log(response["msg"] + "groupname: " + req.body.groupname);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        response["status"] = "false";
                        response["msg"] = "unable to save group.";
                        res.send(response);
                        console.log(response["msg"] + "groupname: " + req.body.groupname);
                    }
                });
            }
        });
    });
}


app.post('/getUserGroups', getUserGroups);                  //username + (opt)sessionstring
/**
 * Function to return the user groups
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function getUserGroups(req,res,next) {
    var sessionString = req.body.sessionString;
    if(!inputValidator.checkGetUserInfo(res,req.body.username))
      return;
    var query = {"userName": req.body.username};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = user.userID;
            UserGroup.find({"userID": userID},{'_id':0}).select("groupID").exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "No groups";
                    res.send(response);
                }
                else {
                    var ids = [];
                    for(var i = 0;i<docs.length;i++){
                        ids.push(docs[i].groupID)
                    }
                    GroupInfo.find({'groupID':{$in:ids}}, function(err,groups){
                        if(sessionString == undefined || sessionString == "")
                            response["msg"] = {"sessionString": "", "groupInfo": groups};
                        else
                            response["msg"] = {"sessionString": user.sessionString, "groupInfo": groups};
                        response["status"] = "true";
                        res.send(response);
                        console.log("groupInfo sent for "+req.body.username);
                    });
                }
            });
        }
    });
}

app.post('/setUserGroup', setUserGroup);                   //sessionstring, groupname
/**
 * Function to add user to a group
 * @param {[type]}   req  [description]
 * @param {[type]}   res  [description]
 * @param {Function} next [description]
 */
function setUserGroup(req,res,next) {

    if(!inputValidator.checkSetUserGroupInput(res, req.body.sessionString, req.body.groupID))
      return;
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var setUserGroupDoc = new UserGroup({
                userID: user.userID,
                groupID: req.body.groupID
            });
            setUserGroupDoc.save(function (err) {
                if(err){
                    response["status"] = "false";
                    response["msg"] = "unable to add in group";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    response["msg"] = "group entry added.";
                    response["status"] = "true";
                    res.send(response);
                    console.log(response["msg"]);
                }
            });
        }
    });
}

app.post('/getUserFollowers', getUserFollowers);           //username + (opt)sessionstring
/**
 * Function that return connections of a given user
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function getUserFollowers(req,res,next) {
    var sessionString = req.body.sessionString;
    if(!inputValidator.checkGetUserInfo(res, req.body.username))
      return;
    var query = {"userName": req.body.username};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = user.userID;
            UserFollowee.find({"userID": userID},{'_id':0}).select("followeeID").exec(function (err, docs) {
                if (err||docs.length==0) {
                    response["status"] = "false";
                    response["msg"] = "No Followers";
                    res.send(response);
                    console.log(response["msg"] + " for user: "+ req.body.username);
                }
                else {
                    var ids = [];
                    for(var i = 0;i<docs.length;i++){
                        ids.push(docs[i].followeeID)
                    }
                    User.find({'userID':{$in:ids}}, function(err,followers){
                        UserInfo.find({'userID':{$in:ids}}, function(infoErr, userInfo){
                            var follower = [];
                            for(var i = 0;i<followers.length;i++){
                                var tempObj = {};
                                tempObj["firstname"] = followers[i].firstName;
                                tempObj["lastname"] = followers[i].lastName;
                                tempObj["username"] = followers[i].userName;
                                for(var j=0;j<userInfo.length;j++){
                                    if(userInfo[j].userID == followers[i].userID){
                                        tempObj["imgLocation"] = userInfo[j].picture;
                                        break;
                                    }
                                }
                                follower.push(tempObj);
                            }
                            if(sessionString == undefined || sessionString == "")
                                response["msg"] = {"sessionString": "", "userInfo":follower};
                            else
                                response["msg"] = {"sessionString": user.sessionString, "userInfo":follower};
                            response["status"] = "true";
                            res.send(response);
                            console.log("followeeInfo sent for "+req.body.username);
                        });
                    });
                }
            });
        }
    });
}

app.post('/followSomeone', followSomeone);                 //sessionstring, followthis(user that needs to be followed by sessionstring holder)
/**
 * Function to add connections
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function followSomeone(req,res,next) {
    if(!inputValidator.checkSessionString(res, req.body.sessionString))
      return;
    if(!inputValidator.checkGetUserInfo(res, req.body.username))
      return;
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            query = {"userName": req.body.username};
            User.findOne(query, function (err, followme) {
                if (err || followme == null) {
                    response["status"] = "false";
                    response["msg"] = "Unable to find user you want to follow.";
                    res.send(response);
                    console.log(response["msg"] + " username: " + req.body.username);
                }
                else {
                    var userFollowDoc = new UserFollowee({
                        userID: user.userID,
                        followeeID: followme.userID,
                        followingFrom: Date.now()
                    });
                    userFollowDoc.save(function (err) {
                        if (err) {
                            response["status"] = "false";
                            response["msg"] = "unable to follow this user: "+ req.body.username;
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            var userFollowDoc2 = new UserFollowee({
                                userID: followme.userID,
                                followeeID: user.userID,
                                followingFrom: Date.now()
                            });
                            userFollowDoc2.save(function (err) {
                                if (err) {
                                    response["status"] = "false";
                                    response["msg"] = "unable to follow this user";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    response["msg"] = "following successful.";
                                    response["status"] = "true";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/addPublication',addPublication);
/**
 * Function to add user publication
 * @param {[type]}   req  [description]
 * @param {[type]}   res  [description]
 * @param {Function} next [description]
 */
function addPublication(req,res,next) {
    if(!inputValidator.checkAddPublication(res, req.body.sessionstring, req.body.name, req.body.ISSN))
      return;
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var query = {"name": req.body.name};
            Publications.findOne(query, function (err, publics) {
                if (publics != null) {
                    response["msg"] = "Publication already exists.";
                    response["status"] = "false";
                    console.log(response["msg"]);
                    res.send(response);
                }
                else {
                    var maxCount = 1;
                    Publications.findOne().sort('-publicationID').exec(function(err, entry) {
                        // entry.userID is the max value
                        if (entry == null) {
                            maxCount = 1;
                        }
                        else {
                            maxCount = entry.publicationID + 1;
                        }
                        var publishDate = new Date(req.body.publishDate);
                        var newPublication = new Publications({
                            publicationID:maxCount,
                            name: req.body.name,
                            ISSN: req.body.ISSN,
                            paperAbstract: req.body.abstract,
                            publishedAt: req.body.publishedAt,
                            publishDate: publishDate,
                            where: req.body.url
                        });
                        newPublication.save(function (err) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = "cannot save publication.";
                                res.send(response);
                                console.log(err);
                            }
                            else {
                                response["status"] = "true";
                                response["msg"] = "Publication saved.";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                        });
                    });
                }
            });
        }
    });
}

app.use(multipart({uploadDir: './public'}));
app.post('/uploadProfilePic', uploadProfilePic);
function uploadProfilePic(req, res, next) {
    var data = req.body.type,
        finalPath = './public/images/profilePics/' + req.body.username + '.jpg',
        file = req.files.file,
        tmp_path = file.path;
    fs.rename(tmp_path, finalPath, function (err) {
        if (err) throw err;
        fs.unlink(tmp_path, function () {
            if (err) {
                response["status"] = "false";
                response["msg"] = "user picture upload failed.";
                res.send(response);
                console.log(response["msg"]);
            }
            else {
                var host = "http://silo.soic.indiana.edu:";
                response["status"] = "true";
                var pathVar = path.join(host, portNumber.toString(), finalPath);
                pathVar = pathVar.replace("edu:/", "edu:");
                pathVar = pathVar.replace("ttp:","ttp:/");
                pathVar = pathVar.replace("/public","");
                User.findOne({"userName": req.body.username}, function (err, user) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "user picture upload failed. unable to find user info.";
                        res.send(response);
                        console.log(response["msg"]);
                    }
                    else {
                        console.log("user: "+user);
                        UserInfo.findOne({"userID": user.userID}, function (err, userinf) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = "user picture upload failed. unable to find user info. please verify your account.";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                            else {
                                userinf.set({picture: pathVar});
                                userinf.save(function (err) {
                                    if (err) {
                                        response["status"] = "false";
                                        response["msg"] = "user picture upload failed. unable to find user info.";
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                    else {
                                        response["status"] = "true";
                                        response["msg"] = "user picture upload successful.";
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}

app.post('/uploadPaperPDF', uploadPaperPDF);
function uploadPaperPDF(req, res, next) {       // requires ISSN, username
  if(!inputValidator.checkAddPublication(res, req.body.sessionString, req.body.name, req.body.ISSN))
    return;
    var data = req.body.type,
        finalPath = './public/papers/' + req.body.ISSN.toString() + '.pdf',
        file = req.files.file,
        tmp_path = file.path;
    fs.rename(tmp_path, finalPath, function (err) {
        if (err){
            response["status"] = "false";
            response["msg"] = "user paperPDF upload failed.";
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            fs.unlink(tmp_path, function () {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "user paperPDF upload failed.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var host = "http://silo.soic.indiana.edu:";
                    response["status"] = "true";
                    var pathVar = path.join(host, portNumber.toString(), finalPath);
                    pathVar = pathVar.replace("edu:/", "edu:");
                    pathVar = pathVar.replace("ttp:","ttp:/");
                    pathVar = pathVar.replace("/public","");
                    User.findOne({"sessionString": req.body.sessionString}, function (err, user) {
                        if (err||user==null) {
                            response["status"] = "false";
                            response["msg"] = "Invalid Session String";
                            res.send(response);
                            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
                        }
                        else {
                            var query = {"name": req.body.name};
                            Publications.findOne(query, function (err, publics) {
                                if (publics != null) {
                                    response["msg"] = "Publication already exists.";
                                    response["status"] = "false";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    var maxCount = 1;
                                    Publications.findOne().sort('-publicationID').exec(function (err, entry) {
                                        if (entry == null) {
                                            maxCount = 1;
                                        }
                                        else {
                                            maxCount = entry.publicationID + 1;
                                        }
                                        var publishDate = new Date(req.body.publishDate);
                                        var newPublication = new Publications({
                                            publicationID: maxCount,
                                            name: req.body.name,
                                            ISSN: req.body.ISSN,
                                            paperAbstract: req.body.paperAbstract,
                                            publishedAt: req.body.publishedAt,
                                            publishDate: publishDate,
                                            avgRating:0,
                                            filePath: pathVar
                                        });
                                        newPublication.save(function (err) {
                                            if (err) {
                                                response["status"] = "false";
                                                response["msg"] = "cannot save publication.";
                                                res.send(response);
                                                console.log("cannot save publication.");
                                            }
                                            else {
                                                var setUserPublicationDoc = new UserPublications({
                                                    userID: user.userID,
                                                    publicationID: maxCount
                                                });
                                                setUserPublicationDoc.save(function (err) {
                                                    if (err) {
                                                        response["status"] = "false";
                                                        response["msg"] = "unable to save";
                                                        res.send(response);
                                                        console.log(response["msg"]);
                                                    }
                                                    else {
                                                        response["msg"] = "publication added.";
                                                        response["status"] = "true";
                                                        res.send(response);
                                                        console.log(response["msg"]);
                                                    }
                                                });
                                                var otherUsernames = req.body.otherUsernames;
                                                if(otherUsernames != undefined && otherUsernames.length>0)
                                                {
                                                    for(var i = 0;i<otherUsernames.length;i++){
                                                        User.findOne({"userName": otherUsernames[i]}, function(err, otherUser){
                                                            if(err || otherUser==null || otherUser==undefined){
                                                            }
                                                            else {
                                                                var publicationMapping = new UserPublications({
                                                                    userID: otherUser.userID,
                                                                    publicationID: maxCount
                                                                });
                                                                publicationMapping.save();
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/getAllGroups', getAllGroups);
function getAllGroups(req, res, next) {
    GroupInfo.find().exec(function (err,groups) {
        if(err){
            response["status"] = "false";
            response["msg"] = "No Groups created yet.";
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            var groupInfo = [];
            for(var i = 0;i < groups.length;i++){
                groupInfo.push(groups[i]);
            }
            response["msg"] = {"groupInfo":groupInfo};
            response["status"] = "true";
            res.send(response);
        }
    });
}

app.post('/getPublicationByID', getPublicationByID);
/**
 * Get the publication details for a given publication ID
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function getPublicationByID(req, res, next) {       // publicationID
    if(!inputValidator.checkPublicationByID(res, req.body.publicationID))
      return;
    var query = {"publicationID":req.body.publicationID};
    Publications.findOne(query,function (err,publication) {
        if(err||publication==null){
            response["status"] = "false";
            response["msg"] = "Publication not found.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            UserPublications.find({"publicationID":publication.publicationID},function (err,userPubs) {
                if(err){
                    response["status"] = "false";
                    response["msg"] = "Something Wrong in userPublication.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    var userIDs=[];
                    for(var i = 0; i < userPubs.length; i++){
                        userIDs.push(userPubs[i].userID);
                    }
                    User.find({"userID":{$in:userIDs}},function (err,users) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = "Something Wrong in users.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["msg"] = {"publicationInfo":publication,"userInfo":users};
                            response["status"] = "true";
                            res.send(response);
                        }
                    });
                }
            });
        }
    });
}

app.post('/addSkill', addSkill);
/**
 * Function to add new skill to user
 * @param {[type]}   req  [description]
 * @param {[type]}   res  [description]
 * @param {Function} next [description]
 */
function addSkill(req, res, next) {       // SessionString, skillName
    if(!inputValidator.checkAddSkill(res, req.body.sessionString, req.body.skillName))
      return;
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (err || user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var query = {"skillName": req.body.skillName};
            Skills.findOne(query, function (err, skillentry) {
                if (skillentry == null) {
                    var maxCount = 1;
                    Skills.findOne().sort('-skillID').exec(function (err, entry) {
                        if (entry == null) {
                            maxCount = 1;
                        }
                        else {
                            maxCount = entry.skillID + 1;
                        }
                        var thisSkill = new Skills({
                            skillID: maxCount,
                            skillName: req.body.skillName
                        });
                        thisSkill.save();
                        var userThisSkill = new UserSkills({
                            skillID: maxCount,
                            userID: user.userID
                        });
                        userThisSkill.save();
                    });
                    response["status"] = "true";
                    response["msg"] = "skill added";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var query = {"userID": user.userID};
                    UserSkills.find(query).where("skillID").equals(skillentry.skillID).exec(function (err,another) {
                        if(another.length == 0){
                            var userThisSkill = new UserSkills({
                                skillID: skillentry.skillID,
                                userID: user.userID
                            });
                            userThisSkill.save();
                            response["status"] = "true";
                            response["msg"] = "skill added";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else{
                            response["status"] = "false";
                            response["msg"] = "user already has this skill";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getUserSkills', getUserSkills);
function getUserSkills(req, res, next) {       // userName
    if(!inputValidator.checkGetUserInfo(res, req.body.userName))
      return;
    var query = {"userName": req.body.userName};
    User.findOne(query, function (err, user) {
        if (err || user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid user.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            var userID = user.userID;
            UserSkills.find({"userID": userID}, {'_id':0}).select("skillID").exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "No skills";
                    res.send(response);
                }
                else {
                    var ids = [];
                    for(var i = 0; i<docs.length; i++){
                        ids.push(docs[i].skillID)
                    }
                    Skills.find({'skillID':{$in:ids}}, function(err, skillNames) {
                        if (err) {
                            response["status"] = "false";
                            response["msg"] = "Skill not found.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = skillNames;
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}


app.post('/searchUser', searchUser);
/**
 * Function to search for the requested query
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function searchUser(req, res, next) {       // searchString
    if(!inputValidator.checkSearchQuery(res, req.body.searchString))
      return;
    var searchString = req.body.searchString;
    if(searchString == undefined || searchString.trim() == "")
    {
        response["status"] = "false";
        response["msg"] = "Invalid input!";
//        res.send(response);
        return response;
    }
    searchString = searchString.toLowerCase();
//    var query = {userName:searchString};
    var result = [];
    User.find({},function (err,users) {
        if(err ){
            response["status"]="false";
            response["msg"] = "Error encountered while searching";
//            res.send(response);
            return response;
        }
        else {
            for(var i = 0;i<users.length;i++){
                if(searchString == users[i].userName.toLowerCase() || users[i].userName.toLowerCase().indexOf(searchString)!=-1)
                    result.push(users[i]);
                else if(searchString == users[i].firstName.toLowerCase() || users[i].firstName.toLowerCase().indexOf(searchString)!=-1)
                    result.push(users[i]);
                else if(searchString== users[i].lastName.toLowerCase() || users[i].lastName.toLowerCase().indexOf(searchString)!=-1)
                    result.push(users[i]);
            }
            if(result.length>0) {
                response["status"] = "true";
                response["msg"] = result;
//                res.send(response);
                return response;
            }
            else{
                response["status"] = "false";
                response["msg"] = "no data found in the users that matches the string.";
//                res.send(response);
                console.log(response["msg"]);
                return response;
            }
        }
    });
}

app.post('/searchGroup', searchGroup);
function searchGroup(req, res, next) {       // searchString
    var searchString = req.body.searchString;
    if (searchString == undefined || searchString.trim() == "")
    {
        response["status"] = "false";
        response["msg"] = "Invalid input for searching for group!";
//        res.send(response);
        console.log(response["msg"]);
        return response;
    }
    searchString = searchString.toLowerCase();
    var result = [];
    GroupInfo.find({}, function (err, groups) {
        if (err){
            response["status"] = "false";
            response["msg"] = "Error encountered while searching for group!";
//            res.send(response);
            console.log(response["msg"]);
            return response;
        }
        else {
            for (var i = 0; i < groups.length; i++) {
                if(searchString == groups[i].groupName.toLowerCase() || groups[i].groupName.toLowerCase().indexOf(searchString) != -1) {
                    result.push(groups[i]);
                }
                else if(groups[i].description.toLowerCase().indexOf(searchString)!=-1){
                    result.push(groups[i]);
                }
            }
            if (result.length > 0) {
                response["status"] = "true";
                response["msg"] = result;
//                res.send(response);
                return response;
            }
            else {
                response["status"] = "false";
                response["msg"] = "No data found in groups that matches the string.";
//                res.send(response);
                console.log(response["msg"]);
                return response;
            }
        }
    });
}

app.post('/searchSkill', searchSkill);
function searchSkill(req, res, next) {
    var skillName = req.body.searchString.toLowerCase();
    if (skillName == undefined || skillName.trim() == "") {
        response["status"] = "false";
        response["msg"] = "Invalid input for searching for skill!";
//        res.send(response);
        return response;
    }
    else {
        var query = {"skillName":skillName};
        Skills.findOne(query,function (err,skill) {
            if(err || skill==null){
                response["status"] = "false";
                response["msg"] = "This skill is not registered";
//                res.send(response);
                console.log(response["msg"]);
                return response;
            }
            else {
                UserSkills.find({"skillID":skill.skillID},function (err, users) {
                    if(err||users==null){
                        response["status"] = "false";
                        response["msg"] = "Nobody has this skill.";
//                        res.send(response);
                        console.log(response["msg"]);
                        return response;
                    }
                    else {
                        var ids = [];
                        for (var i = 0; i < users.length; i++) {
                            ids.push(users[i].userID)
                        }
                        User.find({"userID": {$in: ids}}, function (err, userInfos) {
                            response["status"] = "true";
                            response["msg"] = userInfos;
//                            res.send(response);
                            console.log(response["msg"]);
                            return response;
                        });
                    }
                });
            }
        });
    }
}

app.post('/searchInput', searchInput);
function searchInput(req, res, next){
  if(!inputValidator.checkSearchQuery(res, req.body.searchString))
    return;
    var searchString = req.body.searchString;
    var resultObj = {};
    if(searchString == undefined || searchString.trim() == "")
    {
        response["status"] = "false";
        response["msg"] = "Invalid input!";
        resultObj['userSearch'] =  response;
        res.send(resultObj);
        return;
    }
    searchString = searchString.toLowerCase().trim();
    var searchStr = searchString.split(' ');
    var result = [];
    User.find({},function (err,users) {
        if(err || users == undefined || users.length == 0){
            response["status"]="false";
            response["msg"] = "Error encountered while searching";
            resultObj['userSearch'] = response;
            searchUserGroup(res, searchStr, resultObj);
        }
        else {
            for(var j = 0;j<searchStr.length;j++){
                if(searchStr[j] == undefined || searchStr[j].trim()=="")
                    continue;
                for(var i = 0;i<users.length;i++){
                    if(searchStr[j] == users[i].userName.toLowerCase() || users[i].userName.toLowerCase().indexOf(searchStr[j])!=-1) {
                        result.push(users[i])
                    }
                    else if(searchStr[j] == users[i].firstName.toLowerCase() || users[i].firstName.toLowerCase().indexOf(searchStr[j])!=-1) {
                        result.push(users[i])
                    }
                    else if(searchStr[j]== users[i].lastName.toLowerCase() || users[i].lastName.toLowerCase().indexOf(searchStr[j])!=-1) {
                        result.push(users[i])
                    }
                    else if(searchStr[j]== users[i].lastName.toLowerCase() || users[i].lastName.toLowerCase().indexOf(searchStr[j])!=-1) {
                        result.push(users[i])
                    }
                }
            }
            if(result.length>0) {
                response["status"] = "true";
                response["msg"] = result;
                resultObj['userSearch'] = response;
                searchUserGroup(res, searchStr, resultObj);
            }
            else{
                response["status"] = "false";
                response["msg"] = "no data found in the users that matches the string.";
                resultObj['userSearch'] = response;
                searchUserGroup(res, searchStr, resultObj);
            }
        }
    });
}

function searchUserGroup(res, searchStr, resultObj){
    var result  = [];
    var tempResponse = {};
    GroupInfo.find({}, function (err, groups) {
        if (err){
            response["status"] = "false";
            response["msg"] = "Error encountered while searching for group!";
            resultObj['groupSearch'] = response;
            searchUserSkill(res, searchStr, resultObj);
        }
        else {
            for(var j=0;j<searchStr.length;j++){
                if(searchStr[j] == undefined || searchStr[j].trim()=="")
                    continue;
                for (var i = 0; i < groups.length; i++) {
                    if(searchStr[j] == groups[i].groupName.toLowerCase() || groups[i].groupName.toLowerCase().indexOf(searchStr[j]) != -1) {
                        result.push(groups[i]);
                    }
                    else if((groups[i].description!=undefined && groups[i].description!="") &&  searchStr[j] == groups[i].description.toLowerCase() || groups[i].description.toLowerCase().indexOf(searchStr[j])!=-1){
                        result.push(groups[i]);
                    }
                }
            }
            if (result.length > 0) {
                tempResponse["status"] = "true";
                tempResponse["msg"] = result;
                resultObj['groupSearch'] = tempResponse;
                searchUserSkill(res, searchStr, resultObj);
            }
            else {
                tempResponse["status"] = "false";
                tempResponse["msg"] = "No data found in groups that matches the string.";
                resultObj['groupSearch'] = tempResponse;
                searchUserSkill(res, searchStr, resultObj);
            }
        }
    });
}

function searchUserSkill(res, searchStr, resultObj){
    Skills.find({},function (err,skill) {
        var skillResponse = {};
        if(err || skill==null){
            skillResponse["status"] = "false";
            skillResponse["msg"] = "This skill is not registered";
            resultObj['skillSearch'] = skillResponse;
            searchUserInfo(res, searchStr, resultObj);
        }
        else {
            var skillID = [];
            for(var j=0;j<searchStr.length;j++){
                if(searchStr[j] == undefined || searchStr[j].trim()=="")
                    continue;
                for(var i=0;i<skill.length;i++){
                    var skillName = skill[i].skillName;
                    if(skillName.toLowerCase() == searchStr[j] || skillName.indexOf(searchStr[j])!=-1){
                        skillID.push(skill[i].skillID);
                    }
                }
            }
            UserSkills.find({"skillID":{$in: skillID}},function (err, users) {
                if(err||users==null||users.length==0){
                    skillResponse["status"] = "false";
                    skillResponse["msg"] = "Nobody has this skill.";
                    resultObj['skillSearch'] = skillResponse;
                    searchUserInfo(res, searchStr, resultObj);
                }
                else {
                    var ids = [];
                    for (var i = 0; i < users.length; i++) {
                        ids.push(users[i].userID)
                    }
                    User.find({"userID": {$in: ids}}).select(['userID', 'userName','firstName', 'lastName']).exec(function (err, userInfos) {
                        skillResponse["status"] = "true";
                        skillResponse["msg"] = userInfos;
                        resultObj['skillSearch'] = skillResponse;
                        searchUserInfo(res, searchStr, resultObj);
                    });
                }
            });
        }
    });
}
function searchUserInfo(res, searchStr, resultObj){
    UserInfo.find({},function (err,userInfo) {
        var userInfoResponse = {};
        if (err || userInfo == null) {
            userInfoResponse["status"] = "false";
            userInfoResponse["msg"] = "Nothing found in userInfo";
            resultObj['userInfoSearch'] = userInfoResponse;
            searchPublicationInfo(res, searchStr, resultObj)
        }
        else {
            var users = [];
            for(var j=0;j<searchStr.length;j++){
                if(searchStr[j] == undefined || searchStr[j].trim()=="")
                    continue;
                for(var i = 0; i < userInfo.length; i++) {
                    if (userInfo[i].university.toLowerCase() == searchStr[j] || userInfo[i].university.toLowerCase().indexOf(searchStr[j]) != -1) {
                        users.push(userInfo[i].userID);
                    }
                    else if (userInfo[i].location.address.toLowerCase() == searchStr[j] || userInfo[i].location.address.toLowerCase().indexOf(searchStr[j]) != -1) {
                        users.push(userInfo[i].userID);
                    }
                    else if (userInfo[i].location.city.toLowerCase() == searchStr[j] || userInfo[i].location.city.toLowerCase().indexOf(searchStr[j]) != -1) {
                        users.push(userInfo[i].userID);
                    }
                    else if (userInfo[i].location.state.toLowerCase() == searchStr[j] || userInfo[i].location.state.toLowerCase().indexOf(searchStr[j]) != -1) {
                        users.push(userInfo[i].userID);
                    }
                    else if (userInfo[i].location.country.toLowerCase() == searchStr[j] || userInfo[i].location.country.toLowerCase().indexOf(searchStr[j]) != -1) {
                        users.push(userInfo[i].userID);
                    }
                }
            }
            if(users.length==0){
                userInfoResponse["status"] = "false";
                userInfoResponse["msg"] = "Something wrong in userInfo";
                resultObj['userInfoSearch'] = userInfoResponse;
                searchPublicationInfo(res, searchStr, resultObj)
            }
            else{
                var result=[];
                User.find({"userID":{$in:users}},function (err,userDatas) {
                    if(err||userDatas==null||userDatas==undefined){
                        userInfoResponse["status"] = "false";
                        userInfoResponse["msg"] = "Something wrong in userInfo";
                        resultObj['userInfoSearch'] = userInfoResponse;
                        searchPublicationInfo(res, searchStr, resultObj)
                    }
                    else {
                        for(var i = 0; i < userDatas.length; i++) {
                            result.push(userDatas[i]);
                        }
                        userInfoResponse["status"] = "true";
                        userInfoResponse["msg"] = result;
                        resultObj['userInfoSearch'] = userInfoResponse;
                        searchPublicationInfo(res, searchStr, resultObj)
                    }
                });
            }
        }
    });
}
function searchPublicationInfo(res, searchStr, resultObj) {

    Publications.find({},function (err,publics) {
        var publicsInfoResponse = {};
        if (err || publics == null||publics==undefined) {
            publicsInfoResponse["status"] = "false";
            publicsInfoResponse["msg"] = "Nothing found in publications";
            resultObj['publicsInfoResponse'] = publicsInfoResponse;
            sendSearchResponse(res, resultObj)
        }
        else {
            var publicIDs = [];
            var publicationsInfo=[];
            for(var j=0;j<searchStr.length;j++){
                if(searchStr[j] == undefined || searchStr[j].trim()=="")
                    continue;
                for(var i = 0; i < publics.length; i++){
                    if(publics[i].name.toLowerCase() == searchStr[j] || publics[i].name.toLowerCase().indexOf(searchStr[j])!=-1){
                        publicIDs.push(publics[i].publicationID);
                        publicationsInfo.push(publics[i]);
                    }
                    else if(publics[i].paperAbstract.toLowerCase() == searchStr[j] || publics[i].paperAbstract.toLowerCase().indexOf(searchStr[j])!=-1){
                        publicIDs.push(publics[i].publicationID);
                        publicationsInfo.push(publics[i]);
                    }
                }
            }
            UserPublications.find({"publicationID":{$in:publicIDs}},function (err,users) {
                if(err||users.length==0){
                    publicsInfoResponse["status"] = "false";
                    publicsInfoResponse["msg"] = "Something wrong in publications.";
                    resultObj['publicsInfoResponse'] = publicsInfoResponse;
                    sendSearchResponse(res, resultObj)
                }
                else{
                    var userIDs = [];
                    var userPublicMap=[];
                    for(var i = 0; i < users.length; i++){
                        userIDs.push(users[i].userID);
                        userPublicMap.push(users[i]);
                    }
                    User.find({"userID":{$in:userIDs}}).select(['userID', 'userName', 'firstName', 'lastName']).exec(function (err,userInfo) {
                        if(err||userInfo.length==0){
                            publicsInfoResponse["status"] = "false";
                            publicsInfoResponse["msg"] = "Unable to find users for given userIDs";
                            resultObj['publicsInfoResponse'] = publicsInfoResponse;
                            sendSearchResponse(res, resultObj)
                        }
                        else {
                            var userData = [];
                            for(var i = 0; i < users.length; i++){
                                userData.push(userInfo[i]);
                            }
                            publicsInfoResponse["status"] = "true";
                            publicsInfoResponse["msg"] = {"publicationInfo":publicationsInfo,"userPublicMap":userPublicMap,"userData":userData};
                            resultObj['publicsInfoResponse'] = publicsInfoResponse;
                            sendSearchResponse(res, resultObj)
                        }
                    });
                }
            });
        }
    });
}
function sendSearchResponse(res, resultObj){
    res.send(resultObj)
}

app.post('/setRating', setRating);      //sessionString, publicationID, rating
function setRating(req,res,next) {
    var rating = parseInt(req.body.rating);
    if(rating>5||rating<1){
        response["status"] = "false";
        response["msg"] = "Invalid rating";
        res.send(response);
        console.log(response["msg"]);
    }
    else {
        var pubID = req.body.publicationID;
        var query = {"sessionString": req.body.sessionString};
        User.findOne(query, function (err, user) {
            if (user == null) {
                response["status"] = "false";
                response["msg"] = "Invalid Session String";
                res.send(response);
                console.log(response["msg"] + " sessionString: " + req.body.sessionString);
            }
            else if (err) {
                response["status"] = "false";
                response["msg"] = "Error in finding user";
                res.send(response);
                console.log(response["msg"]);
            }
            else {
                PublicationRatings.find({"userID": user.userID}, function (err, entry) {
                    var ids = [];
                    for (var i = 0; i < entry.length; i++) {
                        if (entry[i].publicationID == parseInt(pubID)) {
                            ids.push(entry[i]);
                            break;
                        }
                    }
                    if (ids[0] != null) {
                        //update existing
                        ids[0].set({ratings: rating});
                        ids[0].set({givenOn: Date.now()});
                        ids[0].save(function (err, updatedEntry) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = " Update failed while saving.";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                            else {
                                response["msg"] = "Rating updated.";
                                response["status"] = "true";
                                res.send(response);
                                console.log(response["msg"]);
                                setPublicationAvgRatings(req.body.publicationID);
                            }
                        });
                    }
                    else {
                        //add new entry
                        var thisRating = new PublicationRatings({
                            publicationID: req.body.publicationID,
                            userID: user.userID,
                            ratings: rating,
                            givenOn: Date.now()
                        });
                        thisRating.save(function (err, savedEntry) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = " Update failed while saving.";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                            else {
                                response["msg"] = "Rating saved.";
                                response["status"] = "true";
                                res.send(response);
                                console.log(response["msg"]);
                                setPublicationAvgRatings(req.body.publicationID);
                            }
                        });
                    }
                });
            }
        });
    }
}

app.post('/setPublicationAvgRatings', setPublicationAvgRatings);
function setPublicationAvgRatings(ID){    //publicationID
//function setPublicationAvgRatings(req,res,next){    //publicationID
//    var ID = req.body.publicationID;
    PublicationRatings.find({"publicationID":ID},function (err,entries) {
        if(err||entries.length==0||entries==null){
            response["status"] = "false";
            response["msg"] = " setPublicationAvgRatings no entries found";
            console.log(response["msg"]);
        }
        else {
            var avg = 0;
            for(var i = 0; i < entries.length; i++){
                avg = avg + entries[i].ratings;
            }
            avg = avg / entries.length;
            Publications.findOne({"publicationID":ID},function (err,paper) {
                if(err||paper==null||paper==undefined){
                    response["status"] = "false";
                    response["msg"] = "setPublicationAvgRatings unable to find paper in database";
                    console.log(response["msg"]);
                }
                else {
                    paper.set({"avgRating":avg});
                    paper.save(function (err,updatedentry) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = " setPublicationAvgRatings unable to update paper avg rating";
                            console.log(response["msg"]);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = " setPublicationAvgRatings updated paper avg rating in database";
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getPublicationRatings', getPublicationRatings);
function getPublicationRatings(req, res, next) {       // publicationID or publicationName
    var query = {"publicationID": req.body.publicationID};
    console.log("hit");
    PublicationRatings.find(query, function (err, publics) {
        if (err || publics == null) {
            response["status"] = "false";
            response["msg"] = "No publication found with this ID.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            var allRatings =[];
            var avgRating = 0;
            for(var i = 0; i < publics.length; i++){
                allRatings.push(publics[i]);
                avgRating = avgRating + publics[i].ratings;
            }
            avgRating = avgRating / publics.length;
            response["status"] = "true";
            response["msg"] = {"avgRating":avgRating,"ratings":allRatings};
            res.send(response);
        }
    });
}

app.post('/removeUserFromGroup', removeUserFromGroup);
function removeUserFromGroup(req, res, next) {          //sessionString,groupID
    var sessionString = req.body.sessionString;
    var query = {'sessionString': sessionString};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = user.userID;
            var query = {'userID': userID};
            UserGroup.find(query, function(err, userGroups) {
                if (userGroups == null||userGroups.length == 0) {
                    response["status"] = "false";
                    response["msg"] = "Can not find user ID in user group table!";
                    res.send(response);
                }
                else {
                    var groupID = req.body.groupID;
                    var deleted = false;
                    for (var i = 0; i < userGroups.length; i++) {
                        if (userGroups[i].groupID == groupID) {
                            userGroups[i].remove();
                            deleted = true;
                            break;
                        }
                    }
                    if (deleted) {
                        response["status"] = "true";
                        response["msg"] = "Group " + groupID + " of user " + userID + " removed successfully!";
                        console.log(response["msg"]);
                        res.send(response);
                    }
                    else {
                        response["status"] = "false";
                        response["msg"] = "Cannot find group " + groupID + " of user " + userID + " in user group table!";
                        console.log(response["msg"]);
                        res.send(response);
                    }
                }
            });
        }
    });
}

app.post('/removeUserPublication', removeUserPublication);
function removeUserPublication(req, res, next) {
    var sessionString = req.body.sessionString;
    var query = {'sessionString': sessionString};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = user.userID;
            var query = {'userID': userID};
            UserPublications.find(query, function(err, userPublications) {
                if (userPublications == null||userPublications.length==0) {
                    response["status"] = "false";
                    response["msg"] = "Can not find user ID in user publication table!";
                    res.send(response);
                }
                else {
                    var publicationID = req.body.publicationID;
                    var deleted = false;
                    for (var i = 0; i < userPublications.length; i++) {
                        if (userPublications[i].publicationID == publicationID) {
                            userPublications[i].remove();
                            deleted = true;
                            break;
                        }
                    }
                    if (deleted) {
                        var query = {'publicationID': publicationID};
                        Publications.findOne(query, function(err, publication){
                            if (publication == null) {
                                response["status"] = "false";
                                response["msg"] = "Cannot find the publication in publication info table!";
                                console.log(response["msg"]);
                                res.send(response);
                            }
                            else {
                                publication.remove();
                                var query = {'publicationID': publicationID};
                                PublicationRatings.find(query, function (err, ratings) {
                                    if (ratings == null||ratings.length==0){
                                        response["status"] = "false";
                                        response["msg"] = "Cannot find the ratings in publication ratings table!";
                                        console.log(response["msg"]);
                                        res.send(response);
                                    }
                                    else {
                                        for (var i = 0; i < ratings.length; i ++) {
                                            ratings[i].remove();
                                        }
                                        response["status"] = "true";
                                        response["msg"] = "Publication and all ratings of publication " + publicationID + " removed successfully!";
                                        console.log(response["msg"]);
                                        res.send(response);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        response["status"] = "false";
                        response["msg"] = "User is not authorized to delete the publication";
                        console.log(response["msg"]);
                        res.send(response);
                    }
                }
            });
        }
    });
}

app.post('/removeUserSkill', removeUserSkill);
function removeUserSkill(req, res, next) {
    var sessionString = req.body.sessionString;
    var query = {'sessionString': sessionString};
    User.findOne(query, function(err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = user.userID;
            var query = {'userID': userID};
            UserSkills.find(query, function(err, userSkills) {
                if (userSkills == null) {
                    response["status"] = "false";
                    response["msg"] = "Can not find user ID in user skill table!";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var skillName = req.body.skillName;
                    var query = {'skillName': skillName};
                    Skills.findOne(query, function(err, skill) {
                        if (skill == null) {
                            response["status"] = "false";
                            response["msg"] = "Cannot find skillName in skill table!";
                            console.log(response["msg"]);
                            res.send(response);
                        }
                        else {
                            var skillID = skill.skillID;
                            var deleted = false;
                            for (var i = 0; i < userSkills.length; i++) {
                                if (userSkills[i].skillID == skillID) {
                                    userSkills[i].remove();
                                    deleted = true;
                                    break;
                                }
                            }
                            if (deleted) {
                                response["status"] = "true";
                                response["msg"] = "Skill " + skillID + " of user " + userID + " removed successfully!";
                                console.log(response["msg"]);
                                res.send(response);
                            }
                            else {
                                response["status"] = "false";
                                response["msg"] = "Cannot find Skill " + skillID + " of user " + userID + " in user skill table!";
                                console.log(response["msg"]);
                                res.send(response);
                            }
                        }
                    });
                }
            });
        }
    });
}

app.post('/postQuestion', postQuestion);        // sessionString, postString, groupID, tagArray
function postQuestion(req, res, next) {
    var sessionString = req.body.sessionString;
    var tagArray = req.body.tagArray;
    var query = {'sessionString': sessionString};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var maxCount = 1;
            DiscussionPosts.findOne().sort('-postID').exec(function (err, entry) {
                if (entry == null) {
                    maxCount = 1;
                }
                else {
                    maxCount = entry.postID + 1;
                }
                var newPost = new DiscussionPosts({
                    postID: maxCount,
                    postString: req.body.postString,
                    userID: user.userID,
                    groupID: req.body.groupID,
                    postedOn: Date.now()
                });
                newPost.save(function (err, savedPost) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "Not Posted";
                        res.send(response);
                        console.log(response["msg"]);
                    }
                    else{
                        tagging(res,tagArray,savedPost.postID)
                    }
                });
            });
        }
    });
}

function tagging(res,tagArray,postID) {
    var tagIDs = [];
    PostTags.find({"tagName": {$in: tagArray}}, function (err, tags) {
        if (tags.length != 0) {
            for (var i = 0; i < tags.length; i++) {
                tagIDs.push(tags[i].tagID);
                tagArray.splice(i, 1);
            }
        }
        var maxCount = 1;
        PostTags.findOne().sort('-tagID').exec(function (err, entry) {
            if (entry == null) {
                maxCount = 1;
            }
            else {
                maxCount = entry.tagID + 1;
            }
            var insertArrayTags = [];
            for (var j = 0; j < tagArray.length; j++) {
                insertArrayTags.push({"tagID": maxCount + j, "tagName": tagArray[j]});
                tagIDs.push(maxCount + j);
            }

            PostTags.insertMany(insertArrayTags, function (err, saved) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "failed in adding new tags";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    console.log("Tags added in postTags:"+saved);
                    tagMapping(res,tagIDs,postID);
                }

            });
        });
    });
}

function tagMapping(res,tagIDs,postID) {
    var insertArrayPostTag = [];
    for(var k = 0; k < tagIDs.length;k++){
        insertArrayPostTag.push({"postID":postID,"tagID":tagIDs[k]});
    }
    PostTagsMapping.insertMany(insertArrayPostTag, function (err,saved) {
        if(err){
            response["status"] = "false";
            response["msg"] = "failed in adding new postTagMapping";
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            response["status"] = "true";
            response["msg"] = "Post and tags added successfully.";
            res.send(response);
            console.log(response["msg"]);
        }
    })
}

app.post('/postReply', postReply);            // postID, replyString, sessionString
function postReply(req, res, next) {
    var query = {"sessionString":req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var maxCount = 1;
            DiscussionReplies.findOne().sort('-replyID').exec(function (err, entry) {
                if (entry == null) {
                    maxCount = 1;
                }
                else {
                    maxCount = entry.replyID + 1;
                }
                var newReply = new DiscussionReplies({
                    postID: parseInt(req.body.postID),
                    replyString: req.body.replyString,
                    replyID: maxCount,
                    userID: user.userID,
                    postedOn: Date.now()
                });
                newReply.save(function (err) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "Unable to post the reply";
                        res.send(response);
                        console.log(response["msg"]);
                    }
                    else {
                        addInterestThroughReply(res,user.userID,parseInt(req.body.postID));
                    }
                });
            });
        }
    });
}

function addInterestThroughReply(res,userID,postID) {
    PostTagsMapping.find({"postID":postID},function (err,entries) {
        if (err) {
            response["status"] = "false";
            response["msg"] = "Reply posted but unable to find tags for the post.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            UserInterests.find({"userID":userID},function (err,userInterestEntries) {
                if(userInterestEntries.length==0){
                    var entryArray = [];
                    for(var i = 0; i < entries.length; i++){
                        entryArray.push({"tagID":entries[i].tagID,"userID": userID,"addedOn":Date.now()});
                    }
                    UserInterests.insertMany(entryArray, function (err, saved) {
                        if (err) {
                            response["status"] = "false";
                            response["msg"] = "Reply posted but failed in adding new userInterest entries.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else{
                            response["status"] = "true";
                            response["msg"] = "added new userInterest entries.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
                else {
                    var entryArray = [];
                    for(var j = 0; j < userInterestEntries.length; j++) {
                        for (var i = 0; i < entries.length; i++) {
                            if (userInterestEntries[j].tagID != entries[i].tagID) {
                                entryArray.push({"tagID": entries[i].tagID, "userID": userID, "addedOn": Date.now()});
                            }
                        }
                    }
                    UserInterests.insertMany(entryArray, function (err, saved) {
                        if (err) {
                            response["status"] = "false";
                            response["msg"] = "failed in adding new userInterest entries.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else{
                            response["status"] = "true";
                            response["msg"] = "added new userInterest entries.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getAllRepliesByPostID', getAllRepliesByPostID);            // postID
function getAllRepliesByPostID(req, res, next) {
    var query = {"postID":req.body.postID};
    DiscussionPosts.findOne(query,function (err, post) {
        if(err||post==null||post==undefined){
            response["status"] = "false";
            response["msg"] = "No post with postID :"+query.postID;
            res.send(response);
        }
        else{
            var userIDs = [];
            userIDs.push(post.userID);

            DiscussionReplies.find(query,function (err, replies) {
                if(replies.length==0||err){
                    User.findOne({"userID":post.userID},function (err,user) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = "User not found. something wrong with user table";
                            res.send(response);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = {"postInfo":post,"replyInfo":{"status":"false","msg":"no replies for this post"},"allUsers":user};
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
                else {
                    for(var i = 0; i < replies.length; i++){
                        userIDs.push(replies[i].userID);
                    }
                    User.find({"userID": {$in: userIDs}}).select(["userID","firstName","lastName","userName"]).exec(function (err,users) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = "Something is really wrong here once again.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = {"postInfo": post, "allRepliesInfo": replies,"allUsers":users};
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getAllPostsByGroupID', getAllPostsByGroupID);            // groupID
function getAllPostsByGroupID(req, res, next) {
    var groupID = req.body.groupID;
    DiscussionPosts.find({"groupID":groupID}).sort("-postedOn").exec(function (err,posts) {
        if(posts.length==0){
            response["status"] = "false";
            response["msg"] = "No posts for group: " + groupID;
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            var userIDs = [];
            for (var i = 0; i < posts.length; i++){
                userIDs.push(posts[i].userID);
            }
            User.find({"userID": {$in: userIDs}}).select(["userID","firstName","lastName","userName"]).exec(function (err,users) {
                if(err){
                    response["status"] = "false";
                    response["msg"] = "Something is really wrong.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    response["status"] = "true";
                    response["msg"] = {"postInfo": posts, "userInfo":users};
                    res.send(response);
                }
            });
        }
    });
}

function sendOTP(sessionString) {            // sessionString
    var OTP = getRandom(low, high);
    var query = {"sessionString": sessionString};
    User.findOneAndUpdate(query, {"OTP":OTP} ,function (err, user) {
        if (user == null||err) {
            response["status"] = "false";
            response["msg"] = "user not registered.";
            console.log(response["msg"]);
            res.send(response);
        }
        else {
            var carriers={"att":"txt.att.net","sprint":"messaging.sprintpcs.com","t-mobile":"tmomail.net","verizon":"vtext.com"};
            if(user.phone == undefined || user.phone == ""){
              console.log("Phone is undefined. Cannot proceed! ");
              return;
            }
            var phone = user.phone.replace(/-/g,'').replace(/\(/g,'').replace(/\)/g,'').replace(/\+/g,'');
            var mailOption = {
                from: 'se.researchmate@gmail.com',
                to: phone+"@"+carriers[user.carrier],
                subject: 'Hello there!',
                text: 'Your OTP : ' + OTP
            };
            sendMaill(mailOption);
        }
    });
}

app.post('/checkOTP',checkOTP);
function checkOTP(req,res,next) {       //sessionString,OTP
    var query = {"sessionString":req.body.sessionString};
    User.findOne(query,function (err,user) {
        if(user==null||err||user==undefined){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            if(user.OTP != req.body.OTP){
                response["status"] = "false";
                response["msg"] = "Invalid OTP";
                res.send(response);
                console.log(response["msg"]);
            }
            else{
                response["status"] = "true";
                response["msg"] = "Valid user";
                res.send(response);
                console.log(response["msg"]);
            }
        }
    })
}

app.post('/getPendingRequests',getPendingRequests);
function getPendingRequests(req,res,next) {       //sessionString for groupAdmin userID, groupID
    var query  = {"sessionString":req.body.sessionString};
    User.findOne(query,function (err,user) {
        if(err||user==null){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else{
            GroupInfo.findOne({"groupID":req.body.groupID},function (err,group) {
                if(err||group==null){
                    response["status"] = "false";
                    response["msg"] = "Invalid groupID";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    if(group.admin==user.userID){
//                      send all entries from groupjoinrequest
                        GroupJoinRequest.find({"groupID":group.groupID},function (err,entries) {
                            if(err||entries.length==0){
                                response["status"] = "false";
                                response["msg"] = "No pending requests";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                            else{
                                var requesterIDs = [];
                                for(var i = 0; i < entries.length; i++){
                                    requesterIDs.push(entries[i].requesterID)
                                }
                                User.find({'userID':{$in:requesterIDs}}).select(['userID','userName','firstName', 'lastName']).exec(function (err,requesterInfo) {
                                    if(err){
                                        response["status"] = "false";
                                        response["msg"] = "Something Wrong in groupJoinRequests";
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                    else{
                                        response["status"] = "true";
                                        response["msg"] = {"requesters":requesterInfo};
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                });
                            }
                        });
                    }
                    else{
                        response["status"] = "false";
                        response["msg"] = "This user is not the admin of this group.";
                        res.send(response);
                        console.log(response["msg"]);
                    }
                }
            });
        }
    });
}

app.post('/joinPrivateGroup',joinPrivateGroup);
function joinPrivateGroup(req,res,next) {       //sessionString for userID, groupID
    var query  = {"sessionString":req.body.sessionString};
    User.findOne(query,function (err,user) {
        if(err||user==null){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else{
            GroupJoinRequest.find({"groupID":req.body.groupID,"requesterID":user.userID},function (err,entry) {
                if(entry.length!=0){
                    response["status"] = "false";
                    response["msg"] = "Already requested.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    GroupInfo.findOne({"groupID":req.body.groupID},function (err,group) {
                        if(err||group==null||group==undefined){
                            response["status"] = "false";
                            response["msg"] = "Unable to find group.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else{
                            var newEntry = new GroupJoinRequest({
                                groupID:req.body.groupID,
                                adminID:group.admin,
                                requesterID:user.userID,
                                requestedOn:Date.now()
                            });
                            newEntry.save(function (err) {
                                if (err) {
                                    response["status"] = "false";
                                    response["msg"] = "Unable to request";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    response["status"] = "true";
                                    response["msg"] = "Requested successfully.";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/approveGroupRequests',approveGroupRequests);
function approveGroupRequests(req,res,next) {       //groupID,userID
    var query = {"groupID":req.body.groupID,"requesterID":req.body.userID};
    GroupJoinRequest.findOne(query,function (err,entry) {
        if(err||entry==null||entry==undefined){
            response["status"] = "false";
            response["msg"] = "Unable to find the request";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            entry.remove();
            var query={"groupID":req.body.groupID,"userID":req.body.userID}
            UserGroup.findOne(query,function (err,entry) {
                if(err||entry!=undefined||entry!=null){
                    response["status"] = "false";
                    response["msg"] = "Already approved.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var newEntry = new UserGroup({
                        groupID:req.body.groupID,
                        userID:req.body.userID,
                    });
                    newEntry.save(function (err) {
                        if (err) {
                            response["status"] = "false";
                            response["msg"] = "Unable to approve";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = "Approval successfully.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getUserPendingRequests',getUserPendingRequests);     //sessionString
function getUserPendingRequests(req,res,next) {
    User.findOne({"sessionString":req.body.sessionString},function (err,user) {
        if(err){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            GroupJoinRequest.find({"requesterID":user.userID}).sort({"requestedOn":-1},function (err,entries) {
                if(err||entries.length==0){
                    response["status"] = "false";
                    response["msg"] = "No pending Requests";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var groupIDs = [];
                    for(var i = 0; i < entries.length; i++){
                        groupIDs.push(entries[i].groupID);
                    }
                    GroupInfo.find({'groupID':{$in:groupIDs}},function (err,groupInfo) {
                        if(err||groupInfo.length==0){
                            response["status"] = "false";
                            response["msg"] = "Something wrong";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = groupInfo;
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getUserID',getUserID);       //sessionString
function getUserID(req,res,next) {
    User.findOne({"sessionString":req.body.sessionString},function (err,user) {
        if(err){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            response["status"] = "true";
            response["msg"] = user.userID;
            res.send(response);
            console.log(response["msg"]);
        }
    });
}

app.post('/mostLikedPaper',mostLikedPaper);
function mostLikedPaper(req,res,next) {
    Publications.find({}).sort("-avgRating").exec(function (err,papers) {
        if(err||papers.length==0){
            response["status"] = "false";
            response["msg"] = "Unable to find any paper in the database.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            var paperInfo=[];
            for(var i = 0; i < papers.length; i++){
                paperInfo.push(papers[i]);
            }
            response["status"] = "true";
            response["msg"] = paperInfo;
            res.send(response);
            console.log(response["msg"]);
        }
    });
}

app.post('/addUserInterest',addUserInterest);       // sessionString, interestName
function addUserInterest(req,res,next) {
    var interestName = req.body.interestName;
    var sessionString = req.body.sessionString;
    User.findOne({"sessionString":sessionString},function (err,user) {
        if(err){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            PostTags.findOne({"tagName":interestName},function (err,tag) {
                if(tag==null||tag==undefined) {
                    var maxCount = 1;
                    PostTags.findOne().sort('-tagID').exec(function(err, entry) {
                        // entry.userID is the max value
                        if(entry == null||entry==undefined||err) {
                            maxCount = 1;
                        }
                        else {
                            maxCount = entry.tagID + 1;
                        }
                        var newTag = new PostTags({"tagID": maxCount, "tagName": interestName});
                        newTag.save(function (err) {
                            if(err){
                                response["status"] = "false";
                                response["msg"] = "Unable to add interest in post";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                            else {
                                addingUserInterest(res,maxCount,user.userID);
                            }
                        });
                    });
                }
                else {
                    var maxCount = tag.tagID;
                    addingUserInterest(res,maxCount,user.userID);
                }
            });
        }
    });
}

function addingUserInterest(res,tagID,userID) {
    UserInterests.findOne({"tagID":tagID,"userID":userID},function (err,entry) {
        if(entry==null||entry==undefined){
            var newEntry = new UserInterests({
                tagID:tagID,
                userID:userID,
                addedOn:Date.now()
            });
            newEntry.save(function (err) {
                if(err){
                    response["status"] = "false";
                    response["msg"] = "Unable to add interest in userInterest";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    response["status"] = "true";
                    response["msg"] = "Interest added successfully.";
                    res.send(response);
                    console.log(response["msg"]);
                }
            });
        }
    });
}

app.post('/removeUserInterest',removeUserInterest);     //sessionString, interestName
function removeUserInterest(req,res,next) {
    User.findOne({"sessionString":req.body.sessionString},function (err,user) {
        if(err){
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            PostTags.findOne({"tagName":req.body.interestName},function (err,entry) {
                if(err||entry==null||entry==undefined){
                    response["status"] = "false";
                    response["msg"] = "Tag is not present in the tables.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var tagID = entry.tagID;
                    UserInterests.findOne({"userID":user.userID,"tagID":tagID},function (err,userInter) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = "Unable to find UserInterest entry.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else if(userInter==null||userInter==undefined){
                            response["status"] = "true";
                            response["msg"] = "Unable to delete UserInterest entry because it was not there to begin with.";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            userInter.remove(function (err) {
                                if(err){
                                    response["status"] = "false";
                                    response["msg"] = "Unable to delete UserInterest entry.";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    response["status"] = "true";
                                    response["msg"] = "Deleted UserInterest entry successfully.";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/getUserBulletinBoard',getUserBulletinBoard);         //sessionString
function getUserBulletinBoard(req,res,next) {
    var sessionString = req.body.sessionString;
    User.findOne({"sessionString":sessionString},function (err,user) {
        if (err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            UserInterests.find({"userID":user.userID},function (err,tags) {
                if(err||tags.length==0){
                    response["status"] = "false";
                    response["msg"] = "User is not interested in anything. Really? Why?";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var tagIDs = [];
                    for(var i = 0; i < tags.length; i++){
                        tagIDs.push(tags[i].tagID);
                    }
                    PostTagsMapping.find({"tagID":{$in:tagIDs}},function (err,postTags) {
                        console.log("Post: "+ tagIDs + " posts: "+ postTags);
                        if(err||postTags.length==0){
                            if(tagIDs.length>0){
                                PostTags.find({"tagID":{$in:tagIDs}},function (err,tagNames){
                                    if (err || tagNames.length == 0) {
                                        response["status"] = "false";
                                        response["msg"] = "Error encountered while getting tag names";
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                    else {
                                        var tagArray = [];
                                        for(var i = 0; i < tagNames.length; i++){
                                            tagArray.push(tagNames[i].tagName);
                                        }
                                        response["status"] = "true";
                                        response["msg"] = {"posts":[],"tagNames":tagArray};
                                        res.send(response);
                                        console.log(response["msg"]);
                                    }
                                });
                            }
                            else{
                                response["status"] = "false";
                                response["msg"] = "User is not interested in anything. Lame!";
                                res.send(response);
                                console.log(response["msg"]);
                            }
                        }
                        else {
                            var postIDs = [];
                            for(var i = 0; i < postTags.length; i++){
                                postIDs.push(postTags[i].postID);
                            }
                            DiscussionPosts.find({"postID":{$in:postIDs}},function (err,posts) {
                                if(err||posts.length==0){
                                    response["status"] = "false";
                                    response["msg"] = "User is not interested in anything. Lame!";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    var postArray = [];
                                    for(var i = 0; i < posts.length; i++){
                                        postArray.push(posts[i]);
                                    }
                                    PostTags.find({"tagID":{$in:tagIDs}},function (err,tagNames) {
                                        if (err || tagNames.length == 0) {
                                            response["status"] = "false";
                                            response["msg"] = "User is not interested in anything. Ultra Lame!";
                                            res.send(response);
                                            console.log(response["msg"]);
                                        }
                                        else {
                                            var tagArray = [];
                                            for(var i = 0; i < tagNames.length; i++){
                                                tagArray.push(tagNames[i].tagName);
                                            }
                                            response["status"] = "true";
                                            response["msg"] = {"posts":postArray,"tagNames":tagArray};
                                            res.send(response);
                                            console.log(response["msg"]);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/getUserInterest',getUserInterest);         //sessionString
function getUserInterest(req,res,next) {
    var sessionString = req.body.sessionString;
    User.findOne({"sessionString":sessionString},function (err,user) {
        if (err||user==null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            UserInterests.find({"userID": user.userID}, function (err, tags) {
                if (err || tags.length == 0) {
                    response["status"] = "false";
                    response["msg"] = "User is not interested in anything. Really? Why?";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else {
                    var tagIDs = [];
                    for (var i = 0; i < tags.length; i++) {
                        tagIDs.push(tags[i].tagID);
                    }

                    PostTags.find({"tagID": {$in: tagIDs}}, function (err, tagNames) {
                        if (err || tagNames.length == 0) {
                            response["status"] = "false";
                            response["msg"] = "User is not interested in anything. Whoa!";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else {
                            response["status"] = "true";
                            response["msg"] = tagNames;
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/logout',logout);         //sessionString
function logout(req,res,next) {
    var sessionString = req.body.sessionString;
    User.findOne({"sessionString": sessionString}, function (err, user) {
        if (err||user==null||user==undefined) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            user.set({sessionString:""});
            user.set({active:false});
            user.save(function(err, updatedUser) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "Error while logging out";
                    res.send(response);
                    console.log(response);
                } else {
                    response["msg"] = "Logout successful.";
                    response["status"] = "true";
                    res.send(response);
                    console.log(response);
                }
            });
        }
    });
}

app.post('/getPostTags',getPostTags);         //postID
function getPostTags(req,res,next) {
    PostTagsMapping.find({"postID":req.body.postID},function (err,tags) {
        if(err||tags.length==0){
            response["msg"] = "No tags for this post.";
            response["status"] = "false";
            res.send(response);
            console.log(response);
        }
        else {
            var tagIDs=[];
            for(var i = 0; i < tags.length; i++){
                tagIDs.push(tags[i].tagID)
            }
            PostTags.find({"tagID":{$in:tagIDs}},function (err,tagNames) {
                if(err||tagNames.length==0){
                    response["msg"] = "No tag names for these tags.";
                    response["status"] = "false";
                    res.send(response);
                    console.log(response);
                }
                else {
                    response["msg"] = tagNames;
                    response["status"] = "true";
                    res.send(response);
                    console.log(response);
                }
            });
        }
    });
}

app.post('/setPostTag',setPostTag);         //postID, tagName
function setPostTag(req,res,next) {
    var postID = req.body.postID,
        tagName = req.body.tagName;
    PostTags.findOne({"tagName":tagName},function (err,tag) {
        if(err||tag==undefined||tag==null){
//      adding a new tag
            addingTag(res,postID,tagName);
        }
        else {
            PostTagsMapping.findOne({"postID":postID,"tagID":tag.tagID},function (err,entry) {
                if(err||entry==null||entry==undefined){
                    var newEntry = new PostTagsMapping({tagID:tag.tagID, postID: postID});
                    newEntry.save(function (err) {
                        if(err){
                            response["msg"] = "Unable to save tag";
                            response["status"] = "false";
                            res.send(response);
                            console.log(response);
                        }
                        else {
                            response["msg"] = "tag saved.";
                            response["status"] = "true";
                            res.send(response);
                            console.log(response);
                        }
                    });
                }
                else{
                    response["msg"] = "tag already exists.";
                    response["status"] = "false";
                    res.send(response);
                    console.log(response);
                }
            });
        }
    });
}
function addingTag(res,postID,tagName) {
    var maxCount = 1;
    PostTags.findOne().sort('-tagID').exec(function (err, entry) {
        if (entry == null) {
            maxCount = 1;
        }
        else {
            maxCount = entry.tagID + 1;
        }
        var newTag = new PostTags({tagID: maxCount, tagName: tagName});
        newTag.save(function (err) {
            if (err) {
                response["msg"] = "Unable to save tag";
                response["status"] = "false";
                res.send(response);
                console.log(response);
            }
            else {
                var newEntry = new PostTagsMapping({tagID: maxCount, postID: postID});
                newEntry.save(function (err) {
                    if (err) {
                        response["msg"] = "Unable to save tag";
                        response["status"] = "false";
                        res.send(response);
                        console.log(response);
                    }
                    else {
                        response["msg"] = "tag saved and added to posttagmapping.";
                        response["status"] = "true";
                        res.send(response);
                        console.log(response);
                    }
                });
            }
        });
    });
}

app.post('/removePostTag',removePostTag);    //postID, tagName
function removePostTag(req,res,next) {
    var postID = req.body.postID;
    PostTags.findOne({"tagName":req.body.tagName},function (err,tag) {
        if (err||tag==null||tag==undefined) {
            response["msg"] = "Unable to find the tag in db.";
            response["status"] = "false";
            res.send(response);
            console.log(response);
        }
        else {
            PostTagsMapping.findOne({"tagID":tag.tagID,"postID":postID},function (err,entry) {
                if (err||entry==null||entry==undefined) {
                    response["msg"] = "Unable to remove tag because it is not linked to post to begin with.";
                    response["status"] = "false";
                    res.send(response);
                    console.log(response);
                }
                else {
                    entry.remove(function (err) {
                        if (err) {
                            response["msg"] = "Unable to remove tag";
                            response["status"] = "false";
                            res.send(response);
                            console.log(response);
                        }
                        else {
                            response["msg"] = "removal successful.";
                            response["status"] = "true";
                            res.send(response);
                            console.log(response);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getMyCircle',getMyCircle);           //sessionString
function getMyCircle(req,res,next) {
    var sessionString = req.body.sessionString;
    var query = {"sessionString": sessionString};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = user.userID;
            UserFollowee.find({"userID": userID}, {'_id': 0}).select("followeeID").exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "None in the circle.";
                    res.send(response);
                }
                else {
                    var ids = [];
                    for (var i = 0; i < docs.length; i++) {
                        ids.push(docs[i].followeeID)
                    }
                    User.find({'userID': {$in: ids}}, function (err, followers) {
                        UserInfo.find({'userID': {$in: ids}}, function (infoErr, userInfo) {
                            var follower = [];
                            for (var i = 0; i < followers.length; i++) {
                                var tempObj = {};
                                if(followers[i].active) {
                                    tempObj["firstname"] = followers[i].firstName;
                                    tempObj["lastname"] = followers[i].lastName;
                                    tempObj["username"] = followers[i].userName;
                                    for (var j = 0; j < userInfo.length; j++) {
                                        if (userInfo[j].userID == followers[i].userID) {
                                            tempObj["imgLocation"] = userInfo[j].picture;
                                            break;
                                        }
                                    }
                                    follower.push(tempObj);
                                }
                            }
                            if(follower.length>0) {
                                response["status"] = "true";
                                response["msg"] = {"followerActiveInfo":follower};
                                res.send(response);
                            }
                            else{
                                response["status"] = "false";
                                response["msg"] = "None active at the moment.";
                                res.send(response);
                            }
                        });
                    });
                }
            });
        }
    });
}

app.post('/sendMessage',sendMessage);           //sessionString(sender), username(receiver),msg
function sendMessage(req,res,next){
    var senderSessionString = req.body.sessionString;
    var receiverUsername = req.body.username;
    var message = req.body.msg;
    var query = {"sessionString": senderSessionString};
    User.findOne(query, function (err, sender) {
        if (sender == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var query = {"userName": receiverUsername};
            User.findOne(query, function (err, receiver) {
                if (receiver == null) {
                    response["status"] = "false";
                    response["msg"] = "User you want to chat with cannot be found.";
                    res.send(response);
                    console.log("Error: Receiver not found!")
                }
                else {
                    var msg = new Messages({
                        senderID:sender.userID,
                        receiverID:receiver.userID,
                        msg:message,
                        sentOn:Date.now()
                    });
                    msg.save(function (err) {
                        if (err) {
                            response["msg"] = "Unable to save msg.";
                            response["status"] = "false";
                            res.send(response);
                            console.log(response);
                        }
                        else {
                            response["msg"] = "msg saved.";
                            response["status"] = "true";
                            res.send(response);
                            console.log(response);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getAllMessages',getAllMessages);           //sessionString(receiver)
function getAllMessages(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, receiver) {
        if (receiver == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var userID = receiver.userID;
            UserFollowee.find({"userID": userID}).exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "None in the circle.";
                    res.send(response);
                }
                else {
                    var ids = [];
                    for (var i = 0; i < docs.length; i++) {
                        ids.push(docs[i].followeeID)
                    }
                    User.find({'userID': {$in: ids}}, function (err, followers) {
                        if(err||followers.length==0){
                            response["status"] = "false";
                            response["msg"] = "Something Wrong.";
                            res.send(response);
                        }
                        else {
                            UserInfo.find({'userID': {$in: ids}}, function (err, userInfo) {
                                if(err||userInfo.length==0){
                                    response["status"] = "false";
                                    response["msg"] = "Something Wrong.";
                                    res.send(response);
                                }
                                else {
                                    var follower = [];
                                    for (var i = 0; i < followers.length; i++) {
                                        var tempObj = {};
                                        tempObj["id"] = followers[i].userID;
                                        tempObj["firstname"] = followers[i].firstName;
                                        tempObj["lastname"] = followers[i].lastName;
                                        tempObj["username"] = followers[i].userName;
                                        var query = {"receiverID":receiver.userID,"senderID":followers[i].userID};
                                        for (var j = 0; j < userInfo.length; j++) {
                                            if (userInfo[j].userID == followers[i].userID) {
                                                tempObj["imgLocation"] = userInfo[j].picture;
                                                break;
                                            }
                                        }
                                        follower.push(tempObj);
                                    }
                                    sendMessageResponse(res,follower,userID);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function sendMessageResponse(res,follower,userID) {
    var ids = [];
    for (var i = 0; i < follower.length; i++) {
        ids.push(follower[i].id);
    }
    var query = {"receiverID": userID};
    Messages.find(query, function (err, entries) {
        if (err || entries.length == 0) {
            response["status"] = "false";
            response["msg"] = "lonely creature";
            res.send(response);
        }
        else {
            for (var i = 0; i < follower.length; i++) {
                var msgCount = 0;
                for (var j = 0; j < entries.length; j++) {
                    if (entries[j].senderID == follower[i].id) {
                        msgCount += 1;
                    }
                }
                follower[i].msgCount = msgCount;
            }
            response["status"] = "true";
            response["msg"] = follower;
            res.send(response);
            console.log(response);
        }
    });
}

// chat
var connectedUsers = [];
io.on('connection', function (socket) {
    // when the user disconnects.. perform this
    socket.on('cut', function (data) {
        delete connectedUsers[data.sender];
    });

    socket.on('universal', function (data) {
        var txt = {};
        txt["sender"] = data.sender;
        txt["receiver"] = data.receiver;
        txt["message"] = data.message;
        console.log(txt);

        connectedUsers[data.sender] = socket.id;

        console.log(connectedUsers);

        var receiverID = connectedUsers[data.receiver];

        User.findOne({"userName":txt["sender"]},function (err,sender) {
            if (err||sender ==null) {
                return new Error("Database Error for sender");
            }
            else {
                User.findOne({"userName": txt["receiver"]}, function (err, receiver) {
                    if (err||receiver==null) {
                        return new Error("Database Error at receiver");
                    }
                    else {
                        var msg = new Messages({
                            senderID: sender.userID,
                            receiverID: receiver.userID,
                            msg: txt["message"],
                            sentOn: Date.now()
                        });
                        msg.save(function (err) {
                            if (err) {
                                return new Error("Database Error while saving");
                            }
                            else {
                                console.log("msg sent.");
                                socket.to(receiverID).emit('universal', txt);
                            }
                        });
                    }
                });
            }
        });
    });
});

app.post('/sendRequest',sendRequest);               //sessionString(requester), username(to be requested)
function sendRequest(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            query = {"userName": req.body.username};
            User.findOne(query, function (err, followme) {
                if (err || followme == null) {
                    response["status"] = "false";
                    response["msg"] = "Unable to find user you want to send request to.";
                    res.send(response);
                    console.log("Error: User you want to befriend not found!")
                }
                else {
                    FriendRequest.findOne({"requesterID":user.userID,"userID":followme.userID},function (err,entry) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = "DB error";
                            res.send(response);
                            console.log(response)
                        }
                        else if(entry==null||entry==undefined){
                            var entry = new FriendRequest({
                                requesterID:user.userID,
                                userID:followme.userID,
                                requestedOn:Date.now()
                            });
                            entry.save(function (err) {
                                if (err) {
                                    response["status"] = "false";
                                    response["msg"] = "unable to send request to this user";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    response["msg"] = "request send successfully.";
                                    response["status"] = "true";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                            });
                        }
                        else {
                            response["msg"] = "request already sent.";
                            response["status"] = "true";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                    });
                }
            });
        }
    });
}

app.post('/getAllConnectionRequests',getAllConnectionRequests);           //sessionString
function getAllConnectionRequests(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            FriendRequest.find({"userID":user.userID},function (err,requesters) {
                if(err||requesters.length==0){
                    response["status"] = "false";
                    response["msg"] = "No requests.";
                    res.send(response);
                    console.log(response)
                }
                else {
                    var requestIDs = [];
                    for(var i = 0; i < requesters.length; i++){
                        requestIDs.push(requesters[i].requesterID);
                    }
                    User.find({"userID":{$in:requestIDs}},function (err,users) {
                        if(err||users.length==0){
                            response["status"] = "false";
                            response["msg"] = "Something Wrong in the database";
                            res.send(response);
                            console.log(response)
                        }
                        else {
                            UserInfo.find({"userID":{$in:requestIDs}},function (err,userInfos) {
                                if(err||users.length==0){
                                    response["status"] = "false";
                                    response["msg"] = "Something Wrong in the database";
                                    res.send(response);
                                    console.log(response)
                                }
                                else {
                                    response["status"] = "true";
                                    response["msg"] = {"users":users,"userInfo":userInfos};
                                    res.send(response);
                                    console.log(response)
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/allowConnectionRequest',allowConnectionRequest);           //sessionString(me), username (requester)
function allowConnectionRequest(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            User.findOne({"userName":req.body.username}, function (err, requester) {
                if (requester == null || err) {
                    response["status"] = "false";
                    response["msg"] = "He/She/It is just your imagination.";
                    res.send(response);
                    console.log(response)
                }
                else {
                    FriendRequest.findOne({"requesterID":requester.userID,"userID":user.userID},function (err,entry) {
                        if(err||entry==null||entry==undefined){
                            response["status"] = "false";
                            response["msg"] = "He/She/It is not in the table anymore.";
                            res.send(response);
                            console.log(response)
                        }
                        else {
                            entry.remove();
                            var userFollowDoc = new UserFollowee({
                                userID: user.userID,
                                followeeID: requester.userID,
                                followingFrom: Date.now()
                            });
                            userFollowDoc.save(function (err) {
                                if (err) {
                                    response["status"] = "false";
                                    response["msg"] = "DB problem";
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                                else {
                                    var userFollowDoc2 = new UserFollowee({
                                        userID: requester.userID,
                                        followeeID: user.userID,
                                        followingFrom: Date.now()
                                    });
                                    userFollowDoc2.save(function (err) {
                                        if (err) {
                                            response["status"] = "false";
                                            response["msg"] = "DB problem";
                                            res.send(response);
                                            console.log(response["msg"]);
                                        }
                                        else {
                                            response["msg"] = "Connection made.";
                                            response["status"] = "true";
                                            res.send(response);
                                            console.log(response["msg"]);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/rejectConnectionRequest',rejectConnectionRequest);           //sessionString(me), username (requester)
function rejectConnectionRequest(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            User.findOne({"userName": req.body.username}, function (err, requester) {
                if (requester == null || err) {
                    response["status"] = "false";
                    response["msg"] = "He/She/It is just your imagination.";
                    res.send(response);
                    console.log(response)
                }
                else {
                    FriendRequest.findOne({"requesterID": requester.userID, "userID": user.userID},function(err,entry){
                        if (err || entry == null || entry == undefined) {
                            response["status"] = "false";
                            response["msg"] = "He/She/It is not in the table anymore.";
                            res.send(response);
                            console.log(response)
                        }
                        else {
                            entry.remove();
                            response["status"] = "true";
                            response["msg"] = "request deleted.";
                            res.send(response);
                            console.log(response)
                        }
                    });
                }
            });
        }
    });
}

app.post('/unfriend',unfriend);           //sessionString(me), username (to unfriend)
function unfriend(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            User.findOne({"userName": req.body.username}, function (err, requester) {
                if (requester == null || err) {
                    response["status"] = "false";
                    response["msg"] = "He/She/It is just your imagination.";
                    res.send(response);
                    console.log(response)
                }
                else {
                    UserFollowee.findOne({
                        "userID": user.userID,
                        "followeeID": requester.userID
                    }, function (err, entry1) {
                        if (err || entry == null || entry == undefined) {
                            response["status"] = "false";
                            response["msg"] = "He/She/It is just your imagination.";
                            res.send(response);
                            console.log(response)
                        }
                        else {
                            UserFollowee.findOne({
                                "userID": requester.userID,
                                "followeeID": user.userID
                            }, function (err, entry2) {
                                if (err || entry == null || entry == undefined) {
                                    response["status"] = "false";
                                    response["msg"] = "He/She/It is just your imagination.";
                                    res.send(response);
                                    console.log(response)
                                }
                                else {
                                    entry1.remove();
                                    entry2.remove();
                                    response["status"] = "true";
                                    response["msg"] = "Friend Removed. I hope you are happy with yourself.";
                                    res.send(response);
                                    console.log(response)
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/getMessagesFromAUser',getMessagesFromAUser);           //sessionString(receiver), username(sender)
function getMessagesFromAUser(req,res,next) {
    var receiverSessionString = req.body.sessionString;
    var senderUsername = req.body.username;
    var query = {"sessionString": receiverSessionString};
    User.findOne(query, function (err, receiver) {
        if (receiver == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log(response["msg"] + " sessionString: " + req.body.sessionString);
        }
        else {
            var query = {"userName": senderUsername};
            User.findOne(query, function (err, sender) {
                if (sender == null) {
                    response["status"] = "false";
                    response["msg"] = "User you want to get msgs from cannot be found.";
                    res.send(response);
                    console.log("Error: Sender not found!")
                }
                else {
                    var query = {"senderID": sender.userID, "receiverID": receiver.userID};
                    Messages.find(query).sort('sentOn').exec(function (err, msgs1) {
                        if (err || msgs1.length == 0) {
                            response["status"] = "false";
                            response["msg"] = "No messages. LAME.";
                            res.send(response);
                            console.log(response)
                        }
                        else {
                            var query = {"senderID": receiver.userID, "receiverID": sender.userID};
                            Messages.find(query).sort('sentOn').exec(function (err, msgs2) {
                                if (err || msgs2.length == 0) {
                                    response["status"] = "false";
                                    response["msg"] = "No messages. LAME.";
                                    res.send(response);
                                    console.log(response)
                                }
                                else {

                                    var convo = [];
                                    var chatters = [];
                                    chatters.push({"userID":receiver.userID,"username":receiver.userName,"firstName":receiver.firstName,"lastName":receiver.lastName});
                                    chatters.push({"userID":sender.userID,"username":sender.userName,"firstName":sender.firstName,"lastName":sender.lastName});

                                    for (var i = 0; i < msgs1.length; i++) {
                                        convo.push(msgs1[i]);
                                    }

                                    for (var i = 0; i < msgs2.length; i++) {
                                        convo.push(msgs2[i]);
                                    }

                                    response["status"] = "true";
                                    response["msg"] = {"users": chatters, "conversation": convo};
                                    res.send(response);
                                    console.log(response["msg"]);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

app.post('/getAllUsers',getAllUsers);
function getAllUsers(req,res,next) {
    User.find({},function (err,users) {
        if(err){
            response["status"] = "false";
            response["msg"] = "Error in database.";
            res.send(response);
            console.log(response["msg"]);
        }
        else{
            UserInfo.find({},function (err,userInfos) {
                if(err){
                    response["status"] = "false";
                    response["msg"] = "Error in database.";
                    res.send(response);
                    console.log(response["msg"]);
                }
                else{
                    response["status"] = "true";
                    response["msg"] = {"users": users, "userInfos": userInfos};
                    res.send(response);
                    console.log(response["msg"]);
                }
            });
        }
    });
}

app.post('/activateUser',activateUser);           //username
function activateUser(req,res,next) {
    var username = req.body.username;
    User.findOne({"userName":username},function (err,user) {
        if(err||user==null||user==undefined){
            response["status"] = "false";
            response["msg"] = "Invalid Username.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            user.set({verificationNumber: 1});
            user.save(function(err, updatedUser) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "Failed to activate User. Please try again";
                    res.send(response);
                } else {
                    response["msg"] = "Activated user successfully.";
                    response["status"] = "true";
                    res.send(response);
                }
            });
        }
    });
}

app.post('/deactivateUser',deactivateUser);           //username
function deactivateUser(req,res,next) {
    var username = req.body.username;
    User.findOne({"userName":username},function (err,user) {
        if(err||user==null||user==undefined){
            response["status"] = "false";
            response["msg"] = "Invalid Username.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            user.set({verificationNumber: -1});
            user.save(function(err, updatedUser) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "Failed to deactivate User. Please try again";
                    res.send(response);
                }
                else {
                    response["msg"] = "Deactivated user successfully.";
                    response["status"] = "true";
                    res.send(response);
                }
            });
        }
    });
}
