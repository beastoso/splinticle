'use strict';

var GoogleStrategy = require('passport-google-oauth2').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('../models/users');
var configAuth = require('./auth');

module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});
	


	passport.use(new GoogleStrategy(
		{
			clientID: configAuth.googleAuth.clientID,
			clientSecret: configAuth.googleAuth.clientSecret,
			callbackURL: configAuth.googleAuth.callbackURL,
    	    passReqToCallback   : true
			},
		function(request, accessToken, refreshToken, profile, done) {
			process.nextTick(function () {
				User.findOne({ 'provider_id': profile.id }, function (err, user) {
					if (err) {
						return done(err);
					}
	
					if (user) {
						return done(null, user);
					} else {
						var userData = {
								provider_id: profile.id,
								name: profile.name.givenName,
								email: profile.email
						};
						
						if (!userData.name || userData.name == "") {
							userData.name = userData.email;
						}
	
						var newUser = new User(userData);
						
						newUser.save(function (err) {
							if (err) {
								throw err;
							}
	
							return done(null, newUser);
						});
					}
				});
			});
		}
	));
	
	passport.use(new TwitterStrategy({
	    consumerKey: configAuth.twitterAuth.clientID,
	    consumerSecret: configAuth.twitterAuth.clientSecret,
	    callbackURL: configAuth.twitterAuth.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
	
	    var searchQuery = {
	      name: profile.displayName
	    };
	
	    var updates = {
	      name: profile.displayName,
	      provider_id: profile.id
	    };
	
	    var options = {
	      upsert: true
	    };
	
	    // update the user if s/he exists or add a new user
	    User.findOneAndUpdate(searchQuery, updates, options, function(err, user) {
	      if(err) {
	        return done(err);
	      } else {
	        return done(null, user);
	      }
	    });
	  }
	
	));
};
