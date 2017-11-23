'use strict';

var path = process.cwd();
var DBHelper = require(path + '/app/common/db-functions.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			req.session.user = req.user;
			return next();
		} else if (req.session.user) {
			return next();
		} else {
			res.redirect('/login');
		}
	}

	app.route('/')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			req.session.user = false;
			res.redirect('/');
		});
		
	app.route('/user')
		.get(isLoggedIn, function(req, res) {
			res.redirect('/user/'+req.session.user._id);
		});
	
	app.route('/user/:userId')
		.get(function(req, res) {
			req.session.displayUserId = req.params.userId;
			res.sendFile(path+'/public/profile.html');
		});
		
	app.route('/api/user/:userId')
		.get(function(req, res) {
			var currentUserId = null;
			if (req.session.user) {
				currentUserId = req.session.user._id;
			}
			DBHelper.getUser(req.params.userId, currentUserId, function(err, user) {
				if (err) return res.json("User not found");
				res.json(user);
			});
		});

	app.route('/api/user')
		.get(function (req, res) {
			if (req.user) {
				req.session.user = req.user;
				res.json(req.user);
			}
			else if (req.session.user) {
				res.json(req.session.user);
			}
			else {
				res.json(false);
			}
		});
		
	
	app.route('/api/pins/recent')
		.get(function(req, res){
			DBHelper.getRecentPins(function(err, pins) {
				if (err || !pins || pins.length == 0) {
					return res.json("No pins yet");
				}
				res.json(pins);
			});
		});
		
	app.route('/api/pins/popular')
		.get(function(req, res){
			DBHelper.getPopularPins(function(err, pins) {
				if (err || !pins || pins.length == 0) {
					return res.json("No pins yet");
				}
				res.json(pins);
			});
		});
		
	app.route('/api/user/pins/:userId')
		.get(function(req, res){
			DBHelper.getUserPins(req.params.userId, function(err, pins) {
				if (err || !pins || pins.length == 0) {
					return res.json("No pins added yet");
				}
				res.json(pins);
			});
		});
		
	app.route('/api/user/fellows/:userId')
		.get(function(req, res) {
			DBHelper.getFellows(req.params.userId, function(err, fellows) {
				if (err || !fellows || fellows.length == 0) {
					return res.json("No users followed yet");
				}
				res.json(fellows);
			});
		});
		
	app.route('/api/pin')
		.post(isLoggedIn, function(req, res){
			if (req.session.user) {
				DBHelper.savePin(req.body, req.session.user._id, function(err, pin) {
					if (err) return res.send("Could not save pin");
					res.json(pin);
				});
			}
			else {
				res.json("not logged in");
			}
		});
		
	app.route('/api/pin/:pinId')
		.delete(isLoggedIn, function(req, res){
			if (req.session.user) {
				DBHelper.removePin(req.params.pinId, req.session.user._id, function(err, book) {
					if (err) return res.send("Could not delete pin");
					res.json(book);
				});
			}
			else {
				res.json("not logged in");
			}
		});;
		
	app.route('/api/like/:pinId')
		.post(function(req, res) {
				var pinId = req.params.pinId;
				DBHelper.addLike(pinId, function(err, status) {
					if (err) return res.send("Could not save like");
					res.json(status);
				});
		});
		
	app.route('/api/follow/:userId')
		.post(isLoggedIn, function(req, res) {
			if (req.session.user) {
				DBHelper.saveFollow(req.session.user._id, req.params.userId, function(err, userRequests) {
					if (err) return res.send("Could not follow user");
					res.json(true);
				});
			}
			else {
				res.json("not logged in");
			}
		}).delete(isLoggedIn, function(req, res) {
			if (req.session.user) {
				DBHelper.removeFollow(req.session.user._id, req.params.userId, function(err, request) {
					if (err) return res.send("Could delete follow");
					res.json(request);
				});
			}
			else {
				res.json("not logged in");
			}
		});
		
		
	app.route('/auth/google')
		.get(passport.authenticate('google', {
			scope: [
				'https://www.googleapis.com/auth/plus.me',
				'https://www.googleapis.com/auth/userinfo.email'
			]
		}));

	app.route('/auth/google/callback')
		.get(passport.authenticate('google', {
			successRedirect: '/user',
			failureRedirect: '/login'
		}));

	app.route('/auth/twitter')
		.get(passport.authenticate('twitter'));
	
	app.route('/auth/twitter/callback')
		.get(passport.authenticate('twitter', {
			successRedirect: '/user',
			failureRedirect: '/login'
		}));

};
