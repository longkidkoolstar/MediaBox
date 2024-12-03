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
        
        // Start content rotation
        this.startContentRotation();
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
        return `
            <div class="media-card" data-id="${item.id}" data-type="${item.type}" onclick="handleMediaClick('${item.type}', ${item.id}, '${item.title.replace(/'/g, "\\'")}')">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="media-title">${item.title}</div>
                <div class="media-rating">★ ${item.rating.toFixed(1)}</div>
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
