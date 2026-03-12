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

let currentFilters = {
    skill: '',
    types: [],
    tags: []
};
// fetchResources fetches all of the items found in the database upon initial load
async function fetchResources() {
    const params = new URLSearchParams();
    if(currentFilters.skill) {
        params.set('skill_level', currentFilters.skill);
    }
    if(currentFilters.types.length > 0) {
        params.set('types', currentFilters.types.join(','));
    }
    if(currentFilters.tags.length > 0) {
        params.set('tags', currentFilters.tags.join(','));
    }

    const url = `/api/resources?${params}`;
    const response = await fetch(url);
    const resources = await response.json();

    document.getElementById('resultCount').textContent = resources.length;

    renderGrid(resources);
}

// renderGrid is a helper method that injects the html elements of each resource found in the database
function renderGrid(resources) {
    const grid = document.getElementById('resourcesGrid');
    grid.innerHTML = '';

    resources.forEach(r => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.innerHTML = `
            <h3>${r.title}</h3>
            <p>${r.description}</p>
            <span class="skill-badge">${r.skill_level}</span>
            <a href="${r.url}" target="_blank">View</a>
        `;
        grid.appendChild(card);
    });
}

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
    currentFilters = { skill: '', types: [], tags: [] };
    document.querySelectorAll('#skillFilters input').forEach(rb => rb.checked = false);
    document.querySelectorAll('#typeFilters input').forEach(cb => cb.checked = false);
    document.querySelectorAll('#tagFilters input').forEach(cb => cb.checked = false);

    fetchResources();
});

// on load render page functions
document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
    fetchResources();
});
