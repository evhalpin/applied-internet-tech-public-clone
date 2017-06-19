var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Movie = mongoose.model('Movie');
var RecList = mongoose.model('RecList');
var User = mongoose.model('User');


/* Renders a list of the user's created lists */
router.get('/', function(req, res) {
	// finds the lists authored by this user
	RecList.find({user: {$in: [req.user._id]}}, function(err, lists, count) {
		if (err) {
			console.log(err);
			res.redirect('/');
		}
		// no lists found
		else if (!lists || lists.length === 0) {
			res.render('myLists', {fullLists: lists});
		}
		// lists found
		else {
			// create a new array of objects where each list is paired with the usernames of the user's it's shared with
			var fullLists = lists.map(function(thisList) {
				var listObj = {
					list: thisList
				};
				// if the list has been shared with at least 1 user, 
				// take the list of ratings for the first movie in the list's movieInfo
				// (which has a list of the ratings for the movie by username for each user the list is shared with)
				// and reduce this list to a string of all the usernames
				if (thisList.movieInfo && thisList.movieInfo[0] && thisList.sharedWith.length > 0) {
					var ratingsList = thisList.movieInfo[0].ratings;
					var usersList = ratingsList.reduce(function(usersString, thisRating) {
						return usersString + ', ' + thisRating.user;
					}, '');
					// remove the list's author's username
					var firstComma = usersList.indexOf(',', 1);
					listObj.users = usersList.slice(firstComma + 1);
				}
				// if the list hasn't been shared yet
				else {
					listObj.users = " N/A";
				}
				return listObj;
			});
			// sorts lists so newest lists are first
			fullLists.sort(function(listA, listB) {
				if (listA.list.created > listB.list.created) {
					return -1;
				}
				else if (listA.list.created < listB.list.created) {
					return 1;
				}
				else {
					return 0;
				}
			});
			res.render('myLists', {fullLists: fullLists});
		}
	});
});


/* Handles the 1st part of the create new list form (the name & displaying available movies to add*/
router.post('/newList', function(req, res) {
	// Gets the user's list of watched films
	Movie.find({watchedBy: {$in: [req.user._id]}}, function(err, movies, count) {
		if (err) {
			console.log(err);
			res.render('myLists', {errMsg: 'Oops, something went wrong. Please try again'});
		}
		// the user hasn't added any movies to their watched list
		else if (movies.length === 0) {
			res.render('myLists', {errMsg: 'You can\'t create a list until you\'ve registered at least one watched movie in myMovies!'});
		}
		// the user has at least 1 movie in their watched list
		else {
			// renders the form that lets the user choose what movies to add to the list
			var listName = req.body.name;
			var escListName = encodeURIComponent(listName);
			res.render('pickMovie', {watched: movies, listName: listName, escListName: escListName});
		}
	});
});


/* Handles the 2nd part of the create new list form - actually creating the list and saving it */
router.post('/:escListName/pickMovies', function(req, res) {
	// creates list without movies
	var newList = new RecList({
		user: req.user,
		name: req.body.listName,
		sharedWith: [],
		movieInfo: [],
		madeBy: (req.body.madeBy) ? req.body.madeBy : req.user.username,
		created: new Date()
	});
	// saves list (adds movies in the callback)
	newList.save(function(err, savedList, count) {
		if (err) {
			console.log(err);
			res.redirect('/myLists');
		}
		// successful save
		else {
			// look at each movie to be added, update the movie's "inList" attribute, 
			// and grab the list author's rating of each film to put in the list
			var moviesAdded = 0;
			var numToAdd = (Array.isArray(req.body.objectID)) ? req.body.objectID.length : 1;
			// recursive function to update & save all of the movies
			var addMoviesToList = function() {
				// makes sure that the id(s) send in the request body is/are in an array
				// - if only one movie is selected, the id in the request body is not in an array
				var idArray = req.body.objectID;
				if (!Array.isArray(idArray)) {
					idArray = [];
					idArray.push(req.body.objectID);
				}
				// update current movie's "inList"
				Movie.findOneAndUpdate({_id: idArray[moviesAdded]},
									   {$addToSet: {inList: savedList.slug}},
									   function(err, movie, count) {
					if (err) {
						console.log(err);
						res.redirect('/myLists');
					}
					else if (!movie) {
						res.redirect('/myLists');
					}
					else {
						// grab the list author's rating (store 0 as their rating if they
						// haven't rated the film yet)
						var userRating = 0;
						for (var i = 0; i < movie.ratings.length; i++) {
							if (movie.ratings[i].user.equals(req.user._id)) {
								userRating = movie.ratings[i].rating;
							}
						}
						var usernameRating = [];
						usernameRating.push({user: req.user.username, rating: userRating});
						var movieInfoUpdate = {
							movie: movie._id,
							ratings: usernameRating
						};
						savedList.movieInfo.push(movieInfoUpdate);
						moviesAdded++;
						// if there is a movie left, call function again
						if (moviesAdded < numToAdd) {
							addMoviesToList();
						}
						// if all movies have been hit, save the updated list with all the movies
						else {
							savedList.save(function(err, newSavedList, count) {
								if (err) {
									console.log(err);
									res.redirect('/myLists');
								}
								// successful save
								else {
									res.redirect('/myLists');
								}
							});
						}
					}
				});
			};
			// actual call to function
			addMoviesToList();
		}
	});
});


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

/* Renders the individual page for each list */
router.get('/list/:slug', function(req, res) {
	// find the list referenced by the slug
	RecList.findOne({slug: req.params.slug}, function(err, list, count) {
		if (err) {
			console.log(err);
			res.redirect('/myLists');
		}
		// no list found - Bad URL
		else if (!list) {
			console.log('you can\'t access this list');
			res.redirect('/myLists');
		}
		// if the list exists but it doesn't belong to the current user (it was created by a different user)
		else if (!list.user.equals(req.user._id)) {
			console.log('you can\'t access this list');
			res.redirect('/myLists');
		}
		// if the list exists and this user created it
		else {
			var createdHash = makeHash(list.created.toString());

			// the external (no login necessary) link that is shared to facebook
			var fbShareLink = req.protocol + '://' + req.hostname + ':15500/' + 'myRecs/extLink/' + list.slug + '/' + createdHash;

			// Find all the movies in the list
			Movie.find({inList: {$in: [req.params.slug]}}, function(err, movies, count) {
				if (err) {
					console.log(err);
					res.redirect('/myLists');
				}
				// found movies
				else {
					// creates a new array of objects where each movie is paired with it's ratings object from the list's movieInfo
					var fullMovies = movies.map(function(thisMovie) {
						var movieObj = {
							movie: thisMovie
						};
						for (var i = 0; i < list.movieInfo.length; i++) {
							if (thisMovie._id.equals(list.movieInfo[i].movie)) {
								movieObj.ratings = list.movieInfo[i].ratings;
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
					res.render('listPage', {list: list, fullMovies: fullMovies, fbShareLink: fbShareLink});
				}
			});
		}
	});
});


/* Handles sharing lists with users within the site */
router.post('/list/:slug/shareList', function(req, res) {
	// search for the user who's username was send in the request body
	User.findOne({username: req.body.username}, function(err, user, count) {
		// something goes wrong with the search
		if (err) {
			console.log(err);
			res.redirect('/myLists/list/' + req.params.slug);
		}
		// the username does not exist
		else if (!user) {
			console.log('that user doesn\'t exist');
			res.redirect('/myLists/list/' + req.params.slug);
		}
		// user found
		else {
			// find the list that the slug references
			RecList.findOne({slug: req.params.slug}, function(err, list, count) {
				if (err) {
					console.log(err);
					res.redirect('/myLists/list/' + req.params.slug);
				}
				// list not found - shouldn't ever happen but still included handler
				else if (!list) {
					res.redirect('/myLists/list/' + req.params.slug);
				}
				// list found
				else {
					// doesn't add list if the username entered belongs to the author of the list
					if (list.user.equals(user._id)) {
						console.log('you created this list, you can\'t share it with yourself');
						res.redirect('/myLists/list/' + req.params.slug);
					}
					else {
						// only adds if the list isn't already shared with the user
						if (list.sharedWith.indexOf(user._id) < 0) {
							list.sharedWith.push(user._id);
							list.movieInfo.forEach(function(thisMovie) {
								thisMovie.ratings.push({user: user.username, rating: 0});
							});
						}
						// saves updated list
						list.save(function(err, savedList, count) {
							if (err) {
								console.log(err);
								res.redirect('/myLists/list/' + req.params.slug);
							}
							else {
								res.redirect('/myLists/list/' + req.params.slug);
							}
						});
					}
				}
			});
		}
	});
});

/* handles the deletion of a list from it's list page */
router.post('/list/:listSlug/deleteList', function(req, res) {
	// find the list referenced by the slug
	RecList.findOneAndRemove({slug: req.params.listSlug}, function(err, list, count) {
		if (err) {
			console.log(err);
			res.redirect('/myLists/list/' + req.params.listSlug);
		}
		// if no list is found - bad url (shouldn't happen, but just in case)
		else if (!list) {
			console.log('bad URL');
			res.redirect('/myLists/list/' + req.params.listSlug);
		}
		// list found
		else {
			// finds out how many movies are in the list
			// (each of them needs to have their inList updated)
			var numToUpdate = list.movieInfo.length;
			// if the list was empty, the list can simply be deleted
			if (numToUpdate === 0) {
				res.redirect('/myLists/list/' + req.params.listSlug);
			}
			else {
				var numUpdated = 0;
				var updateFilms = function() {
					Movie.findOne({_id: list.movieInfo[numUpdated].movie}, function(err, movie, count) {
						if (err || !movie) {
							console.log(err);
							res.redirect('/myLists/list/' + req.params.listSlug);
						}
						else {
							var indexOfList = movie.inList.indexOf(list.slug);
							if (indexOfList >= 0) {
								movie.inList.splice(indexOfList, 1);
							}
							movie.save(function(err, savedMovie, count) {
								numUpdated++;
								if (numUpdated < numToUpdate) {
									updateFilms();
								}
								else {
									res.redirect('/myLists');
								}
							});
						}
					});
				};
				updateFilms();
			}
		}
	});
});



module.exports = router;