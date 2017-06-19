var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');

/* Render home page */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* Render login page */
router.get('/login', function(req, res) {
  res.render('login');
});

/* Handle login form submission */
router.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user) {
		// user exists and password matches
		if (user) {
			req.login(user, function(err) {
				res.redirect('/');
			});
		}
		else {
			res.render('login', {message: 'Invalid username or password'});
		}
	}) (req, res, next);
});

/* Render registration (newUser) page */
router.get('/newUser', function(req, res) {
	res.render('newUser');
});

/* Handle registration form submission */
router.post('/newUser', function(req, res) {
	// tries to save new user's info
	User.register(new User({username: req.body.username}), req.body.password, function (err, user) {
		// username already exists
		if (err && err.name === 'UserExistsError') {
			res.render('newUser', {message: 'Username unavailable'});
		}
		// invalid reg info (ex. blank entry)
		else if (err) {
			console.log(err);
			res.render('newUser', {message: 'Invalid registration info'});
		}
		// logs user in
		else {
			passport.authenticate('local')(req, res, function() {
				res.redirect('/');
			});
		}
	});
});

/* Handle logout (from link/button) */
router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});


module.exports = router;
