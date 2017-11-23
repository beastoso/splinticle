'use strict';


module.exports = {
	'googleAuth': {
		'clientID': process.env.GOOGLE_CLIENT_ID,
		'clientSecret': process.env.GOOGLE_CLIENT_SECRET,
		'callbackURL': process.env.APP_URL + 'auth/google/callback'
	},
	'twitterAuth': {
		'clientID': process.env.TWITTER_CLIENT_ID,
		'clientSecret': process.env.TWITTER_CLIENT_SECRET,
		'callbackURL': process.env.APP_URL + 'auth/twitter/callback'
	}
};
