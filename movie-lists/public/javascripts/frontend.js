var document;
var window;
var XMLHttpRequest;


document.addEventListener('DOMContentLoaded', function(event) {
	console.log('dom content loaded');


	/* INDIVIDUAL LIST PAGE */
	// 1) showing/hiding ratings for films in list 
	// 2) preventing the "username share" form from submitting if a username isn't entered
	function showRatings(event) {
		console.log('show');
		this.removeEventListener('click', showRatings);
		var ratings = this.parentElement.getElementsByClassName('ratings')[0];
		ratings.getElementsByTagName('button')[0].addEventListener('click', hideRatings);
		ratings.classList.remove('hidden');
	}
	function hideRatings(event) {
		console.log('hide');
		this.removeEventListener('click', hideRatings);
		var ratings = this.parentElement;
		ratings.classList.add('hidden');
		var dispRatings = ratings.parentElement.getElementsByClassName('displayRatings')[0];
		dispRatings.addEventListener('click', showRatings);
	}
	if (window.location.href.match('/myLists/list')) {
		console.log('individual list page');
		// 1)
		var movies = document.getElementsByClassName('movie');
		for (var i = 0; i < movies.length; i++) {
			var displayRatings = movies[i].getElementsByClassName('displayRatings')[0];
			displayRatings.addEventListener('click', showRatings);
		}
		// 2)
		var btn = document.getElementById('usernameShareBTN');
		var input = document.getElementById('user');
		// if no input is given, prevent form submission
		btn.addEventListener('click', function(event) {
			if (!input.value) {
				event.preventDefault();
				window.alert('Oops! You forgot to enter username!');
			}
		});
	}

	/* MYMOVIES PAGE */
	// prevents the form on the 1st page of "add Movie" if a query isn't entered
	if (window.location.pathname === '/myMovies' || window.location.pathname === '/myMovies/') {
		console.log('myMovies page - 1st form pg');
		var btnFM = document.getElementById('findMovieBTN');
		var inputFM = document.getElementById('titleInput');
		// if no input is given, prevent form submission
		btnFM.addEventListener('click', function(event) {
			if (!inputFM.value) {
				event.preventDefault();
				window.alert('Oops! You forgot to enter a title!');
			}
		});
	}

	/* FINDMOVIES PAGE */
	// prevents the form on the 2nd page of "add Movie" if a film option isn't selected
	if (window.location.pathname === '/myMovies/findMovie' || window.location.pathname === '/myMovies/findMovie/') {
		console.log('myMovies/findMovie page - 2nd form pg');
		var btnAM = document.getElementById('addMovieBTN');
		var inputs = document.getElementsByTagName('input');
		// if no movie is selected, prevent form submission
		btnAM.addEventListener('click', function(event) {
			var oneActive = false;
			for (var i = 0; i < inputs.length; i++) {
				if (inputs[i].checked) {
					oneActive = true;
					break;
				}
			}
			if (oneActive === false) {
				event.preventDefault();
				window.alert('Oops! You forgot to select a film!');
			}
		});
	}

	/* INDIVIDUAL MOVIE PAGE */
	if (window.location.pathname.match('/myMovies/movie')) {
		// removes additional comma from genres list
		console.log('individual movies page');
		var genreList = document.getElementById('genres');
		var genreTrimmedContent = genreList.textContent.trim();
		// if there is a genre list and it ends in a comma, remove the comma
		if (genreTrimmedContent.length > 0 && genreTrimmedContent.lastIndexOf(',') === genreTrimmedContent.length - 1) {
			genreList.textContent = genreTrimmedContent.slice(0, genreTrimmedContent.length - 1);
		}

		// hides/unhides rating feature & makes rating feature use AJAX calls
		var showFormBTN = document.getElementById('showRatingForm');
		var rForm = document.getElementById('ratingForm');
		var ratingBTN = document.getElementById('submitRatingBTN');
		showFormBTN.addEventListener('click', function(event) {
			showFormBTN.classList.add('hidden');
			rForm.classList.remove('hidden');
		});
		ratingBTN.addEventListener('click', function(event) {
			event.preventDefault();
			rForm.classList.add('hidden');
			showFormBTN.classList.remove('hidden');
			// rating feature AJAX
			var formInputVal = document.getElementById('ratingOptions').value;
			var req = new XMLHttpRequest();
			req.open('POST', window.location.href + '/rateMovieAJAX', true);
			req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			req.send('rating=' + formInputVal);
			req.onreadystatechange = function() {
			    if (req.readyState === XMLHttpRequest.DONE) {
			    	// creates a new request to get the updated rating (i6 was preventing the update from showing for the first time without 2nd request)
			    	var req2 = new XMLHttpRequest();
			        req2.open('GET', window.location.href + '/getMovieRating', true);
			        req2.addEventListener('load', function() {
			        	var response = JSON.parse(req2.responseText);
			        	if (!isNaN(response.message)) {
			        		document.getElementsByClassName('userRating')[0].textContent = 'Your rating: ' + response.message + '/5';
			        	}
			        	else {
			        		console.log('here');
			        	}
			        });
			        req2.send();
			    }
			};
		});
	}

	/* MYLISTS PAGE */
	// prevents the form on the first page of "new list" from submitting if a listname isn't entered
	if (window.location.pathname === '/myLists' || window.location.pathname === '/myLists/') {
		console.log('myLists page - 1st form pg');
		var btnCL = document.getElementById('createListBTN');
		var inputCL = document.getElementById('nameInput');
		// if no input is given, prevent form submission
		btnCL.addEventListener('click', function(event) {
			if (!inputCL.value.trim()) {
				event.preventDefault();
				window.alert('Oops! You forgot to enter a name for your list!\n(the name must have at least one non-whitespace character)');
			}
		});
	}

	/* FINDMOVIES PAGE */
	// prevents the form on the 2nd page of "add Movie" if a film option isn't selected
	if (window.location.pathname.match('/myLists/newList')) {
		console.log('myLists/newList - 2nd form pg');
		var btnCM = document.getElementById('chooseMoviesBTN');
		var inputsCM = document.getElementsByTagName('input');
		// if no movie is selected, prevent form submission
		btnCM.addEventListener('click', function(event) {
			var oneActive = false;
			for (var i = 0; i < inputsCM.length; i++) {
				if (inputsCM[i].checked) {
					oneActive = true;
					break;
				}
			}
			if (oneActive === false) {
				event.preventDefault();
				window.alert('Oops! You forgot to select what films you want to add to your list!\n(you must choose at least one)');
			}
		});
	}
});






