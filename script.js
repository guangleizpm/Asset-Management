// Image storage (in real application, this would be a backend service)
let images = [];
let currentPage = 1;
let imagesPerPage = 10;
let currentSortColumn = 'date';
let sortDirection = 'desc';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imageTableBody = document.getElementById('imageTableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const uploadBtn = document.getElementById('uploadBtn');
const imageModal = document.getElementById('imageModal');
const previewImage = document.getElementById('previewImage');
const closeModal = document.getElementById('closeModal');
const imageTitle = document.getElementById('imageTitle');
const imageTags = document.getElementById('imageTags');
const imageCategory = document.getElementById('imageCategory');
const imageDescription = document.getElementById('imageDescription');
const saveImageDetails = document.getElementById('saveImageDetails');
const deleteImage = document.getElementById('deleteImage');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');

// Add sort event listeners
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.sort;
        if (currentSortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = column;
            sortDirection = 'asc';
        }
        renderImages();
    });
});

// Add event listeners for pagination controls
recordsPerPage.addEventListener('change', (e) => {
    imagesPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderImages();
});

jumpToPage.addEventListener('click', () => {
    const pageNum = parseInt(pageJump.value);
    const filteredImages = filterImagesList();
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    
    if (pageNum >= 1 && pageNum <= totalPages) {
        currentPage = pageNum;
        renderImages();
    } else {
        alert(`Please enter a page number between 1 and ${totalPages}`);
    }
});

// Generate UUID using SHA-256 hash of timestamp and random salt
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

// Generate random date within the last 30 days
function generateRandomDate() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Image Display
function renderImages() {
    console.log('Rendering images. Total images:', images.length);
    
    try {
        const filteredImages = filterImagesList();
        console.log('Filtered images:', filteredImages.length);
        
        // Sort images
        filteredImages.sort((a, b) => {
            let comparison = 0;
            switch (currentSortColumn) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'category':
                    comparison = (a.category || '').localeCompare(b.category || '');
                    break;
                case 'uploader':
                    comparison = (a.uploader || '').localeCompare(b.uploader || '');
                    break;
                case 'uuid':
                    comparison = (a.uuid || '').localeCompare(b.uuid || '');
                    break;
                default:
                    comparison = new Date(b.date) - new Date(a.date); // Default to newest first
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    const start = (currentPage - 1) * imagesPerPage;
    const end = start + imagesPerPage;
    const pageImages = filteredImages.slice(start, end);

        console.log('Rendering page', currentPage, 'of', totalPages);
        console.log('Displaying images', start + 1, 'to', end);

        // Clear the table body
        if (imageTableBody) {
            imageTableBody.innerHTML = '';
            
            if (pageImages.length === 0) {
                imageTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                            No images found
                        </td>
                    </tr>
                `;
            } else {
                pageImages.forEach(image => {
                    try {
                        const row = createTableRow(image);
                        imageTableBody.appendChild(row);
                    } catch (error) {
                        console.error('Error creating row for image:', image, error);
                    }
                });
            }

    updatePagination(totalPages);
}

function createTableRow(image) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 transition-colors';
    
    const uploadDate = new Date(image.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <img src="${image.src}" alt="${image.name}" class="h-16 w-16 object-cover rounded">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${image.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500 font-mono">${image.uuid}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${image.uploader}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">${uploadDate}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getCategoryColor(image.category)}-100 text-${getCategoryColor(image.category)}-800">
                ${image.category || 'Uncategorized'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">${formatFileSize(image.size)}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3 edit-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900 delete-btn">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    // Add event listeners after creating the row
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => showImageDetails(image));
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this image?')) {
            deleteImageById(image.id);
        }
    });

    return row;
}

function getCategoryColor(category) {
    switch (category) {
        case 'work':
            return 'blue';
        case 'personal':
            return 'green';
        case 'nature':
            return 'yellow';
        default:
            return 'gray';
    }
}

// Image Details Modal
function showImageDetails(image) {
    previewImage.src = image.src;
    imageTitle.value = image.name;
    imageTags.value = image.tags.join(', ');
    imageCategory.value = image.category;
    imageDescription.value = image.description;
    
    // Add additional metadata to the modal
    const modalContent = document.querySelector('#imageModal .bg-white');
    const metadataDiv = modalContent.querySelector('.flex-1 .space-y-4');
    
    // Remove existing metadata if present
    const existingMetadata = metadataDiv.querySelector('.bg-gray-50');
    if (existingMetadata) {
        existingMetadata.remove();
    }
    
    // Add uploader and UUID information
    const uploadDate = new Date(image.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    metadataDiv.insertAdjacentHTML('afterbegin', `
        <div class="bg-gray-50 p-3 rounded-md">
            <p class="text-sm text-gray-600">Uploaded by: ${image.uploader}</p>
            <p class="text-sm text-gray-600">Upload date: ${uploadDate}</p>
            <p class="text-sm text-gray-600 font-mono">UUID: ${image.uuid}</p>
            <p class="text-sm text-gray-600">Size: ${formatFileSize(image.size)}</p>
        </div>
    `);
    
    saveImageDetails.onclick = () => {
        updateImageDetails(image);
        imageModal.classList.add('hidden');
    };
    
    deleteImage.onclick = () => {
        deleteImageById(image.id);
        imageModal.classList.add('hidden');
    };
    
    imageModal.classList.remove('hidden');
}

// Image Updates
function updateImageDetails(image) {
    const updatedImage = images.find(img => img.id === image.id);
    if (updatedImage) {
        updatedImage.name = imageTitle.value;
        updatedImage.tags = imageTags.value.split(',').map(tag => tag.trim()).filter(Boolean);
        updatedImage.category = imageCategory.value;
        updatedImage.description = imageDescription.value;
        saveToLocalStorage();
        renderImages();
    }
}

function deleteImageById(id) {
    images = images.filter(image => image.id !== id);
    saveToLocalStorage();
    renderImages();
}

// Filtering and Search
function filterImages() {
    currentPage = 1;
    renderImages();
}

// Pagination
function updatePagination(totalPages) {
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    
    // Update button states
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;

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
        renderImages();
    });
}

function changePage(delta) {
    const filteredImages = filterImagesList();
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    currentPage = Math.max(1, Math.min(currentPage + delta, totalPages));
    renderImages();
}

function updatePagination(totalPages) {
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
}

// Local Storage
function saveToLocalStorage() {
    localStorage.setItem('images', JSON.stringify(images));
}

// Initialize placeholder images
async function initializePlaceholderImages() {
    const imageTemplates = [
        { name: "Project Screenshot 2024.png", category: "work" },
        { name: "Family Vacation.jpg", category: "personal" },
        { name: "Mountain Landscape.jpg", category: "nature" },
        { name: "Code Review Doc.png", category: "work" },
        { name: "Spring Garden.jpg", category: "nature" },
        { name: "Team Meeting.jpg", category: "work" },
        { name: "Sunset at Beach.jpg", category: "nature" },
        { name: "Birthday Party.jpg", category: "personal" },
        { name: "System Architecture.png", category: "work" },
        { name: "Forest Trail.jpg", category: "nature" },
        { name: "Weekend BBQ.jpg", category: "personal" },
        { name: "Product Mockup.png", category: "work" },
        { name: "Desert Landscape.jpg", category: "nature" },
        { name: "Holiday Celebration.jpg", category: "personal" },
        { name: "UI Design Draft.png", category: "work" }
    ];

    images = await Promise.all(imageTemplates.map(async (img, index) => {
        const date = generateRandomDate();
        return {
            id: await generateTimestampUUID(),
            src: `https://placekitten.com/${600 + index}/${400 + index}`,
            name: img.name,
            tags: [img.category, 'sample', 'placeholder'],
            category: img.category,
            description: `Sample ${img.category} image for demonstration purposes.`,
            date: date.toISOString(),
            size: Math.floor(Math.random() * 5000000) + 500000,
            uploader: "guanglei.zhang",
            uuid: await generateTimestampUUID(),
            timestamp: date.getTime()
        };
    }));

    saveToLocalStorage();
    renderImages();
}

// Modified loadFromLocalStorage
function loadFromLocalStorage() {
    const stored = localStorage.getItem('images');
    if (stored) {
        images = JSON.parse(stored);
        console.log('Loaded images from localStorage:', images);
        renderImages();
    } else {
        console.log('No images found in localStorage, initializing with placeholder images...');
        initializePlaceholderImages();
    }
}

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
            
            if (!file.type.startsWith('image/')) {
                console.log('Skipping non-image file:', file.name);
                continue;
            }

            await processImageFile(file);
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

async function processImageFile(file) {
    return new Promise((resolve, reject) => {
        console.log('Reading file:', file.name);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                console.log('File read successfully:', file.name);
                const now = new Date();
                const image = {
                    id: await generateTimestampUUID(),
                    src: e.target.result,
                    name: file.name,
                    tags: [],
                    category: '',
                    description: '',
                    date: now.toISOString(),
                    size: file.size,
                    uploader: "guanglei.zhang",
                    uuid: await generateTimestampUUID(),
                    timestamp: now.getTime()
                };

                console.log('Created image object:', image.name);
                images.unshift(image);
                saveToLocalStorage();
                renderImages();
                resolve();
            } catch (error) {
                console.error('Error processing image:', error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(error);
        };

        try {
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error starting file read:', error);
            reject(error);
        }
    });
} 