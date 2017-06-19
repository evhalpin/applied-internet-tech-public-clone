/*
 * db.js
 * @author Ellen Halpin <evh2@nyu.edu>
 * November 7th, 2016
 * AIT Final Project
 */ 

var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var URLSlugs = require('mongoose-url-slugs');

// SCHEMAS
// Person Schema
var Person = new mongoose.Schema({
    first: String,
    last: {
        type: String,
        required: true
    }
});

// Movie schema
var Movie = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    director: {
        type: [Person],
        required: true
    },
    releaseDate: {
        type: Date,
        required: true
    },
    // Stores 0 if there is no date, 1 if just the year,
    // 2 if the year & month, 3 if year, month, & day
    rDateTypes: {
        type: Number,
        required: true
    },
    runtime: {
        type: Number,
        required: true
    },
    tmdID: {
        type: Number,
        required: true
    },
    watchedBy: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: true
    },
    image: String,
    genre: [String],
    tagline: String,
    ratings: [new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number
    },{ _id : false })],
    // similar: [Number],
    inList: [String]
});
Movie.plugin(URLSlugs('title'));

var RecList = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    movieInfo: [new mongoose.Schema({
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie'
        },
        ratings: [new mongoose.Schema({
            user: String,
            rating: Number
        },{_id : false })]
    },{_id : false })],
    sharedWith: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: false
    },
    madeBy: String,
    created: Date
});
RecList.plugin(URLSlugs('name'));

// User schema
var User = new mongoose.Schema({ });
User.plugin(passportLocalMongoose);


mongoose.model('Person', Person);
mongoose.model('Movie', Movie);
mongoose.model('RecList', RecList);
mongoose.model('User', User);

// Overwrites the function that returns a human-readable string representation 
// of the date, taking into account the value of rDateTypes fed into it
Date.prototype.toDateString = function(dateType) {
    var split;
    if (dateType === 0) {
        return "Date unlisted";
    }
    else if (dateType === 1) {
        return this.toString().split(' ')[3];
    }
    else if (dateType === 2) {
        split = this.toString().split(' ');
        return split[1] + ' ' + split[3];
    }
    else {
        split = this.toString().split(' ');
        return split[1] + ' ' + split[2] + ' ' + split[3];
    }
};

// is the environment variable, NODE_ENV, set to PRODUCTION? 
if (process.env.NODE_ENV == 'PRODUCTION') {
 // if we're in PRODUCTION mode, then read the configration from a file
 // use blocking file io to do this...
 var fs = require('fs');
 var path = require('path');
 var fn = path.join(__dirname, 'config.json');
 var data = fs.readFileSync(fn);

 // our configuration file will be in json, so parse it and set the
 // conenction string appropriately!
 var conf = JSON.parse(data);
 var dbconf = conf.dbconf;
} else {
 // if we're not in PRODUCTION mode, then use
 dbconf = 'mongodb://localhost/finalproject';
}
mongoose.connect(dbconf);





