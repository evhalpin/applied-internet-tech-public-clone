/*
 * auth.js
 * @author Ellen Halpin <evh2@nyu.edu>
 * November 15th, 2016
 * AIT Final Project
 */ 

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('User');

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());