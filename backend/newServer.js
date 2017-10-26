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
    multipart = require('connect-multiparty'),
    path = require('path');



var portNumber = 54545;
app.listen(portNumber);
console.log("Server running at silo.soic.indiana.edu:"+portNumber);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public/'));
app.use(express.static('public/images/profilePics/'));
app.use(express.static('public/papers/'));

mongoose.Promise = global.Promise;

// Connect to MongoDB on localhost:27017
var connection = mongoose.connect('mongodb://localhost:27018/researchMate', { useMongoClient: true });

//  importing pre-defined model
var User = require('./app/userModel');
var UserInfo = require('./app/userInfoModel');
var GroupInfo = require('./app/groupInfoModel');
var UserGroup = require('./app/userGroupInfoModel');
var Publications = require('./app/publicationsInfoModel');
var UserPublications = require('./app/userPublicationInfoModel');
var UserFollowee = require('./app/userFolloweeModel');
var UserSkills = require('./app/userSkillModel');
var Skills = require('./app/skillModel');

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
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response +'\nto :' + mailOptions.to);
        }
    });
}

var low = 10000000;
var high = 99999999;

function getRandom(low,high) {
    return Math.floor(Math.random() * (high - low) + low);
}


app.post('/signUp',signUp);
function signUp(req,res,next) {
//  creating a document
    var email = req.body.email;
    var username = req.body.username;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var pw = req.body.password;

    var maxCount = 1;
    User.findOne().sort('-userID').exec(function(err, entry) {
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
            sessionString: randomstring.generate(16),
            verificationNumber : getRandom(low,high)
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
                    response["status"] = "false";
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

app.post('/verifyUser',verifyUser);
function verifyUser(req,res,next) {
    var username = req.body.username;
    var verifNumber = req.body.verificationNumber;
    var query = {"userName": username};

    User.findOne(query, function(err, seeUser) {
        if (seeUser == null) {
            response["status"] = "false";
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
                        UserInfo.findOne().sort('-userID').exec(function (err, entry) {
                            // entry.userID is the max value
                            if (entry == null) {
                                maxCount = 1;
                            }
                            else {
                                maxCount = entry.userID + 1;
                            }

                            var pic = "http://silo.soic.indiana.edu:"+portNumber.toString()+"/public/userIcon.jpg";
                            var userInfo = new UserInfo({userID: maxCount,picture:pic});


                            userInfo.save(function (err) {
                                if (err) {
                                    response["status"] = "false";
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
                response["status"] = "false";
                response["msg"] = "Incorrect Verification Number";
                res.send(response);
            }
        }
    });
}

app.post('/login',login);
function login(req,res,next) {
    var username = req.body.username;
    var pw = req.body.password;
    var query = {'userName':username};
    User.findOne(query, function(err, seeUser) {
        if (seeUser == null) {
            response["status"] = "false";
            response["msg"] = "User does not exist";
            res.send(response);
            console.log(username + "doesn't exist.");
        }
        else{
            if(seeUser.verificationNumber != 1){
                response["status"] = "false";
                response["msg"] = "User not verified.";
                res.send(response);
                console.log(username + " is not verified.");
            }
            else{
                if (bcrypt.compareSync(pw, seeUser.passWord)){
                    User.findOne(query, function(err, seeUser) {
                        if (seeUser == null) {
                            response["status"] = "false";
                            response["msg"] = "User does not exist";
                            res.send(response);
                            console.log(username + "doesn't exist.");
                        }
                        else {
                            var sessionString = randomstring.generate(16);
                            User.findOneAndUpdate({userName:seeUser.userName}, { $set: { sessionString:sessionString}}, function(err,updatedUser){
                                if(err){
                                    response["status"] = "false";
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

app.post('/updatePassword',updatePassword);
function updatePassword(req, res, next){
    var sessionString = req.body.sessionString;
    var password = myHasher(req.body.password);
    var query = {'sessionString': sessionString};
    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["status"] = "false";
            response["msg"] = "User does not exist";
            res.send(response);
        }
        else{
            if(UserObj.sessionString == sessionString){
                UserObj.set({passWord: password});
                UserObj.save(function(err, updatedUser) {
                    if (err) {
                        response["status"] = "false";
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
                response["status"] = "false";
                response["msg"] = "Session string does not match";
                res.send(response);
            }
        }
    });
}

app.post('/forgetUsername',forgetUsername);
function forgetUsername(req, res, next){
    var email = req.body.email;
    var query = {'emailID' : email};
    User.findOne(query, function(err, UserObj){
        if(UserObj == null){
            response["status"] = "false";
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

app.post('/forgetPassword',forgetPassword);
function forgetPassword(req, res, next){
    var input = req.body.input;
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
            response["msg"] = "User does not exist";
            res.send(response);
        }
        else{
            var rand = randomstring.generate(16);
            UserObj.set({sessionString: rand});
            UserObj.save(function(err, updatedUser) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "Failed to update session key. Please try again";
                    console.log("Update Failed while saving.");
                    res.send(response);
                } else {
                    var firstname = UserObj.firstName;
                    var link = 'http://localhost/researchmate/#/updatepassword';
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
    var username = req.body.username;
    var query = {"userName": username};
    User.findOne(query, function(err, user) {
        if (user == null) {
            console.log(req.body);
            response["status"] = "false";
            response["msg"] = "Error: User not found!";
            res.send(response);
            console.log("Error: User not found!");
        }
        else {
            var queryInfo = {"userID": user.userID};
            UserInfo.findOne(queryInfo, function(err, userInfo) {
                if (userInfo == null) {
                    response["status"] = "false";
                    response["msg"] = "Error: UserInfo not found, may due to verification not done!";
                    res.send(response);
                    console.log("Error: UserInfo not found, may due to verification not done!");
                }
                else {
                    if(sessionString == undefined || sessionString == ""){
                        // user.sessionString = "";
                        console.log("check");
                    }
                    response["msg"] = {"user":user,"userInfo":userInfo};

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
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: Update failed. User not found!")
        }
        else{
            user.set({firstName: req.body.firstname, lastName: req.body.lastname});
            user.save(function(err, userSaveObj){});
            var queryInfo = {"userID": user.userID};
            UserInfo.findOne(queryInfo, function(err, userInfo) {
                if (userInfo == null) {
                    response["status"] = "false";
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
                    userInfo.set({summary: req.body.summary});
                    userInfo.save(function (err, updatedUser) {
                        if(err) {
                            response["status"] = "false";
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
function getUserPublications(req,res,next) {
    var sessionString = req.body.sessionString;
    var query = {"userName": req.body.username};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid username";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            var userID = user.userID;
            UserPublications.find({"userID": userID},{'_id':0}).select("publicationID").exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "No publications";
                    res.send(response);
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
                        console.log(response["msg"]);
                    });
                }
            });
        }
    });
}

app.post('/setUserPublication', setUserPublication);      //sessionstring, publicationID   (not properly set yet)
function setUserPublication(req,res,next) {
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
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
                    response["status"] = "false";
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

app.post('/createGroup', createGroup);                  //groupname, sessionString
function createGroup(req,res,next) {
    var maxCount = 1;
    GroupInfo.findOne().sort('-groupID').exec(function(err, entry) {
        // entry.userID is the max value
        if(entry == null) {
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
                console.log("Error: User not found!");
            }
            else {
                var newGroupDoc = new GroupInfo({
                    groupName: req.body.groupname,
                    groupID: maxCount,
                    createdOn: Date.now(),
                    admin: user.userName
                });

                newGroupDoc.save(function (err) {
                    if (err) {
                        response["status"] = "false";
                        response["msg"] = "unable to save group";
                        res.send(response);
                        console.log(response["msg"]);
                    }
                    else {
                        response["msg"] = "group created.";
                        response["status"] = "true";
                        res.send(response);
                        console.log(response["msg"]);
                    }
                });
            }
        });
    });
}

app.post('/getUserGroups', getUserGroups);                  //username + (opt)sessionstring
function getUserGroups(req,res,next) {
    var sessionString = req.body.sessionString;
    var query = {"userName": req.body.username};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid username";
            res.send(response);
            console.log("Error: User not found!")
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
function setUserGroup(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            query = {"groupName":req.body.groupname};
            GroupInfo.findOne(query,function (err, group) {
                if(err|| group == null){
                    response["status"] = "false";
                    response["msg"] = "group not found";
                    console.log(response["msg"]);
                    res.send(response);
                }
                else{
                    console.log(user.userID);
                    var setUserGroupDoc = new UserGroup({
                        userID: user.userID,
                        groupID: group.groupID
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
    });
}

app.post('/getUserFollowers', getUserFollowers);           //username + (opt)sessionstring
function getUserFollowers(req,res,next) {
    var sessionString = req.body.sessionString;
    var query = {"userName": req.body.username};
    console.log(req.body.username);
    User.findOne(query, function (err, user) {
        if (user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid username";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            var userID = user.userID;
            UserFollowee.find({"userID": userID},{'_id':0}).select("followeeID").exec(function (err, docs) {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "No Followers";
                    res.send(response);
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
function followSomeone(req,res,next) {
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: User not found!")
        }
        else {
            query = {"userName":req.body.username};
            User.findOne(query,function (err,followme) {
                if(err || followme == null){
                    response["status"] = "false";
                    response["msg"] = "Unable to find user you want to follow.";
                    res.send(response);
                    console.log("Error: User you want to follow not found!")
                }
                else{
                    var userFollowDoc = new UserFollowee({
                        userID:user.userID,
                        followeeID:followme.userID,
                        followingFrom:Date.now()
                    });
                    userFollowDoc.save(function (err) {
                        if(err){
                            response["status"] = "false";
                            response["msg"] = "unable to follow this user";
                            res.send(response);
                            console.log(response["msg"]);
                        }
                        else{
                            response["msg"] = "following successful entry added.";
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

app.post('/addPublication',addPublication);
function addPublication(req,res,next) {
    var query = {"sessionString": req.body.sessionstring};
    User.findOne(query, function (err, user) {
        if (user == null || err) {
            response["status"] = "false";
            response["msg"] = "Invalid Session String";
            res.send(response);
            console.log("Error: User not found!")
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
                            abstract: req.body.abstract,
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
                console.log(response["msg"]);
                res.send(response);
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
                        console.log(response["msg"]);
                        res.send(response);
                    }
                    else {
                        console.log("user: "+user);
                        UserInfo.findOne({"userID": user.userID}, function (err, userinf) {
                            if (err) {
                                response["status"] = "false";
                                response["msg"] = "user picture upload failed. unable to find user info. please verify your account.";
                                res.send(response);
                            }
                            else {
                                userinf.set({picture: pathVar});
                                userinf.save(function (err) {
                                    if (err) {
                                        response["status"] = "false";
                                        response["msg"] = "user picture upload failed. unable to find user info.";
                                        console.log(response["msg"]);
                                        res.send(response);
                                    }
                                    else {
                                        response["status"] = "true";
                                        response["msg"] = "user picture upload successful.";
                                        console.log(response["msg"]);
                                        res.send(response);
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
    var data = req.body.type,
        finalPath = './public/papers/' + req.body.ISSN.toString() + '.pdf',
        file = req.files.file,
        tmp_path = file.path;
    console.log(req.body.sessionString);
    fs.rename(tmp_path, finalPath, function (err) {
        if (err){
            response["status"] = "false";
            response["msg"] = "user paperPDF upload failed.";
            console.log(response["msg"]);
            res.send(response);
        }
        else{
            fs.unlink(tmp_path, function () {
                if (err) {
                    response["status"] = "false";
                    response["msg"] = "user paperPDF upload failed.";
                    console.log(response["msg"]);
                    res.send(response);
                }
                else {
                    var host = "http://silo.soic.indiana.edu:";
                    response["status"] = "true";
                    var pathVar = path.join(host, portNumber.toString(), finalPath);
                    pathVar = pathVar.replace("edu:/", "edu:");
                    pathVar = pathVar.replace("ttp:","ttp:/");
                    pathVar = pathVar.replace("/public","");
                    console.log(req.body.sessionString);
                    User.findOne({"sessionString": req.body.sessionString}, function (err, user) {
                        console.log("error: "+user);
                        if (err||user==null) {
                            response["status"] = "false";
                            response["msg"] = "user paperPDF upload failed. unable to find user info.";
                            console.log(response["msg"]);
                            res.send(response);
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
                                    Publications.findOne().sort('-publicationID').exec(function (err, entry) {
                                        if (entry == null) {
                                            maxCount = 1;
                                        }
                                        else {
                                            maxCount = entry.publicationID + 1;
                                        }

                                        var publishDate = new Date(req.body.publishDate);
                                        console.log(user.userID);
                                        var newPublication = new Publications({
                                            publicationID: maxCount,
                                            name: req.body.name,
                                            ISSN: req.body.ISSN,
                                            paperAbstract: req.body.paperAbstract,
                                            publishedAt: req.body.publishedAt,
                                            publishDate: publishDate,
                                            filePath: pathVar
                                        });
                                        newPublication.save(function (err) {
                                            if (err) {
                                                response["status"] = "false";
                                                response["msg"] = "cannot save publication.";
                                                res.send(response);
                                                console.log(err);
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
                                                            var publicationMapping = new UserPublications({
                                                                userID: otherUser.userID,
                                                                publicationID: maxCount
                                                            });
                                                            publicationMapping.save();
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
function getPublicationByID(req, res, next) {       // publicationID
    var query = {"publicationID":req.body.publicationID};
    Publications.findOne(query,function (err,publication) {
        if(err||publication==null){
            response["status"] = "false";
            response["msg"] = "Publication not found.";
            res.send(response);
            console.log(response["msg"]);
        }
        else {
            response["msg"] = publication;
            response["status"] = "true";
            res.send(response);
        }
    });
}

app.post('/addSkill', addSkill);
function addSkill(req, res, next) {       // SessionString, skillName
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (err || user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid sessionString.";
            res.send(response);
            console.log(response["msg"]);
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
                        if(another==null){
                            var maxCount = 1;
                            Skills.findOne().sort('-skillID').exec(function (err, entry) {
                                if (entry == null) {
                                    maxCount = 1;
                                }
                                else {
                                    maxCount = entry.skillID + 1;
                                }
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
function getUserSkills(req, res, next) {       // SessionString
    var query = {"sessionString": req.body.sessionString};
    User.findOne(query, function (err, user) {
        if (err || user == null) {
            response["status"] = "false";
            response["msg"] = "Invalid sessionString.";
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


























































































