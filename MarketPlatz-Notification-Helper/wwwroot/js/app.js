const API_BASE = '/api';
let currentJobId = null;

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

        jobsList.innerHTML = jobs.map(job => `
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

                ${job.filters && job.filters.length > 0 ? `
                    <div class="job-filters">
                        <strong>Filters:</strong><br>
                        ${job.filters.map(f => `
                            <span class="filter-tag">${escapeHtml(f.filterType)}: ${escapeHtml(f.value)}</span>
                        `).join('')}
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
        `).join('');
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsList').innerHTML = '<p class="loading">Error loading jobs. Please refresh.</p>';
    }
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

// Show add job modal
function showAddJobModal() {
    currentJobId = null;
    document.getElementById('modalTitle').textContent = 'Add New Job';
    document.getElementById('jobForm').reset();
    document.getElementById('jobId').value = '';
    document.getElementById('isActive').checked = true;
    document.getElementById('filtersContainer').innerHTML = '';
    addFilter(); // Add one empty filter by default
    document.getElementById('jobModal').style.display = 'block';
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

        const filtersContainer = document.getElementById('filtersContainer');
        filtersContainer.innerHTML = '';

        if (job.filters && job.filters.length > 0) {
            job.filters.forEach(filter => {
                addFilter(filter.filterType, filter.key, filter.value);
            });
        } else {
            addFilter();
        }

        document.getElementById('jobModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading job:', error);
        alert('Error loading job details');
    }
}

// Close modal
function closeJobModal() {
    document.getElementById('jobModal').style.display = 'none';
    currentJobId = null;
}

// Add filter row
function addFilter(filterType = '', key = '', value = '') {
    const filtersContainer = document.getElementById('filtersContainer');
    const filterIndex = filtersContainer.children.length;

    const filterRow = document.createElement('div');
    filterRow.className = 'filter-row';
    filterRow.innerHTML = `
        <div class="form-group">
            <label>Filter Type</label>
            <select class="filter-type" data-index="${filterIndex}">
                <option value="AttributeRange" ${filterType === 'AttributeRange' ? 'selected' : ''}>Price Range</option>
                <option value="AttributeById" ${filterType === 'AttributeById' ? 'selected' : ''}>Attribute By ID</option>
                <option value="AttributeByKey" ${filterType === 'AttributeByKey' ? 'selected' : ''}>Attribute By Key</option>
                <option value="L1CategoryId" ${filterType === 'L1CategoryId' ? 'selected' : ''}>L1 Category ID</option>
                <option value="L2CategoryId" ${filterType === 'L2CategoryId' ? 'selected' : ''}>L2 Category ID</option>
                <option value="Postcode" ${filterType === 'Postcode' ? 'selected' : ''}>Postcode</option>
                <option value="Query" ${filterType === 'Query' ? 'selected' : ''}>Search Query</option>
            </select>
        </div>
        <div class="form-group">
            <label>Key (optional)</label>
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

    // Collect filters
    const filterRows = document.querySelectorAll('.filter-row');
    const filters = Array.from(filterRows).map(row => {
        const filterType = row.querySelector('.filter-type').value;
        const key = row.querySelector('.filter-key').value;
        const value = row.querySelector('.filter-value').value;

        return {
            filterType,
            key: key || filterType,
            value
        };
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
            // Update existing job
            response = await fetch(`${API_BASE}/monitorjobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
        } else {
            // Create new job
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
