// API URLs
const API_BASE = '/api';

// State
let currentUser = null;
let jobs = [];
let history = [];
let errorLogs = [];
let currentTab = 'jobs';

// Filter Data
const BRANDS = [
    { id: 157, label: 'Volkswagen' }, { id: 96, label: 'BMW' }, { id: 130, label: 'Mercedes-Benz' },
    { id: 140, label: 'Peugeot' }, { id: 112, label: 'Ford' }, { id: 138, label: 'Opel' },
    { id: 93, label: 'Audi' }, { id: 146, label: 'Renault' }, { id: 155, label: 'Toyota' },
    { id: 119, label: 'Kia' }, { id: 158, label: 'Volvo' }, { id: 101, label: 'Citroën' },
    { id: 111, label: 'Fiat' }, { id: 150, label: 'Seat' }, { id: 115, label: 'Hyundai' },
    { id: 151, label: 'Skoda' }, { id: 133, label: 'Mini' }, { id: 135, label: 'Nissan' },
    { id: 154, label: 'Suzuki' }, { id: 129, label: 'Mazda' }, { id: 124, label: 'Land Rover' },
    { id: 144, label: 'Porsche' }, { id: 134, label: 'Mitsubishi' }, { id: 2660, label: 'Dacia' },
    { id: 92, label: 'Alfa Romeo' }, { id: 118, label: 'Jeep' }, { id: 2830, label: 'Tesla' }
].sort((a, b) => a.label.localeCompare(b.label));

const FUEL_TYPES = [
    { id: 473, label: 'Benzine' }, { id: 474, label: 'Diesel' },
    { id: 11756, label: 'Elektrisch' }, { id: 13838, label: 'Hybride Elektrisch/Benzine' },
    { id: 13839, label: 'Hybride Elektrisch/Diesel' }, { id: 475, label: 'LPG' },
    { id: 13840, label: 'CNG (Aardgas)' }, { id: 13841, label: 'Waterstof' }
];

const BODY_TYPES = [
    { id: 485, label: 'Cabriolet' }, { id: 486, label: 'Coupé' }, { id: 481, label: 'Hatchback' },
    { id: 482, label: 'MPV' }, { id: 483, label: 'Sedan' }, { id: 484, label: 'Stationwagon' },
    { id: 488, label: 'SUV / Terreinwagen' }
];

const TRANSMISSIONS = [
    { id: 534, label: 'Automatic' }, { id: 535, label: 'Manual' }
];

const ADVERTISER_TYPES = [
    { id: 10898, label: 'Private (Particulier)' }, { id: 10899, label: 'Business (Bedrijf)' }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Initialize Filter Options
let filtersInitialized = false;

function initializeFilters() {
    // Only initialize once
    if (filtersInitialized) return;

    // Brand select
    const brandSelect = document.getElementById('brandSelect');
    if (!brandSelect) {
        console.error('brandSelect not found');
        return;
    }

    // Clear existing options first (except the first "Any Brand" option)
    while (brandSelect.options.length > 1) {
        brandSelect.remove(1);
    }

    BRANDS.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.label;
        brandSelect.appendChild(option);
    });

    // Fuel checkboxes
    const fuelContainer = document.getElementById('fuelFilters');
    if (fuelContainer && fuelContainer.children.length === 0) {
        FUEL_TYPES.forEach(fuel => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="fuel_${fuel.id}" value="${fuel.id}">
                <label for="fuel_${fuel.id}">${fuel.label}</label>
            `;
            fuelContainer.appendChild(div);
        });
    }

    // Body type checkboxes
    const bodyContainer = document.getElementById('bodyFilters');
    if (bodyContainer && bodyContainer.children.length === 0) {
        BODY_TYPES.forEach(body => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="body_${body.id}" value="${body.id}">
                <label for="body_${body.id}">${body.label}</label>
            `;
            bodyContainer.appendChild(div);
        });
    }

    // Transmission checkboxes
    const transmissionContainer = document.getElementById('transmissionFilters');
    if (transmissionContainer && transmissionContainer.children.length === 0) {
        TRANSMISSIONS.forEach(trans => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="trans_${trans.id}" value="${trans.id}">
                <label for="trans_${trans.id}">${trans.label}</label>
            `;
            transmissionContainer.appendChild(div);
        });
    }

    // Advertiser checkboxes
    const advertiserContainer = document.getElementById('advertiserFilters');
    if (advertiserContainer && advertiserContainer.children.length === 0) {
        ADVERTISER_TYPES.forEach(adv => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="adv_${adv.id}" value="${adv.id}">
                <label for="adv_${adv.id}">${adv.label}</label>
            `;
            advertiserContainer.appendChild(div);
        });
    }

    filtersInitialized = true;
    console.log('Filters initialized successfully');
}

// Auth Functions
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/status`);
        const data = await response.json();

        if (data.isAuthenticated) {
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showDashboard();
            loadDashboardData();
        } else {
            errorDiv.textContent = data.message || 'Invalid credentials';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        showLogin();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    initializeFilters();
}

// Dashboard Data Functions
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadJobs(),
        loadHistory()
    ]);
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/listinglogs/stats`);
        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();

        document.getElementById('totalListings').textContent = data.totalListings || 0;
        document.getElementById('last24Hours').textContent = data.last24Hours || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE}/monitorjobs`);
        if (!response.ok) throw new Error('Failed to load jobs');

        jobs = await response.json();
        renderJobs();
        updateJobsCount();
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsList').innerHTML = '<p class="error">Failed to load jobs</p>';
    }
}

function renderJobs() {
    const container = document.getElementById('jobsList');

    if (jobs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No monitor jobs yet. Click "Add New Job" to get started!</p>';
        return;
    }

    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-card-header">
                <div>
                    <div class="job-title">${escapeHtml(job.name)}</div>
                    <div class="job-email">📧 ${escapeHtml(job.emailTo)}</div>
                </div>
                <span class="job-status ${job.isActive ? 'active' : 'inactive'}">
                    ${job.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
            </div>
            ${renderJobFilters(job.filters)}
            <div class="job-meta">
                <span>🕐 Created: ${formatDate(job.createdAt)}</span>
                ${job.lastRunAt ? `<span>⏰ Last check: ${formatDate(job.lastRunAt)}</span>` : ''}
                ${job.lastListingDate ? `<span>📬 Last notification: ${formatDate(job.lastListingDate)}</span>` : ''}
            </div>
            <div class="job-actions">
                <button class="btn btn-sm btn-primary" onclick="testJob(${job.id})">Test</button>
                <button class="btn btn-sm btn-secondary" onclick="editJob(${job.id})">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="toggleJobStatus(${job.id})">${job.isActive ? 'Deactivate' : 'Activate'}</button>
                <button class="btn btn-sm btn-danger" onclick="deleteJob(${job.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function renderJobFilters(filters) {
    if (!filters || filters.length === 0) return '';

    const filterTags = [];
    const SUBCATEGORIES = {
        '149': 'SchadeAuto\'s',
    };

    filters.forEach(filter => {
        const type = filter.filterType.toLowerCase();

        if (type === 'query') {
            filterTags.push(`🔍 "${escapeHtml(filter.value)}"`);
        } else if (type === 'l1categoryid') {
            if (filter.value === '48') {
                filterTags.push(`📂 Auto diversen`);
            }
        } else if (type === 'l2categoryid') {
            // Check if it's a subcategory or brand
            const subcategory = SUBCATEGORIES[filter.value];
            if (subcategory) {
                filterTags.push(`🔧 ${subcategory}`);
            } else {
                const brand = BRANDS.find(b => b.id == filter.value);
                if (brand) filterTags.push(`🚗 ${brand.label}`);
            }
        } else if (type === 'attributerange') {
            const [key, range] = filter.value.split(':');
            if (range) {
                const [min, max] = range.split('|');
                if (key.includes('Prijs')) {
                    filterTags.push(`💰 €${min}-€${max}`);
                } else if (key === 'Bouwjaar') {
                    filterTags.push(`📅 ${min}-${max}`);
                } else if (key === 'mileage') {
                    filterTags.push(`📏 ${min}-${max}km`);
                }
            }
        } else if (type === 'attributebyid') {
            const fuel = FUEL_TYPES.find(f => f.id == filter.value);
            if (fuel) {
                filterTags.push(`⛽ ${fuel.label}`);
            } else {
                const body = BODY_TYPES.find(b => b.id == filter.value);
                if (body) {
                    filterTags.push(`🚙 ${body.label}`);
                } else {
                    const trans = TRANSMISSIONS.find(t => t.id == filter.value);
                    if (trans) {
                        filterTags.push(`⚙️ ${trans.label}`);
                    } else {
                        const adv = ADVERTISER_TYPES.find(a => a.id == filter.value);
                        if (adv) filterTags.push(`👤 ${adv.label}`);
                    }
                }
            }
        } else if (type === 'postcode') {
            filterTags.push(`📍 ${filter.value}`);
        }
    });

    if (filterTags.length === 0) return '';

    return `<div class="job-filters">${filterTags.join(' ')}</div>`;
}

function updateJobsCount() {
    const activeCount = jobs.filter(j => j.isActive).length;
    document.getElementById('activeJobs').textContent = `${activeCount} / 5`;
}

async function loadHistory() {
    try {
        const jobFilter = document.getElementById('historyJobFilter')?.value || '';
        const url = jobFilter ? `${API_BASE}/listinglogs?jobId=${jobFilter}&limit=50` : `${API_BASE}/listinglogs?limit=50`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load history');

        history = await response.json();
        renderHistory();
        populateJobFilter();
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyList').innerHTML = '<p class="error">Failed to load history</p>';
    }
}

function renderHistory() {
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No notifications sent yet.</p>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item">
            ${item.imageUrl ?
                `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" class="history-image">` :
                `<div class="history-image-placeholder">🚗</div>`
            }
            <div class="history-content">
                <div class="history-title">
                    <a href="${item.url}" target="_blank">${escapeHtml(item.title)}</a>
                </div>
                ${item.description ? `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(truncate(item.description, 100))}</div>` : ''}
                <div class="history-meta">
                    <span>📅 ${formatDate(item.notifiedAt)}</span>
                    <span>🆔 ${item.listingId}</span>
                </div>
            </div>
            ${item.price ? `<div class="history-price">€${item.price.toFixed(2)}</div>` : ''}
        </div>
    `).join('');
}

function populateJobFilter() {
    const select = document.getElementById('historyJobFilter');
    if (!select || jobs.length === 0) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">All Jobs</option>' +
        jobs.map(job => `<option value="${job.id}">${escapeHtml(job.name)}</option>`).join('');
    select.value = currentValue;
}

// Category handling
function handleCategoryChange() {
    const category = document.getElementById('categorySelect').value;
    const subcategoryGroup = document.getElementById('subcategoryGroup');

    if (category === '48') {
        subcategoryGroup.style.display = 'block';
    } else {
        subcategoryGroup.style.display = 'none';
        document.getElementById('subcategorySelect').value = '';
    }
}

// Tab Functions
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.getElementById('jobsTab').style.display = tab === 'jobs' ? 'block' : 'none';
    document.getElementById('historyTab').style.display = tab === 'history' ? 'block' : 'none';
    document.getElementById('errorsTab').style.display = tab === 'errors' ? 'block' : 'none';

    // Load error logs when switching to errors tab
    if (tab === 'errors') {
        loadErrorLogs();
    }
}

// Job Modal Functions
function showAddJobModal() {
    if (jobs.length >= 5) {
        alert('Maximum number of jobs (5) reached. Please delete a job first.');
        return;
    }

    document.getElementById('modalTitle').textContent = 'Add New Job';
    document.getElementById('jobForm').reset();
    document.getElementById('jobId').value = '';
    document.getElementById('isActive').checked = true;

    // Reset all checkboxes
    document.querySelectorAll('#fuelFilters input, #bodyFilters input, #transmissionFilters input, #advertiserFilters input').forEach(cb => cb.checked = false);

    document.getElementById('jobModal').classList.add('show');
}

async function editJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    // Reset form
    document.getElementById('jobForm').reset();
    document.querySelectorAll('#fuelFilters input, #bodyFilters input, #transmissionFilters input, #advertiserFilters input').forEach(cb => cb.checked = false);

    document.getElementById('modalTitle').textContent = 'Edit Job';
    document.getElementById('jobId').value = job.id;
    document.getElementById('jobName').value = job.name;
    document.getElementById('emailTo').value = job.emailTo;
    document.getElementById('isActive').checked = job.isActive;

    // Populate filters
    if (job.filters) {
        job.filters.forEach(filter => {
            try {
                if (filter.filterType.toLowerCase() === 'query') {
                    const el = document.getElementById('searchQuery');
                    if (el) el.value = filter.value;
                } else if (filter.filterType.toLowerCase() === 'l1categoryid') {
                    const el = document.getElementById('categorySelect');
                    if (el) {
                        el.value = filter.value;
                        handleCategoryChange(); // Show/hide subcategory
                    }
                } else if (filter.filterType.toLowerCase() === 'l2categoryid') {
                    // Check if it's a subcategory for Auto diversen or a brand for regular cars
                    const category = document.getElementById('categorySelect').value;
                    if (category === '48') {
                        const el = document.getElementById('subcategorySelect');
                        if (el) el.value = filter.value;
                    } else {
                        const el = document.getElementById('brandSelect');
                        if (el) el.value = filter.value;
                    }
                } else if (filter.filterType.toLowerCase() === 'postcode') {
                    const el = document.getElementById('postcode');
                    if (el) el.value = filter.value;
                } else if (filter.filterType.toLowerCase() === 'attributerange') {
                    const [key, range] = filter.value.split(':');
                    if (range) {
                        const [min, max] = range.split('|');
                        if (key === 'PrijsVan' || key.includes('Prijs')) {
                            const minEl = document.getElementById('minPrice');
                            const maxEl = document.getElementById('maxPrice');
                            if (minEl) minEl.value = min;
                            if (maxEl) maxEl.value = max;
                        } else if (key === 'Bouwjaar') {
                            const minEl = document.getElementById('minYear');
                            const maxEl = document.getElementById('maxYear');
                            if (minEl) minEl.value = min;
                            if (maxEl) maxEl.value = max;
                        } else if (key === 'mileage') {
                            const minEl = document.getElementById('minMileage');
                            const maxEl = document.getElementById('maxMileage');
                            if (minEl) minEl.value = min;
                            if (maxEl) maxEl.value = max;
                        }
                    }
                } else if (filter.filterType.toLowerCase() === 'attributebyid') {
                    // Check corresponding checkbox
                    const checkbox = document.querySelector(`input[type="checkbox"][value="${filter.value}"]`);
                    if (checkbox) checkbox.checked = true;
                }
            } catch (error) {
                console.warn('Error loading filter:', filter, error);
            }
        });
    }

    document.getElementById('jobModal').classList.add('show');
}

function closeJobModal() {
    document.getElementById('jobModal').classList.remove('show');
}

async function saveJob(event) {
    event.preventDefault();

    const jobId = document.getElementById('jobId').value;
    const jobData = {
        id: jobId ? parseInt(jobId) : 0,
        name: document.getElementById('jobName').value,
        emailTo: document.getElementById('emailTo').value,
        isActive: document.getElementById('isActive').checked,
        filters: buildFilters()
    };

    try {
        const url = jobId ? `${API_BASE}/monitorjobs/${jobId}` : `${API_BASE}/monitorjobs`;
        const method = jobId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save job');
        }

        closeJobModal();
        await loadJobs();
    } catch (error) {
        alert(error.message);
        console.error('Error saving job:', error);
    }
}

function buildFilters() {
    const filters = [];

    // Search Query
    const query = document.getElementById('searchQuery').value.trim();
    if (query) {
        filters.push({ filterType: 'query', key: '', value: query });
    }

    // Category
    const category = document.getElementById('categorySelect').value;
    filters.push({ filterType: 'l1CategoryId', key: '', value: category });

    // Subcategory (for Auto diversen)
    if (category === '48') {
        const subcategory = document.getElementById('subcategorySelect').value;
        if (subcategory) {
            filters.push({ filterType: 'l2CategoryId', key: '', value: subcategory });
        }
    } else {
        // Brand (only for regular cars category)
        const brand = document.getElementById('brandSelect').value;
        if (brand) {
            filters.push({ filterType: 'l2CategoryId', key: '', value: brand });
        }
    }

    // Postcode
    const postcode = document.getElementById('postcode').value.trim();
    if (postcode) {
        filters.push({ filterType: 'postcode', key: '', value: postcode });
    }

    // Price Range
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    if (minPrice || maxPrice) {
        filters.push({
            filterType: 'attributeRange',
            key: 'PrijsVan',
            value: `PrijsVan:${minPrice || '0'}|${maxPrice || '999999'}`
        });
    }

    // Year Range
    const minYear = document.getElementById('minYear').value;
    const maxYear = document.getElementById('maxYear').value;
    if (minYear || maxYear) {
        filters.push({
            filterType: 'attributeRange',
            key: 'Bouwjaar',
            value: `Bouwjaar:${minYear || '1900'}|${maxYear || new Date().getFullYear()}`
        });
    }

    // Mileage Range
    const minMileage = document.getElementById('minMileage').value;
    const maxMileage = document.getElementById('maxMileage').value;
    if (minMileage || maxMileage) {
        filters.push({
            filterType: 'attributeRange',
            key: 'mileage',
            value: `mileage:${minMileage || '0'}|${maxMileage || '999999'}`
        });
    }

    // Fuel Types (checkboxes)
    document.querySelectorAll('#fuelFilters input:checked').forEach(cb => {
        filters.push({ filterType: 'attributeById', key: '', value: cb.value });
    });

    // Body Types (checkboxes)
    document.querySelectorAll('#bodyFilters input:checked').forEach(cb => {
        filters.push({ filterType: 'attributeById', key: '', value: cb.value });
    });

    // Transmission (checkboxes)
    document.querySelectorAll('#transmissionFilters input:checked').forEach(cb => {
        filters.push({ filterType: 'attributeById', key: '', value: cb.value });
    });

    // Advertiser Types (checkboxes)
    document.querySelectorAll('#advertiserFilters input:checked').forEach(cb => {
        filters.push({ filterType: 'attributeById', key: '', value: cb.value });
    });

    return filters;
}

async function toggleJobStatus(id) {
    try {
        const response = await fetch(`${API_BASE}/monitorjobs/${id}/toggle`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to toggle job');

        await loadJobs();
    } catch (error) {
        alert('Failed to update job status');
        console.error('Error toggling job:', error);
    }
}

async function deleteJob(id) {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
        const response = await fetch(`${API_BASE}/monitorjobs/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete job');

        await loadJobs();
    } catch (error) {
        alert('Failed to delete job');
        console.error('Error deleting job:', error);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Never';

    // Parse the date - if no timezone info, treat as UTC
    let date;
    if (!dateString.includes('Z') && !dateString.includes('+')) {
        // Add 'Z' to indicate UTC if not present
        date = new Date(dateString + 'Z');
    } else {
        date = new Date(dateString);
    }

    // Format as: DD/MM/YYYY HH:MM:SS
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Test Job Functions
async function testJob(id) {
    try {
        const response = await fetch(`${API_BASE}/monitorjobs/${id}/test`, { method: 'POST' });

        if (!response.ok) {
            throw new Error('Failed to test search');
        }

        const result = await response.json();
        showTestResults(result);
    } catch (error) {
        alert('Failed to test search: ' + error.message);
        console.error('Error testing job:', error);
    }
}

function showTestResults(result) {
    const modal = document.getElementById('testResultsModal');
    const content = document.getElementById('testResultsContent');

    if (!result.success) {
        content.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--danger);">
                <h3>Test Failed</h3>
                <p>${result.error || 'Unknown error occurred'}</p>
            </div>
        `;
        modal.classList.add('show');
        return;
    }

    if (!result.listings || result.listings.length === 0) {
        content.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                <h3>No Listings Found</h3>
                <p>Your search filters didn't match any listings.</p>
            </div>
        `;
        modal.classList.add('show');
        return;
    }

    const listingsHtml = result.listings.map(listing => `
        <div class="history-item">
            ${listing.imageUrl ?
                `<img src="${listing.imageUrl}" alt="${escapeHtml(listing.title)}" class="history-image">` :
                `<div class="history-image-placeholder">🚗</div>`
            }
            <div class="history-content">
                <div class="history-title">
                    <a href="${listing.url}" target="_blank">${escapeHtml(listing.title)}</a>
                </div>
                ${listing.description ? `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(truncate(listing.description, 100))}</div>` : ''}
                <div class="history-meta">
                    <span>📅 ${listing.date}</span>
                    <span>🆔 ${listing.itemId}</span>
                </div>
            </div>
            ${listing.price ? `<div class="history-price">€${listing.price.toFixed(2)}</div>` : ''}
        </div>
    `).join('');

    content.innerHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px; padding: 15px; background: var(--background); border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0;">Test Results</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                    Found <strong>${result.totalCount}</strong> total listings. Showing first ${result.listings.length}.
                </p>
            </div>
            <div class="history-list">
                ${listingsHtml}
            </div>
        </div>
    `;

    modal.classList.add('show');
}

function closeTestResultsModal() {
    document.getElementById('testResultsModal').classList.remove('show');
}

// Error Logs Functions
async function loadErrorLogs() {
    try {
        const response = await fetch(`${API_BASE}/errorlogs`);
        if (!response.ok) throw new Error('Failed to load error logs');

        errorLogs = await response.json();
        renderErrorLogs();
    } catch (error) {
        console.error('Error loading error logs:', error);
        document.getElementById('errorsList').innerHTML = '<p class="error">Failed to load error logs</p>';
    }
}

function renderErrorLogs() {
    const container = document.getElementById('errorsList');

    if (errorLogs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No error logs found.</p>';
        return;
    }

    const tableHtml = `
        <table class="errors-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Source</th>
                    <th>Message</th>
                    <th>Job ID</th>
                    <th>Status Code</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${errorLogs.map(error => `
                    <tr>
                        <td>${formatDate(error.timestamp)}</td>
                        <td>${escapeHtml(error.source || '-')}</td>
                        <td>
                            <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis;">
                                ${escapeHtml(error.message)}
                            </div>
                            ${error.stackTrace ? `
                                <details style="margin-top: 8px;">
                                    <summary style="cursor: pointer; color: var(--primary);">Stack Trace</summary>
                                    <pre style="margin-top: 8px; padding: 10px; background: var(--background); border-radius: 4px; font-size: 11px; overflow-x: auto;">${escapeHtml(error.stackTrace)}</pre>
                                </details>
                            ` : ''}
                        </td>
                        <td>${error.monitorJobId || '-'}</td>
                        <td>${error.statusCode || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deleteErrorLog(${error.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

async function deleteErrorLog(id) {
    try {
        const response = await fetch(`${API_BASE}/errorlogs/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete error log');

        await loadErrorLogs();
    } catch (error) {
        alert('Failed to delete error log');
        console.error('Error deleting error log:', error);
    }
}

async function clearAllErrors() {
    if (!confirm('Are you sure you want to clear all error logs?')) return;

    try {
        const response = await fetch(`${API_BASE}/errorlogs/clear`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to clear error logs');

        await loadErrorLogs();
    } catch (error) {
        alert('Failed to clear error logs');
        console.error('Error clearing error logs:', error);
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const jobModal = document.getElementById('jobModal');
    const testModal = document.getElementById('testResultsModal');

    if (event.target === jobModal) {
        closeJobModal();
    } else if (event.target === testModal) {
        closeTestResultsModal();
    }
}
