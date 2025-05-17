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
const pageNumbers = document.getElementById('pageNumbers');
const recordsPerPage = document.getElementById('recordsPerPage');
const pageJump = document.getElementById('pageJump');
const jumpToPage = document.getElementById('jumpToPage');

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

// Event Listeners
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
uploadBtn.addEventListener('click', () => fileInput.click());
searchInput.addEventListener('input', filterImages);
categoryFilter.addEventListener('change', filterImages);
closeModal.addEventListener('click', () => imageModal.classList.add('hidden'));
prevPage.addEventListener('click', () => changePage(-1));
nextPage.addEventListener('click', () => changePage(1));

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

// File Processing
async function handleFiles(files) {
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
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
            images.unshift(image);
            saveToLocalStorage();
            renderImages();
        };
        reader.readAsDataURL(file);
    }
}

// Image Display
function renderImages() {
    const filteredImages = filterImagesList();
    
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
                comparison = a.category.localeCompare(b.category);
                break;
            case 'uploader':
                comparison = a.uploader.localeCompare(b.uploader);
                break;
            case 'uuid':
                comparison = a.uuid.localeCompare(b.uuid);
                break;
            default:
                comparison = new Date(a.date) - new Date(b.date);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    
    // Update page jump input max value
    pageJump.max = totalPages;
    
    // Ensure current page is valid
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    
    const start = (currentPage - 1) * imagesPerPage;
    const end = start + imagesPerPage;
    const pageImages = filteredImages.slice(start, end);

    imageTableBody.innerHTML = '';
    pageImages.forEach(image => {
        const row = createTableRow(image);
        imageTableBody.appendChild(row);
    });

    // Update pagination controls
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
    createPageNumbers(totalPages);
    
    // Update page jump input
    pageJump.value = currentPage;
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

function filterImagesList() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    
    return images.filter(image => {
        const matchesSearch = 
            image.name.toLowerCase().includes(searchTerm) ||
            image.description.toLowerCase().includes(searchTerm) ||
            image.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !category || image.category === category;
        
        return matchesSearch && matchesCategory;
    });
}

// Pagination
function changePage(delta) {
    const filteredImages = filterImagesList();
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    currentPage = Math.max(1, Math.min(currentPage + delta, totalPages));
    renderImages();
}

// Function to create page number buttons
function createPageNumbers(totalPages) {
    pageNumbers.innerHTML = '';
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Add first page button if not in range
    if (startPage > 1) {
        const firstBtn = createPageButton(1);
        pageNumbers.appendChild(firstBtn);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 py-1 text-gray-600';
            pageNumbers.appendChild(ellipsis);
        }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i);
        pageNumbers.appendChild(pageBtn);
    }

    // Add last page button if not in range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 py-1 text-gray-600';
            pageNumbers.appendChild(ellipsis);
        }
        const lastBtn = createPageButton(totalPages);
        pageNumbers.appendChild(lastBtn);
    }
}

// Function to create a single page number button
function createPageButton(pageNum) {
    const button = document.createElement('button');
    button.textContent = pageNum;
    button.className = `px-3 py-1 rounded-md transition-colors ${
        pageNum === currentPage 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;
    button.addEventListener('click', () => {
        currentPage = pageNum;
        renderImages();
    });
    return button;
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
        renderImages();
    } else {
        initializePlaceholderImages();
    }
}

// Initialize
loadFromLocalStorage(); 