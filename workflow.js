// State management
let imageRequests = [];
let currentRole = 'editor';

// DOM Elements
const roleSelect = document.getElementById('roleSelect');
const editorSection = document.getElementById('editorSection');
const creatorSection = document.getElementById('creatorSection');
const approverSection = document.getElementById('approverSection');
const requestInputs = document.getElementById('requestInputs');
const addRequestBtn = document.getElementById('addRequestBtn');
const submitRequestsBtn = document.getElementById('submitRequestsBtn');
const pendingRequestsTable = document.getElementById('pendingRequestsTable');
const reviewRequestsTable = document.getElementById('reviewRequestsTable');
const previewModal = document.getElementById('previewModal');
const modalPreviewImage = document.getElementById('modalPreviewImage');
const closePreviewModal = document.getElementById('closePreviewModal');
const bulkImportSection = document.getElementById('bulkImportSection');
const bulkImportText = document.getElementById('bulkImportText');
const toggleBulkImportBtn = document.getElementById('toggleBulkImportBtn');
const clearBulkImportBtn = document.getElementById('clearBulkImportBtn');
const processBulkImportBtn = document.getElementById('processBulkImportBtn');
const toggleSelectModeBtn = document.getElementById('toggleSelectModeBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const selectedCount = document.getElementById('selectedCount');

// Add selection mode state
let isSelectMode = false;

// Event Listeners
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.role-btn').forEach(b => {
            b.classList.remove('bg-blue-700', 'text-white');
            b.classList.add('bg-white', 'text-gray-900');
        });
        
        // Add active class to clicked button
        btn.classList.remove('bg-white', 'text-gray-900');
        btn.classList.add('bg-blue-700', 'text-white');
        
        // Update current role and visibility
        currentRole = btn.dataset.role;
        updateVisibility();
        loadFromLocalStorage(); // Reload data when switching roles
        renderTables();
    });
});

addRequestBtn.addEventListener('click', addRequestInput);
submitRequestsBtn.addEventListener('click', submitRequests);
closePreviewModal.addEventListener('click', () => previewModal.classList.add('hidden'));
toggleBulkImportBtn.addEventListener('click', () => {
    bulkImportSection.classList.toggle('hidden');
});
clearBulkImportBtn.addEventListener('click', () => {
    bulkImportText.value = '';
});
processBulkImportBtn.addEventListener('click', processBulkImport);
toggleSelectModeBtn.addEventListener('click', toggleSelectMode);
selectAllBtn.addEventListener('click', toggleSelectAll);
deleteSelectedBtn.addEventListener('click', deleteSelected);

// Initialize from localStorage
loadFromLocalStorage();

// UUID Generation
async function generateTimestampUUID() {
    const timestamp = new Date().getTime();
    const salt = Math.random().toString(36).substring(2);
    const data = `${timestamp}-${salt}`;
    
    // Convert string to buffer for hashing
    const msgBuffer = new TextEncoder().encode(data);
    
    // Hash the data
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Format as UUID (8-4-4-4-12)
    return `${hashHex.slice(0, 8)}-${hashHex.slice(8, 12)}-${hashHex.slice(12, 16)}-${hashHex.slice(16, 20)}-${hashHex.slice(20, 32)}`;
}

// Role Management
function updateVisibility() {
    editorSection.classList.toggle('hidden', currentRole !== 'editor');
    creatorSection.classList.toggle('hidden', currentRole !== 'creator');
    approverSection.classList.toggle('hidden', currentRole !== 'approver');
    console.log('Switching to role:', currentRole); // Debug log
}

// Editor Functions
function addRequestInput() {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'flex gap-2';
    inputGroup.innerHTML = `
        <div class="select-checkbox ${isSelectMode ? 'flex' : 'hidden'} items-center pr-2">
            <input type="checkbox" class="request-checkbox h-4 w-4 text-blue-600 rounded border-gray-300">
        </div>
        <input type="text" class="filename-input flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter filename (e.g., banner-homepage.jpg)">
        <input type="text" class="description-input flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter description">
        <button class="remove-input text-red-600 hover:text-red-800 px-2" title="Remove"><i class="fas fa-times"></i></button>
    `;

    // Add checkbox change event listener
    const checkbox = inputGroup.querySelector('.request-checkbox');
    checkbox.addEventListener('change', updateSelectedCount);

    inputGroup.querySelector('.remove-input').addEventListener('click', () => {
        if (requestInputs.children.length > 1) {
            inputGroup.remove();
            updateSelectedCount();
        }
    });
    
    requestInputs.appendChild(inputGroup);
}

async function submitRequests() {
    const inputs = requestInputs.querySelectorAll('.flex');
    const newRequests = await Promise.all(Array.from(inputs).map(async input => {
        const filename = input.querySelector('.filename-input').value.trim();
        const description = input.querySelector('.description-input').value.trim();
        
        if (!filename) return null;

        return {
            id: await generateTimestampUUID(),
            filename,
            description,
            status: 'pending',
            createdAt: new Date().toISOString(),
            uploadedImage: null,
            approvalStatus: null,
            feedback: null,
            uuid: await generateTimestampUUID(),
            uploader: "guanglei.zhang",
            size: null,
            type: 'new',
            revisionHistory: []  // Initialize as empty array
        };
    }));

    const validRequests = newRequests.filter(Boolean);
    if (validRequests.length === 0) {
        alert('Please add at least one valid request.');
        return;
    }

    imageRequests = [...imageRequests, ...validRequests];
    saveToLocalStorage();
    clearRequestInputs();
    renderTables();
}

function clearRequestInputs() {
    requestInputs.innerHTML = `
        <div class="flex gap-2">
            <div class="select-checkbox ${isSelectMode ? 'flex' : 'hidden'} items-center pr-2">
                <input type="checkbox" class="request-checkbox h-4 w-4 text-blue-600 rounded border-gray-300">
            </div>
            <input type="text" class="filename-input flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter filename (e.g., banner-homepage.jpg)">
            <input type="text" class="description-input flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter description">
            <button class="remove-input text-red-600 hover:text-red-800 px-2" title="Remove"><i class="fas fa-times"></i></button>
        </div>
    `;
    requestInputs.querySelector('.remove-input').addEventListener('click', (e) => {
        if (requestInputs.children.length > 1) e.target.closest('.flex').remove();
    });
}

// Creator Functions
function handleFileUpload(requestId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const request = imageRequests.find(r => r.id === requestId);
            console.log('Processing upload for request:', request);
            if (request) {
                // Ensure all required properties exist
                request.revisionHistory = request.revisionHistory || [];
                request.approvalStatus = request.approvalStatus || null;
                request.type = request.type || 'new';
                
                // If this is a revision, store the previous version in history
                if (request.type === 'revision' && request.uploadedImage) {
                    request.revisionHistory.push({
                        image: request.uploadedImage,
                        uploadedAt: request.uploadedAt,
                        feedback: request.feedback
                    });
                }
                
                request.uploadedImage = e.target.result;
                request.status = 'uploaded';
                request.uploadedAt = new Date().toISOString();
                request.size = file.size;
                request.approvalStatus = null;  // Reset approval status for new uploads
                
                console.log('Updated request before save:', request);
                
                // Save to localStorage immediately
                saveToLocalStorage();
                
                // Force reload from localStorage to ensure state is consistent
                loadFromLocalStorage();
                
                // Render tables with updated data
                renderTables();
                
                console.log('Upload complete. Updated request:', request);
                console.log('Current role:', currentRole);
                console.log('Total requests:', imageRequests.length);
                console.log('Uploaded requests:', imageRequests.filter(r => r.status === 'uploaded' && !r.approvalStatus).length);
            } else {
                console.error('Request not found with ID:', requestId);
            }
        };
        reader.readAsDataURL(file);
    };

    input.click();
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Approver Functions
async function sendToAssetManagement(request) {
    // Get the images array from localStorage
    const storedImages = localStorage.getItem('images');
    let images = storedImages ? JSON.parse(storedImages) : [];
    
    // Create new image entry
    const now = new Date();
    const image = {
        id: await generateTimestampUUID(),
        src: request.uploadedImage,
        name: request.filename,
        tags: [],
        category: '',
        description: request.description,
        date: now.toISOString(),
        size: request.size,
        uploader: request.uploader,
        approver: currentRole,  // Add approver information
        approvalDate: now.toISOString(),
        uuid: request.uuid,  // Use the same UUID from the workflow
        timestamp: now.getTime(),
        workflowHistory: {
            createdAt: request.createdAt,
            uploadedAt: request.uploadedAt,
            approvedAt: now.toISOString(),
            revisionHistory: request.revisionHistory || []
        }
    };
    
    // Add to images array
    images.unshift(image);
    
    // Save back to localStorage
    localStorage.setItem('images', JSON.stringify(images));
    
    console.log('Image sent to asset management:', image);
}

function handleApproval(requestId, isApproved, feedback = '') {
    const request = imageRequests.find(r => r.id === requestId);
    if (request) {
        if (isApproved) {
            request.approvalStatus = 'approved';
            request.status = 'completed';
            request.approvedAt = new Date().toISOString();
            request.approver = currentRole;
            
            // Send to asset management system
            sendToAssetManagement(request)
                .then(() => {
                    console.log('Successfully sent to asset management');
                })
                .catch(error => {
                    console.error('Error sending to asset management:', error);
                });
        } else {
            request.approvalStatus = 'rejected';
            request.status = 'pending';  // Reset to pending for revision
            request.feedback = feedback;
            request.type = 'revision';   // Mark as revision request
        }
        request.reviewedAt = new Date().toISOString();
        saveToLocalStorage();
        renderTables();
    }
}

function showImagePreview(imageData) {
    modalPreviewImage.src = imageData;
    previewModal.classList.remove('hidden');
}

// Table Rendering
function renderTables() {
    if (currentRole === 'creator') {
        renderPendingRequests();
    } else if (currentRole === 'approver') {
        renderReviewRequests();
    }
}

function renderPendingRequests() {
    const pendingRequests = imageRequests.filter(r => r.status === 'pending');
    
    if (!pendingRequests || pendingRequests.length === 0) {
        pendingRequestsTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No pending requests
                </td>
            </tr>
        `;
        return;
    }
    
    pendingRequestsTable.innerHTML = pendingRequests.map(request => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${request.filename}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.description}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 font-mono">${request.uuid}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col space-y-2">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold ${request.type === 'revision' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${request.type === 'revision' ? 'Revision Needed' : 'New Request'}
                    </span>
                    ${request.type === 'revision' ? `
                        <div class="flex items-start space-x-4 mt-2">
                            <div class="flex-shrink-0">
                                <img src="${request.uploadedImage}" 
                                     alt="Previous version" 
                                     class="h-16 w-16 object-cover rounded cursor-pointer"
                                     onclick="showImagePreview('${request.uploadedImage}')"
                                     title="Version ${request.revisionHistory.length + 1}">
                                <div class="text-xs text-gray-500 mt-1 text-center">Version ${request.revisionHistory.length + 1}</div>
                            </div>
                            <div class="flex-1">
                                <div class="text-sm text-red-600 mb-1">
                                    <i class="fas fa-comment-alt mr-1"></i>Feedback:
                                </div>
                                <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                    ${request.feedback}
                                </div>
                            </div>
                        </div>
                        ${request.revisionHistory.map((revision, index) => `
                            <div class="flex items-start space-x-4 mt-2 border-t pt-2">
                                <div class="flex-shrink-0">
                                    <img src="${revision.image}" 
                                         alt="Version ${index + 1}" 
                                         class="h-16 w-16 object-cover rounded cursor-pointer"
                                         onclick="showImagePreview('${revision.image}')"
                                         title="Version ${index + 1}">
                                    <div class="text-xs text-gray-500 mt-1 text-center">Version ${index + 1}</div>
                                </div>
                                <div class="flex-1">
                                    <div class="text-sm text-gray-500 mb-1">
                                        <i class="fas fa-history mr-1"></i>Previous Feedback:
                                    </div>
                                    <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                        ${revision.feedback}
                                    </div>
                                </div>
                            </div>
                        `).reverse().join('')}
                    ` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="handleFileUpload('${request.id}')" class="text-blue-600 hover:text-blue-900">
                    Upload ${request.type === 'revision' ? 'New Version' : 'Image'}
                </button>
            </td>
        </tr>
    `).join('');
}

function renderReviewRequests() {
    console.log('Rendering review requests...');
    console.log('All requests before filtering:', imageRequests);
    
    // Ensure all requests have required properties
    imageRequests = imageRequests.map(request => ({
        ...request,
        revisionHistory: request.revisionHistory || [],
        approvalStatus: request.approvalStatus || null,
        type: request.type || 'new'
    }));
    
    // Filter for uploaded requests that haven't been approved/rejected yet
    const reviewRequests = imageRequests.filter(r => {
        console.log('Checking request:', r);
        console.log('Status:', r.status);
        console.log('Approval status:', r.approvalStatus);
        return r.status === 'uploaded' && !r.approvalStatus;
    });
    
    console.log('Filtered review requests:', reviewRequests);
    
    if (!reviewRequests || reviewRequests.length === 0) {
        reviewRequestsTable.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No images pending review
                </td>
            </tr>
        `;
        return;
    }

    reviewRequestsTable.innerHTML = reviewRequests.map(request => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${request.uploadedImage}" alt="${request.filename}" class="h-16 w-16 object-cover rounded cursor-pointer"
                     onclick="showImagePreview('${request.uploadedImage}')">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${request.filename}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.description}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 font-mono">${request.uuid}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${formatFileSize(request.size)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${request.type === 'revision' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}">
                    ${request.type === 'revision' ? 'Revision' : 'New Upload'}
                </span>
                ${(request.revisionHistory || []).length > 0 ? `
                    <div class="mt-1 text-sm text-gray-500">
                        <i class="fas fa-history mr-1"></i>Revision #${request.revisionHistory.length}
                    </div>
                ` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="handleApproval('${request.id}', true)" class="text-green-600 hover:text-green-900 mr-2">
                    Approve
                </button>
                <button onclick="handleApproval('${request.id}', false, prompt('Please provide feedback for rejection:'))" class="text-red-600 hover:text-red-900">
                    Reject
                </button>
            </td>
        </tr>
    `).join('');
    
    // Save the normalized data back to localStorage
    saveToLocalStorage();
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveToLocalStorage() {
    localStorage.setItem('imageRequests', JSON.stringify(imageRequests));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('imageRequests');
    if (stored) {
        imageRequests = JSON.parse(stored);
        console.log('Loaded from localStorage:', imageRequests);
        renderTables();
    }
    
    // Set initial active state for editor button
    const editorBtn = document.querySelector('[data-role="editor"]');
    editorBtn.classList.remove('bg-white', 'text-gray-900');
    editorBtn.classList.add('bg-blue-700', 'text-white');
}

// Initial render
updateVisibility();

// Add new functions for bulk import
function processBulkImport() {
    const text = bulkImportText.value.trim();
    if (!text) {
        alert('Please enter some data to import.');
        return;
    }

    // Split into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const requests = [];
    
    for (const line of lines) {
        // Try to parse as Excel paste (tab-separated or multiple spaces)
        const parts = line.split(/\t|  +/);
        
        if (parts.length > 1) {
            // Handle as Excel paste with filename and description
            requests.push({
                filename: parts[0].trim(),
                description: parts.slice(1).join(' ').trim()
            });
        } else {
            // Handle as space-delimited filenames
            const filenames = line.split(' ').filter(f => f.trim());
            requests.push(...filenames.map(filename => ({
                filename: filename.trim(),
                description: ''
            })));
        }
    }

    // Validate requests
    const validRequests = requests.filter(r => {
        // Basic filename validation
        return r.filename && !r.filename.includes('/') && !r.filename.includes('\\');
    });

    if (validRequests.length === 0) {
        alert('No valid requests found in the input.');
        return;
    }

    // Clear existing inputs except the first one
    while (requestInputs.children.length > 1) {
        requestInputs.removeChild(requestInputs.lastChild);
    }

    // Clear the first input
    const firstInput = requestInputs.children[0];
    firstInput.querySelector('.filename-input').value = '';
    firstInput.querySelector('.description-input').value = '';

    // Add new inputs for each request
    validRequests.forEach((request, index) => {
        if (index === 0) {
            // Use the first existing input
            firstInput.querySelector('.filename-input').value = request.filename;
            firstInput.querySelector('.description-input').value = request.description;
        } else {
            // Add new input for subsequent requests
            const inputGroup = document.createElement('div');
            inputGroup.className = 'flex gap-2';
            inputGroup.innerHTML = `
                <div class="select-checkbox ${isSelectMode ? 'flex' : 'hidden'} items-center pr-2">
                    <input type="checkbox" class="request-checkbox h-4 w-4 text-blue-600 rounded border-gray-300">
                </div>
                <input type="text" class="filename-input flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${request.filename}">
                <input type="text" class="description-input flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value="${request.description}">
                <button class="remove-input text-red-600 hover:text-red-800 px-2" title="Remove"><i class="fas fa-times"></i></button>
            `;
            
            // Add checkbox change event listener
            const checkbox = inputGroup.querySelector('.request-checkbox');
            checkbox.addEventListener('change', updateSelectedCount);
            
            inputGroup.querySelector('.remove-input').addEventListener('click', () => {
                if (requestInputs.children.length > 1) {
                    inputGroup.remove();
                    updateSelectedCount();
                }
            });
            
            requestInputs.appendChild(inputGroup);
        }
    });

    // Clear the bulk import textarea
    bulkImportText.value = '';
    
    // Hide the bulk import section
    bulkImportSection.classList.add('hidden');
    
    // Show success message
    alert(`Successfully processed ${validRequests.length} requests.`);
}

// Add selection mode functions
function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    
    // Toggle visibility of selection controls
    const checkboxes = document.querySelectorAll('.select-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.classList.toggle('hidden', !isSelectMode);
        checkbox.classList.toggle('flex', isSelectMode);
    });
    
    // Toggle visibility of bulk action buttons
    selectAllBtn.classList.toggle('hidden', !isSelectMode);
    deleteSelectedBtn.classList.toggle('hidden', !isSelectMode);
    
    // Update button text
    toggleSelectModeBtn.innerHTML = isSelectMode ? 
        '<i class="fas fa-times mr-2"></i> Exit Select Mode' :
        '<i class="fas fa-check-square mr-2"></i> Select Mode';
    
    // Toggle button style
    toggleSelectModeBtn.classList.toggle('bg-gray-100', isSelectMode);
    
    // Reset selection when exiting select mode
    if (!isSelectMode) {
        document.querySelectorAll('.request-checkbox').forEach(cb => cb.checked = false);
        updateSelectedCount();
    }
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.request-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    updateSelectedCount();
}

function deleteSelected() {
    const selectedRows = Array.from(document.querySelectorAll('.request-checkbox:checked'))
        .map(checkbox => checkbox.closest('.flex'));
    
    if (selectedRows.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedRows.length} selected requests?`)) {
        selectedRows.forEach(row => row.remove());
        
        // If all rows are deleted, add back one empty row
        if (requestInputs.children.length === 0) {
            addRequestInput();
        }
        
        updateSelectedCount();
    }
}

function updateSelectedCount() {
    const count = document.querySelectorAll('.request-checkbox:checked').length;
    selectedCount.textContent = count;
    
    // Update select all button text
    const allChecked = count === document.querySelectorAll('.request-checkbox').length;
    selectAllBtn.innerHTML = allChecked ? 
        '<i class="fas fa-times-circle mr-2"></i> Deselect All' :
        '<i class="fas fa-check-double mr-2"></i> Select All';
}