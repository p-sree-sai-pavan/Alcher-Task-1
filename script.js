// My movie app's main JavaScript file!

// Keeping track of all the movies and TV shows I've got
let allMovies = []; 
let mockTvShows = []; 

// For pagination, though not fully implemented yet
let currentPage = 1; 
const moviesPerPage = 10; 

// How many movies I want to show in each horizontal row on the home screen
const homeSectionDisplayCount = 18; 

// A little timer for the search bar so it doesn't search on every single key press
let searchTimeout = null; 

// Grabbing all the main sections from my HTML
const homePage = document.getElementById('home-page');
const discoverPage = document.getElementById('discover-page');
const liveTvPage = document.getElementById('live-tv-page');
const onDemandPage = document.getElementById('on-demand-page');
const movieDetailPage = document.getElementById('movie-detail-page');

// References to the containers for movie cards on the home page
const bingeShowsSection = homePage.querySelector('.binge-section:nth-of-type(1)');
const bingeShowsContainer = document.getElementById('binge-shows-container'); 
const popularIndiaSection = homePage.querySelector('.binge-section:nth-of-type(2)');
const popularIndiaContainer = document.getElementById('popular-india-container'); 

// The new sections I added for more content on the home page
const trendingNowContainer = document.getElementById('trending-now-container');
const newReleasesContainer = document.getElementById('new-releases-container');
const criticallyAcclaimedContainer = document.getElementById('critically-acclaimed-container');
const actionAdventureContainer = document.getElementById('action-adventure-container');
const comediesContainer = document.getElementById('comedies-container');
const documentariesContainer = document.getElementById('documentaries-container');
const sciFiFantasyContainer = document.getElementById('sci-fi-fantasy-container');
const familyFavoritesContainer = document.getElementById('family-favorites-container');


// Containers for the full-grid pages (Discover, Live TV, On Demand)
const discoverMoviesContainer = document.getElementById('discover-movies-container');
const liveTvShowsContainer = document.getElementById('live-tv-shows-container');
const onDemandMoviesContainer = document.getElementById('on-demand-movies-container');

// Elements for the search bar and movie detail page
const searchBar = document.querySelector('.searchbar');
const backToSectionsButton = movieDetailPage.querySelector('#back-to-sections-button');
const detailContentArea = movieDetailPage.querySelector('.detail-content-area');

// My navigation buttons
const homeButton = document.querySelector('.mainnav:nth-of-type(1)');
const liveTvButton = document.querySelector('.mainnav:nth-of-type(2)');
const onDemandButton = document.querySelector('.mainnav:nth-of-type(3)');
const discoverButton = document.querySelector('.mainnav:nth-of-type(4)');
const signInButton = document.querySelector('.button a');

// A little loading spinner I'll show when data is being fetched
let loadingIndicator = null;

/**
 * Shows a loading spinner to tell the user something's happening.
 */
function showLoadingIndicator() {
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            z-index: 1002;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        loadingIndicator.innerHTML = `
            <div class="spinner" style="border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid #fff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
            Loading content...
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'flex';
}

/**
 * Hides the loading spinner once content is ready.
 */
function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Grabs movie data from the API and also makes up some TV show data.
 */
async function fetchData() {
    showLoadingIndicator();
    try {
        console.log('Getting movies and making up some TV shows...');
        // Fetching a bunch of pages to make sure I have enough movies for all sections
        let fetchedMoviesPromises = [];
        for (let i = 1; i <= 20; i++) { 
            fetchedMoviesPromises.push(fetch(`https://jsonfakery.com/movies/paginated?page=${i}&per_page=${moviesPerPage}`));
        }

        const responses = await Promise.all(fetchedMoviesPromises);
        let allResponsesOk = true;
        for (const res of responses) {
            if (!res.ok) {
                allResponsesOk = false;
                throw new Error(`HTTP error! status: ${res.status}`);
            }
        }

        const data = await Promise.all(responses.map(res => res.json()));
        
        let collectedMovies = [];
        data.forEach(d => {
            if (d && Array.isArray(d.data)) {
                collectedMovies = [...collectedMovies, ...d.data];
            }
        });

        if (collectedMovies.length > 0) {
            allMovies = collectedMovies;
            console.log("All the movies I fetched:", allMovies);
            generateMockTvShows(); // Time to make some fake TV shows!
            // Figure out which page to show based on the URL when the app loads
            renderCurrentPageFromHash(); 
        } else {
            console.warn("Couldn't get movie data or it was empty:", data);
            displayMessage("No movie data found. Oops!");
        }

    } catch (error) {
        console.error("Failed to get data:", error);
        displayMessage("Couldn't load content. Give it another try later!");
    } finally {
        hideLoadingIndicator();
    }
}

/**
 * Creates some dummy TV show data using the movie data I already have.
 */
function generateMockTvShows() {
    mockTvShows = allMovies.slice(0, 20).map((movie, index) => ({
        id: `tv-${movie.id}`,
        original_title: `TV Show: ${movie.original_title} Series`,
        overview: `A binge-worthy series based on ${movie.original_title}. ${movie.overview}`,
        poster_path: movie.poster_path, 
        backdrop_path: movie.backdrop_path,
        release_date: `201${index % 5 + 5}-01-01`, 
        casts: movie.casts,
        adult: movie.adult,
        popularity: movie.popularity * 0.8, 
        vote_average: Math.min(10, movie.vote_average + (index % 3 - 1)), 
        vote_count: movie.vote_count,
        isTvShow: true 
    }));
    console.log("Here are my made-up TV shows:", mockTvShows);
}

/**
 * Shows a specific page and updates the browser's history so back/forward buttons work.
 * @param {string} pageId - Which page to show ('home', 'discover', 'live-tv', 'on-demand', 'detail').
 * @param {object} [data] - Any extra data needed, especially for the movie detail page.
 * @param {boolean} [pushState=true] - Should I add this to the browser history? (Usually yes).
 */
function showPage(pageId, data = null, pushState = true) {
    // Hiding all the pages first
    homePage.style.display = 'none';
    discoverPage.style.display = 'none';
    liveTvPage.style.display = 'none';
    onDemandPage.style.display = 'none';
    movieDetailPage.style.display = 'none';

    // Making sure scrolling is normal
    document.body.style.overflow = '';

    let urlHash = `#${pageId}`;
    if (pageId === 'detail' && data && data.id) {
        urlHash = `#detail/${data.id}`;
    }

    if (pushState) {
        history.pushState({ page: pageId, dataId: data ? data.id : null }, '', urlHash);
    }

    // Now, actually put the content on the page
    renderPageContent(pageId, data);
}

/**
 * Figures out which page to show when the URL hash changes (like when using back/forward buttons).
 */
function renderCurrentPageFromHash() {
    const hash = window.location.hash;
    let pageId = 'home'; // Default to home if no hash
    let dataId = null;

    if (hash) {
        const parts = hash.split('/');
        pageId = parts[0].substring(1); // Get the page ID without the '#'
        if (parts.length > 1) {
            dataId = parts[1]; // Get the item ID if it's a detail page
        }
    }

    let data = null;
    if (pageId === 'detail' && dataId) {
        // Trying to find the movie or TV show by its ID
        data = allMovies.find(m => m.id == dataId) || mockTvShows.find(tv => tv.id == `tv-${dataId}`);
        if (!data) {
            console.warn(`Couldn't find data for ID ${dataId}. Going back to home.`);
            pageId = 'home'; // If I can't find it, just go home
        }
    }

    // Render the content without adding another history entry
    renderPageContent(pageId, data);
}

/**
 * This function actually puts the right content on the screen for a given page.
 * @param {string} pageId - The ID of the page to show.
 * @param {object} [data] - Optional data for the detail page.
 */
function renderPageContent(pageId, data = null) {
    // Hiding everything first, just to be sure
    homePage.style.display = 'none';
    discoverPage.style.display = 'none';
    liveTvPage.style.display = 'none';
    onDemandPage.style.display = 'none';
    movieDetailPage.style.display = 'none';

    // Resetting scroll
    document.body.style.overflow = '';

    switch (pageId) {
        case 'home':
            homePage.style.display = 'block';
            renderMovieSections(allMovies, 'default');
            break;
        case 'discover':
            discoverPage.style.display = 'block';
            discoverPage.querySelector('.section-header h3').textContent = 'Discover All Movies >';
            discoverPage.querySelector('.subheading').textContent = 'Explore our entire collection';
            renderFullGrid(allMovies, discoverMoviesContainer);
            break;
        case 'live-tv':
            liveTvPage.style.display = 'block';
            renderFullGrid(mockTvShows, liveTvShowsContainer, true);
            break;
        case 'on-demand':
            onDemandPage.style.display = 'block';
            // Sorting movies by their rating for the "highest rated" section
            const highestRatedMovies = [...allMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            renderFullGrid(highestRatedMovies, onDemandMoviesContainer);
            break;
        case 'detail':
            movieDetailPage.style.display = 'block';
            document.body.style.overflow = 'auto';
            renderMovieDetailPageContent(data); 
            break;
        default:
            console.error('Hmm, not sure which page to render:', pageId);
            homePage.style.display = 'block'; 
            renderMovieSections(allMovies, 'default');
    }
}


/**
 * Fills up the horizontal movie sections on the Home page.
 * @param {Array} moviesData - All the movie data I have.
 * @param {string} mode - 'default' for the usual home page, 'all' if I want to show everything (though this now goes to Discover), or 'search' for search results.
 */
function renderMovieSections(moviesData, mode = 'default') {
    // Clearing out all the movie cards from all the containers first
    bingeShowsContainer.innerHTML = '';
    popularIndiaContainer.innerHTML = '';
    trendingNowContainer.innerHTML = '';
    newReleasesContainer.innerHTML = '';
    criticallyAcclaimedContainer.innerHTML = '';
    actionAdventureContainer.innerHTML = '';
    comediesContainer.innerHTML = '';
    documentariesContainer.innerHTML = '';
    sciFiFantasyContainer.innerHTML = '';
    familyFavoritesContainer.innerHTML = '';


    // Grabbing all the home page sections
    const allHomeSections = document.querySelectorAll('#home-page .binge-section');

    // Getting rid of any "Back to Sections" button that might be hanging around on the home page
    const existingBackButton = document.getElementById('back-to-sections-button-home');
    if (existingBackButton) {
        existingBackButton.remove();
    }

    if (mode === 'all') {
        // This part is mostly for when I used to show "all movies" on the home page.
        // Now, clicking "View All" sends you to the Discover page, so this might not be used much.
        bingeShowsContainer.classList.add('grid-view');
        renderMovieCardsIntoContainer(moviesData, bingeShowsContainer, true); 

        // Hiding all other sections if I'm showing everything in one big section
        allHomeSections.forEach(section => {
            if (section.id !== 'binge-shows-section') { 
                section.style.display = 'none';
            }
        });
        
        bingeShowsSection.querySelector('h3').textContent = 'All Movies >';
        bingeShowsSection.querySelector('.subheading').textContent = 'Full Catalog';

        const backButton = document.createElement('button');
        backButton.id = 'back-to-sections-button-home';
        backButton.textContent = '← Back to Sections';
        backButton.classList.add('mainnav');
        backButton.style.marginTop = '20px';
        backButton.style.marginLeft = '20px';
        homePage.prepend(backButton);

        backButton.addEventListener('click', () => {
            renderMovieSections(allMovies, 'default');
            backButton.remove();
        });

    } else { // This is for the regular Home page view with all 10 sections
        allHomeSections.forEach(section => section.style.display = 'block'); // Making sure all sections are visible

        // Making sure all card containers on the home page are in horizontal scroll mode
        const allCardsContainers = document.querySelectorAll('#home-page .cards-container');
        allCardsContainers.forEach(container => container.classList.remove('grid-view'));

        // Distributing movies to each section, taking 18 for each
        let currentMovieIndex = 0;

        const getSectionData = () => {
            const data = moviesData.slice(currentMovieIndex, currentMovieIndex + homeSectionDisplayCount);
            currentMovieIndex += homeSectionDisplayCount;
            return data;
        };

        // Filling up each section with movies
        renderMovieCardsIntoContainer(getSectionData(), bingeShowsContainer, false);
        renderMovieCardsIntoContainer(getSectionData(), popularIndiaContainer, false);
        renderMovieCardsIntoContainer(getSectionData(), trendingNowContainer, false);
        renderMovieCardsIntoContainer(getSectionData(), newReleasesContainer, false);

        // For critically acclaimed, I'm sorting all movies by their average vote
        const criticallyAcclaimed = [...moviesData].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, homeSectionDisplayCount);
        renderMovieCardsIntoContainer(criticallyAcclaimed, criticallyAcclaimedContainer, false);

        // For genres, I'm trying to filter by genre or keywords in the overview. If no matches, just use the next batch of movies.
        const actionAdventure = moviesData.filter(movie => (movie.genres && movie.genres.includes('Action')) || (movie.overview || '').toLowerCase().includes('action')).slice(0, homeSectionDisplayCount);
        renderMovieCardsIntoContainer(actionAdventure.length > 0 ? actionAdventure : getSectionData(), actionAdventureContainer, false);

        const comedies = moviesData.filter(movie => (movie.genres && movie.genres.includes('Comedy')) || (movie.overview || '').toLowerCase().includes('comedy')).slice(0, homeSectionDisplayCount);
        renderMovieCardsIntoContainer(comedies.length > 0 ? comedies : getSectionData(), comediesContainer, false);

        const documentaries = moviesData.filter(movie => (movie.genres && movie.genres.includes('Documentary')) || (movie.overview || '').toLowerCase().includes('documentary')).slice(0, homeSectionDisplayCount);
        renderMovieCardsIntoContainer(documentaries.length > 0 ? documentaries : getSectionData(), documentariesContainer, false);

        const sciFiFantasy = moviesData.filter(movie => (movie.genres && movie.genres.includes('Science Fiction')) || (movie.overview || '').toLowerCase().includes('sci-fi') || (movie.overview || '').toLowerCase().includes('fantasy')).slice(0, homeSectionDisplayCount);
        renderMovieCardsIntoContainer(sciFiFantasy.length > 0 ? sciFiFantasy : getSectionData(), sciFiFantasyContainer, false);

        const familyFavorites = moviesData.filter(movie => (movie.genres && movie.genres.includes('Family')) || (movie.overview || '').toLowerCase().includes('family')).slice(0, homeSectionDisplayCount);
        renderMovieCardsIntoContainer(familyFavorites.length > 0 ? familyFavorites : getSectionData(), familyFavoritesContainer, false);
    }
}

/**
 * Renders all items (movies or TV shows) in a big grid. Used for Discover, Live TV, and On Demand pages.
 * @param {Array} itemsToRender - The movies or TV shows to display.
 * @param {HTMLElement} container - Where to put the cards.
 * @param {boolean} [isTvShow=false] - Is this a TV show? (Just for the title prefix).
 */
function renderFullGrid(itemsToRender, container, isTvShow = false) {
    container.innerHTML = ''; // Clearing the container
    container.classList.add('grid-view'); // Making sure it's a grid

    itemsToRender.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.itemId = item.id || 'unknown'; 
        card.dataset.itemTitle = item.original_title || 'Untitled'; 

        const posterUrl = item.poster_path || `https://placehold.co/180x270/000000/FFFFFF?text=${encodeURIComponent(item.original_title || 'No Title')}`;
        const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : 'N/A';
        const titlePrefix = isTvShow ? 'TV Series: ' : '';

        card.innerHTML = `
            <img src="${posterUrl}" alt="${item.original_title || 'Untitled'}" onerror="this.onerror=null;this.src='https://placehold.co/180x270/000000/FFFFFF?text=Image Not Found';" />
            <h3>${titlePrefix}${item.original_title || 'Untitled'}</h3>
            <p>Year: ${releaseYear}</p>
        `;
        container.appendChild(card);

        card.addEventListener('click', () => showPage('detail', item));
    });
}


/**
 * Renders movie cards for the horizontal sections on the Home page.
 * @param {Array} moviesToRender - The movies to display.
 * @param {HTMLElement} container - The container for the cards.
 * @param {boolean} isGridView - Should this container be a grid? (False for horizontal sections).
 */
function renderMovieCardsIntoContainer(moviesToRender, container, isGridView) {
    container.innerHTML = '';

    if (isGridView) {
        container.classList.add('grid-view');
    } else {
        container.classList.remove('grid-view');
    }

    moviesToRender.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.movieId = movie.id || 'unknown'; 
        card.dataset.movieTitle = movie.original_title || 'Untitled'; 

        const posterUrl = movie.poster_path || `https://placehold.co/180x270/000000/FFFFFF?text=${encodeURIComponent(movie.original_title || 'No Title')}`;
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

        card.innerHTML = `
            <img src="${posterUrl}" alt="${movie.original_title || 'Untitled'}" onerror="this.onerror=null;this.src='https://placehold.co/180x270/000000/FFFFFF?text=Image Not Found';" />
            <h3>${movie.original_title || 'Untitled'}</h3>
            <p>Year: ${releaseYear}</p>
        `;
        container.appendChild(card);

        card.addEventListener('click', () => showPage('detail', movie));
    });

    // Adding the "View All" card if it's a horizontal section
    if (!isGridView) {
        const viewAllCard = document.createElement('div');
        viewAllCard.classList.add('card', 'view-all');
        viewAllCard.innerHTML = `
            <div class="view-all-content">
                <div class="grid-icon">☷</div>
                <p>View All</p>
            </div>
        `;
        container.appendChild(viewAllCard);

        viewAllCard.addEventListener('click', () => {
            showPage('discover'); // Clicking "View All" now takes you to the Discover page
        });
    }
}


/**
 * Renders the detailed view for a single movie or TV show.
 * @param {object} item - The movie or TV show object to display details for.
 */
function renderMovieDetailPageContent(item) { 
    console.log("Showing full details for:", item);

    const posterUrl = item.poster_path || `https://placehold.co/300x450/000000/FFFFFF?text=${encodeURIComponent(item.original_title || 'No Title')}`;
    const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : 'N/A';
    const backdropUrl = item.backdrop_path || '';

    let castHtml = '';
    if (item.casts && Array.isArray(item.casts) && item.casts.length > 0) {
        castHtml = `
            <div class="cast-section">
                <h4>Cast of ${item.original_title || 'This Title'}</h4>
                <div class="cast-list">
                    ${item.casts.map(member => `
                        <div class="cast-member">
                            <img src="${member.profile_path || 'https://placehold.co/50x50/cccccc/333333?text=N/A'}" alt="${member.name || 'Unknown Cast'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=N/A';" />
                            <p>${member.name || 'Unknown'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        castHtml = '<p class="cast-section">Cast information not available.</p>';
    }

    // Just placeholders for director and genre for now
    const director = 'N/A'; 
    const genre = 'N/A'; 
    const runtime = '2h 5m'; 

    detailContentArea.innerHTML = `
        <div class="movie-hero-section" style="background-image: url('${backdropUrl}');">
            <div class="hero-overlay"></div>
            <div class="hero-decorative-image" style="background-image: url('${backdropUrl}');"></div>
            <div class="hero-content">
                <img src="${posterUrl}" alt="${item.original_title || 'Untitled'}" class="movie-poster-large" onerror="this.onerror=null;this.src='https://placehold.co/200x300/000000/FFFFFF?text=Image Not Found';" />
                <div class="movie-info-large">
                    <h1>${item.original_title || 'Untitled'}</h1>
                    <p class="director-info">Directed by ${director}</p>
                    <div class="movie-meta-large">
                        <span>PG</span>
                        <span>${runtime}</span>
                        <span>${genre}</span>
                        <span>Action, Adventure, and more</span>
                    </div>
                    <div class="movie-ratings-large">
                        <span>${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                        <span class="rating-icon">👍 ${item.vote_average ? (item.vote_average * 10).toFixed(0) : 'N/A'}%</span>
                        <span class="rating-icon">❤️ ${item.popularity ? item.popularity.toFixed(0) : 'N/A'}%</span>
                    </div>
                    <div class="action-buttons-large">
                        <button class="add-to-watchlist">
                            <span class="icon">+</span> Add to Watchlist
                        </button>
                        <button class="action-icon"><span class="icon">🔗</span></button>
                        <button class="action-icon"><span class="icon">⬇️</span></button>
                        <button class="action-icon"><span class="icon">⬆️</span></button>
                    </div>
                    <p class="movie-description-inline">${item.overview || 'No description available.'}</p>
                </div>
            </div>
        </div>
        
        <div class="where-to-watch-section">
            <h4>Where to Watch ${item.original_title || 'This Title'}</h4>
            <p>There are no locations currently available for this title</p>
        </div>

        ${castHtml}
    `;
}

/**
 * Shows a quick message to the user (instead of those annoying alert boxes).
 * @param {string} message - The message to show.
 */
function displayMessage(message) {
    let messageBox = document.getElementById('custom-message-box');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'custom-message-box';
        messageBox.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            text-align: center;
        `;
        document.body.appendChild(messageBox);
    }
    messageBox.textContent = message;
    messageBox.style.opacity = '1';

    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.parentNode.removeChild(messageBox);
            }
        }, 300);
    }, 2000);
}


// --- Setting up what happens when you click the navigation buttons ---

homeButton.addEventListener('click', () => {
    displayMessage('Heading back home...');
    showPage('home');
});

liveTvButton.addEventListener('click', () => {
    displayMessage('Checking out Live TV...');
    showPage('live-tv');
});

onDemandButton.addEventListener('click', () => {
    displayMessage('Browsing On Demand content...');
    showPage('on-demand');
});

discoverButton.addEventListener('click', () => {
    displayMessage('Discovering new stuff...');
    showPage('discover');
});

signInButton.addEventListener('click', (event) => {
    event.preventDefault(); // Stop the link from actually going anywhere
    displayMessage('Sign In is not set up in this demo yet.');
});

backToSectionsButton.addEventListener('click', () => {
    // When I click the back button on a detail page, just go back in browser history
    history.back();
});


// Search bar magic with a slight delay
searchBar.addEventListener('input', (event) => {
    clearTimeout(searchTimeout); // Clear any previous search timer
    const searchTerm = event.target.value.toLowerCase();

    searchTimeout = setTimeout(() => {
        // Filtering both movies and TV shows
        const filteredMovies = allMovies.filter(item =>
            (item.original_title || '').toLowerCase().includes(searchTerm)
        );
        const filteredTvShows = mockTvShows.filter(item =>
            (item.original_title || '').toLowerCase().includes(searchTerm)
        );

        if (filteredMovies.length > 0 || filteredTvShows.length > 0) {
            const combinedResults = [...filteredMovies, ...filteredTvShows];
            // If there are results, go to the discover page and show them
            showPage('discover', null, true); 
            discoverMoviesContainer.innerHTML = ''; 
            renderFullGrid(combinedResults, discoverMoviesContainer); 
            discoverPage.querySelector('.section-header h3').textContent = 'Search Results >';
            discoverPage.querySelector('.subheading').textContent = `Found ${combinedResults.length} results for "${searchTerm}"`;
        } else {
            displayMessage(`No results found for "${searchTerm}". Bummer!`);
            showPage('home'); // If nothing, just go back home
        }
    }, 300); // Wait 300ms after typing stops
});

// --- Listening for browser back/forward button clicks ---
window.addEventListener('popstate', (event) => {
    // When the browser's back/forward button is used, re-render the page based on the URL
    renderCurrentPageFromHash();
});

// What happens when the page first loads
document.addEventListener('DOMContentLoaded', () => {
    fetchData(); // Get all the data and start the app!
});
