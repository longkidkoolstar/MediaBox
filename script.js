// API configuration
const API_KEY = '4994e33a-c36e-414e-917d-6918eddd782a';
const STORAGE_URL = 'https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/d44110a3-258b-4d92-8169-84e5531fa02b';

// User authentication and settings management
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
    }

    async initialize() {
        await this.loadUsers();
        await this.restoreSession();
        this.setupAuthUI();
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

    login(user, saveToStorage = true) {
        this.currentUser = user;
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');
        const usernameSpan = document.getElementById('username');

        authButton.textContent = user.username;
        usernameSpan.textContent = user.email;
        this.applyUserSettings();
        
        if (saveToStorage) {
            this.saveSession();
        }
    }

    logout() {
        this.currentUser = null;
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');

        authButton.textContent = 'Sign In';
        userDropdown.style.display = 'none';
        this.resetSettings();
        this.saveSession(); // This will remove the session from localStorage
    }

    applyUserSettings() {
        if (this.currentUser && this.currentUser.settings) {
            const darkModeToggle = document.getElementById('darkModeToggle');
            darkModeToggle.checked = this.currentUser.settings.darkMode;
            if (this.currentUser.settings.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    }

    resetSettings() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.checked = false;
        document.body.classList.remove('dark-mode');
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

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize user manager
    const userManager = new UserManager();
    await userManager.initialize();

    // Set up dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('change', () => {
        if (userManager.currentUser) {
            userManager.updateUserSettings({ darkMode: darkModeToggle.checked });
        }
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });

    // Initialize user settings
    const userSettings = {
        darkMode: false,
        lastUpdated: new Date().toISOString()
    };

    // Load settings when page loads
    if (userManager.currentUser) {
        userManager.applyUserSettings();
    } else {
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.checked = userSettings.darkMode;
        if (userSettings.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    // Dark mode and settings functionality
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsDropdown = document.querySelector('.settings-dropdown');

    // Settings dropdown toggle
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('active');
        }
    });

    document.getElementById('searchBtn').addEventListener('click', async function () {
        const query = document.getElementById('searchInput').value;
        const resultsContainer = document.getElementById('resultsContainer');

        if (query.trim() === '') {
            alert('Please enter a search query.');
            return;
        }

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
                        embedUrl = `https://www.2embed.cc/embed/${item.id}`;
                        playButton = `<button onclick="playMedia('${embedUrl}')">Watch Now</button>`;
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
        
                        playButton = isAnime 
                            ? `<button onclick="playAnime('${item.title}')">Watch Now</button>` 
                            : `<button onclick="playTvShow('${item.id}')">Watch Now</button>`;
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
                if (item.media_type === 'tv') {
                    updateEpisodeDropdown(item.id);
                }
            });
        
        } catch (error) {
            resultsContainer.innerHTML = '<p>Something went wrong. Please try again later.</p>';
            console.error('Error fetching data:', error);
        }
    });

    function playTvShow(id) {
        const season = document.getElementById(`seasonSelect${id}`).value;
        const episode = document.getElementById(`episodeSelect${id}`).value;
        const embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;

        const resultsContainer = document.getElementById('resultsContainer');
        const iframeStyle = window.innerWidth > 768 ? 'width: 1000px;' : 'width: 100%;';
        resultsContainer.innerHTML = `<iframe src="${embedUrl}" style="${iframeStyle} height: 100%; border: none;" allowfullscreen></iframe>`;
        resultsContainer.style.height = "500px";  // Set a specific height for the container
    }

    function playAnime(title) {
        const embedUrl = `https://2anime.xyz/embed/${title.replace(/\s+/g, '-').toLowerCase()}-1`;
        playMedia(embedUrl);
    }

    function playMedia(embedUrl) {
        const resultsContainer = document.getElementById('resultsContainer');
        const iframeStyle = window.innerWidth > 768 ? 'width: 1000px;' : 'width: 100%;';
        resultsContainer.innerHTML = `<iframe src="${embedUrl}" style="${iframeStyle} height: 100%; border: none;" allowfullscreen></iframe>`;
        resultsContainer.style.height = "500px";  // Set a specific height for the container
    }

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
