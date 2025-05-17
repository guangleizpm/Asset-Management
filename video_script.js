// Video management functionality
let videos = [];
let currentPage = 1;
const itemsPerPage = 10;
let sortColumn = 'date';
let sortDirection = 'desc';

// DOM Elements
let dropZone, fileInput, videoTableBody, searchInput, categoryFilter, uploadBtn,
    modal, closeModal, previewVideo, videoTitle, videoTags, videoCategory,
    videoDescription, saveVideoDetails, deleteVideoBtn, prevPageBtn, nextPageBtn,
    currentPageSpan, totalPagesSpan;

// Initialize DOM Elements
function initializeDOMElements() {
    dropZone = document.getElementById('dropZone');
    fileInput = document.getElementById('fileInput');
    videoTableBody = document.getElementById('videoTableBody');
    searchInput = document.getElementById('searchInput');
    categoryFilter = document.getElementById('categoryFilter');
    uploadBtn = document.getElementById('uploadBtn');
    modal = document.getElementById('videoModal');
    closeModal = document.getElementById('closeModal');
    previewVideo = document.getElementById('previewVideo');
    videoTitle = document.getElementById('videoTitle');
    videoTags = document.getElementById('videoTags');
    videoCategory = document.getElementById('videoCategory');
    videoDescription = document.getElementById('videoDescription');
    saveVideoDetails = document.getElementById('saveVideoDetails');
    deleteVideoBtn = document.getElementById('deleteVideo');
    prevPageBtn = document.getElementById('prevPage');
    nextPageBtn = document.getElementById('nextPage');
    currentPageSpan = document.getElementById('currentPage');
    totalPagesSpan = document.getElementById('totalPages');

    // Verify critical elements
    if (!dropZone || !fileInput || !videoTableBody) {
        console.error('Critical DOM elements not found!');
        return false;
    }
    return true;
}

// Initialize Event Listeners
function initializeEventListeners() {
    // File Upload Event Listeners
    dropZone.addEventListener('click', () => {
        console.log('Drop zone clicked');
        fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Drag over event');
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Drag leave event');
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Drop event occurred');
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        console.log('Dropped files:', files);
        handleFiles(Array.from(files));
    });

    fileInput.addEventListener('change', (e) => {
        console.log('File input change event');
        const files = e.target.files;
        console.log('Selected files:', files);
        handleFiles(Array.from(files));
    });

    // Other event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterAndDisplayVideos);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndDisplayVideos);
    }
    if (closeModal) {
        closeModal.addEventListener('click', closeVideoModal);
    }
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(-1));
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(1));
    }
    if (saveVideoDetails) {
        saveVideoDetails.addEventListener('click', saveCurrentVideoDetails);
    }
    if (deleteVideoBtn) {
        deleteVideoBtn.addEventListener('click', deleteCurrentVideo);
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing video management system...');
    
    if (initializeDOMElements()) {
        console.log('DOM elements initialized successfully');
        initializeEventListeners();
        loadFromLocalStorage();
        filterAndDisplayVideos();
    } else {
        console.error('Failed to initialize DOM elements');
    }
});

// File Processing
async function handleFiles(files) {
    console.log('Starting to process files:', files);
    
    if (!files || files.length === 0) {
        console.log('No files to process');
        return;
    }

    try {
        for (const file of files) {
            console.log('Processing file:', file.name, 'Type:', file.type);
            
            if (!file.type.startsWith('video/')) {
                console.log('Skipping non-video file:', file.name);
                continue;
            }

            await processVideoFile(file);
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

async function processVideoFile(file) {
    return new Promise((resolve, reject) => {
        console.log('Reading file:', file.name);
        
        try {
            // Store the file object and create a blob URL
            const url = URL.createObjectURL(file);
            
            const video = {
                id: generateUUID(),
                name: file.name,
                size: file.size,
                displaySize: formatFileSize(file.size),
                type: file.type,
                uploadDate: new Date().toISOString(),
                uploader: 'Current User',
                category: 'tutorial',
                tags: [],
                description: '',
                url: url,
                file: file // Store the file object for later use if needed
            };

            console.log('Created video object:', video.name);
            videos.unshift(video);
            saveToLocalStorage();
            filterAndDisplayVideos();
            resolve();
        } catch (error) {
            console.error('Error processing video:', error);
            reject(error);
        }
    });
}

// Video display and management functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function filterAndDisplayVideos() {
    console.log('Filtering and displaying videos. Total videos:', videos.length);
    
    try {
        const searchTerm = searchInput?.value?.toLowerCase() || '';
        const categoryValue = categoryFilter?.value || '';

        let filteredVideos = videos.filter(video => {
            const matchesSearch = video.name.toLowerCase().includes(searchTerm) ||
                                (video.description || '').toLowerCase().includes(searchTerm) ||
                                (video.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
            const matchesCategory = !categoryValue || video.category === categoryValue;
            return matchesSearch && matchesCategory;
        });

        console.log('Filtered videos:', filteredVideos.length);

        // Sort videos
        filteredVideos.sort((a, b) => {
            let valueA = a[sortColumn];
            let valueB = b[sortColumn];

            if (sortColumn === 'size') {
                valueA = parseInt(valueA);
                valueB = parseInt(valueB);
            }

            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Update pagination
        const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageVideos = filteredVideos.slice(start, end);

        console.log('Displaying videos', start + 1, 'to', end);

        // Clear and update table
        if (videoTableBody) {
            videoTableBody.innerHTML = '';
            
            if (pageVideos.length === 0) {
                videoTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                            No videos found
                        </td>
                    </tr>
                `;
            } else {
                pageVideos.forEach(video => {
                    try {
                        const row = createVideoRow(video);
                        videoTableBody.appendChild(row);
                    } catch (error) {
                        console.error('Error creating row for video:', video, error);
                    }
                });
            }

            updatePagination(totalPages);
        } else {
            console.error('videoTableBody element not found!');
        }
    } catch (error) {
        console.error('Error filtering and displaying videos:', error);
    }
}

// Modal functions
let currentVideoId = null;

window.editVideo = function(videoId) {
    console.log('Editing video:', videoId);
    const video = videos.find(v => v.id === videoId);
    
    if (!video) {
        console.error('Video not found:', videoId);
        return;
    }

    try {
        // Store the current video ID in the modal
        modal.dataset.currentVideoId = videoId;
        
        // Update modal content
        previewVideo.src = video.url;
        videoTitle.value = video.name;
        videoTags.value = (video.tags || []).join(', ');
        videoCategory.value = video.category || '';
        videoDescription.value = video.description || '';
        
        // Add file size information to the modal
        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'mt-4 p-3 bg-gray-50 rounded-md';
        metadataDiv.innerHTML = `
            <p class="text-sm text-gray-600">File size: ${video.displaySize || formatFileSize(video.size)}</p>
            <p class="text-sm text-gray-600">Upload date: ${formatDate(video.uploadDate)}</p>
            <p class="text-sm text-gray-600 font-mono">UUID: ${video.uuid || video.id}</p>
        `;
        
        // Find the form container and insert metadata before it
        const formContainer = videoTitle.closest('.space-y-4');
        formContainer.insertBefore(metadataDiv, formContainer.firstChild);
        
        // Show modal
        modal.classList.remove('hidden');
        
        console.log('Video loaded in modal:', video.name);
    } catch (error) {
        console.error('Error loading video in modal:', error);
    }
};

window.deleteVideo = function(videoId) {
    console.log('Attempting to delete video:', videoId);
    
    if (!videoId) {
        console.error('No video ID provided for deletion');
        return;
    }

    const video = videos.find(v => v.id === videoId);
    if (!video) {
        console.error('Video not found:', videoId);
        return;
    }

    if (confirm(`Are you sure you want to delete the video "${video.name}"?`)) {
        try {
            // Revoke the object URL to free up memory
            if (video.url && video.url.startsWith('blob:')) {
                URL.revokeObjectURL(video.url);
            }

            // Remove from array
            videos = videos.filter(v => v.id !== videoId);
            
            // Save to localStorage
            saveToLocalStorage();
            
            // Refresh display
            filterAndDisplayVideos();
            
            console.log('Video deleted successfully:', videoId);
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    }
};

function closeVideoModal() {
    try {
        // Stop video playback
        if (previewVideo) {
            previewVideo.pause();
            previewVideo.currentTime = 0;
            previewVideo.src = '';
        }
        
        // Clear the current video ID
        modal.dataset.currentVideoId = '';
        
        // Hide modal
        modal.classList.add('hidden');
        
        console.log('Video modal closed');
    } catch (error) {
        console.error('Error closing video modal:', error);
    }
}

function saveCurrentVideoDetails() {
    const currentVideoId = modal.dataset.currentVideoId;
    console.log('Saving details for video:', currentVideoId);
    
    if (!currentVideoId) {
        console.error('No video ID found for saving');
        return;
    }

    try {
        const videoIndex = videos.findIndex(v => v.id === currentVideoId);
        if (videoIndex === -1) {
            console.error('Video not found:', currentVideoId);
            return;
        }

        // Update video object
        videos[videoIndex] = {
            ...videos[videoIndex],
            name: videoTitle.value.trim(),
            tags: videoTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            category: videoCategory.value,
            description: videoDescription.value.trim()
        };

        // Save to localStorage
        saveToLocalStorage();
        
        // Refresh display
        filterAndDisplayVideos();
        
        // Close modal
        closeVideoModal();
        
        console.log('Video details saved successfully');
    } catch (error) {
        console.error('Error saving video details:', error);
    }
}

function deleteCurrentVideo() {
    const currentVideoId = modal.dataset.currentVideoId;
    if (currentVideoId) {
        window.deleteVideo(currentVideoId);
        closeVideoModal();
    } else {
        console.error('No video ID found for deletion in modal');
    }
}

// Pagination functions
function updatePagination(totalPages) {
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    
    // Update button states
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    // Add page input functionality
    const pageInput = document.createElement('input');
    pageInput.type = 'number';
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.value = currentPage;
    pageInput.className = 'w-16 px-2 py-1 text-center border rounded-md mx-2';
    
    // Replace the current page span with the input
    currentPageSpan.parentNode.replaceChild(pageInput, currentPageSpan);
    
    // Add event listener for page input
    pageInput.addEventListener('change', () => {
        let newPage = parseInt(pageInput.value);
        if (newPage < 1) newPage = 1;
        if (newPage > totalPages) newPage = totalPages;
        currentPage = newPage;
        filterAndDisplayVideos();
    });
}

function changePage(delta) {
    const filteredVideos = filterVideosList();
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        filterAndDisplayVideos();
    }
}

// UUID Generation (same as image management)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function createVideoRow(video) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <video class="video-preview h-24 w-40 object-cover" src="${video.url}" controls></video>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${video.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500 font-mono">${video.uuid}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${video.uploader}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">${formatDate(video.uploadDate)}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getCategoryColor(video.category)}-100 text-${getCategoryColor(video.category)}-800">
                ${video.category || 'Uncategorized'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">${video.displaySize || formatFileSize(video.size)}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3" data-video-id="${video.id}" data-action="edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900" data-video-id="${video.id}" data-action="delete">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    // Add event listeners to the buttons
    const editBtn = row.querySelector('[data-action="edit"]');
    const deleteBtn = row.querySelector('[data-action="delete"]');

    editBtn.addEventListener('click', () => window.editVideo(video.id));
    deleteBtn.addEventListener('click', () => window.deleteVideo(video.id));

    return row;
}

function getCategoryColor(category) {
    switch (category?.toLowerCase()) {
        case 'tutorial':
            return 'blue';
        case 'presentation':
            return 'green';
        case 'marketing':
            return 'yellow';
        default:
            return 'gray';
    }
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        // Create a copy of videos without the blob URLs
        const videosToSave = videos.map(video => ({
            ...video,
            url: null, // Don't store blob URLs
            file: null // Don't store file objects
        }));
        localStorage.setItem('videos', JSON.stringify(videosToSave));
        console.log('Videos saved to localStorage:', videos.length);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('videos');
        if (stored) {
            videos = JSON.parse(stored);
            console.log('Loaded videos from localStorage:', videos.length);
        } else {
            console.log('No videos found in localStorage');
            videos = [];
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        videos = [];
    }
}

// ... rest of the existing code ... 