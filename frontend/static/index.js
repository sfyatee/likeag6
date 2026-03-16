function $(id) {
  return document.getElementById(id);
}

function onClick(id, handler) {
  const el = $(id);
  if (el) el.addEventListener('click', handler);
  return el;
}

// Check if user is logged in and hide/show login button accordingly
window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = $('signinBtn');
  if (!loginBtn) return;

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user && user.avatar) {
    const avatarStyles = {
      avatar1: 'background: linear-gradient(135deg, #667eea 0%, #B87B80 100%);',
      avatar2: 'background: linear-gradient(135deg, #f093fb 0%, #0F4662 100%);',
      avatar3: 'background: linear-gradient(135deg, #4facfe 0%, #7994A0 100%);'
    };

    loginBtn.innerHTML = `
      <div style="width: 32px; height: 32px; border-radius: 50%; ${avatarStyles[user.avatar] || avatarStyles.avatar1}"></div>
      <span>${user.fName || 'Account'}</span>
    `;
    loginBtn.onclick = () => window.location.href = '/dashboard';
  } else if (user) {
    loginBtn.style.display = 'none';
  } else {
    loginBtn.style.display = '';
    loginBtn.onclick = () => window.location.href = '/login';
  }
});

// Home
onClick('G6Logo', () => window.location.href = '/');

// Header buttons
onClick('graphBtn', () => window.location.href = '/graphing');
onClick('calculatorBtn', () => window.location.href = '/matrixCalc');

// NEW: Assistance tab -> Problem Assistance page
onClick('assistanceBtn', () => window.location.href = '/problemAssistance');

// Landing page feature cards
onClick('graphingCard', () => window.location.href = '/graphing');
onClick('calculatorCard', () => window.location.href = '/matrixCalc');
onClick('dashboardCard', () => window.location.href = '/dashboard');

// NEW: Problem Assistance card -> Problem Assistance page
onClick('problemAssistanceCard', () => window.location.href = '/problemAssistance');

// Carousel functionality (landing page only)
(function initCarousel() {
  const leftCarouselBtn = $('leftArrowBtn');
  const rightCarouselBtn = $('rightArrowBtn');
  const carouselWrapper = document.querySelector('.carouselWrapper');
  const carouselCards = document.querySelectorAll('.carouselCards');

  if (!leftCarouselBtn || !rightCarouselBtn || !carouselWrapper || !carouselCards.length) return;

  let currentIndex = 0;
  const maxIndex = Math.max(0, carouselCards.length - 3);

  function updateCarousel() {
    const card = carouselCards[0];
    const cardStyle = window.getComputedStyle(card);
    const cardWidth = card.offsetWidth;
    const marginRight = parseInt(cardStyle.marginRight || '0', 10);
    const scrollAmount = cardWidth + marginRight;

    carouselWrapper.scrollTo({
      left: scrollAmount * currentIndex,
      behavior: 'smooth'
    });

    leftCarouselBtn.disabled = currentIndex === 0;
    rightCarouselBtn.disabled = currentIndex >= maxIndex;

    leftCarouselBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
    leftCarouselBtn.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';

    rightCarouselBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
    rightCarouselBtn.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
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

  updateCarousel();
})();

// Search bar collapse/expand (landing page / assistance page)
(function initSearchBar() {
  const searchBarWrapper = document.querySelector('.searchBarWrapper');
  const searchField = document.querySelector('.searchField');
  const collapseBtn = $('collapseBtn');
  const searchBtn = $('searchBtn');
  const searchInput = document.querySelector('.searchField input');

  if (!searchBarWrapper || !searchField || !collapseBtn || !searchBtn || !searchInput) return;

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
})();