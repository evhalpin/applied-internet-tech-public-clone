# The Watchlist ###

## Project Description:

The Watchlist is a web application that makes recommending movies to friends simpler. A user can create a personal list of films that they have seen and the rate each film with a rating out of 5, and then generate recommendation lists for their friends from those films. These recommendation lists can be shared on facebook (where the shared list can be viewed by anyone, even if they don't have a Watchlist account), or shared through the site (provided that the friend the user is sharing with also has an account on The Watchlist). If the user's friend does have a Watchlist account, they can add movies from their friend's recommendation list to their own list of watched movies, rate them, and then those ratings are visible to the user who shared the list with them. Movie information is pulled from The Movie Database's (TMD) API.



## Sample documents:

The Movie documents store the information pulled from the TMD API that will be needed by the app. The film's title, director (a Person document), releaseDate, runtime, TMD ID number are all required for each Movie stored, but an image for the film (like a poster), the genre IDs (which come from TMD's API), and the film's tagline are optional. The releaseDate is a Date object and rDateTypes is used to indicate what type of value was fed to the Date object (just a year? a year and the month? the whole date?). If there was no releaseDate in the data sent back by the TMD API, a new Date is created (because  releaseDate is required for each Movie document), but rDateTypes is set to 0 to tell the application to treat this date as fake. Each movie has a ratings field which stores an array of objects consisting of a user's _id and that user's rating. In addition, each Movie has an inList field which holds the slugs of every list the movie is in.
```
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
    inList: [String]
});
```

A Person stores a first and last name for someone (first name is not required, but a last name is). If a director has only one name, this is stored as their last name.
```
var Person = new mongoose.Schema({
    first: String,
    last: {
        type: String,
        required: true
    }
});
```

#### EXAMPLE:
```
forrestGump = {
	"title": "Forrest Gump",
	"director": {
		"first": "Robert",
		"last": "Zemeckis"
	},
	"releaseDate": Date(1994-07-06),
	"rDateTypes": 3,
	"runtime": 142,
	"tmdID": 13,
	"watchedBy": [ObjectId('<some user _id>')],
	"screenwriter": {
		"first": "Eric",
		"last": "Roth"
	},
	"image": "/ctOEhQiFIHWkiaYp7b0ibSTe5IL.jpg",
	"genre": ["Comedy", "Drama", "Romance"],
	"tagline": "The world will never be the same, once you've seen it through the eyes of Forrest Gump.",
	"ratings": [],
	"inList": []
}
```
** After adding Forrest Gump to the recommendation lists "Best Dramas" and "Movies for Mom"
```
"inList": ["Best Dramas", "Movies for Mom"]
```

** After the user with _id === 'some other user _id' adds the movie to their watched list and rates the movie 4 out of 5
```
"watchedBy": [ObjectId('<some user _id>'), ObjectId('<some other user _id>')]
"ratings": [{user: ObjectId('<some other user _id'), rating: 5}]
```

## Wireframes:
Register an account:

![Alt text](/Documentation/register.png?raw=true "Register")
* (no confirm password field)
Login:

![Alt text](/Documentation/login.png?raw=true "Login")

User's homepage (myMovies):

![Alt text](/Documentation/users_home.png?raw=true "User's homepage")
* + button in corner links to the movie's page 

The movie's page (with all available info):

![Alt text](/Documentation/movie_profile.png?raw=true "Movie page")
* no add-to-list feature on movie page and no similar movies feature 

myLists (the recommendation lists the user has created):

![Alt text](/Documentation/all_user_lists.png?raw=true "myLists")
* no movies-in-list preview for each list, instead, a list of usernames that the list has been shared with is shown 

A specific list's page:

![Alt text](/Documentation/single_user_list.png?raw=true "A single list")
* different styling 

The form to add a new list:

![Alt text](/Documentation/new_list.png?raw=true "New list form")
* new list form is now a 2-page form. 1st the user chooses a list name, and 2nd they pick movies to add to the list from their watched movies list 

myRecommendations:

![Alt text](/Documentation/recommendations.png?raw=true "myRecommendations")
* no movies-in-list preview for each recommendation list, instead, the username of the recommendation list's author is shown 

A single recommendation list viewed while logged in:

![Alt text](/Documentation/recommended_list_logged_in.png?raw=true "A single recommendation list - logged in")
* user clicks "I've seen this" button and then can submit a rating for the movie from their watched movies list (which then update's their rating that the recommendation list's author can see. Also, different styling 

A single recommendation list viewed while logged in:

![Alt text](/Documentation/recommended_list_no_login.png?raw=true "A single recommendation list - not logged in")
* different styling 



## Sitemap:
![Alt text](/Documentation/sitemap.jpg?raw=true "SiteMap")
* movie pages are only accessible from the "myMovies" page/subdomain, not from lists or recommendation lists, and these movie pages do not link to any other similar movies' pages 

## User stories:

#### User1
As a user, named User1, I want to keep track of the movies I've watched so that I can then recommend them to my friends.

As User1 I'd like to create specific lists of movies that I can then recommend to my friends, so I can give them more personalized recommendations and group the movies, rather than recommend each film one-by-one.

As User1 I'd like to be able to share a recommendation list I've created with a specific user on the site and on social media, so that I can send my recommendations to friends regardless of whether or not they have an account on the site.

As User1 I'd like to be able to see the ratings that my friend with an account on the site gave each movie on the list I sent them, so that I know what they thought of each film.
***
#### User2 
As a user, named User2, I want to be able to see the list of films recommended to me by User1, so that I can watch them myself.
		
As User2, I want to be able to share my rating of the movies recommended with User1, so that they know what I thought of the films.

As User2, I'd like to be able to add the movies recommended to me to my own list of watched movies after I finish them, so that I can add the movies to my own list of recommendations.

As User2, I'd like to have the same abilities as User1, because that's only fair as we're both users. :)
***
#### Non-user 
As a non-user friend of User1, I want to be able to see the list of films recommended to me by User1 so that I can watch them myself.



## Research Topics:

#### The Movie Database API
For my project proposal, I said:
> I will be using this API to pull in all of the required information about each movie that gets stored in someone's list(s). I've chosen to use this API in particular because it will allow me to ensure all movies added are actual movies (or at least, exist within a database that I don't need to validate) and the API has some rating & recommendations features of it's own that I may be able to integrate later on. Also, this API allows people to get developer/non-commercial keys, whereas some other APIs (like the Rotten Tomatoes one), do not.
> As I've never tried to integrate an API into an application before, this may be tricky to get at first. But the data returned by requests to the API looks pretty easy to handle, so I still think it's manageable. I would estimate 4 points or so for the integration, 5 if I end up struggling more than I expect to.


The API didn't give me any more trouble than I expected. The only issue that took me some time to resolve was that 2 requests must be made to the API: 1 to search the database for the films matching the user's query string, and 2 to grab all of the necessary information for the film (for example, the search returns the title, release date, runtime, etc. but not the crew listings needed to get the director's name, that requires an additional request). To simplify storing data into Movie documents, I decided to use the 2nd request made to grab all of the information needed, rather than getting part of what I needed from the 1st request and the rest of what I needed from the 2nd. Because of this extra level of complexity though, I decided not to integrate the "similar movies" feature (which would have come from the API) as this would require yet another request to be made (meaning 3 calls to the API just to add one movie). I think that my original estimation of 4 points for the integration of this API should stand.



#### Facebook sharing
For my project proposal, I said:
> Users will have the option to share URLs to their recommendation lists on facebook so that un-registered friends can still view the user's lists (though they won't be able to submit their own rating of the film).
> This doesn't seem too complex, so I think it'll only be 2 points or so.
> I currently plan on the users to register an account through my app, rather than associate their account with facebook, but that may change as well and I may end up using a facebook login to make sharing between users & facebook sharing more streamlined. In this case, I'd probably say full facebook integration (sharing & login) would be worth more points.


I implemented facebook sharing of lists that use a list visible to the public. It was a little easier than I expected it to be (I had never integrated a social media sharing button into a project before so I didn't know what to expect). However, tied into the project's requirement that `"data specified as private to a user cannot be viewed by another user"`, I had to implement a way of making sure that the link shared could not be altered in a simple way to see another non-shared list (ex. that changing the list slug would not allow you to see a different list than the original shared list). To do this, each external share link includes a hash of the list's creation date (toString string) and the route handler for external links makes sure the hash is the value it should be before displaying the list. This extra step makes me feel that even though the integration of the share button was easier than expected, the actual functionality of the share was more complex than I realized, so I would still say that 2 points are deserved for this integration.



#### Authentication
Although I didn't originally list it as a research topic in my project proposal, I did implement authentication through mongoose (passport) allowing a user to create an account and login and logout of their account. I used Prof. Versoza's example as a guide while implementing authentication. Also, user accounts are used by my web app to share recommendation lists (lists are shared with other users by their usernmame), so I think my implementation of user authentication should count as the 6 point research topic it's listed as in the project requirements.



#### CSS Framework - maybe Bootstrap
For my project proposal, I said:
> I'd like to be able to customize my theme, but not build it all from scratch, especially because ideally my design would be responsive. Therefore, I'd like to use somesort of CSS framework, though I'm not sure which just yet.


I sort of integrated Bootstrap. I used the CDN to deliver the code to my site though, and then used a mix of my own styles overwriting bootstrap's and inline styles for a few specific elements (like the rating div in myLists/list lists). Most of the changes I made were size control changes to divs, many of the colors, shapes, border styles, etc. remain the same. I don't know if this counts for the project requirements that we `"(don't just use stock Bootstrap - minimally configure a theme)"` or not, but I am leaving it listed as a research topic (I have more points than necessary even without it).





