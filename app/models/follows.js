'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Follow = new Schema({
	target_user_id: Schema.Types.ObjectId,
	follower_id: Schema.Types.ObjectId,
	date_added: Date
});

module.exports = mongoose.model('Follow', Follow);
