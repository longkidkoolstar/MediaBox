// API configuration
const API_KEY = '4994e33a-c36e-414e-917d-6918eddd782a';
const STORAGE_URL = 'https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/d44110a3-258b-4d92-8169-84e5531fa02b';

// User authentication and settings management
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.initialized = false;
    }

    async initialize() {
        await this.loadUsers();
        await this.restoreSession();
        this.setupAuthUI();
        this.setupSettingsUI();
        this.initialized = true;
    }

    async loadUsers() {
        try {
            const response = await fetch(`${STORAGE_URL}?apiKey=${API_KEY}`);
            if (response.ok) {
                const data = await response.json();
                this.users = data.users || [];
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async saveUsers() {
        try {
            const response = await fetch(`${STORAGE_URL}?apiKey=${API_KEY}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ users: this.users })
            });
            if (!response.ok) {
                throw new Error('Failed to save users');
            }
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    async restoreSession() {
        const savedUserId = localStorage.getItem('currentUserId');
        if (savedUserId) {
            const user = this.users.find(u => u.id === savedUserId);
            if (user) {
                this.login(user, false); // false means don't save to localStorage again
            }
        }
    }

    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('currentUserId', this.currentUser.id);
        } else {
            localStorage.removeItem('currentUserId');
        }
    }

    setupAuthUI() {
        // Get DOM elements
        const authModal = document.getElementById('authModal');
        const authButton = document.getElementById('authButton');
        const closeBtn = document.querySelector('.close');
        const authTabs = document.querySelectorAll('.auth-tab');
        const signinForm = document.getElementById('signinForm');
        const signupForm = document.getElementById('signupForm');
        const userDropdown = document.getElementById('userDropdown');
        const usernameSpan = document.getElementById('username');
        const logoutButton = document.getElementById('logoutButton');

        // Show/hide modal
        authButton.addEventListener('click', () => {
            if (this.currentUser) {
                userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
            } else {
                authModal.style.display = 'block';
            }
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            authModal.style.display = 'none';
        });

        // Tab switching
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetForm = tab.dataset.tab === 'signin' ? signinForm : signupForm;
                const otherForm = tab.dataset.tab === 'signin' ? signupForm : signinForm;
                
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                targetForm.style.display = 'flex';
                otherForm.style.display = 'none';
            });
        });

        // Sign In
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signinForm.querySelector('input[type="email"]').value;
            const password = signinForm.querySelector('input[type="password"]').value;

            const user = this.users.find(u => u.email === email && u.password === password);
            if (user) {
                this.login(user);
                authModal.style.display = 'none';
                signinForm.reset();
            } else {
                alert('Invalid email or password');
            }
        });

        // Sign Up
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = signupForm.querySelector('input[type="text"]').value;
            const email = signupForm.querySelector('input[type="email"]').value;
            const password = signupForm.querySelector('input[type="password"]').value;
            const confirmPassword = signupForm.querySelectorAll('input[type="password"]')[1].value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            if (this.users.some(u => u.email === email)) {
                alert('Email already exists');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password,
                settings: {
                    darkMode: false,
                    movieSource: 'vidsrc.dev',
                    tvSource: 'vidsrc.dev',
                    lastUpdated: new Date().toISOString()
                }
            };

            this.users.push(newUser);
            await this.saveUsers();
            this.login(newUser);
            authModal.style.display = 'none';
            signupForm.reset();
        });

        // Logout
        logoutButton.addEventListener('click', () => {
            this.logout();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && e.target !== authButton) {
                userDropdown.style.display = 'none';
            }
        });
    }

    setupSettingsUI() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const movieSourceSelect = document.getElementById('movieSourceSelect');
        const tvSourceSelect = document.getElementById('tvSourceSelect');
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');

        // Load saved settings from localStorage for non-logged-in users
        if (!this.currentUser) {
            if (movieSourceSelect) {
                const savedMovieSource = localStorage.getItem('movieSource');
                if (savedMovieSource) {
                    movieSourceSelect.value = savedMovieSource;
                }
            }
            if (tvSourceSelect) {
                const savedTvSource = localStorage.getItem('tvSource');
                if (savedTvSource) {
                    tvSourceSelect.value = savedTvSource;
                }
            }
        }

        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                document.body.classList.toggle('dark-mode', darkModeToggle.checked);
                if (this.currentUser) {
                    this.updateUserSettings({
                        darkMode: darkModeToggle.checked
                    });
                } else {
                    localStorage.setItem('darkMode', darkModeToggle.checked);
                }
            });
        }

        if (movieSourceSelect) {
            movieSourceSelect.addEventListener('change', () => {
                if (this.currentUser) {
                    this.updateUserSettings({
                        movieSource: movieSourceSelect.value
                    });
                } else {
                    localStorage.setItem('movieSource', movieSourceSelect.value);
                }
            });
        }

        if (tvSourceSelect) {
            tvSourceSelect.addEventListener('change', () => {
                if (this.currentUser) {
                    this.updateUserSettings({
                        tvSource: tvSourceSelect.value
                    });
                } else {
                    localStorage.setItem('tvSource', tvSourceSelect.value);
                }
            });
        }

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    login(user, saveToStorage = true) {
        this.currentUser = user;
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');
        const usernameSpan = document.getElementById('username');

        if (authButton) authButton.textContent = user.username;
        if (usernameSpan) usernameSpan.textContent = user.username;
        if (userDropdown) userDropdown.style.display = 'none';

        // Apply user settings and clear localStorage
        this.applyUserSettings();
        
        // Clear localStorage settings since we're using user account settings now
        localStorage.removeItem('movieSource');
        localStorage.removeItem('tvSource');
        localStorage.removeItem('darkMode');

        if (saveToStorage) {
            this.saveSession();
        }
    }

    logout() {
        // Save current settings to localStorage before logout
        if (this.currentUser?.settings) {
            localStorage.setItem('movieSource', this.currentUser.settings.movieSource || 'vidsrc.dev');
            localStorage.setItem('tvSource', this.currentUser.settings.tvSource || 'vidsrc.dev');
            localStorage.setItem('darkMode', this.currentUser.settings.darkMode || false);
        }

        this.currentUser = null;
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');

        if (authButton) authButton.textContent = 'Sign In';
        if (userDropdown) userDropdown.style.display = 'none';

        this.saveSession();
        
        // Re-apply settings from localStorage
        const movieSourceSelect = document.getElementById('movieSourceSelect');
        const tvSourceSelect = document.getElementById('tvSourceSelect');
        const darkModeToggle = document.getElementById('darkModeToggle');

        if (movieSourceSelect) {
            movieSourceSelect.value = localStorage.getItem('movieSource') || 'vidsrc.dev';
        }
        if (tvSourceSelect) {
            tvSourceSelect.value = localStorage.getItem('tvSource') || 'vidsrc.dev';
        }
        if (darkModeToggle) {
            darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
            document.body.classList.toggle('dark-mode', darkModeToggle.checked);
        }
    }

    applyUserSettings() {
        if (this.currentUser && this.currentUser.settings) {
            // Apply dark mode
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = this.currentUser.settings.darkMode;
                document.body.classList.toggle('dark-mode', this.currentUser.settings.darkMode);
            }

            // Apply video source settings
            const movieSourceSelect = document.getElementById('movieSourceSelect');
            const tvSourceSelect = document.getElementById('tvSourceSelect');
            
            if (movieSourceSelect) {
                movieSourceSelect.value = this.currentUser.settings.movieSource || 'vidsrc.dev';
            }
            if (tvSourceSelect) {
                tvSourceSelect.value = this.currentUser.settings.tvSource || 'vidsrc.dev';
            }
        }
    }

    resetSettings() {
        const defaultSettings = {
            darkMode: false,
            movieSource: 'vidsrc.dev',
            tvSource: 'vidsrc.dev',
            lastUpdated: new Date().toISOString()
        };

        if (this.currentUser) {
            this.currentUser.settings = defaultSettings;
            this.saveUsers();
        } else {
            localStorage.setItem('darkMode', 'false');
            localStorage.setItem('movieSource', 'vidsrc.dev');
            localStorage.setItem('tvSource', 'vidsrc.dev');
        }

        this.applyUserSettings();
    }

    async updateUserSettings(settings) {
        if (this.currentUser) {
            this.currentUser.settings = {
                ...this.currentUser.settings,
                ...settings,
                lastUpdated: new Date().toISOString()
            };
            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.users[userIndex] = this.currentUser;
                await this.saveUsers();
            }
        }
    }
}

// Create a global userManager instance
window.userManager = new UserManager();

// Global media player functions
window.playTvShow = function(id, season = null, episode = null) {
    if (!id) return;
    
    // Convert id to string to ensure we can use string methods
    id = String(id);
    
    // If season and episode are not provided, try to get them from the dropdowns
    if (!season && !episode) {
        const seasonSelect = document.getElementById(`seasonSelect${id}`);
        const episodeSelect = document.getElementById(`episodeSelect${id}`);
        if (seasonSelect && episodeSelect) {
            season = seasonSelect.value;
            episode = episodeSelect.value;
        }
    }
    
    // Get source from user settings or localStorage
    const source = window.userManager?.currentUser?.settings?.tvSource || 
                  localStorage.getItem('tvSource') || 
                  'vidsrc.dev';
    
    let embedUrl;
    switch (source) {
        case 'vidsrc.to':
            embedUrl = `https://vidsrc.to/embed/tv/${id}`;
            if (season) embedUrl += `/${season}`;
            if (episode) embedUrl += `/${episode}`;
            break;
        case '2embed':
            // Check if it's an IMDb ID (starts with 'tt')
            if (id.startsWith('tt')) {
                if (season && episode) {
                    embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
                } else {
                    embedUrl = `https://www.2embed.cc/embedtvfull/${id}`;
                }
            } else {
                // Assume it's a TMDB ID
                if (season && episode) {
                    embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
                } else {
                    embedUrl = `https://www.2embed.cc/embedtvfull/${id}`;
                }
            }
            break;
        default: // vidsrc.dev
            embedUrl = `https://vidsrc.xyz/embed/tv/${id}`;
            if (season) embedUrl += `/${season}`;
            if (episode) embedUrl += `/${episode}`;
            break;
    }
    
    playMedia(embedUrl);
};

window.playMovie = function(id) {
    if (!id) return;
    
    // Convert id to string to ensure we can use string methods
    id = String(id);
    
    // Get source from user settings or localStorage
    const source = window.userManager?.currentUser?.settings?.movieSource || 
                  localStorage.getItem('movieSource') || 
                  'vidsrc.dev';
    
    let embedUrl;
    switch (source) {
        case 'vidsrc.to':
            embedUrl = `https://vidsrc.to/embed/movie/${id}`;
            break;
        case '2embed':
            embedUrl = `https://www.2embed.cc/embed/${id}`;
            break;
        default: // vidsrc.dev
            embedUrl = `https://vidsrc.xyz/embed/movie/${id}`;
            break;
    }
    
    playMedia(embedUrl);
};

window.playMedia = function(embedUrl) {
    const resultsContainer = document.getElementById('resultsContainer');
    const iframeStyle = window.innerWidth > 768 ? 'width: 1000px;' : 'width: 100%;';
    resultsContainer.innerHTML = `<iframe src="${embedUrl}" style="${iframeStyle} height: 100%; border: none;" allowfullscreen></iframe>`;
    resultsContainer.style.height = "500px";  // Set a specific height for the container
};

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

// Global media click handler
function handleMediaClick(type, id, title) {
    if (window.featuredContent) {
        window.featuredContent.hide();
    }

    switch (type) {
        case 'movie':
            playMovie(id);
            break;
        case 'tv':
        case 'anime':
            playTvShow(id);
            break;
        default:
            console.error('Unknown media type:', type);
    }
}

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize user manager
    await window.userManager.initialize();

    // Initialize featured content
    window.featuredContent = new FeaturedContent();

    // Set up dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (window.userManager.currentUser) {
                window.userManager.updateUserSettings({ darkMode: darkModeToggle.checked });
            }
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            localStorage.setItem('darkMode', darkModeToggle.checked);
        });
    }

    // Initialize user settings
    const userSettings = {
        darkMode: localStorage.getItem('darkMode') === 'true',
        movieSource: localStorage.getItem('movieSource') || 'vidsrc.dev',
        tvSource: localStorage.getItem('tvSource') || 'vidsrc.dev',
        lastUpdated: new Date().toISOString()
    };

    // Load settings when page loads
    if (window.userManager.currentUser) {
        window.userManager.applyUserSettings();
    } else {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = userSettings.darkMode;
            if (userSettings.darkMode) {
                document.body.classList.add('dark-mode');
            }
        }
    }

    // Video source toggle functionality
    const movieSourceSelect = document.getElementById('movieSourceSelect');
    const tvSourceSelect = document.getElementById('tvSourceSelect');
    if (movieSourceSelect) {
        movieSourceSelect.value = userSettings.movieSource;
    }
    if (tvSourceSelect) {
        tvSourceSelect.value = userSettings.tvSource;
    }

    // Reset settings functionality
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to default?')) {
                // Reset dark mode
                const darkModeToggle = document.getElementById('darkModeToggle');
                if (darkModeToggle) {
                    darkModeToggle.checked = false;
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('darkMode', false);
                }

                // Reset video source
                const movieSourceSelect = document.getElementById('movieSourceSelect');
                const tvSourceSelect = document.getElementById('tvSourceSelect');
                if (movieSourceSelect) {
                    movieSourceSelect.value = 'vidsrc.dev';
                    localStorage.setItem('movieSource', 'vidsrc.dev');
                }
                if (tvSourceSelect) {
                    tvSourceSelect.value = 'vidsrc.dev';
                    localStorage.setItem('tvSource', 'vidsrc.dev');
                }

                // Reset user settings if logged in
                if (window.userManager.currentUser) {
                    window.userManager.updateUserSettings({
                        darkMode: false,
                        movieSource: 'vidsrc.dev',
                        tvSource: 'vidsrc.dev',
                        lastUpdated: new Date().toISOString()
                    });
                }
            }
        });
    }

    // Add settings link to header
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    document.getElementById('searchBtn').addEventListener('click', async function () {
        const query = document.getElementById('searchInput').value;
        const resultsContainer = document.getElementById('resultsContainer');

        if (query.trim() === '') {
            window.featuredContent.show();
            resultsContainer.innerHTML = '';
            return;
        }

        window.featuredContent.hide();
        resultsContainer.innerHTML = '';  // Clear previous results

        const apiKey = '1d21d96347d1b72f32806b6256c3a132';  // Your TMDB API key
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(searchUrl);
            const data = await response.json();

            if (data.results.length === 0) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
                return;
            }

            data.results.forEach(async item => {
                const mediaItem = document.createElement('div');
                mediaItem.classList.add('media-item');
        
                const mediaTitle = item.title || item.name || 'Unknown Title';
                const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500/${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
        
                let embedUrl = '';
                let seasonDropdown = '';
                let episodeDropdown = '';
                let playButton = '';
        
                // Check for the media type or genres
                const isAnime = item.genre_ids && item.genre_ids.includes(16);  // 16 is the genre ID for Animation in TMDB
        
                switch (item.media_type) {
                    case 'movie':
                        embedUrl = document.getElementById('videoSourceToggle').checked ? `https://vidsrc.dev/embed/movie/${item.id}` : `https://www.2embed.cc/embed/${item.id}`;
                        playButton = `<button onclick="window.playMovie(${item.id})">Watch Now</button>`;
                        break;
                    case 'tv':
                        // Fetch the number of seasons and episodes dynamically
                        const tvShowUrl = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${apiKey}`;
                        const tvShowResponse = await fetch(tvShowUrl);
                        const tvShowData = await tvShowResponse.json();
        
                        const numSeasons = tvShowData.number_of_seasons;
        
                        seasonDropdown = `<select id="seasonSelect${item.id}" onchange="updateEpisodeDropdown(${item.id})">`;
                        for (let i = 1; i <= numSeasons; i++) {
                            seasonDropdown += `<option value="${i}">Season ${i}</option>`;
                        }
                        seasonDropdown += `</select>`;
        
                        episodeDropdown = `<select id="episodeSelect${item.id}"></select>`;
        
                        playButton = `<button onclick="window.playTvShow(${item.id})">Watch Now</button>`;
                        break;
                    case 'anime':
                        // Handle anime the same way as TV shows
                        const animeShowUrl = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${apiKey}`;
                        const animeShowResponse = await fetch(animeShowUrl);
                        const animeShowData = await animeShowResponse.json();
        
                        const animeSeasons = animeShowData.number_of_seasons;
        
                        seasonDropdown = `<select id="seasonSelect${item.id}" onchange="updateEpisodeDropdown(${item.id})">`;
                        for (let i = 1; i <= animeSeasons; i++) {
                            seasonDropdown += `<option value="${i}">Season ${i}</option>`;
                        }
                        seasonDropdown += `</select>`;
        
                        episodeDropdown = `<select id="episodeSelect${item.id}"></select>`;
        
                        playButton = `<button onclick="window.playTvShow(${item.id})">Watch Now</button>`;
                        break;
                }
        
                mediaItem.innerHTML = `
                    <img src="${posterPath}" alt="${mediaTitle}">
                    <h3>${mediaTitle}</h3>
                    ${seasonDropdown} ${episodeDropdown}
                    ${playButton}
                `;
        
                resultsContainer.appendChild(mediaItem);
                
                // Populate episodes dropdown initially for TV shows
                if (item.media_type === 'tv' || item.media_type === 'anime') {
                    updateEpisodeDropdown(item.id);
                }
            });
        
        } catch (error) {
            resultsContainer.innerHTML = '<p>Something went wrong. Please try again later.</p>';
            console.error('Error fetching data:', error);
        }
    });

    async function updateEpisodeDropdown(id) {
        const season = document.getElementById(`seasonSelect${id}`).value;
        const episodeSelect = document.getElementById(`episodeSelect${id}`);

        // Update episodes based on the selected season
        // Fetch the number of episodes for the selected season dynamically
        // This is an example. You can dynamically fetch the number of episodes for each season using the TMDB API.
        const apiKey = '1d21d96347d1b72f32806b6256c3a132';  // Your TMDB API key
        const episodeUrl = `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${apiKey}`;
        const episodeResponse = await fetch(episodeUrl);
        const episodeData = await episodeResponse.json();

        const numEpisodes = episodeData.episodes.length;

        episodeSelect.innerHTML = ``;
        for (let i = 1; i <= numEpisodes; i++) {
            episodeSelect.innerHTML += `<option value="${i}">Episode ${i}</option>`;
        }
    }
});
