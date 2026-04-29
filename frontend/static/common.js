// ============================================
// Common functionality shared across all pages
// ============================================

// Check if user is logged in and update header accordingly
window.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('signinBtn');
    
    if (loginBtn) {
        if (user && user.avatar) {
            const avatarStyles = {
                'avatar1': 'background: linear-gradient(135deg, #667eea 0%, #B87B80 100%);',
                'avatar2': 'background: linear-gradient(135deg, #f093fb 0%, #0F4662 100%);',
                'avatar3': 'background: linear-gradient(135deg, #4facfe 0%, #7994A0 100%);'
            };
            
            loginBtn.innerHTML = `
                <div style="width: 32px; height: 32px; border-radius: 50%; ${avatarStyles[user.avatar] || avatarStyles['avatar1']}"></div>
                <span>${user.fName}</span>
            `;
            loginBtn.onclick = () => {
                window.location.href = '/dashboard';
            };
        } else if (user) {
            loginBtn.style.display = 'none';
        } else {
            loginBtn.style.display = '';
        }
    }
});

// Home button navigation (handles both ID variations)
const homeBtn = document.getElementById('G6Logo') || document.getElementById('likeag6Logo');
if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
}

// Login button navigation (only if not already overridden by DOMContentLoaded)
const loginBtn = document.getElementById('signinBtn');
if (loginBtn && !localStorage.getItem('user')) {
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login';
    });
}

// ============ SEARCH FUNCTIONALITY ============

// Debounce helper - waits until user stops typing
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Search bar collapse/expand functionality
const searchBarWrapper = document.querySelector('.searchBarWrapper');
const searchField = document.querySelector('.searchField');
const collapseBtn = document.getElementById('collapseBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.querySelector('.searchField input');

if (collapseBtn && searchBarWrapper && searchField) {
    collapseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchBarWrapper.classList.add('collapsed');
        searchField.classList.add('collapsed');
    });
}

if (searchBtn && searchField && searchBarWrapper) {
    searchBtn.addEventListener('click', (e) => {
        if (searchField.classList.contains('collapsed')) {
            e.preventDefault();
            searchBarWrapper.classList.remove('collapsed');
            searchField.classList.remove('collapsed');
            if (searchInput) searchInput.focus();
        }
    });
}

// Minimum characters required to trigger search
const COMMON_MIN_SEARCH_CHARS = 2;

// Universal search handler - works on any page
if (searchInput) {
    const isResourcesPage = window.location.pathname === '/resources';
    
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim();
        
        if (isResourcesPage && typeof currentFilters !== 'undefined' && typeof fetchResources === 'function') {
            // On resources page: filter in-place
            // Allow empty query (to clear) or queries meeting minimum length
            if (query.length === 0 || query.length >= COMMON_MIN_SEARCH_CHARS) {
                currentFilters.search = query;
                fetchResources();
            }
        }
    }, 300));
    
    // Handle Enter key to navigate/search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            
            // On other pages: redirect to resources with search query (if valid length)
            if (!isResourcesPage && query.length >= COMMON_MIN_SEARCH_CHARS) {
                window.location.href = `/resources?q=${encodeURIComponent(query)}`;
            } else if (!isResourcesPage && query.length > 0 && query.length < COMMON_MIN_SEARCH_CHARS) {
                // Provide feedback for too-short queries
                searchInput.classList.add('invalid');
                setTimeout(() => searchInput.classList.remove('invalid'), 500);
            }
        }
    });
}


