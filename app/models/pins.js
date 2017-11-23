'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Pin = new Schema({
	user_id: Schema.Types.ObjectId,
	title: String,
	image_url: String,
	date_added: Date,
	likes: Number
});

module.exports = mongoose.model('Pin', Pin);
