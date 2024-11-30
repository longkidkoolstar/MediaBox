// API configuration
const API_KEY = '4994e33a-c36e-414e-917d-6918eddd782a';
const STORAGE_URL = 'https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/d44110a3-258b-4d92-8169-84e5531fa02b';

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
                this.login(user, false);
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
        const authModal = document.getElementById('authModal');
        const authButton = document.getElementById('authButton');
        const closeBtn = document.querySelector('.close');
        const authTabs = document.querySelectorAll('.auth-tab');
        const signinForm = document.getElementById('signinForm');
        const signupForm = document.getElementById('signupForm');
        const userDropdown = document.getElementById('userDropdown');
        const usernameSpan = document.getElementById('username');
        const logoutButton = document.getElementById('logoutButton');

        if (!authModal || !authButton) return;

        authButton.addEventListener('click', () => {
            if (this.currentUser) {
                userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
            } else {
                authModal.style.display = 'block';
            }
        });

        closeBtn?.addEventListener('click', () => {
            authModal.style.display = 'none';
        });

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

        signinForm?.addEventListener('submit', async (e) => {
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

        signupForm?.addEventListener('submit', async (e) => {
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

        logoutButton?.addEventListener('click', () => {
            this.logout();
        });

        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target) && e.target !== authButton) {
                userDropdown.style.display = 'none';
            }
        });
    }

    login(user, saveToStorage = true) {
        this.currentUser = user;
        if (saveToStorage) {
            this.saveSession();
        }
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');
        const usernameSpan = document.getElementById('username');
        
        if (authButton && userDropdown && usernameSpan) {
            authButton.textContent = user.username;
            usernameSpan.textContent = user.username;
        }

        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('userLogin', { detail: user }));
    }

    logout() {
        this.currentUser = null;
        this.saveSession();
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (authButton && userDropdown) {
            authButton.textContent = 'Sign In';
            userDropdown.style.display = 'none';
        }

        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('userLogout'));
    }
}

// Create a global userManager instance
window.userManager = new UserManager();
