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
            
            // Search anime (using TV search with anime keyword)
            const animeResponse = await fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&with_keywords=210024`
            );
            const animeData = await animeResponse.json();

            // Get anime IDs to filter them out from TV shows
            const animeIds = new Set(animeData.results.map(item => item.id));

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
                ...tvData.results
                    .filter(item => !animeIds.has(item.id))  // Filter out anime from TV shows
                    .map(item => ({
                        id: item.id,
                        title: item.name,
                        type: 'tv',
                        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a7614185931650f8cee23fa137b93812ccb132b9df511df1cfac.svg',
                        rating: item.vote_average,
                        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'
                    })),
                ...animeData.results.map(item => ({
                    id: item.id,
                    title: item.name,
                    type: 'anime',
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

        this.resultsContainer.innerHTML = results.map(item => `
            <div class="media-card">
                ${window.favoritesManager?.createFavoriteButton(item.id) || ''}
                <div class="media-content" onclick="window.searchPage.handleMediaClick('${item.type}', ${item.id}, '${item.title.replace(/'/g, "\\'")}')">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
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
        `).join('');

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
            const savedSeason = localStorage.getItem(`show_${id}_season`) || '1';
            const savedEpisode = localStorage.getItem(`show_${id}_episode`) || '1';
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
