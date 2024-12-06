// Featured content management
class FeaturedContent {
    constructor() {
        this.featuredSection = document.querySelector('.featured-section');
        this.currentIndex = 0;
        this.rotationInterval = 10000; // 10 seconds
        this.apiKey = '1d21d96347d1b72f32806b6256c3a132';  // TMDB API key

        // Initialize content arrays
        this.popularMovies = [];
        this.trendingShows = [];
        this.latestAnime = [];
        
        // Initialize favorites after ensuring favoritesManager is ready
        this.initializeFavorites();
        
        // Start content rotation
        this.startContentRotation();
    }

    async initializeFavorites() {
        // Check if favoritesManager is already initialized
        if (window.favoritesManager?.initialized && window.userManager?.getCurrentUser()) {
            this.updateFavoritesSection();
            return;
        }

        // Wait for favoritesManager to be available and initialized
        while (!window.favoritesManager?.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Now check if user is logged in and update favorites
        if (window.userManager?.getCurrentUser()) {
            this.updateFavoritesSection();
        }
    }

    async fetchTMDBContent() {
        try {
            // Fetch popular movies
            const moviesResponse = await fetch(
                `https://api.themoviedb.org/3/movie/popular?api_key=${this.apiKey}&language=en-US&page=1`
            );
            const moviesData = await moviesResponse.json();
            this.popularMovies = moviesData.results.slice(0, 8).map(movie => ({
                id: movie.id,
                title: movie.title,
                type: 'movie',
                image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                rating: movie.vote_average
            }));

            // Fetch trending TV shows
            const showsResponse = await fetch(
                `https://api.themoviedb.org/3/tv/popular?api_key=${this.apiKey}&language=en-US&page=1`
            );
            const showsData = await showsResponse.json();
            this.trendingShows = showsData.results.slice(0, 8).map(show => ({
                id: show.id,
                title: show.name,
                type: 'tv',
                image: `https://image.tmdb.org/t/p/w500${show.poster_path}`,
                rating: show.vote_average
            }));

            // For anime, we'll use a specific keyword search
            const animeResponse = await fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${this.apiKey}&language=en-US&page=1&query=anime&with_keywords=210024`
            );
            const animeData = await animeResponse.json();
            this.latestAnime = animeData.results.slice(0, 8).map(anime => ({
                id: anime.id,
                title: anime.name,
                type: 'anime',
                image: `https://image.tmdb.org/t/p/w500${anime.poster_path}`,
                rating: anime.vote_average
            }));

            // Update the display
            this.populateFeaturedContent();
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    }

    createMediaCard(item) {
        // Default image for when poster is missing
        const defaultImage = 'images/no-poster.svg';
        const imageUrl = item.image || item.poster || defaultImage;
        const rating = typeof item.rating === 'number' ? item.rating.toFixed(1) : 'N/A';
        
        return `
            <div class="media-card" data-id="${item.id}" data-media-type="${item.type}">
                ${window.favoritesManager?.createFavoriteButton(item.id) || ''}
                <div class="media-content" onclick="handleMediaClick('${item.type}', ${item.id}, '${(item.title || '').replace(/'/g, "\\'")}')">
                    <img src="${imageUrl}" alt="${item.title || 'Untitled'}" loading="lazy" onerror="this.src='${defaultImage}'">
                    <div class="media-title">${item.title || 'Untitled'}</div>
                    <div class="media-rating">★ ${rating}</div>
                </div>
            </div>
        `;
    }

    populateFeaturedContent() {
        const popularMoviesContainer = document.getElementById('popularMovies');
        const trendingShowsContainer = document.getElementById('trendingShows');
        const latestAnimeContainer = document.getElementById('latestAnime');

        if (popularMoviesContainer) {
            popularMoviesContainer.innerHTML = this.popularMovies.map(movie => this.createMediaCard(movie)).join('');
        }
        if (trendingShowsContainer) {
            trendingShowsContainer.innerHTML = this.trendingShows.map(show => this.createMediaCard(show)).join('');
        }
        if (latestAnimeContainer) {
            latestAnimeContainer.innerHTML = this.latestAnime.map(anime => this.createMediaCard(anime)).join('');
        }

        // Add favorites section if user is logged in
        if (window.userManager?.getCurrentUser()) {
            this.updateFavoritesSection();
        }

        // Listen for login/logout events
        window.addEventListener('userLogin', () => this.updateFavoritesSection());
        window.addEventListener('userLogout', () => {
            const favoritesSection = document.querySelector('.favorites-section');
            if (favoritesSection) {
                favoritesSection.remove();
            }
        });
    }

    updateFavoritesSection() {
        const favorites = favoritesManager.getAllFavorites();
        let favoritesSection = document.querySelector('.favorites-section');
        
        if (!favoritesSection) {
            favoritesSection = document.createElement('section');
            favoritesSection.className = 'favorites-section';
            favoritesSection.innerHTML = `
                <h2>My Favorites</h2>
                <div id="favoritesContent" class="favorites-grid"></div>
            `;
            this.featuredSection.parentNode.insertBefore(favoritesSection, this.featuredSection);
        }

        const favoritesContent = favoritesSection.querySelector('#favoritesContent');
        if (favorites.length > 0) {
            // Display only first 5 favorites
            const displayedFavorites = favorites.slice(0, 5);
            favoritesContent.innerHTML = displayedFavorites.map(item => this.createMediaCard({
                ...item,
                rating: item.rating || 0
            })).join('');
            
            // Add "See More" link if there are more than 5 favorites
            if (favorites.length > 5) {
                const seeMoreDiv = document.createElement('div');
                seeMoreDiv.className = 'see-more-favorites';
                seeMoreDiv.innerHTML = `
                    <a href="favorites.html" class="see-more-link">
                        See More (${favorites.length - 5} more)
                    </a>
                `;
                favoritesContent.appendChild(seeMoreDiv);
            }
        } else {
            favoritesContent.innerHTML = '<p class="no-favorites">No favorites yet. Click the heart icon on any media to add it to your favorites!</p>';
        }
    }

    startContentRotation() {
        // Initial fetch
        this.fetchTMDBContent();

        // Set up periodic content refresh
        setInterval(() => {
            this.fetchTMDBContent();
        }, this.rotationInterval);
    }

    hide() {
        if (this.featuredSection) {
            this.featuredSection.style.display = 'none';
        }
    }

    show() {
        if (this.featuredSection) {
            this.featuredSection.style.display = 'block';
        }
    }
}

// Create and expose global instance
window.featuredContent = new FeaturedContent();

// Handle media click
function handleMediaClick(type, id, title) {
    // Treat anime as TV shows for playback
    if (type === 'tv' || type === 'anime') {
        window.location.href = `player.html?type=tv&id=${id}&season=1&episode=1`;
    } else {
        window.location.href = `player.html?type=${type}&id=${id}`;
    }
}

// Setup search functionality
document.getElementById('searchBtn')?.addEventListener('click', function() {
    const query = document.getElementById('searchInput')?.value.trim();
    if (query) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
});

// Add enter key support for search
document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }
});

// Clear search on input clear
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    if (e.target.value.trim() === '') {
        resultsContainer.innerHTML = '';
        window.featuredContent.show();
    }
});
