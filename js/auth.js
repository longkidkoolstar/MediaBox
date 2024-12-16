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

        // Update UI based on current user state
        this.updateAuthUI();

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

        window.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.style.display = 'none';
            }
            if (!e.target.closest('.user-menu')) {
                userDropdown.style.display = 'none';
            }
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
            const input = e.target.querySelector('input[placeholder="Username or Email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;
            
            const type = this.validateInput(input);
            let user;
            if (type === 'email') {
                user = this.users.find(u => u.email === input && u.password === password);
            } else {
                user = this.users.find(u => u.username === input && u.password === password);
            }
            if (user) {
                this.login(user);
                authModal.style.display = 'none';
                e.target.reset();
            } else {
                const type = this.validateInput(input);
                if (type === 'email') {
                    alert('Invalid email or password');
                } else {
                    alert('Invalid username or password');
                }
            }
        });

        signupForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.querySelector('input[type="text"]').value;
            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;
            const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            if (this.users.some(u => u.email === email)) {
                alert('Email already exists');
                return;
            }

            const newUser = {
                id: crypto.randomUUID(),
                username,
                email,
                password
            };

            this.users.push(newUser);
            await this.saveUsers();
            this.login(newUser);
            authModal.style.display = 'none';
            e.target.reset();
        });

        logoutButton?.addEventListener('click', () => {
            this.logout();
        });
    }

    validateInput(input) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(input) ? 'email' : 'username';
    }

    updateAuthUI() {
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');
        const usernameSpan = document.getElementById('username');

        // Skip UI updates if elements don't exist
        if (!authButton && !userDropdown && !usernameSpan) {
            return;
        }

        if (this.currentUser) {
            if (authButton) {
                authButton.textContent = this.currentUser.username;
                authButton.classList.add('logged-in');
            }
            if (usernameSpan) {
                usernameSpan.textContent = this.currentUser.username;
            }
            if (userDropdown) {
                userDropdown.style.display = 'none';
            }
        } else {
            if (authButton) {
                authButton.textContent = 'Sign In';
                authButton.classList.remove('logged-in');
            }
            if (userDropdown) {
                userDropdown.style.display = 'none';
            }
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    login(user, saveSession = true) {
        this.currentUser = user;
        if (saveSession) {
            this.saveSession();
        }
        this.updateAuthUI();
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('userLogin', { detail: user }));
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUserId');
        this.updateAuthUI();
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('userLogout'));
        // Only reload if we're not in the player
        if (!window.location.pathname.includes('player.html')) {
            window.location.reload();
        }
    }
}

// Create a global userManager instance
window.userManager = new UserManager();
