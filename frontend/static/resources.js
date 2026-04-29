// ============ FILTER STATE ============
let currentFilters = {
    skill: '',
    types: [],
    tags: [],
    search: ''
};

// Abort controller for canceling stale requests
let abortController = null;

// Minimum characters required to trigger search
const MIN_SEARCH_CHARS = 2;


// ============ DATA LOADING ============

// loadFilters injects the html elements into the filter panel upon initial rendering to display types and learning 
// styles stored in the database
async function loadFilters() {
    const [types, tags] = await Promise.all([
        fetch('/api/resources/types').then(r => r.json()),
        fetch('/api/resources/tags').then(r => r.json())
    ]);

    const typeContainer = document.getElementById('typeFilters');
    types.forEach(t => {
        typeContainer.innerHTML += `
            <label>
                <input type="checkbox" name="type" value="${t.id}">
                ${t.name}
            </label>
        `;
    });

    const tagContainer = document.getElementById('tagFilters');
    tags.forEach(t => {
        tagContainer.innerHTML += `
        <label style="--tag-color: ${t.color}">
            <input type="checkbox" name="tag" value="${t.id}">
            <span class="tag-badge">${t.name}</span>
        </label>
    `;
    });
}

// fetchResources fetches all of the items found in the database upon initial load
async function fetchResources() {
    const grid = document.getElementById('resourcesGrid');
    const resultCount = document.getElementById('resultCount');
    
    // Cancel any pending request
    if (abortController) {
        abortController.abort();
    }
    abortController = new AbortController();
    
    // Build query params
    const params = new URLSearchParams();
    
    // Only include search if meets minimum length
    if (currentFilters.search && currentFilters.search.length >= MIN_SEARCH_CHARS) {
        params.set('q', currentFilters.search);
    }
    if (currentFilters.skill) {
        params.set('skill_level', currentFilters.skill);
    }
    if (currentFilters.types.length > 0) {
        params.set('types', currentFilters.types.join(','));
    }
    if (currentFilters.tags.length > 0) {
        params.set('tags', currentFilters.tags.join(','));
    }

    const url = `/api/resources?${params}`;
    
    // Show loading state
    grid.classList.add('loading');
    
    try {
        const response = await fetch(url, { signal: abortController.signal });
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }
        
        const resources = await response.json();
        
        resultCount.textContent = resources.length;
        renderGrid(resources);
        
    } catch (err) {
        // Ignore abort errors (expected when canceling stale requests)
        if (err.name === 'AbortError') {
            return;
        }
        
        // Show error message
        console.error('Search error:', err);
        grid.innerHTML = '<p class="search-error">Something went wrong. Please try again.</p>';
        resultCount.textContent = '0';
        
    } finally {
        grid.classList.remove('loading');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Highlight matching search terms in text
function highlightMatch(text, query) {
    if (!query || query.length < MIN_SEARCH_CHARS) {
        return escapeHtml(text);
    }
    
    const escaped = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    
    // Case-insensitive highlight
    const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
}

// renderGrid is a helper method that injects the html elements of each resource found in the database
function renderGrid(resources) {
    const grid = document.getElementById('resourcesGrid');
    grid.innerHTML = '';
    
    // No results message
    if (resources.length === 0) {
        const searchTerm = currentFilters.search;
        const message = searchTerm && searchTerm.length >= MIN_SEARCH_CHARS
            ? `No resources found for "${escapeHtml(searchTerm)}". Try a different search or adjust your filters.`
            : 'No resources found. Try adjusting your filters.';
        grid.innerHTML = `<p class="no-results">${message}</p>`;
        return;
    }
    
    const query = currentFilters.search;

    resources.forEach(r => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.innerHTML = `
            <h3>${highlightMatch(r.title, query)}</h3>
            <p>${highlightMatch(r.description, query)}</p>
            <span class="skill-badge">${escapeHtml(r.skill_level)}</span>
            <a href="${escapeHtml(r.url)}" target="_blank">View</a>
        `;
        grid.appendChild(card);
    });
}


// ============ EVENT LISTENERS ============

// event listener for skill level filter
document.getElementById('skillFilters').addEventListener('change', (e) => {
    if (e.target.name === 'skill') {
        currentFilters.skill = e.target.value;
        fetchResources();
    }
});

// event listener for type filters checkboxes
document.getElementById('typeFilters').addEventListener('change', (e) => {
    const id = parseInt(e.target.value);
    if (e.target.checked) {
        currentFilters.types.push(id);
    } else {
        currentFilters.types = currentFilters.types.filter(x => x !== id);
    }
    fetchResources();
});

// event listener for the tag filters checkboxes
document.getElementById('tagFilters').addEventListener('change', (e) => {
    const id = parseInt(e.target.value);
    if (e.target.checked) {
        currentFilters.tags.push(id);
    } else {
        currentFilters.tags = currentFilters.tags.filter(x => x !== id);
    }
    fetchResources();
});

// event listener for the clear btn
document.getElementById('clearFilters').addEventListener('click', (e) => {
    currentFilters = { skill: '', types: [], tags: [], search: '' };
    document.querySelectorAll('#skillFilters input').forEach(rb => rb.checked = false);
    document.querySelectorAll('#typeFilters input').forEach(cb => cb.checked = false);
    document.querySelectorAll('#tagFilters input').forEach(cb => cb.checked = false);

    // Clear the search input (defined in common.js)
    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.value = '';

    fetchResources();
});

// ============ INITIALIZATION ============
// on load render page functions
document.addEventListener('DOMContentLoaded', () => {
    // Check for search query in URL (when redirected from another page)
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        currentFilters.search = searchQuery;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = searchQuery;
    }
    
    loadFilters();
    fetchResources();
});
