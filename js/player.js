// Media player manager
class MediaPlayer {
    constructor() {
        this.initialized = false;
        this.container = null;
        this.currentSource = null;
    }

initialize(containerId) {
    try {
        // Check if container exists
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Player container not found:', containerId);
            return false;
        }

        // Apply theme based on settings
        this.applyTheme();

        // Listen for theme changes
        window.addEventListener('settingsChanged', (event) => {
            if (event.detail && typeof event.detail.darkMode !== 'undefined') {
                this.applyTheme();
            }
        });

        // Mark as initialized
        this.initialized = true;
        console.log('MediaPlayer initialized successfully');

        // Check for saved progress
        if (window.userManager?.currentUser?.watchProgress) {
            // Get the last watched show from user data
            const watchProgress = window.userManager.currentUser.watchProgress;
            const lastShowId = Object.keys(watchProgress).pop();
            if (lastShowId) {
                const { season, episode } = watchProgress[lastShowId];
                this.playTvShow(lastShowId, season, episode);
            }
        } else {
            // Fallback to localStorage
            const savedShows = Object.keys(localStorage).filter(key => key.startsWith('show_'));
            if (savedShows.length > 0) {
                const latestShowId = savedShows[savedShows.length - 1].split('_')[1];
                const savedSeason = localStorage.getItem(`show_${latestShowId}_season`);
                const savedEpisode = localStorage.getItem(`show_${latestShowId}_episode`);
                
                if (savedSeason && savedEpisode) {
                    this.playTvShow(latestShowId, savedSeason, savedEpisode);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('Error initializing MediaPlayer:', error);
        this.initialized = false;
        this.container = null;
        return false;
    }
}

    applyTheme() {
        let isDarkMode = false;
        
        // Check if user is logged in and has settings
        if (typeof window.userManager !== 'undefined' && 
            window.userManager.initialized && 
            window.userManager.currentUser?.settings) {
            isDarkMode = window.userManager.currentUser.settings.darkMode;
        } else {
            // Fall back to localStorage
            isDarkMode = localStorage.getItem('darkMode') === 'true';
        }

        // Apply dark mode class to body
        document.body.classList.toggle('dark-mode', isDarkMode);
    }

    ensureInitialized() {
        if (!this.initialized || !this.container) {
            throw new Error('MediaPlayer not initialized or container not found. Call initialize() first.');
        }
    }

    getVideoSource(type) {
        // Default to vidsrc.dev if settingsManager is not available
        if (typeof settingsManager === 'undefined') {
            console.warn('SettingsManager not available, using default video source');
            return 'vidsrc.dev';
        }

        // Get the appropriate source based on media type
        const settings = window.userManager?.currentUser?.settings || {
            movieSource: localStorage.getItem('movieSource') || 'vidsrc.dev',
            tvSource: localStorage.getItem('tvSource') || 'vidsrc.dev'
        };

        // Use tvSource for both TV shows and anime
        if (type === 'tv' || type === 'anime') {
            return settings.tvSource || 'vidsrc.dev';
        }
        
        // Use movieSource for movies
        return settings.movieSource || 'vidsrc.dev';
    }

    async getImdbId(type, tmdbId) {
        const apiKey = '1d21d96347d1b72f32806b6256c3a132';
        const endpoint = type === 'movie' 
            ? `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids`
            : `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids`;
            
        try {
            const response = await fetch(`${endpoint}?api_key=${apiKey}`);
            if (!response.ok) {
                throw new Error('Failed to fetch IMDb ID');
            }
            const data = await response.json();
            return data.imdb_id;
        } catch (error) {
            console.error('Error fetching IMDb ID:', error);
            return null;
        }
    }

    async getPreferredLanguage() {
        // Get user's preferred language from browser or settings
        return navigator.language?.split('-')[0] || 'en';
    }

    buildVidsrcXyzUrl(type, id, season = null, episode = null) {
        const baseUrl = 'https://vidsrc.xyz/embed';
        let url = '';

        if (type === 'movie') {
            if (id.startsWith('tt')) {
                url = `${baseUrl}/movie?imdb=${id}`;
            } else {
                url = `${baseUrl}/movie?tmdb=${id}`;
            }
        } else if (type === 'tv') {
            if (id.startsWith('tt')) {
                url = `${baseUrl}/tv?imdb=${id}`;
            } else {
                url = `${baseUrl}/tv?tmdb=${id}`;
            }

            // Add season and episode if provided
            if (season && episode) {
                url += `&season=${season}&episode=${episode}`;
            }
        }

        // Add default subtitle language if available
        return this.getPreferredLanguage().then(lang => {
            return `${url}&ds_lang=${lang}`;
        });
    }

    createIframe(src) {
        try {
            this.ensureInitialized();
            console.log('Creating iframe with source:', src);

            // Clear the container
            this.container.innerHTML = '';

            // Create iframe wrapper for better control
            const wrapper = document.createElement('div');
            wrapper.className = 'iframe-wrapper';

            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.textContent = 'Loading video...';
            loadingDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 1.2em;
                z-index: 1;
            `;
            wrapper.appendChild(loadingDiv);

            // Create and configure iframe
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
                z-index: 2;
                background: #000;
            `;
            
            // Configure iframe attributes for vidsrc.to
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('webkitallowfullscreen', 'true');
            iframe.setAttribute('mozallowfullscreen', 'true');
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            
            // Set referrer policy
            iframe.setAttribute('referrerpolicy', 'origin');
            
            // Handle iframe load events
            iframe.addEventListener('load', () => {
                loadingDiv.style.display = 'none';
                console.log('Iframe loaded successfully');
            });

            // Handle iframe errors
            iframe.addEventListener('error', (error) => {
                console.error('Iframe loading error:', error);
                this.handlePlayerError('Failed to load video player');
            });

            // Set source after adding event listeners
            iframe.src = src;
            wrapper.appendChild(iframe);

            // Add error handling for player errors
            const handleMessage = (event) => {
                if (event.data === 'player_error') {
                    this.handlePlayerError('Video player encountered an error');
                }
            };

            window.addEventListener('message', handleMessage);
            
            // Cleanup event listener when iframe is removed
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node === wrapper || node.contains(wrapper)) {
                            window.removeEventListener('message', handleMessage);
                            observer.disconnect();
                        }
                    });
                });
            });
            
            observer.observe(this.container, { childList: true, subtree: true });

            this.container.appendChild(wrapper);
        } catch (error) {
            console.error('Error creating iframe:', error);
            this.handlePlayerError('Failed to initialize video player');
        }
    }

    handlePlayerError(message) {
        if (!this.container) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
            z-index: 3;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 8px;
        `;
        
        errorDiv.innerHTML = `
            <h3>Playback Error</h3>
            <p>${message}</p>
            <p>Try refreshing the page or selecting a different video source.</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                <button onclick="location.reload()" style="padding: 8px 16px; cursor: pointer; background: #2ecc71; border: none; border-radius: 4px; color: white;">
                    Refresh Page
                </button>
                <button onclick="window.location.href='settings.html'" style="padding: 8px 16px; cursor: pointer; background: #3498db; border: none; border-radius: 4px; color: white;">
                    Change Source
                </button>
            </div>
        `;

        // Remove loading indicator if it exists
        const loadingDiv = this.container.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }

        this.container.appendChild(errorDiv);
    }

    async playMovie(movieId) {
        try {
            this.ensureInitialized();

            if (!movieId) {
                throw new Error('Movie ID is required');
            }

            console.log('Playing movie:', movieId);
            const source = this.getVideoSource('movie');
            let embedUrl;

            if (source === 'vidsrc.dev') {
                embedUrl = `https://vidsrc.dev/embed/movie/${movieId}`;
            } else if (source === '2embed') {
                if (movieId.startsWith('tt')) {
                    // If it's already an IMDb ID, use it directly
                    embedUrl = `https://2embed.org/embed/movie/${movieId}`;
                } else {
                    // For TMDB ID, we need to get the IMDb ID
                    const imdbId = await this.getImdbId('movie', movieId);
                    if (!imdbId) {
                        throw new Error('Failed to get IMDb ID for this movie');
                    }
                    embedUrl = `https://2embed.org/embed/movie/${imdbId}`;
                }
            } else if (source === '2embed.cc') {
                if (movieId.startsWith('tt')) {
                    // If it's already an IMDb ID, use it directly
                    embedUrl = `https://www.2embed.cc/embed/${movieId}`;
                } else {
                    embedUrl = `https://www.2embed.cc/embed/${movieId}`;
                }
            } else if (source === 'vidsrc.xyz') {
                embedUrl = await this.buildVidsrcXyzUrl('movie', movieId);
            } else {
                // For vidsrc.to
                if (movieId.startsWith('tt')) {
                    // If it's already an IMDb ID, use it directly
                    embedUrl = `https://vidsrc.to/embed/movie/${movieId}`;
                } else {
                    // For TMDB ID, we need to get the IMDb ID
                    const imdbId = await this.getImdbId('movie', movieId);
                    if (!imdbId) {
                        throw new Error('Failed to get IMDb ID for this movie');
                    }
                    embedUrl = `https://vidsrc.to/embed/movie/${imdbId}`;
                }
            }

            this.createIframe(embedUrl);
        } catch (error) {
            console.error('Error playing movie:', error);
            if (this.container) {
                this.container.innerHTML = `
                    <div class="error-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">
                        <h3>Error Playing Movie</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    }

    async playTvShow(showId, season, episode) {
        try {
            this.ensureInitialized();

            if (!showId) {
                throw new Error('Show ID is required');
            }

            console.log('Playing TV show:', showId, 'Season:', season, 'Episode:', episode);
            const source = this.getVideoSource('tv');
            let embedUrl;

            if (source === 'vidsrc.dev') {
                embedUrl = `https://vidsrc.dev/embed/tv/${showId}`;
                if (season) embedUrl += `/${season}`;
                if (episode) embedUrl += `/${episode}`;
            } else if (source === '2embed') {
                let imdbId;
                if (showId.startsWith('tt')) {
                    // If it's already an IMDb ID, use it directly
                    imdbId = showId;
                } else {
                    // For TMDB ID, we need to get the IMDb ID
                    imdbId = await this.getImdbId('tv', showId);
                    if (!imdbId) {
                        throw new Error('Failed to get IMDb ID for this TV show');
                    }
                }

                // Build the URL based on available parameters
                if (!season && !episode) {
                    embedUrl = `https://2embed.org/embed/tv/${imdbId}`;
                } else if (season && !episode) {
                    embedUrl = `https://2embed.org/embed/tv/${imdbId}/${season}`;
                } else if (season && episode) {
                    embedUrl = `https://2embed.org/embed/tv/${imdbId}/${season}/${episode}`;
                }
            } else if (source === '2embed.cc') {
                let id = showId;
                if (!season || !episode) {
                    // For full TV show without specific episode
                    embedUrl = `https://www.2embed.cc/embedtvfull/${id}`;
                } else {
                    // For specific episode
                    embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
                }
            } else if (source === 'vidsrc.xyz') {
                embedUrl = await this.buildVidsrcXyzUrl('tv', showId, season, episode);
            } else {
                // For vidsrc.to
                let imdbId;
                if (showId.startsWith('tt')) {
                    // If it's already an IMDb ID, use it directly
                    imdbId = showId;
                } else {
                    // For TMDB ID, we need to get the IMDb ID
                    imdbId = await this.getImdbId('tv', showId);
                    if (!imdbId) {
                        throw new Error('Failed to get IMDb ID for this TV show');
                    }
                }

                // Build the URL based on available parameters
                if (!season && !episode) {
                    embedUrl = `https://vidsrc.to/embed/tv/${imdbId}.html`;
                } else if (season && !episode) {
                    embedUrl = `https://vidsrc.to/embed/tv/${imdbId}/${season}`;
                } else if (season && episode) {
                    embedUrl = `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`;
                }
            }

            // Show navigation buttons for TV shows
            const navButtons = document.getElementById('episodeNavigation');
            if (navButtons) {
                navButtons.style.display = 'flex';
                this.updateNavigationButtons(showId, season, episode);
            }

            this.createIframe(embedUrl);

            // Save progress to user data if logged in
            if (window.userManager?.currentUser) {
                const user = window.userManager.currentUser;
                if (!user.watchProgress) {
                    user.watchProgress = {};
                }
                user.watchProgress[showId] = { season, episode };
                
                // Update user data in jsonstorage
                await window.userManager.saveUsers();
            } else {
                // Fallback to localStorage if not logged in
                localStorage.setItem(`show_${showId}_season`, season);
                localStorage.setItem(`show_${showId}_episode`, episode);
            }
        } catch (error) {
            console.error('Error playing TV show:', error);
            if (this.container) {
                this.container.innerHTML = `
                    <div class="error-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">
                        <h3>Error Playing TV Show</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    }

    updateNavigationButtons(showId, season, episode) {
        const navigationDiv = document.getElementById('episodeNavigation');
        const prevBtn = document.getElementById('prevEpisodeBtn');
        const nextBtn = document.getElementById('nextEpisodeBtn');
        const episodeSelect = document.getElementById('episodeSelect');

        // Hide navigation for movies
        const urlParams = new URLSearchParams(window.location.search);
        const mediaType = urlParams.get('type');
        
        if (mediaType === 'movie') {
            if (navigationDiv) navigationDiv.style.display = 'none';
            return;
        }

        // Show navigation for TV shows and anime
        if (navigationDiv) navigationDiv.style.display = 'flex';

        if (prevBtn && nextBtn && episodeSelect) {
            const totalEpisodes = episodeSelect.options.length;
            const currentEpisode = Number(episodeSelect.value) || Number(episode);

            prevBtn.disabled = currentEpisode <= 1;
            nextBtn.disabled = currentEpisode >= totalEpisodes;

            prevBtn.onclick = (e) => {
                e.preventDefault();
                if (currentEpisode > 1) {
                    const newEpisode = currentEpisode - 1;
                    this.playTvShow(showId, season, newEpisode);
                    episodeSelect.value = newEpisode;
                }
            };

            nextBtn.onclick = (e) => {
                e.preventDefault(); 
                if (currentEpisode < totalEpisodes) {
                    const newEpisode = currentEpisode + 1;
                    this.playTvShow(showId, season, newEpisode);
                    episodeSelect.value = newEpisode;
                }
            };
        }
    }
}

// Create and expose global instance
window.mediaPlayer = new MediaPlayer();
