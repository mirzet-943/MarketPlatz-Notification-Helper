const API_BASE = '/api';
let currentJobId = null;
let currentFilterTab = 'quick';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadJobs();
    loadLogs();

    // Refresh data every 30 seconds
    setInterval(() => {
        loadStats();
        loadJobs();
        loadLogs();
    }, 30000);
});

// Load statistics
async function loadStats() {
    try {
        const [logsResponse, jobsResponse] = await Promise.all([
            fetch(`${API_BASE}/listinglogs/stats`),
            fetch(`${API_BASE}/monitorjobs`)
        ]);

        const stats = await logsResponse.json();
        const jobs = await jobsResponse.json();

        document.getElementById('totalListings').textContent = stats.totalListings || 0;
        document.getElementById('last24Hours').textContent = stats.last24Hours || 0;
        document.getElementById('activeJobs').textContent = jobs.filter(j => j.isActive).length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load all jobs
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE}/monitorjobs`);
        const jobs = await response.json();

        const jobsList = document.getElementById('jobsList');

        if (jobs.length === 0) {
            jobsList.innerHTML = '<p class="loading">No monitor jobs yet. Click "Add New Job" to create one.</p>';
            return;
        }

        jobsList.innerHTML = jobs.map(job => {
            const filterSummary = summarizeFilters(job.filters);
            return `
            <div class="job-card">
                <div class="job-header">
                    <h3 class="job-title">${escapeHtml(job.name)}</h3>
                    <span class="job-status ${job.isActive ? 'active' : 'inactive'}">
                        ${job.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div class="job-info">
                    <p><strong>Email:</strong> ${escapeHtml(job.emailTo)}</p>
                    <p><strong>Last Run:</strong> ${formatDate(job.lastRunAt)}</p>
                    ${job.lastListingDate ? `<p><strong>Last Listing:</strong> ${formatDate(job.lastListingDate)}</p>` : ''}
                </div>

                ${filterSummary ? `
                    <div class="job-filters">
                        <strong>Filters:</strong><br>
                        ${filterSummary}
                    </div>
                ` : ''}

                <div class="job-actions">
                    <button class="btn btn-secondary btn-small" onclick="editJob(${job.id})">Edit</button>
                    <button class="btn ${job.isActive ? 'btn-secondary' : 'btn-primary'} btn-small"
                            onclick="toggleJob(${job.id})">
                        ${job.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteJob(${job.id}, '${escapeHtml(job.name)}')">Delete</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsList').innerHTML = '<p class="loading">Error loading jobs. Please refresh.</p>';
    }
}

// Summarize filters for display
function summarizeFilters(filters) {
    if (!filters || filters.length === 0) return '';

    const summaries = [];
    filters.forEach(f => {
        const config = Object.values(FILTER_CONFIG).find(c => c.key === f.key || c.filterType === f.filterType);
        if (config) {
            summaries.push(`<span class="filter-tag">${config.label}: ${escapeHtml(f.value)}</span>`);
        } else {
            summaries.push(`<span class="filter-tag">${escapeHtml(f.filterType)}: ${escapeHtml(f.value)}</span>`);
        }
    });
    return summaries.join('');
}

// Load recent logs
async function loadLogs() {
    try {
        const response = await fetch(`${API_BASE}/listinglogs?limit=50`);
        const logs = await response.json();

        const logsList = document.getElementById('listingLogs');

        if (logs.length === 0) {
            logsList.innerHTML = '<p class="loading">No listings found yet.</p>';
            return;
        }

        logsList.innerHTML = logs.map(log => `
            <div class="log-card">
                <div class="log-title">${escapeHtml(log.title)}</div>
                <div class="log-details">
                    ${log.price ? `<p><strong>Price:</strong> €${log.price.toFixed(2)}</p>` : ''}
                    <p><strong>Notified:</strong> ${formatDate(log.notifiedAt)}</p>
                    ${log.url ? `<p><a href="${escapeHtml(log.url)}" target="_blank">View Listing →</a></p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('listingLogs').innerHTML = '<p class="loading">Error loading listings. Please refresh.</p>';
    }
}

// Switch filter tab
function switchFilterTab(tab) {
    currentFilterTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update content
    document.getElementById('quickFiltersContainer').style.display = tab === 'quick' ? 'block' : 'none';
    document.getElementById('advancedFiltersContainer').style.display = tab === 'advanced' ? 'block' : 'none';
}

// Show add job modal
function showAddJobModal() {
    currentJobId = null;
    document.getElementById('modalTitle').textContent = 'Add New Job';
    document.getElementById('jobForm').reset();
    document.getElementById('jobId').value = '';
    document.getElementById('isActive').checked = true;

    // Reset filters
    document.getElementById('filtersContainer').innerHTML = '';
    renderQuickFilters();

    currentFilterTab = 'quick';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('quickFiltersContainer').style.display = 'block';
    document.getElementById('advancedFiltersContainer').style.display = 'none';

    document.getElementById('jobModal').style.display = 'block';
}

// Render quick filters
function renderQuickFilters() {
    const container = document.getElementById('quickFiltersContainer');
    container.innerHTML = `
        <div class="filter-notice">
            <strong>ℹ️ Tip:</strong> Use filters to narrow your search and reduce notifications.
            You can combine multiple filters like brand, price range, fuel type, and keywords.
        </div>

        <div class="quick-filter-group">
            <label for="qf-brand">Brand</label>
            <select id="qf-brand">
                <option value="">All Brands</option>
                ${FILTER_CONFIG.brand.options.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('')}
            </select>
        </div>

        <div class="quick-filter-group">
            <label for="qf-fuel">Fuel Type (hold Ctrl/Cmd for multiple)</label>
            <select id="qf-fuel" multiple>
                ${FILTER_CONFIG.fuel.options.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('')}
            </select>
        </div>

        <div class="quick-filter-group">
            <label>Construction Year</label>
            <div class="filter-range-group">
                <select id="qf-year-from">
                    <option value="">From</option>
                    ${FILTER_CONFIG.constructionYear.years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
                <span>to</span>
                <select id="qf-year-to">
                    <option value="">To</option>
                    ${FILTER_CONFIG.constructionYear.years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="quick-filter-group">
            <label>Price Range (EUR)</label>
            <div class="filter-range-group">
                <input type="number" id="qf-price-from" placeholder="Min (e.g., 5000)" step="1000">
                <span>to</span>
                <input type="number" id="qf-price-to" placeholder="Max (e.g., 20000)" step="1000">
            </div>
        </div>

        <div class="quick-filter-group">
            <label>Mileage (km)</label>
            <div class="filter-range-group">
                <select id="qf-mileage-from">
                    <option value="">From</option>
                    ${FILTER_CONFIG.mileage.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
                <span>to</span>
                <select id="qf-mileage-to">
                    <option value="">To</option>
                    ${FILTER_CONFIG.mileage.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="quick-filter-group">
            <label for="qf-transmission">Transmission</label>
            <select id="qf-transmission" multiple>
                ${FILTER_CONFIG.transmission.options.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('')}
            </select>
        </div>

        <div class="quick-filter-group">
            <label for="qf-body">Body Type</label>
            <select id="qf-body" multiple>
                ${FILTER_CONFIG.body.options.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('')}
            </select>
        </div>

        <div class="quick-filter-group">
            <label for="qf-postcode">Postcode (Location)</label>
            <input type="text" id="qf-postcode" placeholder="e.g., 1012AB">
        </div>

        <div class="quick-filter-group">
            <label for="qf-query">Search Keywords</label>
            <input type="text" id="qf-query" placeholder="e.g., volkswagen golf">
        </div>
    `;
}

// Edit existing job
async function editJob(jobId) {
    try {
        const response = await fetch(`${API_BASE}/monitorjobs/${jobId}`);
        const job = await response.json();

        currentJobId = jobId;
        document.getElementById('modalTitle').textContent = 'Edit Job';
        document.getElementById('jobId').value = job.id;
        document.getElementById('jobName').value = job.name;
        document.getElementById('emailTo').value = job.emailTo;
        document.getElementById('isActive').checked = job.isActive;

        // Render quick filters first
        renderQuickFilters();

        // Load quick filters from job filters
        loadQuickFilters(job.filters);

        // Load advanced filters
        const advancedContainer = document.getElementById('filtersContainer');
        advancedContainer.innerHTML = '';

        const customFilters = job.filters.filter(f => !isQuickFilter(f));
        if (customFilters.length > 0) {
            customFilters.forEach(filter => {
                addFilter(filter.filterType, filter.key, filter.value);
            });
        } else {
            addFilter();
        }

        currentFilterTab = 'quick';
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('quickFiltersContainer').style.display = 'block';
        document.getElementById('advancedFiltersContainer').style.display = 'none';

        document.getElementById('jobModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading job:', error);
        alert('Error loading job details');
    }
}

// Check if filter is handled by quick filters
function isQuickFilter(filter) {
    const quickFilterKeys = ['l2CategoryId', 'fuel', 'constructionYear', 'PriceCents', 'mileage', 'transmission', 'body', 'postcode', 'query'];
    return quickFilterKeys.includes(filter.key) ||
           (filter.filterType === 'AttributeRange' && quickFilterKeys.includes(filter.key)) ||
           (filter.filterType === 'AttributeById' && ['fuel', 'transmission', 'body'].some(k => filter.key === k));
}

// Load quick filters from job filters
function loadQuickFilters(filters) {
    filters.forEach(filter => {
        if (filter.filterType === 'L2CategoryId') {
            document.getElementById('qf-brand').value = filter.value;
        } else if (filter.key === 'fuel' && filter.filterType === 'AttributeById') {
            const select = document.getElementById('qf-fuel');
            Array.from(select.options).forEach(opt => {
                if (opt.value === filter.value) opt.selected = true;
            });
        } else if (filter.key === 'constructionYear') {
            const [from, to] = filter.value.split(':');
            if (from) document.getElementById('qf-year-from').value = from;
            if (to) document.getElementById('qf-year-to').value = to;
        } else if (filter.key === 'PriceCents') {
            const [from, to] = filter.value.split(':');
            if (from) document.getElementById('qf-price-from').value = parseInt(from) / 100;
            if (to) document.getElementById('qf-price-to').value = parseInt(to) / 100;
        } else if (filter.key === 'mileage') {
            const [from, to] = filter.value.split(':');
            if (from) document.getElementById('qf-mileage-from').value = from;
            if (to) document.getElementById('qf-mileage-to').value = to;
        } else if (filter.key === 'transmission' && filter.filterType === 'AttributeById') {
            const select = document.getElementById('qf-transmission');
            Array.from(select.options).forEach(opt => {
                if (opt.value === filter.value) opt.selected = true;
            });
        } else if (filter.key === 'body' && filter.filterType === 'AttributeById') {
            const select = document.getElementById('qf-body');
            Array.from(select.options).forEach(opt => {
                if (opt.value === filter.value) opt.selected = true;
            });
        } else if (filter.filterType === 'Postcode') {
            document.getElementById('qf-postcode').value = filter.value;
        } else if (filter.filterType === 'Query') {
            document.getElementById('qf-query').value = filter.value;
        }
    });
}

// Close modal
function closeJobModal() {
    document.getElementById('jobModal').style.display = 'none';
    currentJobId = null;
}

// Add filter row (for advanced filters)
function addFilter(filterType = '', key = '', value = '') {
    const filtersContainer = document.getElementById('filtersContainer');
    const filterIndex = filtersContainer.children.length;

    const filterRow = document.createElement('div');
    filterRow.className = 'filter-row';
    filterRow.innerHTML = `
        <div class="form-group">
            <label>Filter Type</label>
            <select class="filter-type" data-index="${filterIndex}">
                <option value="AttributeRange" ${filterType === 'AttributeRange' ? 'selected' : ''}>Attribute Range</option>
                <option value="AttributeById" ${filterType === 'AttributeById' ? 'selected' : ''}>Attribute By ID</option>
                <option value="AttributeByKey" ${filterType === 'AttributeByKey' ? 'selected' : ''}>Attribute By Key</option>
                <option value="L1CategoryId" ${filterType === 'L1CategoryId' ? 'selected' : ''}>L1 Category ID</option>
                <option value="L2CategoryId" ${filterType === 'L2CategoryId' ? 'selected' : ''}>L2 Category ID</option>
                <option value="Postcode" ${filterType === 'Postcode' ? 'selected' : ''}>Postcode</option>
                <option value="Query" ${filterType === 'Query' ? 'selected' : ''}>Search Query</option>
            </select>
        </div>
        <div class="form-group">
            <label>Key</label>
            <input type="text" class="filter-key" value="${escapeHtml(key)}" placeholder="e.g., PriceCents">
        </div>
        <div class="form-group">
            <label>Value</label>
            <input type="text" class="filter-value" value="${escapeHtml(value)}" placeholder="e.g., 400000:1400000" required>
        </div>
        <button type="button" class="btn btn-danger btn-small" onclick="removeFilter(this)" style="margin-top: 24px;">Remove</button>
    `;

    filtersContainer.appendChild(filterRow);
}

// Remove filter row
function removeFilter(button) {
    button.parentElement.remove();
}

// Save job
async function saveJob(event) {
    event.preventDefault();

    const jobId = document.getElementById('jobId').value;
    const name = document.getElementById('jobName').value;
    const emailTo = document.getElementById('emailTo').value;
    const isActive = document.getElementById('isActive').checked;

    // Collect filters from both quick and advanced tabs
    const filters = [];

    // Add default filters
    DEFAULT_FILTERS.forEach(df => {
        filters.push({
            filterType: df.filterType,
            key: df.key,
            value: df.value
        });
    });

    // Collect quick filters
    const brand = document.getElementById('qf-brand').value;
    if (brand) {
        filters.push({ filterType: 'L2CategoryId', key: 'l2CategoryId', value: brand });
    }

    const fuelOptions = Array.from(document.getElementById('qf-fuel').selectedOptions);
    fuelOptions.forEach(opt => {
        filters.push({ filterType: 'AttributeById', key: 'fuel', value: opt.value });
    });

    const yearFrom = document.getElementById('qf-year-from').value;
    const yearTo = document.getElementById('qf-year-to').value;
    if (yearFrom || yearTo) {
        filters.push({
            filterType: 'AttributeRange',
            key: 'constructionYear',
            value: `${yearFrom || '0'}:${yearTo || '9999'}`
        });
    }

    const priceFrom = document.getElementById('qf-price-from').value;
    const priceTo = document.getElementById('qf-price-to').value;
    if (priceFrom || priceTo) {
        filters.push({
            filterType: 'AttributeRange',
            key: 'PriceCents',
            value: `${(priceFrom || 0) * 100}:${(priceTo || 999999) * 100}`
        });
    }

    const mileageFrom = document.getElementById('qf-mileage-from').value;
    const mileageTo = document.getElementById('qf-mileage-to').value;
    if (mileageFrom || mileageTo) {
        filters.push({
            filterType: 'AttributeRange',
            key: 'mileage',
            value: `${mileageFrom || '0'}:${mileageTo || '9999999'}`
        });
    }

    const transmissionOptions = Array.from(document.getElementById('qf-transmission').selectedOptions);
    transmissionOptions.forEach(opt => {
        filters.push({ filterType: 'AttributeById', key: 'transmission', value: opt.value });
    });

    const bodyOptions = Array.from(document.getElementById('qf-body').selectedOptions);
    bodyOptions.forEach(opt => {
        filters.push({ filterType: 'AttributeById', key: 'body', value: opt.value });
    });

    const postcode = document.getElementById('qf-postcode').value;
    if (postcode) {
        filters.push({ filterType: 'Postcode', key: 'postcode', value: postcode });
    }

    const query = document.getElementById('qf-query').value;
    if (query) {
        filters.push({ filterType: 'Query', key: 'query', value: query });
    }

    // Collect advanced filters
    const filterRows = document.querySelectorAll('#filtersContainer .filter-row');
    filterRows.forEach(row => {
        const filterType = row.querySelector('.filter-type').value;
        const key = row.querySelector('.filter-key').value;
        const value = row.querySelector('.filter-value').value;

        if (value) {
            filters.push({
                filterType,
                key: key || filterType,
                value
            });
        }
    });

    const jobData = {
        id: jobId ? parseInt(jobId) : 0,
        name,
        emailTo,
        isActive,
        filters
    };

    try {
        let response;
        if (jobId) {
            response = await fetch(`${API_BASE}/monitorjobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
        } else {
            response = await fetch(`${API_BASE}/monitorjobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
        }

        if (response.ok) {
            closeJobModal();
            loadJobs();
            loadStats();
            alert(jobId ? 'Job updated successfully!' : 'Job created successfully!');
        } else {
            const error = await response.text();
            alert('Error saving job: ' + error);
        }
    } catch (error) {
        console.error('Error saving job:', error);
        alert('Error saving job. Please try again.');
    }
}

// Toggle job active status
async function toggleJob(jobId) {
    try {
        const response = await fetch(`${API_BASE}/monitorjobs/${jobId}/toggle`, {
            method: 'POST'
        });

        if (response.ok) {
            loadJobs();
            loadStats();
        } else {
            alert('Error toggling job status');
        }
    } catch (error) {
        console.error('Error toggling job:', error);
        alert('Error toggling job status');
    }
}

// Delete job
async function deleteJob(jobId, jobName) {
    if (!confirm(`Are you sure you want to delete "${jobName}"? This will also delete all associated logs.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/monitorjobs/${jobId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadJobs();
            loadStats();
            alert('Job deleted successfully!');
        } else {
            alert('Error deleting job');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        alert('Error deleting job');
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('jobModal');
    if (event.target === modal) {
        closeJobModal();
    }
}
