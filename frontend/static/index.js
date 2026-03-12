// ============================================
// Index page specific functionality
// ============================================

// Element references for index page
const dashboardBtn = document.getElementById('dashboardCard');
const leftCarouselBtn = document.getElementById('leftArrowBtn');
const rightCarouselBtn = document.getElementById('rightArrowBtn');
const carouselWrapper = document.querySelector('.carouselWrapper');
const carouselCards = document.querySelectorAll('.carouselCards');
const graphHeaderBtn = document.getElementById('graphBtn');
const calcHeaderBtn = document.getElementById('calculatorBtn');
const graphCard = document.getElementById('graphingCard');
const calcCard = document.getElementById('calculatorCard');
const resourcesCard = document.getElementById('altResourcesCard');

// Carousel state
let currentIndex = 0;
const maxIndex = carouselCards.length - 3; // Show 3 cards at a time

// Dashboard card navigation
if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });
}

// Carousel functionality
function updateCarousel() {
    if (!carouselWrapper || !carouselCards.length) return;
    
    const card = carouselCards[0];
    const cardStyle = window.getComputedStyle(card);
    const cardWidth = card.offsetWidth;
    const marginRight = parseInt(cardStyle.marginRight);
    const scrollAmount = cardWidth + marginRight;
    
    carouselWrapper.scrollTo({
        left: scrollAmount * currentIndex,
        behavior: 'smooth'
    });
    
    if (leftCarouselBtn) {
        leftCarouselBtn.disabled = currentIndex === 0;
        leftCarouselBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        leftCarouselBtn.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
    }
    
    if (rightCarouselBtn) {
        rightCarouselBtn.disabled = currentIndex >= maxIndex;
        rightCarouselBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
        rightCarouselBtn.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
    }
}

if (leftCarouselBtn) {
    leftCarouselBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
}

if (rightCarouselBtn) {
    rightCarouselBtn.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });
}

// Initialize carousel
if (carouselWrapper) {
    updateCarousel();
}

// Header navigation buttons
if (graphHeaderBtn) {
    graphHeaderBtn.addEventListener('click', () => {
        window.location.href = '/graphing';
    });
}

if (calcHeaderBtn) {
    calcHeaderBtn.addEventListener('click', () => {
        window.location.href = '/matrixCalc';
    });
}

// Card navigation
if (graphCard) {
    graphCard.addEventListener('click', () => {
        window.location.href = '/graphing';
    });
}

if (calcCard) {
    calcCard.addEventListener('click', () => {
        window.location.href = '/matrixCalc';
    });
}

if (resourcesCard) {
    resourcesCard.addEventListener('click', () => {
        window.location.href = '/resources';
    });
}