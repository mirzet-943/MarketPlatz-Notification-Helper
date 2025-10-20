// API URLs
const API_BASE = '/api';

// State
let currentUser = null;
let jobs = [];
let history = [];
let currentTab = 'jobs';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

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
            <div class="job-meta">
                <span>🕐 Created: ${formatDate(job.createdAt)}</span>
                ${job.lastRunAt ? `<span>⏰ Last check: ${formatDate(job.lastRunAt)}</span>` : ''}
                ${job.lastListingDate ? `<span>📬 Last notification: ${formatDate(job.lastListingDate)}</span>` : ''}
            </div>
            <div class="job-actions">
                <button class="btn btn-sm btn-secondary" onclick="editJob(${job.id})">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="toggleJobStatus(${job.id})">${job.isActive ? 'Deactivate' : 'Activate'}</button>
                <button class="btn btn-sm btn-danger" onclick="deleteJob(${job.id})">Delete</button>
            </div>
        </div>
    `).join('');
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
    document.getElementById('jobModal').classList.add('show');
}

async function editJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    document.getElementById('modalTitle').textContent = 'Edit Job';
    document.getElementById('jobId').value = job.id;
    document.getElementById('jobName').value = job.name;
    document.getElementById('emailTo').value = job.emailTo;
    document.getElementById('isActive').checked = job.isActive;

    // Populate filters
    if (job.filters) {
        job.filters.forEach(filter => {
            if (filter.filterType === 'query') {
                document.getElementById('searchQuery').value = filter.value;
            } else if (filter.filterType === 'l1CategoryId') {
                document.getElementById('l1CategoryId').value = filter.value;
            } else if (filter.filterType === 'postcode') {
                document.getElementById('postcode').value = filter.value;
            } else if (filter.filterType === 'attributeRange') {
                const [key, range] = filter.value.split(':');
                if (key === 'PrijsVan') document.getElementById('minPrice').value = range.split('|')[0];
                if (key === 'PrijsTot') document.getElementById('maxPrice').value = range.split('|')[1];
                if (key === 'Bouwjaar') {
                    const [min, max] = range.split('|');
                    document.getElementById('minYear').value = min;
                    document.getElementById('maxYear').value = max;
                }
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

    const query = document.getElementById('searchQuery').value.trim();
    if (query) {
        filters.push({ filterType: 'query', key: '', value: query });
    }

    const l1CategoryId = document.getElementById('l1CategoryId').value;
    if (l1CategoryId) {
        filters.push({ filterType: 'l1CategoryId', key: '', value: l1CategoryId });
    }

    const postcode = document.getElementById('postcode').value.trim();
    if (postcode) {
        filters.push({ filterType: 'postcode', key: '', value: postcode });
    }

    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    if (minPrice || maxPrice) {
        filters.push({
            filterType: 'attributeRange',
            key: 'PrijsVan',
            value: `PrijsVan:${minPrice || '0'}|${maxPrice || '999999'}`
        });
    }

    const minYear = document.getElementById('minYear').value;
    const maxYear = document.getElementById('maxYear').value;
    if (minYear || maxYear) {
        filters.push({
            filterType: 'attributeRange',
            key: 'Bouwjaar',
            value: `Bouwjaar:${minYear || '1900'}|${maxYear || new Date().getFullYear()}`
        });
    }

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
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else {
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}

function truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('jobModal');
    if (event.target === modal) {
        closeJobModal();
    }
}
