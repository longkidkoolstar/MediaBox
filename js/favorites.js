class FavoritesManager {
    constructor() {
        this.favorites = new Map();
        this.initialized = false;
        this.API_KEY = '4994e33a-c36e-414e-917d-6918eddd782a';
        this.STORAGE_URL = 'https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/d44110a3-258b-4d92-8169-84e5531fa02b';
    }

    async initialize() {
        // Ensure DOM is fully loaded
        if (document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }

        // Wait for userManager to be available
        if (typeof userManager === 'undefined') {
            console.warn('UserManager not loaded yet, waiting...');
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.initialize();
        }
        
        // Setup event listeners first
        this.setupEventListeners();
        
        // Then load favorites
        await this.loadFavorites();
        
        this.initialized = true;
        
        // Update all favorite buttons in the DOM
        this.updateAllFavoriteButtons();
        
        // Dispatch initialized event
        window.dispatchEvent(new CustomEvent('favoritesInitialized'));
    }

    async loadFavorites() {
        const user = window.userManager?.getCurrentUser();
        if (!user) {
            this.favorites = new Map();
            window.dispatchEvent(new CustomEvent('favoritesLoaded'));
            return;
        }
        
        try {
            // Fetch all users' data
            const response = await fetch(`${this.STORAGE_URL}?apiKey=${this.API_KEY}`);
            if (!response.ok) {
                throw new Error('Failed to fetch users data');
            }
            const data = await response.json();
            
            // Find current user's favorites
            const userData = data.users?.find(u => u.id === user.id);
            if (userData?.favorites) {
                this.favorites = new Map(Object.entries(userData.favorites));
            } else {
                this.favorites = new Map();
            }
            
            // Dispatch event when favorites are loaded
            window.dispatchEvent(new CustomEvent('favoritesLoaded'));
        } catch (error) {
            console.error('Error loading favorites from cloud:', error);
            // Fallback to local storage
            const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
            if (storedFavorites) {
                try {
                    const favoritesArray = JSON.parse(storedFavorites);
                    this.favorites = new Map(favoritesArray);
                } catch (e) {
                    console.error('Error loading favorites from local storage:', e);
                    this.favorites = new Map();
                }
            }
            // Always dispatch event, even on error
            window.dispatchEvent(new CustomEvent('favoritesLoaded'));
        }
    }

    async saveFavorites() {
        const user = window.userManager?.getCurrentUser();
        if (!user) return;
        
        try {
            // First get all users' data
            const response = await fetch(`${this.STORAGE_URL}?apiKey=${this.API_KEY}`);
            if (!response.ok) {
                throw new Error('Failed to fetch users data');
            }
            const data = await response.json();
            
            // Update current user's favorites
            const userIndex = data.users?.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                if (!data.users[userIndex].favorites) {
                    data.users[userIndex].favorites = {};
                }
                data.users[userIndex].favorites = Object.fromEntries(this.favorites);
                
                // Save back to JSONStorage
                const updateResponse = await fetch(`${this.STORAGE_URL}?apiKey=${this.API_KEY}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (!updateResponse.ok) {
                    throw new Error('Failed to update favorites in cloud storage');
                }
            }
        } catch (error) {
            console.error('Error saving favorites to cloud:', error);
        }
        
        // Always save to local storage as backup
        const favoritesArray = Array.from(this.favorites.entries());
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favoritesArray));
    }

    async toggleFavorite(mediaId, mediaData) {
        if (!window.userManager?.getCurrentUser()) {
            document.getElementById('authModal').style.display = 'block';
            return false;
        }

        // Update local state and UI immediately
        if (this.favorites.has(mediaId)) {
            this.favorites.delete(mediaId);
        } else {
            this.favorites.set(mediaId, mediaData);
        }
        
        // Update UI immediately
        this.updateFavoriteButton(mediaId);
        
        // Update favorites section if it exists
        if (window.featuredContent) {
            window.featuredContent.updateFavoritesSection();
        }

        // Save changes asynchronously
        await this.saveFavorites();
        
        return this.isFavorite(mediaId);
    }

    isFavorite(mediaId) {
        return this.favorites.has(mediaId);
    }

    updateFavoriteButton(mediaId) {
        const favoriteBtn = document.querySelector(`[data-favorite-id="${mediaId}"]`);
        if (favoriteBtn) {
            const isFavorited = this.isFavorite(mediaId);
            favoriteBtn.classList.toggle('favorited', isFavorited);
            favoriteBtn.innerHTML = `<i class="fas fa-heart"></i>`;
            favoriteBtn.setAttribute('title', isFavorited ? 'Remove from favorites' : 'Add to favorites');
        }
    }

    createFavoriteButton(mediaId) {
        const isFavorited = this.isFavorite(mediaId);
        return `
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-favorite-id="${mediaId}"
                    title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="fas fa-heart"></i>
            </button>
        `;
    }

    getAllFavorites() {
        return Array.from(this.favorites.values());
    }

    setupEventListeners() {
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.favorite-btn')) {
                const favoriteBtn = e.target.closest('.favorite-btn');
                const mediaId = favoriteBtn.dataset.favoriteId;
                const mediaCard = favoriteBtn.closest('.media-card');
                if (mediaCard) {
                    const mediaData = {
                        id: mediaId,
                        title: mediaCard.querySelector('.media-title')?.textContent,
                        poster: mediaCard.querySelector('img')?.src,
                        type: mediaCard.dataset.mediaType
                    };
                    await this.toggleFavorite(mediaId, mediaData);
                }
            }
        });

        // Listen for user login/logout events to refresh favorites
        window.addEventListener('userLogin', () => this.loadFavorites());
        window.addEventListener('userLogout', () => {
            this.favorites.clear();
        });
    }

    updateAllFavoriteButtons() {
        try {
            // Find all favorite buttons in the DOM
            const favoriteButtons = document.querySelectorAll('.favorite-btn');
            favoriteButtons?.forEach(button => {
                if (!button) return;  // Skip if button is null
                const mediaId = button.dataset?.favoriteId;
                if (mediaId) {
                    const isFavorited = this.isFavorite(mediaId);
                    // Use try-catch for classList operations
                    try {
                        button.classList.toggle('favorited', isFavorited);
                        button.setAttribute('title', isFavorited ? 'Remove from favorites' : 'Add to favorites');
                    } catch (err) {
                        console.warn('Error updating favorite button:', err);
                    }
                }
            });
        } catch (err) {
            console.error('Error in updateAllFavoriteButtons:', err);
        }
    }
}

// Create and expose global instance
window.favoritesManager = new FavoritesManager();
