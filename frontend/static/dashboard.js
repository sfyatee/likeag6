// Load user info from localStorage and personalize the greeting
window.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (user && user.fName) {
        welcomeMessage.textContent = `Welcome to G6Labs, ${user.fName}!`;
    } else {
        // If no user found, redirect to login
        window.location.href = '/login';
    }

    // Setup event listeners after DOM is loaded
    const homeBtn = document.getElementById('G6Logo');
    const logoutBtn = document.getElementById('logoutBtn');

    //method to reroute user to homepage
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

    //method to logout user and return to homepage
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logout button clicked');
            // Clear user data from localStorage
            localStorage.removeItem('user');
            // Redirect to homepage
            window.location.href = '/';
        });
    }

    // Handle avatar selection
    const avatarRadios = document.querySelectorAll('.avatarRadio');
    
    // Set current avatar if exists
    if (user && user.avatar) {
        const selectedRadio = document.getElementById(`${user.avatar}RB`);
        if (selectedRadio) {
            selectedRadio.checked = true;
        }
    }
    
    // Listen for avatar changes
    avatarRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (currentUser) {
                    currentUser.avatar = e.target.value;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    console.log('Avatar updated:', e.target.value);
                }
            }
        });
    });
});

const dashboardBtn = document.getElementById('dashboardBtn');
const profileBtn = document.getElementById('profileBtn');
const customizeBtn = document.getElementById('customizeBtn');
const settingsBtn = document.getElementById('profileBtn');

//method to hide dashboard features (first row) but maintain layout
let firstRowHidden = false;
dashboardBtn.addEventListener('click', () => {
    const contentRow = document.querySelector('.contentRow');
    if (contentRow) {
        const items = contentRow.querySelectorAll('.mainContentItem');
        for (let i = 0; i < 4 && i < items.length; i++) {
            if (firstRowHidden) {
                items[i].style.visibility = '';
                items[i].style.pointerEvents = '';
            } else {
                items[i].style.visibility = 'hidden';
                items[i].style.pointerEvents = 'none';
            }
        }
        firstRowHidden = !firstRowHidden;
    }
});

// Toggle progression card visibility with profile button
let progressionHidden = false;
const progressionCard = document.querySelector('.progressionCard');
if (profileBtn && progressionCard) {
    profileBtn.addEventListener('click', () => {
        progressionCard.style.display = progressionHidden ? '' : 'none';
        progressionHidden = !progressionHidden;
    });
}

// Toggle visibility of the last 4 cards (3rd row) except the settings card when the customize button is clicked
let lastFourHidden = false;
if (customizeBtn) {
    customizeBtn.addEventListener('click', () => {
        const contentRow = document.querySelector('.contentRow');
        if (contentRow) {
            const items = Array.from(contentRow.querySelectorAll('.mainContentItem'));
            // Filter out the settings card
            const lastFour = items.slice(-4).filter(item => !item.classList.contains('settingsCard'));
            lastFour.forEach(item => {
                item.style.display = lastFourHidden ? '' : 'none';
            });
            lastFourHidden = !lastFourHidden;
        }
    });
}

// Toggle visibility of the settings card by using visibility and pointer-events, so layout is preserved
const settingsBtnFixed = document.getElementById('settingsBtn');
let settingsHidden = false;
const settingsCard = document.querySelector('.settingsCard');
if (settingsBtnFixed && settingsCard) {
    settingsBtnFixed.addEventListener('click', () => {
        if (settingsHidden) {
            settingsCard.style.visibility = '';
            settingsCard.style.pointerEvents = '';
        } else {
            settingsCard.style.visibility = 'hidden';
            settingsCard.style.pointerEvents = 'none';
        }
        settingsHidden = !settingsHidden;
    });
}

