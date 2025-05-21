// Audio Management System
let audioFiles = [];
let currentPage = 1;
const itemsPerPage = 10;
let sortColumn = 'date';
let sortDirection = 'desc';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadAudioFiles();
    setupEventListeners();
    renderTable();
});

// Load audio files from localStorage
function loadAudioFiles() {
    const storedFiles = localStorage.getItem('audioFiles');
    audioFiles = storedFiles ? JSON.parse(storedFiles) : [];
}

// Save audio files to localStorage
function saveAudioFiles() {
    localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
}

// Setup event listeners
function setupEventListeners() {
    // Drop zone events
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Search and filter events
    document.getElementById('searchInput').addEventListener('input', renderTable);
    document.getElementById('categoryFilter').addEventListener('change', renderTable);

    // Pagination events
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(getFilteredFiles().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // Sort events
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'desc';
            }
            renderTable();
        });
    });

    // Modal events
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('saveAudioDetails').addEventListener('click', saveAudioDetails);
    document.getElementById('deleteAudio').addEventListener('click', deleteAudio);
}

// Handle file uploads
function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('audio/')) {
            alert('Please upload audio files only.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const audioFile = {
                id: generateUUID(),
                name: file.name,
                type: file.type,
                size: formatFileSize(file.size),
                data: e.target.result,
                uploadDate: new Date().toISOString(),
                uploader: 'Current User', // Replace with actual user
                category: document.getElementById('categoryFilter').value || 'Uncategorized',
                tags: [],
                description: ''
            };

            audioFiles.unshift(audioFile);
            saveAudioFiles();
            renderTable();
        };
        reader.readAsDataURL(file);
    });
}

// Render the audio files table
function renderTable() {
    const filteredFiles = getFilteredFiles();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    const tbody = document.getElementById('audioTableBody');
    tbody.innerHTML = '';

    paginatedFiles.forEach(file => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <audio controls class="audio-preview">
                    <source src="${file.data}" type="${file.type}">
                </audio>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${file.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${file.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">${file.uploader}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatDate(file.uploadDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${file.category}</td>
            <td class="px-6 py-4 whitespace-nowrap">${file.size}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="editAudio('${file.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteAudio('${file.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(filteredFiles.length);
}

// Get filtered audio files
function getFilteredFiles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    return audioFiles
        .filter(file => {
            const matchesSearch = file.name.toLowerCase().includes(searchTerm) ||
                                file.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                                file.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || file.category === categoryFilter;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];
            const modifier = sortDirection === 'asc' ? 1 : -1;
            return aValue > bValue ? modifier : -modifier;
        });
}

// Update pagination controls
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Edit audio file
function editAudio(id) {
    const file = audioFiles.find(f => f.id === id);
    if (!file) return;

    const modal = document.getElementById('audioModal');
    const audio = document.getElementById('previewAudio');
    const title = document.getElementById('audioTitle');
    const tags = document.getElementById('audioTags');
    const category = document.getElementById('audioCategory');
    const description = document.getElementById('audioDescription');

    audio.src = file.data;
    title.value = file.name;
    tags.value = file.tags.join(', ');
    category.value = file.category;
    description.value = file.description;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

// Save audio details
function saveAudioDetails() {
    const title = document.getElementById('audioTitle').value;
    const tags = document.getElementById('audioTags').value.split(',').map(tag => tag.trim());
    const category = document.getElementById('audioCategory').value;
    const description = document.getElementById('audioDescription').value;

    const file = audioFiles.find(f => f.name === title);
    if (file) {
        file.tags = tags;
        file.category = category;
        file.description = description;
        saveAudioFiles();
        renderTable();
        closeModal();
    }
}

// Delete audio file
function deleteAudio(id) {
    if (confirm('Are you sure you want to delete this audio file?')) {
        audioFiles = audioFiles.filter(f => f.id !== id);
        saveAudioFiles();
        renderTable();
        closeModal();
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('audioModal');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Utility functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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