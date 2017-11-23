"use strict"

var mongo = require("mongodb");
var Pin = require("../models/pins");
var Follow = require("../models/follows");
var User = require("../models/users");

var self = module.exports = {
    saveUserDetails: function(userId, details, callback) {
        var userInfo = {
          'name': details.name,
        };
        User.update(
            { _id: new mongo.ObjectId(userId)},
            userInfo,
            function(err, user) {
                if (err) return callback(err);
                callback(null, true);
            }
        );
    },
    getUser: function(userId, currentUserId, callback) {
      User.findOne({_id : new mongo.ObjectId(userId)}, function(err, user) {
        if (err) return callback(err);
        if (user && user._id) {
            Follow.find(
                {target_user_id : new mongo.ObjectId(userId)}, 
                function(ferr, followers) {
                    if (ferr) return callback(ferr);
                    user = user._doc;
                    user.followers = followers.length;
                    
                    if (currentUserId) {
                        for(var i = 0; i < followers.length; i++) {
                            if (followers[i]._doc.follower_id.equals(new mongo.ObjectId(currentUserId))) {
                                user.following = true;
                                break;
                            }
                        }
                    }
                    
                    callback(null, user);
            });
        }
        else {
            callback("User not found by email");
        }
      });
    },
    savePin: function(pinInfo, userId, callback) {
        
        var pinModel = {
            'user_id': new mongo.ObjectId(userId),
            'title': pinInfo.title,
            'image_url': pinInfo.imageUrl,
            'date_added': new Date(),
            'likes': 0
        };
        
        if (pinInfo.pinId) {
            Pin.update(
            { 
                _id: new mongo.ObjectId(pinInfo.pinId)
            },
            pinModel,
            { accepted: true },
            { upsert: false },
            callback
        );
        }
        else {
            new Pin(pinModel).save(function(error, pin){
                if (error) return callback(error, null);
                callback(null, pin);
            });
        }
    },
    getPin: function(pinId, callback) {
      Pin.findOne(
           {_id: new mongo.ObjectId(pinId)}, 
           function(err, pin) {
               if (err) return callback(err);
                   User.findOne({_id: pin._doc.user_id}, function(uerr, user){
                       if (uerr) return callback(uerr);
                       
                       pin = pin._doc;
                       pin.userName = user._doc.name;
                       callback(null, pin);
                   });
            }
       );
    },
    getRecentPins: function(callback) {
      Pin.find(
          { "$query": {}, "$orderby" : { date_added: -1 }, "$limit" : 10}, 
          function(err, pins) {
              if (err) return callback(err);
              var userIds = [];
              pins.forEach(function(pin) {
                 userIds.push(pin._doc.user_id); 
              });
              User.find({_id : { "$in" : userIds}}, function(uerr, users) {
                  if (uerr) return callback(uerr);
                  var formattedPins = [];
                  pins.forEach(function(pin) {
                      pin = pin._doc;
                      users.forEach(function(user) {
                          if (pin.user_id.equals(user._doc._id)) {
                            pin.userName = user._doc.name;
                          }
                      });
                      formattedPins.push(pin);
                  });
                  
                  callback(null, formattedPins);
              });
          });
    },
    getPopularPins: function(callback) {
        Pin.find(
            { "$query": {}, "$orderby" : { likes: -1 }, "$limit" : 10}, 
            function(err, pins) {
                if (err) return callback(err);
                
                var userIds = [];
              pins.forEach(function(pin) {
                 userIds.push(pin._doc.user_id); 
              });
              User.find({_id : { "$in": userIds}}, function(uerr, users) {
                  if (uerr) return callback(uerr);
                  var formattedPins = [];
                  pins.forEach(function(pin) {
                      pin = pin._doc;
                      users.forEach(function(user) {
                          if (pin.user_id.equals(user._doc._id)) {
                            pin.userName = user._doc.name;
                          }
                      });
                      formattedPins.push(pin);
                  });
                  
                  callback(null, formattedPins);
              });
            }
        );
    },
    getUserPins: function(userId, callback) {
        var matchQuery = {
            'user_id': new mongo.ObjectId(userId)
        };
        
        Pin.find(
            { "$query" : matchQuery, "$orderby" : { date_added: 1 } }, callback);
    },
    getFellows: function(userId, callback) {
        Follow.find(
            { "$query" : {follower_id: new mongo.ObjectId(userId)},
                "$orderby" : { date_added: -1 }},
            function(err, follows) {
                if (err) return callback(err);
                var userIds = [];
                follows.forEach(function(follow) {
                   userIds.push(follow._doc.target_user_id) ;
                });
                if (userIds.length == 0) {
                    return callback(null, userIds);
                }
                User.find({_id : { "$in" : userIds}}, 
                    function(berr, users) {
                        if (berr) return callback(berr);
                        var formattedUsers = [];
                        Pin.find(
                            { "$query" : { user_id : { "$in" : userIds}},
                              "$orderby" : { date_added : -1 }
                            }, function(perr, pins) {
                                if (perr) return callback(perr);
                                users.forEach(function(user) {
                                    var formattedUser = {
                                        user_id: user._doc._id,
                                        name: user._doc.name
                                    };
                                    pins.forEach(function(pin){
                                        if (pin._doc.user_id.equals(formattedUser.user_id)) {
                                            formattedUser.latestPin = pin._doc;
                                            return false;
                                        }
                                    });
                                    formattedUsers.push(formattedUser);
                                });  
                                
                                callback(null, formattedUsers);
                            });
                    });
            }
        );
    },
    saveFollow: function(userId, targetId, callback) {
           new Follow({
               follower_id: new mongo.ObjectId(userId),
               target_user_id: new mongo.ObjectId(targetId),
               date_added: new Date()
           }).save(function(terr, request) {
              if (terr) return callback(terr);
              callback(null, request);
           });
    },
    removeFollow: function(userId, targetId, callback) {
        Follow.remove(
            { follower_id : mongo.ObjectId(userId),
                target_user_id: mongo.ObjectId(targetId)
            }, callback);
    },
    addLike: function(pinId, callback) {
        Pin.update(
            { _id: new mongo.ObjectId(pinId) },
            { "$inc" : { likes : 1 } },
            { accepted: true,
             upsert: false },
            callback
        );
    },
    removePin: function(pinId, userId, callback) {
        Pin.remove(
            { user_id: mongo.ObjectId(userId), 
              _id: mongo.ObjectId(pinId)
            }, callback);
    },
    countFollowers: function(userId, callback) {
        Follow.find(
            { target_user_id: new mongo.ObjectId(userId)},
            function(err, followers) {
                if (err) return callback(err);
                callback(followers.length);
            }
            );
    }
}