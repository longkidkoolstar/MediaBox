// Settings manager class
class SettingsManager {
    constructor() {
        this.initialized = false;
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.videoSourceToggle = document.getElementById('videoSourceToggle');
    }

    initialize() {
        if (this.initialized) return;
        this.setupEventListeners();
        this.loadSettings();
        this.initialized = true;
    }

    setupEventListeners() {
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', () => {
                const isDarkMode = this.darkModeToggle.checked;
                this.applyDarkMode(isDarkMode);
                this.saveSettings();
            });
        }

        if (this.videoSourceToggle) {
            this.videoSourceToggle.addEventListener('change', () => {
                this.saveSettings();
            });
        }

        // Listen for user login/logout events
        window.addEventListener('userLogin', (e) => this.loadUserSettings(e.detail));
        window.addEventListener('userLogout', () => this.loadDefaultSettings());
    }

    loadSettings() {
        // Check if userManager exists and is initialized
        if (typeof window.userManager !== 'undefined' && window.userManager.initialized) {
            if (window.userManager.currentUser) {
                this.loadUserSettings(window.userManager.currentUser);
            } else {
                this.loadDefaultSettings();
            }
        } else {
            // If userManager is not available, use default settings
            this.loadDefaultSettings();
        }
    }

    loadUserSettings(user) {
        if (!user?.settings) return;

        if (this.darkModeToggle) {
            this.darkModeToggle.checked = user.settings.darkMode;
            this.applyDarkMode(user.settings.darkMode);
        }

        if (this.videoSourceToggle) {
            this.videoSourceToggle.checked = user.settings.movieSource === 'vidsrc.dev';
        }
    }

    loadDefaultSettings() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (this.darkModeToggle) {
            this.darkModeToggle.checked = darkMode;
            this.applyDarkMode(darkMode);
        }

        if (this.videoSourceToggle) {
            const useVidSrc = localStorage.getItem('useVidSrc') !== 'false';
            this.videoSourceToggle.checked = useVidSrc;
        }
    }

    applyDarkMode(isDarkMode) {
        document.body.classList.toggle('dark-mode', isDarkMode);
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }

    async saveSettings() {
        const settings = {
            darkMode: this.darkModeToggle?.checked || false,
            movieSource: this.videoSourceToggle?.checked ? 'vidsrc.dev' : 'vidsrc.to',
            tvSource: this.videoSourceToggle?.checked ? 'vidsrc.dev' : 'vidsrc.to',
            lastUpdated: new Date().toISOString()
        };

        // Check if userManager exists and is initialized
        if (typeof window.userManager !== 'undefined' && window.userManager.initialized && window.userManager.currentUser) {
            window.userManager.currentUser.settings = settings;
            await window.userManager.saveUsers();
        } else {
            localStorage.setItem('darkMode', settings.darkMode);
            localStorage.setItem('useVidSrc', this.videoSourceToggle?.checked);
        }

        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    }

    getVideoSource() {
        // Check if userManager exists and is initialized
        if (typeof window.userManager !== 'undefined' && window.userManager.initialized && window.userManager.currentUser?.settings) {
            return window.userManager.currentUser.settings.movieSource;
        }
        return this.videoSourceToggle?.checked ? 'vidsrc.dev' : 'vidsrc.to';
    }
}

// Create and initialize a global settingsManager instance
window.settingsManager = new SettingsManager();
