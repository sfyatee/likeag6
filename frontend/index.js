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
    // Add click listeners to arrows
    this.leftArrow.addEventListener('click', () => this.previousPage());
    this.rightArrow.addEventListener('click', () => this.nextPage());
    
    // Initialize carousel state
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
    // Calculate the card width and gap
    const cardWidth = this.cards[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(this.carousel).gap);
    
    // Calculate the offset for the current page
    const offset = this.currentPage * (cardWidth + gap);
    
    // Apply transform to shift carousel
    this.carousel.style.transform = `translate(-50%, -50%) translateX(-${offset}px)`;
    
    // Update dots
    this.updateDots();
    
    // Update arrow visibility
    this.updateArrows();
  }
  
  updateDots() {
    this.dots.forEach((dot, index) => {
      if (index === this.currentPage) {
        dot.style.backgroundColor = '#000000';
      } else {
        dot.style.backgroundColor = '#d9d9d9';
      }
    });
  }
  
  updateArrows() {
    // Hide left arrow on first page
    if (this.currentPage === 0) {
      this.leftArrow.style.opacity = '0';
      this.leftArrow.style.pointerEvents = 'none';
    } else {
      this.leftArrow.style.opacity = '1';
      this.leftArrow.style.pointerEvents = 'auto';
    }
    
    // Hide right arrow on last page
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
    
    // Make the social icons container clickable
    this.socialIcons.style.cursor = 'pointer';
    
    // Add click event listener
    this.socialIcons.addEventListener('click', (e) => this.handleClick(e));
    
    // Create individual clickable areas for each icon
    this.createClickableAreas();
  }
  
  createClickableAreas() {
    // Create wrapper div for individual icons
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '16px';
    
    // Create clickable areas for each social media icon
    const icons = ['facebook', 'linkedin', 'youtube', 'instagram'];
    icons.forEach((icon, index) => {
      const iconArea = document.createElement('div');
      iconArea.className = `social-icon-${icon}`;
      iconArea.style.width = '40px';
      iconArea.style.height = '40px';
      iconArea.style.cursor = 'pointer';
      iconArea.style.transition = 'transform 0.2s ease';
      iconArea.dataset.social = icon;
      
      // Add hover effect
      iconArea.addEventListener('mouseenter', () => {
        iconArea.style.transform = 'scale(1.1)';
      });
      
      iconArea.addEventListener('mouseleave', () => {
        iconArea.style.transform = 'scale(1)';
      });
      
      // Add click handler
      iconArea.addEventListener('click', (e) => {
        e.stopPropagation();
        this.redirectTo(icon);
      });
      
      wrapper.appendChild(iconArea);
    });
    
    // Insert wrapper after the social icons image
    this.socialIcons.parentElement.style.position = 'relative';
    this.socialIcons.parentElement.appendChild(wrapper);
  }
  
  handleClick(e) {
    // Get click position relative to the image
    const rect = this.socialIcons.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const iconWidth = rect.width / 4; // 4 icons
    const iconIndex = Math.floor(x / iconWidth);
    
    const icons = ['facebook', 'linkedin', 'youtube', 'instagram'];
    if (iconIndex >= 0 && iconIndex < icons.length) {
      this.redirectTo(icons[iconIndex]);
    }
  }
  
  redirectTo(platform) {
    const url = this.socialLinks[platform];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
    if (!this.searchBar) return;
    
    // Convert the text div to an actual input
    this.createInput();
    
    // Add event listeners
    this.clearButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearSearch();
    });
    
    this.searchIcon.addEventListener('click', () => {
      if (!this.isExpanded) {
        this.expandSearch();
      }
    });
    
    // Collapse on outside click
    document.addEventListener('click', (e) => {
      if (!this.searchBar.contains(e.target) && this.isExpanded && !this.searchValue) {
        this.collapseSearch();
      }
    });
  }
  
  createInput() {
    // Create actual input element
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search...';
    input.className = 'search-input';
    input.style.cssText = `
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: "Quicksand", Helvetica;
      font-weight: 600;
      color: #0f4662;
      font-size: 24px;
      letter-spacing: 0;
      line-height: normal;
      transition: opacity 0.3s ease, width 0.3s ease, flex 0.3s ease;
    `;
    
    // Replace the placeholder text with input
    this.searchInput.style.display = 'none';
    this.searchInput.parentElement.insertBefore(input, this.searchInput);
    this.input = input;
    
    // Start in expanded state
    this.searchBar.classList.add('expanded');
    
    // Add input event listeners
    this.input.addEventListener('input', (e) => {
      this.searchValue = e.target.value;
      this.updateClearButton();
    });
    
    this.input.addEventListener('focus', () => {
      this.expandSearch();
    });
    
    this.input.addEventListener('blur', () => {
      // Blur handler
    });
    
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
  }
  
  updateClearButton() {
    // X button is always visible now, no need to hide it
    // Keep it visible at all times
  }
  
  clearSearch() {
    this.searchValue = '';
    this.input.value = '';
    this.updateClearButton();
    this.collapseSearch();
  }
  
  expandSearch() {
    this.isExpanded = true;
    
    // Remove collapsed class, add expanded class
    this.searchBar.classList.remove('collapsed');
    this.searchBar.classList.add('expanded');
    
    // Animate expansion
    this.searchBar.style.width = '48.61%';
    this.searchBar.style.height = '60px';
    this.searchBar.style.left = '25.69%';
    this.searchBar.style.transform = 'translateX(0)';
    this.searchBar.style.borderRadius = '50px';
    
    // Show input
    this.input.style.opacity = '1';
    this.input.style.width = 'auto';
    this.input.style.flex = '1';
    this.input.style.pointerEvents = 'auto';
    
    setTimeout(() => {
      this.input.focus();
    }, 150);
  }
  
  collapseSearch() {
    if (this.searchValue) return; // Don't collapse if there's text
    
    this.isExpanded = false;
    
    // Remove expanded class, add collapsed class
    this.searchBar.classList.remove('expanded');
    this.searchBar.classList.add('collapsed');
    
    // Hide input
    this.input.style.opacity = '0';
    this.input.style.width = '0';
    this.input.style.flex = '0';
    this.input.style.pointerEvents = 'none';
    this.input.blur();
    
    // Animate collapse to center
    this.searchBar.style.width = '120px';
    this.searchBar.style.height = '60px';
    this.searchBar.style.left = '50%';
    this.searchBar.style.transform = 'translateX(-50%)';
    this.searchBar.style.borderRadius = '30px';
  }
  
  performSearch() {
    if (this.searchValue.trim()) {
      console.log('Searching for:', this.searchValue);
      // Add your search logic here
      // For now, just log the search term
      alert(`Searching for: ${this.searchValue}`);
    }
  }
}

// Initialize carousel, social media links, and search bar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Carousel();
  new SocialMediaLinks();
  new SearchBar();

  const redirectToCalculator = () => {
    window.location.href = '/matrixCalc';
  };

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
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
  };

  addRedirect('.calculator-button');
  addRedirect('.calculator');
});
