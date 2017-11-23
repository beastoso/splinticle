'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
		provider_id: String,
		name: String,
      email: String
});

module.exports = mongoose.model('User', User);
