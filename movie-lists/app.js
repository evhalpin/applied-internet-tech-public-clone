/*
 * app.js
 * @edited by Ellen Halpin <evh2@nyu.edu>
 * November 7th, 2016
 * AIT Final Project
 */ 

// brings in database/login setup files
require('./db');
require('./auth');

var passport = require('passport');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// brings in the route handlers from the routes files
var index = require('./routes/index');
var users = require('./routes/users');
var movies = require('./routes/movies');
var lists = require('./routes/lists');
var reclists = require('./routes/reclists');

var app = express();

// enables express-session to keep a user logged in throughout their session
var session = require('express-session');
var sessionOptions = {
	secret: 'this is my secret',
	resave: true,
	saveUninitialized: true
};
app.use(session(sessionOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// sets up passport - specifically passport with sessions enabled
app.use(passport.initialize());
app.use(passport.session());

// store the user's info in res.locals to allow all hbs templates access to it
app.use(function(req, res, next) {
	res.locals.user = req.user;
	next();
});

// redirects to the homepage if no one is logged in and a request is made to a page that requires login
app.use(function(req, res, next) {
	if (!req.user && req.path !== '/' && req.path !== '/login' && req.path !== '/newUser' && req.path.indexOf('extLink') < 0) {
		res.redirect('/');
	}
	next();
});

// indicates which path each of the routes in the given route handling file is mounted on
app.use('/', index);
app.use('/users', users);
app.use('/myMovies', movies);
app.use('/myLists', lists);
app.use('/myRecs', reclists);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
// CREDIT: prof's auth demo
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
