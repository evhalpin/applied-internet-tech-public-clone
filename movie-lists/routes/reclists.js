var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Movie = mongoose.model('Movie');
var RecList = mongoose.model('RecList');


/* Renders the list of recommendation lists that other users have shared with the logged in user */
router.get('/', function(req, res) {
	// finds the lists that have been shared with the user
	RecList.find({sharedWith: {$in: [req.user]}}, function(err, lists, count) {
		if (err) {
			console.log(err);
			console.log('Oops, something went wrong');
			res.render('myRecs');
		}
		// if no lists found
		else if (!lists || lists.length === 0) {
			console.log('no one\'s sent you any recommendations');
			res.render('myRecs', {errMsg: 'Looks like no one has sent you any recommendation lists yet!'});
		}
		// at least one list has been found
		else {
			// create a new array of objects where each list is paired with the username of it's author
			var fullLists = lists.map(function(thisList) {
				var listObj = {
					list: thisList
				};
				// if the list has been shared with at least 1 user, 
				// take the list of ratings for the first movie in the list's movieInfo
				// (which has a list of the ratings for the movie by username for each user the list is shared with)
				// and the first username in this list is the list author's
				if (thisList.movieInfo && thisList.movieInfo[0]) {
					var ratingsList = thisList.movieInfo[0].ratings;
					listObj.user = ' ' + ratingsList[0].user;
				}
				// if the list hasn't been shared yet
				else {
					listObj.users = " ???";
				}
				return listObj;
			});
			// sorts reclists into order by alphabetical list author (the user who shared the list)
			fullLists.sort(function(listA, listB) {
				if (listA.list.madeBy.toLowerCase() > listB.list.madeBy.toLowerCase()) {
					return 1;
				}
				else if (listA.list.madeBy.toLowerCase() < listB.list.madeBy.toLowerCase()) {
					return -1;
				}
				else {
					return 0;
				}
			});
			res.render('myRecs', {fullLists: fullLists});
		}
	});
});


/* Renders an individual recommendation list */
router.get('/list/:listSlug', function(req, res) {
	// finds the list referenced by the slug
	RecList.findOne({slug: req.params.listSlug}, function(err, list, count) {
		if (err) {
			console.log(err);
			console.log('Oops something went wrong');
			res.redirect('/myRecs');
		}
		// no list found
		else if (!list) {
			console.log('bad URL');
			res.redirect('/myRecs');
		}
		// list found, but it isn't shared with user
		else if (list.sharedWith.indexOf(req.user._id) < 0) {
			console.log('you dont have permission to view this list');
			res.redirect('/myRecs');
		}
		// list found and it has been shared with the user
		else {
			// find the movies in the list referenced by the slug
			Movie.find({inList: {$in: [req.params.listSlug]}}, function(err, movies, count) {
				if (err) {
					console.log(err);
					console.log('Oops something went wrong');
					res.redirect('/myRecs');
				}
				// no movies found - should not ever happen because no list can exist without at least 1 movie
				else if (!movies || movies.length === 0) {
					console.log('Oops something went wrong');
					res.redirect('/myRecs');
				}
				// movies found
				else {
					// creates a new array of objects where each movie in the list is coupled with:
					// - username of the list's creator
					// - the list's name 
					// (because it's helpful for the hbs template)
					var fullMovies = movies.map(function(thisMovie) {
						var movieObj = {
							movie: thisMovie,
							author: list.madeBy,
							listSlug: list.slug
						};
						for (var i = 0; i < list.movieInfo.length; i++) {
							if (thisMovie._id.equals(list.movieInfo[i].movie)) {
								movieObj.recRating = list.movieInfo[i].ratings[0];
							}
						}
						return movieObj;
					});
					// sorts movies into alphabetical order
					fullMovies.sort(function(movA, movB) {
						if (movA.movie.title.toUpperCase() > movB.movie.title.toUpperCase()) {
							return 1;
						}
						else if (movA.movie.title.toUpperCase() < movB.movie.title.toUpperCase()) {
							return -1;
						}
						else {
							return 0;
						}
					});
					res.render('recList', {list: list, fullMovies: fullMovies});
				}
			});
		}
	});
});


/* PUBLIC LISTS - VIEW WITHOUT LOGGING IN */
// makes a hash of the creation date of the list (used for validating external links to the list)
// CREDIT: I got this simple hashing function from:
//		 http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function makeHash(dateString) {
	var hash = 0;
	for (var i = 0; i < dateString.length; i++) {
		var thisChar = dateString.charCodeAt(i);
		hash = ((hash << 5) - hash) + thisChar;
		hash = hash & hash;
	}
	return Math.abs(hash);
}


/* Renders a non-logged-in view of a list (ex. a list shared as a link in a facebook post) */
router.get('/extLink/:listSlug/:hashVal', function(req, res) {
	// find the list referenced by the slug
	RecList.findOne({slug: req.params.listSlug}, function(err, list, count) {
		// error or no list with the slug given is found
		if (err) {
			console.log(err);
			console.log("list not found");
			res.render('listUnfound');
		}
		// no list found
		else if (!list) {
			console.log('can\'t find that list');
			res.render('listUnfound');
		}
		// list with given slug is found
		else {
			// stores what the date-hash for the list should be
			var createdHash = makeHash(list.created.toString());
			// hash matches - link is valid
			if (+req.params.hashVal === createdHash) {
				Movie.find({inList: {$in: [req.params.listSlug]}}, function(err, movies, count) {
					if (err) {
						console.log(err);
						console.log('Oops something went wrong');
						res.render('listUnfound');
					}
					// no movies found - should not ever happen because no list can exist without at least 1 movie
					else if (!movies || movies.length === 0) {
						console.log('Oops something went wrong');
						res.render('listUnfound');
					}
					else {
						res.render('recListExt', {list: list, movies: movies});
					}
				});
			}
			// if hash doesn't match - bad url
			else {
				console.log('the list doesn\'t exist or you dont have permission to view it');
				res.render('listUnfound');
			}
		}
	});
});


module.exports = router;
