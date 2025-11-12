// Carousel functionality
class Carousel {
  constructor() {
    this.currentPage = 0;
    this.totalPages = 3;
    this.cardsPerPage = 3;
    this.carousel = document.querySelector('.resources-carousel');
    this.leftArrow = document.querySelector('.arrow-circle-left');
    this.rightArrow = document.querySelector('.vuesax-twotone-arrow');
    this.dots = document.querySelectorAll('.dots > div');
    this.cards = document.querySelectorAll('.resources-carousel > div');
    this.init();
  }
  init() {
    if (!this.carousel || !this.leftArrow || !this.rightArrow) return;
    this.leftArrow.addEventListener('click', () => this.previousPage());
    this.rightArrow.addEventListener('click', () => this.nextPage());
    this.updateCarousel();
  }
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updateCarousel();
    }
  }
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateCarousel();
    }
  }
  updateCarousel() {
    if (!this.cards.length) return;
    const cardWidth = this.cards[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(this.carousel).gap);
    const offset = this.currentPage * (cardWidth + gap);
    this.carousel.style.transform = `translate(-50%, -50%) translateX(-${offset}px)`;
    this.updateDots();
    this.updateArrows();
  }
  updateDots() {
    this.dots.forEach((dot, index) => {
      dot.style.backgroundColor = index === this.currentPage ? '#000000' : '#d9d9d9';
    });
  }
  updateArrows() {
    if (!this.leftArrow || !this.rightArrow) return;
    if (this.currentPage === 0) {
      this.leftArrow.style.opacity = '0';
      this.leftArrow.style.pointerEvents = 'none';
    } else {
      this.leftArrow.style.opacity = '1';
      this.leftArrow.style.pointerEvents = 'auto';
    }
    if (this.currentPage === this.totalPages - 1) {
      this.rightArrow.style.opacity = '0';
      this.rightArrow.style.pointerEvents = 'none';
    } else {
      this.rightArrow.style.opacity = '1';
      this.rightArrow.style.pointerEvents = 'auto';
    }
  }
}

// Social Media Links
class SocialMediaLinks {
  constructor() {
    this.socialIcons = document.querySelector('.social-icons');
    this.socialLinks = {
      facebook: 'https://www.facebook.com',
      linkedin: 'https://www.linkedin.com',
      youtube: 'https://www.youtube.com',
      instagram: 'https://www.instagram.com'
    };
    this.init();
  }
  init() {
    if (!this.socialIcons) return;
    this.socialIcons.style.cursor = 'pointer';
    this.socialIcons.addEventListener('click', (e) => this.handleClick(e));
    this.createClickableAreas();
  }
  createClickableAreas() {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '16px';
    const icons = ['facebook', 'linkedin', 'youtube', 'instagram'];
    icons.forEach((icon) => {
      const iconArea = document.createElement('div');
      iconArea.className = `social-icon-${icon}`;
      iconArea.style.width = '40px';
      iconArea.style.height = '40px';
      iconArea.style.cursor = 'pointer';
      iconArea.style.transition = 'transform 0.2s ease';
      iconArea.dataset.social = icon;
      iconArea.addEventListener('mouseenter', () => { iconArea.style.transform = 'scale(1.1)'; });
      iconArea.addEventListener('mouseleave', () => { iconArea.style.transform = 'scale(1)'; });
      iconArea.addEventListener('click', (e) => { e.stopPropagation(); this.redirectTo(icon); });
      wrapper.appendChild(iconArea);
    });
    this.socialIcons.parentElement.style.position = 'relative';
    this.socialIcons.parentElement.appendChild(wrapper);
  }
  handleClick(e) {
    const rect = this.socialIcons.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const iconWidth = rect.width / 4;
    const iconIndex = Math.floor(x / iconWidth);
    const icons = ['facebook', 'linkedin', 'youtube', 'instagram'];
    if (iconIndex >= 0 && iconIndex < icons.length) this.redirectTo(icons[iconIndex]);
  }
  redirectTo(platform) {
    const url = this.socialLinks[platform];
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Search Bar functionality
class SearchBar {
  constructor() {
    this.searchBar = document.querySelector('.search-bar');
    this.searchInput = document.querySelector('.text-wrapper-16');
    this.clearButton = document.querySelector('.x');
    this.searchIcon = document.querySelector('.message-question');
    this.isExpanded = true;
    this.searchValue = '';
    this.init();
  }
  init() {
    if (!this.searchBar || !this.searchInput || !this.clearButton || !this.searchIcon) return;
    this.createInput();
    this.clearButton.addEventListener('click', (e) => { e.stopPropagation(); this.clearSearch(); });
    this.searchIcon.addEventListener('click', () => { if (!this.isExpanded) this.expandSearch(); });
    document.addEventListener('click', (e) => {
      if (!this.searchBar.contains(e.target) && this.isExpanded && !this.searchValue) this.collapseSearch();
    });
  }
  createInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search...';
    input.className = 'search-input';
    input.style.cssText = `
      flex: 1; border: none; outline: none; background: transparent;
      font-family: "Quicksand", Helvetica; font-weight: 600; color: #0f4662;
      font-size: 24px; letter-spacing: 0; line-height: normal;
      transition: opacity .3s ease, width .3s ease, flex .3s ease;
    `;
    this.searchInput.style.display = 'none';
    this.searchInput.parentElement.insertBefore(input, this.searchInput);
    this.input = input;
    this.searchBar.classList.add('expanded');
    this.input.addEventListener('input', (e) => { this.searchValue = e.target.value; this.updateClearButton(); });
    this.input.addEventListener('focus', () => { this.expandSearch(); });
    this.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.performSearch(); });
  }
  updateClearButton() {}
  clearSearch() {
    this.searchValue = '';
    this.input.value = '';
    this.updateClearButton();
    this.collapseSearch();
  }
  expandSearch() {
    this.isExpanded = true;
    this.searchBar.classList.remove('collapsed'); this.searchBar.classList.add('expanded');
    this.searchBar.style.width = '48.61%';
    this.searchBar.style.height = '60px';
    this.searchBar.style.left = '25.69%';
    this.searchBar.style.transform = 'translateX(0)';
    this.searchBar.style.borderRadius = '50px';
    this.input.style.opacity = '1';
    this.input.style.width = 'auto';
    this.input.style.flex = '1';
    this.input.style.pointerEvents = 'auto';
    setTimeout(() => { this.input.focus(); }, 150);
  }
  collapseSearch() {
    if (this.searchValue) return;
    this.isExpanded = false;
    this.searchBar.classList.remove('expanded'); this.searchBar.classList.add('collapsed');
    this.input.style.opacity = '0';
    this.input.style.width = '0';
    this.input.style.flex = '0';
    this.input.style.pointerEvents = 'none';
    this.input.blur();
    this.searchBar.style.width = '120px';
    this.searchBar.style.height = '60px';
    this.searchBar.style.left = '50%';
    this.searchBar.style.transform = 'translateX(-50%)';
    this.searchBar.style.borderRadius = '30px';
  }
  performSearch() {
    if (this.searchValue.trim()) {
      console.log('Searching for:', this.searchValue);
      alert(`Searching for: ${this.searchValue}`);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new Carousel();
  new SocialMediaLinks();
  new SearchBar();

  // ---- CALCULATOR (existing behavior) ----
  const redirectToCalculator = () => { window.location.href = '/matrixCalc'; };

  // Restores your original helper for calculator tiles/buttons
  const addRedirect = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', redirectToCalculator);
    el.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        redirectToCalculator();
      }
    });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  };

  addRedirect('.calculator-button');
  addRedirect('.calculator');

  // ---- GRAPHING (new behavior) ----
  const redirectToGraphing = () => { window.location.href = '/graphing'; };

  const addRedirectTo = (selector, fn) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', fn);
    el.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fn();
      }
    });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  };

  // Small top icon + big center card → /graphing
  addRedirectTo('.graphing-button', redirectToGraphing);
  addRedirectTo('.graphing', redirectToGraphing);

  // ---- Fallback: event delegation (clicks on child nodes still count) ----
  document.addEventListener('click', (e) => {
    const graphTile = e.target.closest('.graphing-button, .graphing');
    if (graphTile) {
      e.preventDefault();
      redirectToGraphing();
      return;
    }
    const calcTile = e.target.closest('.calculator-button, .calculator');
    if (calcTile) {
      e.preventDefault();
      redirectToCalculator();
    }
  });
});
