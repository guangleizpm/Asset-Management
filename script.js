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
const recordsPerPage = document.getElementById('recordsPerPage');
const jumpToPage = document.getElementById('jumpToPage');
const pageJump = document.getElementById('pageJump');

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
        }

        updatePagination(totalPages);
    } catch (error) {
        console.error('Error rendering images:', error);
    }
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
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${image.size}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onclick="showImageDetails('${image.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteImageById('${image.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function getCategoryColor(category) {
    const colors = {
        'Math': 'blue',
        'Science': 'green',
        'English': 'yellow',
        'History': 'purple',
        'default': 'gray'
    };
    return colors[category] || colors.default;
}

function showImageDetails(imageId) {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    previewImage.src = image.src;
    imageTitle.value = image.name;
    imageTags.value = image.tags.join(', ');
    imageCategory.value = image.category || '';
    imageDescription.value = image.description || '';
    
    // Store the current image ID for saving
    imageModal.dataset.imageId = imageId;
    
    // Show the modal
    imageModal.classList.remove('hidden');
}

function updateImageDetails(imageId) {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    image.name = imageTitle.value;
    image.tags = imageTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    image.category = imageCategory.value;
    image.description = imageDescription.value;

    saveToLocalStorage();
    renderImages();
    imageModal.classList.add('hidden');
}

function deleteImageById(id) {
    if (confirm('Are you sure you want to delete this image?')) {
        images = images.filter(img => img.id !== id);
        saveToLocalStorage();
        renderImages();
    }
}

function filterImagesList() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    
    return images.filter(image => {
        const matchesSearch = image.name.toLowerCase().includes(searchTerm) ||
                            image.description.toLowerCase().includes(searchTerm) ||
                            image.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !category || image.category === category;
        
        return matchesSearch && matchesCategory;
    });
}

function updatePagination(totalPages) {
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage === totalPages;
    
    // Update jump to page input
    if (pageJump) {
        pageJump.max = totalPages;
        pageJump.value = currentPage;
    }
}

function changePage(delta) {
    const newPage = currentPage + delta;
    const filteredImages = filterImagesList();
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderImages();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('images', JSON.stringify(images));
}

async function initializePlaceholderImages() {
    if (images.length === 0) {
        const placeholderImages = [
            {
                id: await generateTimestampUUID(),
                name: 'Math Problem 1',
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TWF0aCBQcm9ibGVtPC90ZXh0Pjwvc3ZnPg==',
                category: 'Math',
                tags: ['algebra', 'equations'],
                description: 'Sample math problem for algebra class',
                date: generateRandomDate().toISOString(),
                size: formatFileSize(Math.floor(Math.random() * 1000000)),
                uploader: 'guanglei.zhang',
                uuid: await generateTimestampUUID()
            },
            {
                id: await generateTimestampUUID(),
                name: 'Science Diagram',
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2NpZW5jZSBEaWFncmFtPC90ZXh0Pjwvc3ZnPg==',
                category: 'Science',
                tags: ['biology', 'cells'],
                description: 'Cell structure diagram',
                date: generateRandomDate().toISOString(),
                size: formatFileSize(Math.floor(Math.random() * 1000000)),
                uploader: 'guanglei.zhang',
                uuid: await generateTimestampUUID()
            }
        ];
        
        images = placeholderImages;
        saveToLocalStorage();
    }
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('images');
    if (stored) {
        images = JSON.parse(stored);
    }
    renderImages();
}

async function handleFiles(files) {
    for (const file of files) {
        try {
            const image = await processImageFile(file);
            images.unshift(image);
        } catch (error) {
            console.error('Error processing file:', file.name, error);
            alert(`Error processing ${file.name}: ${error.message}`);
        }
    }
    
    saveToLocalStorage();
    renderImages();
}

async function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const image = {
                    id: await generateTimestampUUID(),
                    name: file.name,
                    src: e.target.result,
                    category: '',
                    tags: [],
                    description: '',
                    date: new Date().toISOString(),
                    size: formatFileSize(file.size),
                    uploader: 'guanglei.zhang',
                    uuid: await generateTimestampUUID()
                };
                resolve(image);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load images from localStorage first
        loadFromLocalStorage();
        
        // Then initialize placeholder images if needed
        await initializePlaceholderImages();
        
        // Add event listeners for file upload
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-blue-500');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-blue-500');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-blue-500');
                handleFiles(e.dataTransfer.files);
            });

            // Add click event listener to trigger file input
            dropZone.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                handleFiles(e.target.files);
            });
        }
        
        // Add event listeners for search and filter
        if (searchInput) {
            searchInput.addEventListener('input', renderImages);
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', renderImages);
        }
        
        // Add event listeners for pagination
        if (prevPage) {
            prevPage.addEventListener('click', () => changePage(-1));
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => changePage(1));
        }
        
        // Add event listeners for modal
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                imageModal.classList.add('hidden');
            });
        }
        
        if (saveImageDetails) {
            saveImageDetails.addEventListener('click', () => {
                const imageId = imageModal.dataset.imageId;
                if (imageId) {
                    updateImageDetails(imageId);
                }
            });
        }

        // Initial render
        renderImages();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}); 