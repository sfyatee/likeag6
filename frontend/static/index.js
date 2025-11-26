// Check if user is logged in and hide/show login button accordingly
window.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('signinBtn');
    
    if (user && user.avatar) {
        // Map avatar choices to gradient styles
        const avatarStyles = {
            'avatar1': 'background: linear-gradient(135deg, #667eea 0%, #B87B80 100%);',
            'avatar2': 'background: linear-gradient(135deg, #f093fb 0%, #0F4662 100%);',
            'avatar3': 'background: linear-gradient(135deg, #4facfe 0%, #7994A0 100%);'
        };
        
        // User is logged in with avatar selected, replace login button content
        loginBtn.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; ${avatarStyles[user.avatar] || avatarStyles['avatar1']}"></div>
            <span>${user.fName}</span>
        `;
        loginBtn.onclick = () => {
            window.location.href = '/dashboard';
        };
    } else if (user) {
        // User is logged in but no avatar selected, hide login button
        loginBtn.style.display = 'none';
    } else {
        // User is not logged in, show login button
        loginBtn.style.display = '';
    }
});

const homeBtn = document.getElementById('G6Logo');
const loginBtn = document.getElementById('signinBtn');
const dashboardBtn = document.getElementById('dashboardCard');
const leftCarouselBtn = document.getElementById('leftArrowBtn');
const rightCarouselBtn = document.getElementById('rightArrowBtn');
const searchBarWrapper = document.querySelector('.searchBarWrapper');
const searchField = document.querySelector('.searchField');
const collapseBtn = document.getElementById('collapseBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.querySelector('.searchField input');
// Carousel functionality
const carouselWrapper = document.querySelector('.carouselWrapper');
const carouselCards = document.querySelectorAll('.carouselCards');
let currentIndex = 0;
const maxIndex = carouselCards.length - 3; // Show 3 cards at a time
const graphHeaderBtn = document.getElementById('graphBtn');
const calcHeaderBtn = document.getElementById('calculatorBtn');
const graphCard = document.getElementById('graphingCard');
const calcCard = document.getElementById('calculatorCard');

console.log('JavaScript loaded');
console.log('graphHeaderBtn:', graphHeaderBtn);
console.log('calcHeaderBtn:', calcHeaderBtn);

homeBtn.addEventListener('click', () => {
    window.location.href = '/';
});

loginBtn.addEventListener('click', () => {
    window.location.href = '/login';
});

dashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard';
});


function updateCarousel() {
    // Calculate card width + margin
    const card = carouselCards[0];
    const cardStyle = window.getComputedStyle(card);
    const cardWidth = card.offsetWidth;
    const marginRight = parseInt(cardStyle.marginRight);
    const scrollAmount = cardWidth + marginRight;
    
    // Scroll to position
    carouselWrapper.scrollTo({
        left: scrollAmount * currentIndex,
        behavior: 'smooth'
    });
    
    // Update button states
    leftCarouselBtn.disabled = currentIndex === 0;
    rightCarouselBtn.disabled = currentIndex >= maxIndex;
    
    // Add/remove greyed out class
    if (currentIndex === 0) {
        leftCarouselBtn.style.opacity = '0.5';
        leftCarouselBtn.style.cursor = 'not-allowed';
    } else {
        leftCarouselBtn.style.opacity = '1';
        leftCarouselBtn.style.cursor = 'pointer';
    }
    
    if (currentIndex >= maxIndex) {
        rightCarouselBtn.style.opacity = '0.5';
        rightCarouselBtn.style.cursor = 'not-allowed';
    } else {
        rightCarouselBtn.style.opacity = '1';
        rightCarouselBtn.style.cursor = 'pointer';
    }
}

leftCarouselBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

rightCarouselBtn.addEventListener('click', () => {
    if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
    }
});

// Initialize carousel state
updateCarousel();

// Search bar collapse/expand functionality

collapseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    searchBarWrapper.classList.add('collapsed');
    searchField.classList.add('collapsed');
});

searchBtn.addEventListener('click', (e) => {
    if (searchField.classList.contains('collapsed')) {
        e.preventDefault();
        searchBarWrapper.classList.remove('collapsed');
        searchField.classList.remove('collapsed');
        searchInput.focus();
    }
});

graphHeaderBtn.addEventListener('click', () => {
    console.log('Graph button clicked');
    window.location.href = '/graphing';
});

calcHeaderBtn.addEventListener('click', () => {
    console.log('Calculator button clicked');
    window.location.href = '/matrixCalc';
});

graphCard.addEventListener('click', () => {
    console.log('Graph button clicked');
    window.location.href = '/graphing';
});

calcCard.addEventListener('click', () => {
    console.log('Calculator button clicked');
    window.location.href = '/matrixCalc';
});