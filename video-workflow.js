document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentRole = '';
    let videoRequests = [];
    let selectMode = false;
    let initialized = false;

    // DOM Elements - Move these before initialization
    const roleButtons = document.querySelectorAll('.role-btn');
    const producerSection = document.getElementById('producerSection');
    const editorSection = document.getElementById('editorSection');
    const approverSection = document.getElementById('approverSection');
    const producerAddRequestBtn = document.getElementById('producerAddRequestBtn');
    const producerSubmitRequestsBtn = document.getElementById('producerSubmitRequestsBtn');
    const producerRequestInputs = document.getElementById('producerRequestInputs');
    const producerBulkImportBtn = document.getElementById('producerBulkImportBtn');
    const producerBulkImportSection = document.getElementById('producerBulkImportSection');
    const producerBulkImportText = document.getElementById('producerBulkImportText');
    const producerClearBulkImportBtn = document.getElementById('producerClearBulkImportBtn');
    const producerProcessBulkImportBtn = document.getElementById('producerProcessBulkImportBtn');
    const producerToggleSelectModeBtn = document.getElementById('producerToggleSelectModeBtn');
    const producerSelectAllBtn = document.getElementById('producerSelectAllBtn');
    const producerDeleteSelectedBtn = document.getElementById('producerDeleteSelectedBtn');
    const producerSelectedCount = document.getElementById('producerSelectedCount');
    const pendingRequestsTable = document.getElementById('pendingRequestsTable');
    const reviewRequestsTable = document.getElementById('reviewRequestsTable');
    const previewModal = document.getElementById('previewModal');
    const closePreviewModal = document.getElementById('closePreviewModal');
    const modalPreviewVideo = document.getElementById('modalPreviewVideo');

    // Load saved requests from localStorage
    function loadFromLocalStorage() {
        const savedRequests = localStorage.getItem('videoRequests');
        if (savedRequests) {
            try {
                videoRequests = JSON.parse(savedRequests);
                // Update views based on current role
                if (currentRole === 'editor') {
                    updatePendingRequests();
                } else if (currentRole === 'approver') {
                    updateReviewRequests();
                }
            } catch (error) {
                console.error('Error loading saved requests:', error);
                videoRequests = [];
            }
        }
    }

    // Save requests to localStorage
    function saveToLocalStorage() {
        try {
            localStorage.setItem('videoRequests', JSON.stringify(videoRequests));
        } catch (error) {
            console.error('Error saving requests:', error);
        }
    }

    // Initialize the application
    function initialize() {
        loadFromLocalStorage();
        
        // Set default role if none is selected
        if (!currentRole) {
            switchRole('producer');
        }
    }

    // Event Listeners
    roleButtons.forEach(button => {
        button.addEventListener('click', () => switchRole(button.dataset.role));
    });

    producerAddRequestBtn.addEventListener('click', addNewRequest);
    producerSubmitRequestsBtn.addEventListener('click', submitRequests);
    producerBulkImportBtn.addEventListener('click', toggleBulkImport);
    producerClearBulkImportBtn.addEventListener('click', clearBulkImport);
    producerProcessBulkImportBtn.addEventListener('click', processBulkImport);
    producerToggleSelectModeBtn.addEventListener('click', toggleSelectMode);
    producerSelectAllBtn.addEventListener('click', selectAllRequests);
    producerDeleteSelectedBtn.addEventListener('click', deleteSelectedRequests);
    closePreviewModal.addEventListener('click', closePreview);

    // Call initialize when the page loads
    initialize();

    // Update UUID Generation to match video management
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
    function switchRole(role) {
        currentRole = role;
        roleButtons.forEach(btn => {
            // Remove all styling classes first
            btn.classList.remove('bg-blue-700', 'text-white', 'bg-white', 'text-gray-900', 'hover:bg-gray-100', 'hover:text-blue-700');
            
            if (btn.dataset.role === role) {
                // Add active styling
                btn.classList.add('bg-blue-700', 'text-white');
            } else {
                // Add inactive styling
                btn.classList.add('bg-white', 'text-gray-900', 'hover:bg-gray-100', 'hover:text-blue-700');
            }
        });

        // Show/hide sections based on role
        producerSection.classList.toggle('hidden', role !== 'producer');
        editorSection.classList.toggle('hidden', role !== 'editor');
        approverSection.classList.toggle('hidden', role !== 'approver');

        // Update content based on role
        if (role === 'editor') {
            updatePendingRequests();
        } else if (role === 'approver') {
            updateReviewRequests();
        } else if (role === 'producer' && !initialized) {
            initialized = true;
            addNewRequest(); // Add initial empty request only once
        }
    }

    // Request Management
    function addNewRequest() {
        addRequestInput();
    }

    function addRequestInput() {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'flex-col gap-4 p-4 border rounded-lg bg-gray-50';
        inputGroup.innerHTML = `
            <div class="select-checkbox ${selectMode ? 'flex' : 'hidden'} items-center">
                <input type="checkbox" class="request-checkbox h-4 w-4 text-blue-600 rounded border-gray-300">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Frame Chain</label>
                    <input type="text" class="frame-chain-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter frame chain">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Frame</label>
                    <input type="text" class="frame-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter frame">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Slide</label>
                    <input type="text" class="slide-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter slide">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                    <input type="text" class="filename-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter filename">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Desired Length</label>
                    <input type="text" class="length-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter time (e.g., 1:30)">
                </div>
                <div class="flex items-end">
                    <button class="remove-input text-red-600 hover:text-red-800 px-2 py-2" title="Remove">
                        <i class="fas fa-times"></i> Remove Request
                    </button>
                </div>
            </div>
        `;

        // Add checkbox change event listener
        const checkbox = inputGroup.querySelector('.request-checkbox');
        checkbox.addEventListener('change', updateSelectedCount);

        // Add remove button event listener
        inputGroup.querySelector('.remove-input').addEventListener('click', () => {
            if (producerRequestInputs.children.length > 1) {
                inputGroup.remove();
                updateSelectedCount();
            }
        });
        
        producerRequestInputs.appendChild(inputGroup);
    }

    function clearRequestInputs() {
        while (producerRequestInputs.firstChild) {
            producerRequestInputs.removeChild(producerRequestInputs.firstChild);
        }
        addNewRequest(); // Add one empty request
    }

    // Update submitRequests to use the new UUID generation
    async function submitRequests() {
        const inputs = producerRequestInputs.querySelectorAll('.flex-col');
        console.log('Number of inputs found:', inputs.length);

        const newRequests = [];
        for (const input of inputs) {
            const frameChain = input.querySelector('.frame-chain-input')?.value?.trim();
            const frame = input.querySelector('.frame-input')?.value?.trim();
            const slide = input.querySelector('.slide-input')?.value?.trim();
            const filename = input.querySelector('.filename-input')?.value?.trim();
            const desiredLength = input.querySelector('.length-input')?.value?.trim();
            
            console.log('Processing request:', { frameChain, frame, slide, filename, desiredLength });

            if (!frameChain || !frame || !slide || !filename || !desiredLength) {
                console.log('Skipping invalid request');
                continue;
            }

            const uuid = await generateTimestampUUID();
            newRequests.push({
                id: uuid,
                uuid: uuid, // Add UUID field to match video management
                frameChain,
                frame,
                slide,
                filename,
                desiredLength: timeToSeconds(desiredLength),
                status: 'pending',
                createdAt: new Date().toISOString(),
                uploadedVideo: null,
                approvalStatus: null,
                feedback: null,
                uploader: "guanglei.zhang",
                size: null,
                type: 'new',
                revisionHistory: [],
                videoUrl: null
            });
        }

        if (newRequests.length === 0) {
            alert('Please fill in all fields for at least one valid request.');
            return;
        }

        console.log('Valid requests to be added:', newRequests.length);

        videoRequests = [...videoRequests, ...newRequests];
        saveToLocalStorage();
        clearRequestInputs();
        updatePendingRequests();
        alert(`Successfully submitted ${newRequests.length} requests.`);
    }

    // Bulk Import
    function toggleBulkImport() {
        if (!producerBulkImportSection) {
            console.error('Bulk import section not found');
            return;
        }
        producerBulkImportSection.classList.toggle('hidden');
    }

    function clearBulkImport() {
        if (!producerBulkImportText) {
            console.error('Bulk import textarea not found');
            return;
        }
        producerBulkImportText.value = '';
    }

    // Add a helper function to convert time format to seconds
    function timeToSeconds(timeStr) {
        // Handle different time formats
        if (timeStr.includes(':')) {
            const [minutes, seconds] = timeStr.split(':').map(num => parseInt(num, 10));
            return (minutes * 60) + (seconds || 0);
        }
        return parseInt(timeStr, 10);
    }

    function processBulkImport() {
        if (!producerBulkImportText || !producerBulkImportSection) {
            console.error('Required bulk import elements not found');
            return;
        }

        const text = producerBulkImportText.value.trim();
        if (!text) {
            alert('Please enter some data to import.');
            return;
        }

        // Split into lines and filter out empty lines
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const requests = [];
        const errors = [];
        
        for (const [index, line] of lines.entries()) {
            try {
                // Split by spaces or tabs and filter out empty parts
                const parts = line.split(/\s+/).filter(part => part.length > 0);
                
                // We need exactly 4 parts (frame chain, frame, slide, filename) plus optional time
                if (parts.length < 4 || parts.length > 5) {
                    errors.push(`Line ${index + 1}: Expected 4-5 fields, got ${parts.length}`);
                    continue;
                }

                const frameChain = parts[0];
                const frame = parts[1];
                const slide = parts[2];
                const filename = parts[3];
                const desiredLength = parts[4] ? timeToSeconds(parts[4]) : 0;

                // Basic validation
                if (!frameChain || !frame || !slide || !filename) {
                    errors.push(`Line ${index + 1}: Missing required fields`);
                    continue;
                }

                requests.push({
                    frameChain,
                    frame,
                    slide,
                    filename,
                    desiredLength
                });
            } catch (error) {
                console.error('Error parsing line:', line, error);
                errors.push(`Line ${index + 1}: ${error.message}`);
            }
        }

        // Show any errors
        if (errors.length > 0) {
            alert('Some lines could not be processed:\n' + errors.join('\n'));
            if (requests.length === 0) {
                return;
            }
        }

        try {
            // Clear existing inputs
            clearRequestInputs();

            // Add requests to the form
            requests.forEach((request, index) => {
                if (index > 0) {
                    addRequestInput();
                }
                
                const inputContainer = producerRequestInputs.children[index];
                if (!inputContainer) {
                    console.error('No input container found for index:', index);
                    return;
                }

                // Update the input fields
                inputContainer.querySelector('.frame-chain-input').value = request.frameChain;
                inputContainer.querySelector('.frame-input').value = request.frame;
                inputContainer.querySelector('.slide-input').value = request.slide;
                inputContainer.querySelector('.filename-input').value = request.filename;
                inputContainer.querySelector('.length-input').value = request.desiredLength || '';
            });

            // Clear the bulk import textarea and hide the section
            producerBulkImportText.value = '';
            producerBulkImportSection.classList.add('hidden');
            
            alert(`Successfully processed ${requests.length} requests.`);
        } catch (error) {
            console.error('Error updating form:', error);
            alert('An error occurred while processing the requests. Please try again.');
        }
    }

    // Selection Mode
    function toggleSelectMode() {
        selectMode = !selectMode;
        const checkboxes = producerRequestInputs.querySelectorAll('.select-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.classList.toggle('hidden', !selectMode);
        });
        producerSelectAllBtn.classList.toggle('hidden', !selectMode);
        producerDeleteSelectedBtn.classList.toggle('hidden', !selectMode);
        updateSelectedCount();
    }

    function updateSelectCheckboxes() {
        const checkboxes = producerRequestInputs.querySelectorAll('.select-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.classList.toggle('hidden', !selectMode);
        });
    }

    function selectAllRequests() {
        const checkboxes = producerRequestInputs.querySelectorAll('.request-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        updateSelectedCount();
    }

    function deleteSelectedRequests() {
        const selectedRequests = producerRequestInputs.querySelectorAll('.request-checkbox:checked');
        selectedRequests.forEach(checkbox => {
            const container = checkbox.closest('.flex-col');
            if (container && producerRequestInputs.children.length > 1) {
                container.remove();
            }
        });
        updateSelectedCount();
    }

    function updateSelectedCount() {
        const count = producerRequestInputs.querySelectorAll('.request-checkbox:checked').length;
        producerSelectedCount.textContent = count;
    }

    // Editor and Approver Functions
    function updatePendingRequests() {
        const pendingRequests = videoRequests.filter(request => 
            request.status === 'pending' || request.status === 'rejected'
        );
        console.log('Pending/rejected requests found:', pendingRequests.length);
        
        pendingRequestsTable.innerHTML = pendingRequests.map(request => `
            <tr>
                <td class="px-6 py-4">${request.frameChain}</td>
                <td class="px-6 py-4">${request.frame}</td>
                <td class="px-6 py-4">${request.slide}</td>
                <td class="px-6 py-4">${request.filename}</td>
                <td class="px-6 py-4">${secondsToTimeFormat(request.desiredLength)}</td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-500 font-mono">${request.uuid}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col space-y-2">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${request.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                        ${request.status === 'rejected' ? `
                            <div class="mt-2">
                                <div class="text-sm text-gray-700 mb-2">Rejected Version:</div>
                                <video src="${request.videoUrl}" controls class="w-full max-h-48 object-contain mb-2"></video>
                            </div>
                            <div class="text-sm text-red-600">
                                <i class="fas fa-comment-alt mr-1"></i>Feedback:
                                <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">
                                    ${request.feedback}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-2">
                        <button class="upload-video-btn text-blue-600 hover:text-blue-900" data-id="${request.id}">
                            <i class="fas fa-upload mr-1"></i> Upload ${request.status === 'rejected' ? 'New Version' : ''}
                        </button>
                        ${request.revisionHistory && request.revisionHistory.length > 0 ? `
                            <button class="view-history-btn text-gray-600 hover:text-gray-900" 
                                    onclick="showVideoHistory('${request.id}')"
                                    title="View previous versions">
                                <i class="fas fa-history mr-1"></i> History
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to upload buttons
        document.querySelectorAll('.upload-video-btn').forEach(btn => {
            btn.addEventListener('click', () => handleVideoUpload(btn.dataset.id));
        });
    }

    function updateReviewRequests() {
        const reviewRequests = videoRequests.filter(request => request.status === 'uploaded');
        console.log('Review requests found:', reviewRequests.length);
        
        reviewRequestsTable.innerHTML = reviewRequests.map(request => `
            <tr>
                <td class="px-6 py-4">
                    <div class="flex flex-col space-y-4">
                        <div class="relative">
                            <video class="video-preview w-full max-h-48 object-contain" src="${request.videoUrl || ''}" controls></video>
                            <span class="absolute top-0 right-0 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">Current</span>
                        </div>
                        ${request.type === 'revision' && request.revisionHistory && request.revisionHistory.length > 0 ? `
                            <div class="relative">
                                <video class="video-preview w-full max-h-48 object-contain opacity-70" 
                                       src="${request.revisionHistory[request.revisionHistory.length - 1].videoUrl}" 
                                       controls></video>
                                <span class="absolute top-0 right-0 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">Previous</span>
                            </div>
                            <div class="text-xs text-gray-500">
                                <i class="fas fa-comment-alt mr-1"></i>Previous Feedback:
                                <div class="mt-1 text-gray-700 bg-gray-50 p-1.5 rounded text-wrap max-w-[200px] break-words">
                                    ${request.revisionHistory[request.revisionHistory.length - 1].feedback}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">${request.frameChain}</td>
                <td class="px-6 py-4">${request.frame}</td>
                <td class="px-6 py-4">${request.slide}</td>
                <td class="px-6 py-4">${request.filename}</td>
                <td class="px-6 py-4">${secondsToTimeFormat(request.desiredLength)}</td>
                <td class="px-6 py-4">${request.fileSize || 'N/A'}</td>
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${request.type === 'revision' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}">
                            ${request.type === 'revision' ? 'Revision' : 'New Upload'}
                        </span>
                        ${request.revisionHistory && request.revisionHistory.length > 0 ? `
                            <div class="mt-1 text-xs text-gray-500">
                                <i class="fas fa-history mr-1"></i>Revision #${request.revisionHistory.length}
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col space-y-2">
                        <button class="approve-btn text-green-600 hover:text-green-900 mr-2" data-id="${request.id}">
                            <i class="fas fa-check mr-1"></i>Approve
                        </button>
                        <button class="reject-btn text-red-600 hover:text-red-900" data-id="${request.id}">
                            <i class="fas fa-times mr-1"></i>Reject
                        </button>
                        ${request.revisionHistory && request.revisionHistory.length > 0 ? `
                            <button class="view-history-btn text-gray-600 hover:text-gray-900" 
                                    onclick="showVideoHistory('${request.id}')"
                                    title="View all previous versions">
                                <i class="fas fa-history mr-1"></i>View History
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to approve/reject buttons
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => approveVideo(btn.dataset.id));
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => rejectVideo(btn.dataset.id));
        });
    }

    function handleVideoUpload(requestId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const request = videoRequests.find(r => r.id === requestId);
                if (request) {
                    // If this is a revision, store the previous version
                    if (request.status === 'rejected' && request.videoUrl) {
                        request.revisionHistory = request.revisionHistory || [];
                        request.revisionHistory.push({
                            videoUrl: request.videoUrl,
                            uploadedAt: request.uploadedAt,
                            feedback: request.feedback,
                            fileSize: request.fileSize,
                            actualFileSize: request.actualFileSize
                        });
                    }

                    request.status = 'uploaded';
                    request.videoUrl = URL.createObjectURL(file);
                    request.fileSize = formatFileSize(file.size);
                    request.actualFileSize = file.size; // Store the actual file size in bytes
                    request.uploadedAt = new Date().toISOString();
                    request.feedback = null;
                    request.approvalStatus = null;
                    
                    saveToLocalStorage();
                    updatePendingRequests();
                    updateReviewRequests();
                }
            }
        };
        input.click();
    }

    // Add function to send video to Video Management
    async function sendToVideoManagement(request) {
        // Get the videos array from localStorage
        let storedVideos = JSON.parse(localStorage.getItem('videos')) || [];
        
        // Create a new video object in the format expected by the video management system
        const newVideo = {
            id: request.uuid, // Use the same UUID
            name: request.filename,
            size: request.actualFileSize, // Use actual file size in bytes
            displaySize: request.fileSize, // Keep formatted size for display
            type: 'video/mp4', // Default type for videos
            uploadDate: request.uploadedAt,
            uploader: request.uploader,
            category: 'tutorial', // Default category
            tags: [],
            description: `Frame Chain: ${request.frameChain}\nFrame: ${request.frame}\nSlide: ${request.slide}\nDesired Length: ${secondsToTimeFormat(request.desiredLength)}`,
            url: request.videoUrl,
            uuid: request.uuid
        };

        // Add the new video to the beginning of the array
        storedVideos.unshift(newVideo);

        // Save back to localStorage
        localStorage.setItem('videos', JSON.stringify(storedVideos));
        
        console.log('Video sent to video management:', newVideo);
    }

    function approveVideo(requestId) {
        const request = videoRequests.find(r => r.id === requestId);
        if (request) {
            // Ensure all required fields are present
            if (!request.uploadedAt) {
                request.uploadedAt = new Date().toISOString();
            }
            
            // Send to video management system
            sendToVideoManagement(request);
            
            // Remove the approved request from the workflow
            videoRequests = videoRequests.filter(r => r.id !== requestId);
            
            // Save the updated workflow state
            saveToLocalStorage();
            
            // Update the review requests table
            updateReviewRequests();
            
            // Show success message
            alert('Video approved and sent to Video Management successfully.');
        }
    }

    function rejectVideo(requestId) {
        showRejectDialog(requestId);
    }

    // Utility Functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function closePreview() {
        previewModal.classList.add('hidden');
        modalPreviewVideo.src = '';
    }

    // Add utility function to convert seconds to mm:ss format
    function secondsToTimeFormat(seconds) {
        if (!seconds && seconds !== 0) return '--:--';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Add function to show rejection dialog
    function showRejectDialog(requestId) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Provide Rejection Feedback</h3>
                <textarea id="rejection-feedback" 
                          class="w-full h-32 px-3 py-2 text-base text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="Please provide feedback for the rejection..."></textarea>
                <div class="mt-4 flex justify-end space-x-3">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
                        Cancel
                    </button>
                    <button onclick="submitRejection('${requestId}')" 
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                        Submit Rejection
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Add function to handle rejection submission
    function submitRejection(requestId) {
        const feedbackElement = document.getElementById('rejection-feedback');
        const feedback = feedbackElement ? feedbackElement.value.trim() : '';
        
        if (!feedback) {
            alert('Please provide feedback for the rejection.');
            return;
        }
        
        const request = videoRequests.find(r => r.id === requestId);
        if (request) {
            request.status = 'rejected';
            request.feedback = feedback;
            request.type = 'revision';
            
            saveToLocalStorage();
            updatePendingRequests();
            updateReviewRequests();
        }
        
        // Remove the modal
        feedbackElement.closest('.fixed').remove();
    }

    // Add function to show video history
    function showVideoHistory(requestId) {
        const request = videoRequests.find(r => r.id === requestId);
        if (!request || !request.revisionHistory || request.revisionHistory.length === 0) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium">Revision History</h3>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    ${request.revisionHistory.map((revision, index) => `
                        <div class="border-t pt-4 ${index === 0 ? 'border-t-0' : ''}">
                            <div class="flex items-start gap-4">
                                <div class="flex-1">
                                    <video src="${revision.videoUrl}" controls class="w-full max-h-48 object-contain"></video>
                                    <div class="mt-2 text-sm text-gray-500">
                                        <div>Version ${request.revisionHistory.length - index}</div>
                                        <div>Uploaded: ${new Date(revision.uploadedAt).toLocaleString()}</div>
                                        <div>Size: ${revision.fileSize}</div>
                                    </div>
                                    <div class="mt-2 text-sm">
                                        <div class="font-medium text-red-600">Rejection Feedback:</div>
                                        <div class="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                                            ${revision.feedback}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Add to window object to make functions available to onclick handlers
    window.showRejectDialog = showRejectDialog;
    window.submitRejection = submitRejection;
    window.showVideoHistory = showVideoHistory;
}); 