// Settings manager class
class SettingsManager {
    constructor() {
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        this.loadSettings();
        this.initialized = true;
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
        
        const isDarkMode = user.settings.darkMode ?? false;
        this.applyDarkMode(isDarkMode);
    }

    loadDefaultSettings() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.applyDarkMode(isDarkMode);
    }

    applyDarkMode(isDarkMode) {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', isDarkMode);
    }

    saveSettings() {
        const settings = {
            darkMode: document.body.classList.contains('dark-mode')
        };

        if (window.userManager?.currentUser) {
            window.userManager.updateUserSettings(settings);
        }
    }
}

// Create and initialize a global settingsManager instance
window.settingsManager = new SettingsManager();

// Listen for storage changes
window.addEventListener('storage', function(event) {
    // Check if the change is related to your specific key
    if (event.key === `settings_${window.userManager?.getCurrentUser()?.id}`) {
        // Get the new value from the event
        const newValue = event.newValue;

        // Get the current value from localStorage
        const currentValue = localStorage.getItem(`settings_${window.userManager?.getCurrentUser()?.id}`);

        // Compare and overwrite if necessary
        if (newValue !== currentValue) {
            localStorage.setItem(`settings_${window.userManager?.getCurrentUser()?.id}`, newValue);
            console.log('Local storage updated with new value:', newValue);
        }
    }
});
