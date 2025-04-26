class SearchPage {
    constructor() {
        this.apiKey = '1d21d96347d1b72f32806b6256c3a132';
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.filterBtns = document.querySelectorAll('.filter-btn');

        this.currentFilter = 'all';
        this.searchResults = [];

        this.initialize();
    }

    initialize() {
        // Get search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
            this.searchInput.value = query;
            this.performSearch(query);
        }

        // Add event listeners
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.type;
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterResults();
            });
        });
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        if (query) {
            // Update URL with search query
            const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

            await this.performSearch(query);
        }
    }

    async performSearch(query) {
        try {
            this.resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

            // Search movies
            const movieResponse = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`
            );
            const movieData = await movieResponse.json();

            // Search TV shows
            const tvResponse = await fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`
            );
            const tvData = await tvResponse.json();

            // For each TV result, fetch additional details to check if it's anime
            const tvDetailsPromises = tvData.results.map(show =>
                fetch(`https://api.themoviedb.org/3/tv/${show.id}?api_key=${this.apiKey}&append_to_response=keywords`)
                    .then(res => res.json())
            );

            const tvDetails = await Promise.all(tvDetailsPromises);

            // Anime-related keywords and genres
            const animeKeywords = [210024, 6075]; // anime, japanese animation
            const animeGenres = [16]; // animation

            // Helper function to check if a show is anime
            const isAnime = (details) => {
                const hasAnimeKeyword = details.keywords?.results?.some(k => animeKeywords.includes(k.id));
                const hasAnimeGenre = details.genres?.some(g => animeGenres.includes(g.id));
                const isJapanese = details.origin_country?.includes('JP');
                return (hasAnimeKeyword || (hasAnimeGenre && isJapanese));
            };

            // Combine and process results
            this.searchResults = [
                ...movieData.results.map(item => ({
                    id: item.id,
                    title: item.title,
                    type: 'movie',
                    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a7614185931650f8cee23fa137b93812ccb132b9df511df1cfac.svg',
                    rating: item.vote_average,
                    year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'
                })),
                ...tvData.results.map((item, index) => ({
                    id: item.id,
                    title: item.name,
                    type: isAnime(tvDetails[index]) ? 'anime' : 'tv',
                    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a7614185931650f8cee23fa137b93812ccb132b9df511df1cfac.svg',
                    rating: item.vote_average,
                    year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'
                }))
            ];

            this.filterResults();
        } catch (error) {
            console.error('Search error:', error);
            this.resultsContainer.innerHTML = '<div class="error">An error occurred while searching. Please try again.</div>';
        }
    }

    filterResults() {
        const filteredResults = this.currentFilter === 'all'
            ? this.searchResults
            : this.searchResults.filter(item => item.type === this.currentFilter);

        this.displayResults(filteredResults);
    }

    displayResults(results) {
        if (!results.length) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>No results found. Try a different search term.</p>
                </div>
            `;
            return;
        }

        this.resultsContainer.innerHTML = results.map(item => {
            // Check if the image is the placeholder image
            const imageUrl = item.image === 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a7614185931650f8cee23fa137b93812ccb132b9df511df1cfac.svg'
                ? 'images/no-poster.svg' // Use no-poster.svg if it is the placeholder
                : item.image; // Otherwise, use the original image

                return `
                <div class="media-card" data-media-type="${item.type}">
                    ${window.favoritesManager?.createFavoriteButton(item.id) || ''}
                    <div class="media-content" onclick="window.searchPage.handleMediaClick('${item.type}', ${item.id}, '${item.title.replace(/'/g, "\\'")}')">
                        <img src="${imageUrl}" alt="${item.title}" loading="lazy">
                        <div class="media-year">${item.year || 'N/A'}</div>
                        <div class="media-info">
                            <div class="media-type">${item.type.toUpperCase()}</div>
                            <h3 class="media-title">${item.title}</h3>
                            <div class="media-rating">
                                <i class="fas fa-star"></i>
                                ${item.rating ? item.rating.toFixed(1) : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Update favorite buttons after displaying results
        if (window.favoritesManager?.initialized) {
            window.favoritesManager.updateAllFavoriteButtons();
        }
    }

    handleLoginClick() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginBtn = document.getElementById('loginBtn');
        if (isLoggedIn) {
            localStorage.setItem('isLoggedIn', 'false');
            loginBtn.textContent = 'Login';
        } else {
            localStorage.setItem('isLoggedIn', 'true');
            loginBtn.textContent = 'Logout';
        }
    }

    // Handle media click
    handleMediaClick(type, id, title) {
        // Store the selected media info
        localStorage.setItem('selectedMedia', JSON.stringify({ type, id, title }));

        // Navigate to player page
        if (type === 'tv' || type === 'anime') {
            // Retrieve the user's watch progress if logged in
            const userWatchProgress = window.userManager?.currentUser?.watchProgress || {};
            const savedProgress = userWatchProgress[id] || { season: '1', episode: '1' }; // Default to '1' if no progress found
            const savedSeason = savedProgress.season;
            const savedEpisode = savedProgress.episode;

            window.location.href = `player.html?type=tv&id=${id}&season=${savedSeason}&episode=${savedEpisode}`;
        } else {
            window.location.href = `player.html?type=${type}&id=${id}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Initialize auth and settings
    await userManager.initialize();
    settingsManager.initialize();
    favoritesManager.initialize();
    document.body.classList.remove('js-loading');
});

// Initialize search page
window.searchPage = new SearchPage();
