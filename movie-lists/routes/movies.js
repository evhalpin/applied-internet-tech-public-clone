var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Movie = mongoose.model('Movie');
var RecList = mongoose.model('RecList');
var querystring = require('querystring');
var request = require('request');

var apiKey = '3d14474161dcb357dd163a50407318c7';
var base = 'https://api.themoviedb.org/3';


// Builds the url used for the 'The Movie Database API'
function makeURL(reqType, queryType, query, page) {
	var wholeURL = base;
	wholeURL += reqType;
	wholeURL += '?api_key=' + apiKey;
	wholeURL += '&' + queryType + '=' + querystring.escape(query);
	if (page) {
		wholeURL += '&page=1';
	}
	return wholeURL;
}


/* Renders user's watched movies list */
router.get('/', function(req, res) {
	Movie.find({watchedBy: {$in: [req.user._id]}}, function(err, movies, count) {
		if (err) {
			console.log(err);
			res.redirect('/');
		}
		else {
			// sorts movies into alphabetical order
			movies.sort(function(movA, movB) {
				if (movA.title.toUpperCase() > movB.title.toUpperCase()) {
					return 1;
				}
				else if (movA.title.toUpperCase() < movB.title.toUpperCase()) {
					return -1;
				}
				else {
					return 0;
				}
			});
			res.render('myMovies', {watched: movies});
		}
	});
});


/* Handles the 1st part of the add-watched movie form (the movie database api request) */
router.post('/findMovie', function(req, res) {
	// build the url for the API's search-for-a-movie functionality
	var searchURL = makeURL('/search/movie', 'query', req.body.title, true);
	// make the request
	request.get(searchURL, function(err, response, body) {
		if (err) {
			console.log(err);
			res.redirect('/myMovies');
		}
		// search successful
		else {
			// parse to JavaScript from JSON response
			var data = JSON.parse(body);
			var movieList = [];
			// build a list of movie options to fill in the template for the next part of the form
			for (var i = 0; i < data.results.length; i++) {
				var movie = {};
				movie.id = data.results[i].id;
				movie.title = data.results[i].title;
				movie.date = data.results[i].release_date;
				// movie has poster
				if (data.results[i].poster_path) {
					movie.img = 'https://image.tmdb.org/t/p/w185' + data.results[i].poster_path;
				}
				else {
					// no poster
					movie.img = '/images/noImage.png';
				}
				movieList.push(movie);
			}
			// render the next part of the form 
			// - if movieList[] the handle tells the user their search yielded no results
			res.render('addMovie', {movie: movieList});
		}
	});
});


/* Handles the 2nd part of the 'Add watched movie form' - actually adding the movie to the user's db document */
router.post('/chooseMovie', function(req, res) {
	// build the url for the get-movie-information functionality of the API
	var movieURL = makeURL(('/movie/' + req.body.id), 'append_to_response', 'credits', false);
	// make the request
	request.get(movieURL, function(err, response, body) {
		if (err) {
			console.log(err);
			res.redirect('/myMovies');
		}
		// API call successful
		else {
			var data = JSON.parse(body);
			// search the movie database for a movie matching the selected film's 'The Movie Database API' id
			Movie.findOne({tmdID: data.id}, function(err, movie, count) {
				// If something goes wrong with the DB search
				if (err) {
					console.log(err);
					res.redirect('myMovies');
				}
				// If the movie does not exist in the "movies" collection
				else if (!movie) {
					// static properties are fed to constructor
					var newMovie = new Movie({
						title: data.title,
						runtime: data.runtime,
						tmdID: data.id,
						tagline: data.tagline,
						watchedBy: req.user._id
					});
					// properties that require meddling are added separately
					// DIRECTOR
					// find all crew members with the job title "Director"
					var crew = data.credits.crew.filter(function(crewMember) {
						return (crewMember.job === 'Director');
					});
					// store all directors
					newMovie.director = [];
					for (var i = 0; i < crew.length; i++) {
						var splitName = crew[i].name.split(' ');
						// stores only first and last name (or just last name) of director
						if (splitName.length > 1) {
							newMovie.director[i] = {
								first: crew[i].name.replace((' ' + splitName[splitName.length-1]), ''),
								last: splitName[splitName.length-1]
							};
						}
						else {
							newMovie.director[i] = {
								last: crew[i].name
							};
						}
					}
					// IMAGE
					// image exists
					if (data.poster_path) {
						newMovie.image = 'https://image.tmdb.org/t/p/w342' + data.poster_path;
					}
					// image doesn't exist
					else {
						newMovie.image = '/images/noImage.png';
					}
					// RELEASE_DATE
					// if there is a release date listed
					if (data.release_date) {
						newMovie.releaseDate = new Date(data.release_date);
						// determines whether the year, month, and day are all in the provided release date
						var splitDate = data.release_date.split('-');
						newMovie.rDateTypes = splitDate.length;
					}
					// if no release date is given
					else {
						newMovie.releaseDate = new Date();
						newMovie.rDateTypes = 0;
					}
					// GENRE(S)
					newMovie.genre = [];
					for (var j = 0; j < data.genres.length; j++) {
						newMovie.genre.push(data.genres[j].name);
					}
					// save new Movie
					newMovie.save(function(err, savedMovie, count) {
						if (err) {
							console.log(err);
							res.render('addMovie', {message: 'Something went wrong, choose your film again (or a different one)'});
						}
						else {
							res.redirect('/myMovies');
						}
					});
				}
				// movie already exists in the "movies" collection
				else {
					// if the user hasn't already said they've watched it, indicate they've watched it
					if (movie.watchedBy.indexOf(req.user._id) < 0) {
						movie.watchedBy.push(req.user._id);
					}
					// save updated Movie
					movie.save(function(err, savedMovie, count) {
						if (err) {
							console.log(err);
							res.redirect('/myMovies');
						}
						else {
							res.redirect('/myMovies');
						}
					});
				}
			});
		}
	});
});


/* Renders the individual info page for each film */
router.get('/movie/:slug', function(req, res) {
	// search the database for the movie referenced by the slug
	Movie.findOne({slug: req.params.slug}, function(err, movie, count) {
		if (err) {
			console.log(err);
			res.redirect('/myMovies');
		}
		// if the movie isn't found
		else if (!movie) {
			console.log('You don\'t have access to that film');
			res.redirect('/myMovies');
		}
		// movie exists in database
		else {
			// the user hasn't watched this movie (and therefore should not be able to see it's page)
			if (movie.watchedBy.indexOf(req.user._id) < 0) {
				console.log('You don\'t have access to that film');
				res.redirect('/myMovies');
			}
			// the user has watched this movie
			else {
				// checks if the movie has been rated by the user
				var noRating = true;
				var userRating;
				for (var i = 0; i < movie.ratings.length; i++) {
					// movie has been rated by the current user
					if (movie.ratings[i].user.equals(req.user._id)) {
						userRating = movie.ratings[i].rating;
						noRating = false;
						break;
					}
				}
				// stores a human-readable version of the date that is fed into the template
				var printableDate = movie.releaseDate.toDateString();
				res.render('moviePage', {movie: movie, printableDate: printableDate, noRating: noRating, userRating: userRating});
			}
		}
	});
});


/* Handles the rating feature on individual movie page (non ajax version - old version but i left it here because the ajax version is based on it) */
router.post('/movie/:slug/rateMovie', function(req, res) {
	// find the movie in the database being rated
	Movie.findOne({slug: req.params.slug}, function(err, movie, count) {
		if (err || !movie) {
			console.log(err);
			res.redirect('/myMovies');
		}
		// movie found
		else {
			var noRating = true;
			for (var i = 0; i < movie.ratings.length; i++) {
				// update rating if one already exists for this user
				if (movie.ratings[i].user.equals(req.user._id)) {
					noRating = false;
					movie.ratings[i].rating = req.body.rating;
					break;
				}
			}
			// store new rating if the user hasn't rated the film yet
			if (noRating) {
				var userRating = {
					user: req.user._id,
					rating: req.body.rating
				};
				movie.ratings.push(userRating);
			}
			// save the updated Movie
			movie.save(function(err, savedMovie, count) {
				if (err) {
					console.log(err);
					res.redirect('/myMovies/movie/' + req.params.slug);
				}
				else {
					// updates the lists with this film in them that the user is connected to
					RecList.find({$or: [{user: req.user._id}, {sharedWith: {$in: [req.user._id]}}]}, function(err, lists, count) {
						if (err) {
							console.log(err);
							res.redirect('/myMovies/movie/' + req.params.slug);
						}
						// no lists found related to the user
						else if (!lists || lists.length === 0) {
							res.redirect('/myMovies/movie/' + req.params.slug);
						}
						// found a list that the user is connected to (user is either author, or the list is shared with the user)
						else {
							var listsUpdated = 0;
							var listsToUpdate = lists.length;
							// recurrsive function to update each list
							var updateRatingsInList = function() {
								var thisList = lists[listsUpdated];
								var thisMovieInfo = thisList.movieInfo;
								// try to find the movie and the users rating and update if found
								for (var i = 0; i < thisMovieInfo.length; i++) {
									var movieObj = thisMovieInfo[i];
									if (movieObj.movie.equals(savedMovie._id)) {
										for (var j = 0; j < movieObj.ratings.length; j++) {
											var rating = movieObj.ratings[j];
											if (rating.user === req.user.username) {
												thisList.movieInfo[i].ratings[j].rating = +req.body.rating;
											}
										}
									}
								}
								listsUpdated++;
								// save the updated list
								thisList.save(function(err, savedList, count) {
									if (err) {
										console.log(err);
										res.redirect('/myMovies/movie/' + req.params.slug);
									}
									// if there are more lists to update, call function again (in save callback for previous list)
									else if (listsUpdated < listsToUpdate) {
										updateRatingsInList();
									}
									// if all of the lists have been updated, redirect
									else {
										res.redirect('/myMovies/movie/' + req.params.slug);
									}
								});
							};
							// first call of function
							updateRatingsInList();
						}
					});
				}
			});
		}
	});
});


/* Handles the rating feature on individual movie page */
router.post('/movie/:slug/rateMovieAJAX', function(req, res) {
	// find the movie in the database being rated
	Movie.findOne({slug: req.params.slug}, function(err, movie, count) {
		if (err || !movie) {
			console.log(err);
			res.json({message: 'error'});
		}
		// movie found
		else {
			var noRating = true;
			for (var i = 0; i < movie.ratings.length; i++) {
				// update rating if one already exists for this user
				if (movie.ratings[i].user.equals(req.user._id)) {
					noRating = false;
					movie.ratings[i].rating = req.body.rating;
					break;
				}
			}
			// store new rating if the user hasn't rated the film yet
			if (noRating) {
				var userRating = {
					user: req.user._id,
					rating: req.body.rating
				};
				movie.ratings.push(userRating);
			}
			// save the updated Movie
			movie.save(function(err, savedMovie, count) {
				if (err) {
					console.log(err);
					res.json({message: 'error'});
				}
				else {
					// updates the lists with this film in them that the user is connected to
					RecList.find({$or: [{user: req.user._id}, {sharedWith: {$in: [req.user._id]}}]}, function(err, lists, count) {
						if (err) {
							console.log(err);
							res.json({message: 'error'});
						}
						// no lists found related to the user
						else if (!lists || lists.length === 0) {
							res.json({message: 'error'});
						}
						// found a list that the user is connected to (user is either author, or the list is shared with the user)
						else {
							var listsUpdated = 0;
							var listsToUpdate = lists.length;
							// recurrsive function to update each list
							var updateRatingsInList = function() {
								var thisList = lists[listsUpdated];
								var thisMovieInfo = thisList.movieInfo;
								// try to find the movie and the users rating and update if found
								for (var i = 0; i < thisMovieInfo.length; i++) {
									var movieObj = thisMovieInfo[i];
									if (movieObj.movie.equals(savedMovie._id)) {
										for (var j = 0; j < movieObj.ratings.length; j++) {
											var rating = movieObj.ratings[j];
											if (rating.user === req.user.username) {
												thisList.movieInfo[i].ratings[j].rating = +req.body.rating;
											}
										}
									}
								}
								listsUpdated++;
								// save the updated list
								thisList.save(function(err, savedList, count) {
									if (err) {
										console.log(err);
										res.json({message: 'error'});
									}
									// if there are more lists to update, call function again (in save callback for previous list)
									else if (listsUpdated < listsToUpdate) {
										updateRatingsInList();
									}
									// if all of the lists have been updated, send success message
									else {
										res.json({message: req.body.rating});
									}
								});
							};
							// first call of function
							updateRatingsInList();
						}
					});
				}
			});
		}
	});
});

/* handles an ajax request for the current user's rating */
router.get('/movie/:slug/getMovieRating', function(req, res) {
	// finds the movie in the database
	Movie.findOne({slug: req.params.slug}, function(err, movie, count) {
		if (err || !movie || !req.user) {
			console.log(err);
			res.json({message: 'error'});
		}
		// if the movie hasn't been watched by the user (bad url), send err message
		else if (movie.watchedBy.indexOf(req.user._id) < 0) {
			res.json({message: 'error'});
		}
		// movie found in user's watched list
		else {
			// grab the user rating
			var userRating = 'no rating';
			for (var i = 0; i < movie.ratings.length; i++) {
				if (movie.ratings[i].user.equals(req.user._id)) {
					userRating = movie.ratings[i].rating;
					break;
				}
			}
			// if the user's rating can't be found - return a string
			if (userRating === 'no rating') {
				res.json({message: 'error'});
			}
			// user's rating is found - return number
			else {
				res.json({message: userRating});
			}
		}
	});
});


/* Handles adding a movie to a user's watched list from a recommendation list (sent by another user) */
router.post('/addWatchedFromRecList', function(req, res) {
	// movie should already exist in the db in order to be on a list
	Movie.findOne({_id: req.body.movieID}, function(err, movie, count) {
		if (err) {
			console.log(err);
			res.redirect('/myRecs/list/' + req.body.listSlug);
		}
		// movie did not exist in database - bad url
		else if (!movie) {
			console.log('Bad URL');
			res.redirect('/myRecs/list/' + req.body.listSlug);
		}
		// movie found
		else {
			// if the user hasn't already indicated that they've watched the movie, this indicates that they have
			if (movie.watchedBy.indexOf(req.user._id) < 0) {
				movie.watchedBy.push(req.user._id);
			}
			// saves the updated Movie
			movie.save(function(err, savedMovie, count) {
				if (err) {
					console.log(err);
					res.redirect('/myRecs/list/' + req.body.listSlug);
				}
				// successful save
				else {
					// if the user had already watched & rated the film, this updates their rating in the list that they accessed it from 
					var movieRatings = savedMovie.ratings;
					var userHasRated = false;
					var userRating = 0;
					// searches for the user's rating
					for (var i = 0; i < movieRatings.length; i++) {
						if (movieRatings[i].user.equals(req.user._id)) {
							userHasRated = true;
							userRating = movieRatings[i].rating;
						}
					}
					// if the user hasn't rated the film, no more steps necessary
					if (userHasRated === false) {
						res.redirect('/myRecs/list/' + req.body.listSlug);
					}
					// if the user has rated the film before
					else {
						// find the list that the user clicked on the "I've watched this" button in
						RecList.findOne({slug: req.body.listSlug}, function(err, list, count) {
							if (err) {
								console.log(err);
								res.redirect('/myRecs/list/' + req.body.listSlug);
							}
							// no list found - bad url
							else if (!list) {
								console.log('Bad URL');
								res.redirect('/myRecs/list/' + req.body.listSlug);
							}
							// list found
							else {
								// find the movie-ratings pair in movieInfo and update the user's rating
								var thisMovieInfo = list.movieInfo;
								for (var j = 0; j < thisMovieInfo.length; j++) {
									var thisMovieObj = thisMovieInfo[j];
									if (thisMovieObj.movie.equals(savedMovie._id)) {
										for (var k = 0; k < thisMovieObj.ratings.length; k++) {
											if (thisMovieObj.ratings[k].user === req.user.username) {
												thisMovieObj.ratings[k].rating = userRating;
											}
										}
									}
								}
								// save the updated list
								list.save(function(err, savedList, count) {
									if (err) {
										console.log(err);
										res.redirect('/myRecs/list/' + req.body.listSlug);
									}
									// successful save
									else {
										// go back to the list
										res.redirect('/myRecs/list/' + req.body.listSlug);
									}
								});
							}
						});
					}
				}
			});
		}
	});
});



module.exports = router;