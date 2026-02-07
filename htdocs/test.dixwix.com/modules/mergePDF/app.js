document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const mergeBtn = document.getElementById("mergeBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const initialUploadState = document.getElementById("initialUploadState");
    const fileSelectionButtons = document.getElementById("fileSelectionButtons");
    const selectFilesBtn = document.getElementById("selectFilesBtn");
    const initialGoogleDriveBtn = document.getElementById("initialGoogleDriveBtn");
    const initialDropboxBtn = document.getElementById("initialDropboxBtn");
    const addBtn = document.getElementById("addBtn");
    const computerBtn = document.getElementById("computerBtn");
    const googleDriveBtn = document.getElementById("googleDriveBtn");
    const dropboxBtn = document.getElementById("dropboxBtn");
    const fileCountBadge = document.getElementById("fileCountBadge");
    const fileContainer = document.querySelector('.col-md-6.position-relative');
    let selectedFiles = [];
    let draggedItem = null;
    let pdfFiles = [];
    let googleApiInitialized = false;
    let googleAccessToken = null;

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || '102744766704-ed1ch4pgc1j33hm831v41jfr6lgn021o.apps.googleusercontent.com';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || ''; // API Key is optional for Picker API
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    pdfInput.addEventListener("change", handleFileSelection);

    // Initialize Google API
    initializeGoogleAPI();

    // Initial state button listeners
    selectFilesBtn.addEventListener("click", () => pdfInput.click());
    initialGoogleDriveBtn.addEventListener("click", () => {
        openGoogleDrivePicker();
    });
    initialDropboxBtn.addEventListener("click", () => {
        showAlert("Dropbox integration coming soon!", 'primary');
        // TODO: Implement Dropbox file picker
    });

    // File selection buttons (shown after files are selected)
    addBtn.addEventListener("click", () => pdfInput.click());
    computerBtn.addEventListener("click", () => pdfInput.click());
    
    googleDriveBtn.addEventListener("click", () => {
        openGoogleDrivePicker();
    });
    
    dropboxBtn.addEventListener("click", () => {
        showAlert("Dropbox integration coming soon!", 'primary');
        // TODO: Implement Dropbox file picker
    });

    // Drag and drop for initial upload area
    if (initialUploadState) {
        initialUploadState.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.add('drag-over');
        });

        initialUploadState.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.remove('drag-over');
        });

        initialUploadState.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            handleDroppedFiles(files);
        });
    }

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    function handleDroppedFiles(files) {
        files.forEach(file => {
            if (file.type === "application/pdf") {
                if (pdfFiles.some(f => f.name === file.name)) {
                    showAlert(`File "${file.name}" is already added.`, 'warning');
                } else {
                    pdfFiles.push(file);
                    updateFileList();
                }
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        fileList.innerHTML = "";
        // Reset selectedFiles to match current pdfFiles
        selectedFiles = pdfFiles.map(file => file.name);
        
        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'col-6 col-sm-6 col-md-6 col-lg-6 mb-4 list-item';
            divItem.dataset.id = index;
            divItem.setAttribute('draggable', true);
            divItem.addEventListener('dragstart', handleDragStart);
            divItem.addEventListener('dragover', handleDragOver);
            divItem.addEventListener('dragenter', handleDragEnter);
            divItem.addEventListener('dragleave', handleDragLeave);
            divItem.addEventListener('drop', handleDrop);
            divItem.addEventListener('dragend', handleDragEnd);
            const divScnd = document.createElement("div");
            divScnd.className = 'pdf-card selected';
            divScnd.id = file.name;
            divScnd.addEventListener("click", () => toggleSelection(divScnd));
            
            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFile(index);
            });
            
            const tickBtn = document.createElement("span");
            tickBtn.classList.add("checkmark");
            tickBtn.textContent = "✔";
            const imgItem = document.createElement("img");
            imgItem.src = '/assests/pdf 2.png';
            imgItem.alt = file.name;
            const nameDiv = document.createElement("div");
            nameDiv.classList.add("pdf-name");
            nameDiv.textContent = file.name;

            divScnd.appendChild(deleteBtn);
            divScnd.appendChild(tickBtn);
            divScnd.appendChild(imgItem);
            divScnd.appendChild(nameDiv);
            divItem.appendChild(divScnd);
            fileList.appendChild(divItem);
        });
        
        // Update file count badge, selected count, and UI state
        updateFileCountBadge();
        updateSelectedCount();
        updateUIState();
    }
    
    function updateFileCountBadge() {
        const fileCount = pdfFiles.length;
        fileCountBadge.textContent = fileCount;
        if (fileCount > 0) {
            fileCountBadge.classList.add('show');
        } else {
            fileCountBadge.classList.remove('show');
        }
    }

    function updateUIState() {
        const hasFiles = pdfFiles.length > 0;
        
        if (hasFiles) {
            // Hide initial state, show file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'none';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'flex';
            if (fileContainer) fileContainer.classList.add('has-files');
        } else {
            // Show initial state, hide file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'flex';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'none';
            if (fileContainer) fileContainer.classList.remove('has-files');
        }
    }

    // Initialize UI state and selected count
    updateUIState();
    updateSelectedCount();
    
    loadSavedOrder();

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        
        // Add dragging class after a short delay for better visual effect
        setTimeout(() => this.classList.add('dragging'), 0);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (draggedItem !== this) {
            // Get all list items
            const items = Array.from(fileList.querySelectorAll('.list-item'));
            
            // Find the index of the dragged item and the target item
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = items.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                // Insert after the target
                fileList.insertBefore(draggedItem, this.nextSibling);
            } else {
                // Insert before the target
                fileList.insertBefore(draggedItem, this);
            }
            
            // Save the new order
            saveOrder();
        }
        
        this.classList.remove('over');
        return false;
    }
    
    function handleDragEnd(e) {
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.remove('dragging');
            item.classList.remove('over');
        });
    }
    
    function saveOrder() {
        const items = Array.from(fileList.querySelectorAll('.list-item'));
        const order = items.map(item => item.getAttribute('data-id'));
        pdfFiles = order.map(index => pdfFiles[index]);
        items.forEach((item, index) => {
            item.dataset.id = index;
        });
        console.log(pdfFiles);
        localStorage.setItem('draggableListOrder', JSON.stringify(order));
    }
    
    function loadSavedOrder() {
        const savedOrder = localStorage.getItem('draggableListOrder');
        if (savedOrder) {
            const order = JSON.parse(savedOrder);
            const items = Array.from(fileList.querySelectorAll('.list-item'));
            
            // Sort items based on saved order
            const sortedItems = order.map(id => 
                items.find(item => item.getAttribute('data-id') === id)
            ).filter(item => item !== undefined);
            
            // Clear the list and append sorted items
            fileList.innerHTML = '';
            sortedItems.forEach(item => fileList.appendChild(item));
        }
    }

    function toggleSelection(card) {
      card.classList.toggle('selected');
      const fileName = card.id;
      if (card.classList.contains("selected")){
        if (!selectedFiles.includes(fileName)) {
          selectedFiles.push(fileName);
        }
      } else {
        selectedFiles = selectedFiles.filter(item => item !== fileName);
      }
      updateSelectedCount();
    }
  
    function updateSelectedCount() {
      const selectedCards = document.querySelectorAll('.pdf-card.selected').length;
      const selectedCountElement = document.getElementById('selected-count');
      if (selectedCountElement) {
        selectedCountElement.textContent = selectedCards;
      }
    }

    function removeFile(index) {
        const fileToRemove = pdfFiles[index];
        pdfFiles.splice(index, 1);
        selectedFiles = selectedFiles.filter(name => name !== fileToRemove.name);
        updateFileList();
        updateSelectedCount();
    }

    mergeBtn.addEventListener("click", mergePDFs);

    async function mergePDFs() {
        pdfFiles.forEach((file, index) => {
            if(!selectedFiles.includes(file.name)){
                pdfFiles.splice(index, 1);
            }
        });
        if (pdfFiles.length === 0) {
            showAlert("Please add at least one PDF file to merge.", 'danger');
            return;
        }

        const { PDFDocument } = PDFLib;

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of pdfFiles) {
                const existingPdfBytes = await pdfFile.arrayBuffer();
                const existingPdf = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
            }

            const mergedPdfBytes = await mergedPdf.save();
            await downloadMergedPDF(mergedPdfBytes);
        } catch (error) {
            showAlert("An error occurred while merging the PDFs: " + error.message, 'danger');
            console.error("Error merging PDFs:", error);
        }
    }

    function generateUniqueName() {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
        return `merged_${timestamp}.pdf`;
    }

    async function downloadMergedPDF(pdfBytes) {
        const fileName = generateUniqueName();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Get user ID
        let userId = null;
        try {
            const laravelUrl = 'http://82.180.132.134:8000';
            const userResponse = await fetch(`${laravelUrl}/api/current-user`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.authenticated && userData.user_id) {
                    userId = userData.user_id;
                }
            }
        } catch (error) {
            console.warn('Could not fetch user ID:', error);
        }
        
        // Record file in database
        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL || 'http://82.180.132.134:3000';
            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('tool_name', 'Merge PDF');
            if (userId) formData.append('user_id', userId);
            formData.append('original_filename', fileName);
            
            await fetch(`${SERVER_NAME}/api/record-processed-file`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.warn('Failed to record file in database:', error);
        }
        
        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showAlert("PDFs merged successfully!", 'success');
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        alertPlaceholder.innerHTML = ''; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout (optional)
        setTimeout(() => {
            alertDiv.remove();
        }, 7000); // Remove alert after 7 seconds
    }

    // ===================================
    // Google Drive Integration
    // ===================================

    function initializeGoogleAPI() {
        if (typeof gapi === 'undefined') {
            console.warn('Google API not loaded. Please check if the script is included.');
            return;
        }

        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            console.warn('Google Drive API credentials not configured. Please set GOOGLE_CLIENT_ID in your environment variables.');
            return;
        }

        // Load the Picker API (API key is optional for Picker)
        gapi.load('picker', () => {
            googleApiInitialized = true;
            console.log('Google Picker API loaded successfully');
        });
    }

    function openGoogleDrivePicker() {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            showAlert('Google Drive API credentials not configured. Please contact the administrator.', 'warning');
            return;
        }

        if (!googleApiInitialized) {
            showAlert('Google Drive is initializing. Please try again in a moment.', 'info');
            initializeGoogleAPI();
            // Wait a bit and try again
            setTimeout(() => {
                if (googleApiInitialized) {
                    authenticateAndCreatePicker();
                } else {
                    showAlert('Failed to initialize Google Drive. Please refresh the page.', 'danger');
                }
            }, 1500);
            return;
        }

        authenticateAndCreatePicker();
    }

    function authenticateAndCreatePicker() {
        // Use Google Identity Services (GSI) for authentication
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            try {
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.readonly',
                    callback: (response) => {
                        if (response && response.access_token) {
                            googleAccessToken = response.access_token;
                            createPicker();
                        } else if (response && response.error) {
                            console.error('OAuth error:', response.error);
                            showAlert('Failed to authenticate with Google: ' + response.error, 'danger');
                        } else {
                            showAlert('Failed to authenticate with Google. Please try again.', 'danger');
                        }
                    },
                });

                // Request access token
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                console.error('Error initializing token client:', error);
                showAlert('Failed to initialize Google authentication. Please refresh the page.', 'danger');
            }
        } else {
            // Fallback: Try to use Picker without explicit auth (it will handle auth itself)
            console.warn('Google Identity Services not available, trying direct picker');
            if (typeof google !== 'undefined' && typeof google.picker !== 'undefined') {
                // Picker can handle authentication internally
                createPickerWithoutAuth();
            } else {
                showAlert('Google authentication not available. Please refresh the page.', 'danger');
            }
        }
    }

    function createPickerWithoutAuth() {
        // Create picker that will handle auth internally
        showPicker();
    }

    function createPicker() {
        // Wait for picker API to be loaded
        if (typeof google === 'undefined' || typeof google.picker === 'undefined') {
            // Try loading picker API
            gapi.load('picker', () => {
                if (typeof google !== 'undefined' && typeof google.picker !== 'undefined') {
                    showPicker();
                } else {
                    showAlert('Google Picker API not loaded. Please refresh the page.', 'danger');
                }
            });
            return;
        }

        showPicker();
    }

    function showPicker() {
        // Create a view for PDF files
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/pdf');

        // Build picker with available credentials
        const pickerBuilder = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .addView(view)
            .setCallback(pickerCallback);

        // Add OAuth token if available
        if (googleAccessToken) {
            pickerBuilder.setOAuthToken(googleAccessToken);
        } else {
            // Set App ID for authentication
            pickerBuilder.setAppId(GOOGLE_APP_ID);
        }

        const picker = pickerBuilder.build();
        picker.setVisible(true);
    }

    function pickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            const docs = data.docs;
            
            // Get access token from picker response if available
            if (data[google.picker.Response.TOKEN]) {
                googleAccessToken = data[google.picker.Response.TOKEN];
            }
            
            showAlert(`Loading ${docs.length} file(s) from Google Drive...`, 'info');
            
            // Load each selected file
            docs.forEach((doc, index) => {
                loadFileFromGoogleDrive(doc, index === docs.length - 1);
            });
        } else if (data.action === google.picker.Action.CANCEL) {
            console.log('User cancelled the picker');
        } else if (data.action === google.picker.Action.LOADED) {
            console.log('Picker loaded successfully');
        }
    }

    async function loadFileFromGoogleDrive(doc, isLast) {
        try {
            if (!googleAccessToken) {
                throw new Error('No access token available. Please try selecting files again.');
            }

            // Download the file from Google Drive
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired, need to re-authenticate
                    googleAccessToken = null;
                    showAlert('Session expired. Please select files from Google Drive again.', 'warning');
                    return;
                }
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            
            // Convert blob to File object
            const file = new File([blob], doc.name, { type: 'application/pdf' });

            // Check if file already exists
            if (pdfFiles.some(f => f.name === file.name)) {
                showAlert(`File "${file.name}" is already added.`, 'warning');
                return;
            }

            // Add to pdfFiles array
            pdfFiles.push(file);
            
            // Update the file list
            updateFileList();

            if (isLast) {
                const loadedCount = pdfFiles.length;
                showAlert(`Successfully loaded file(s) from Google Drive!`, 'success');
            }
        } catch (error) {
            console.error('Error loading file from Google Drive:', error);
            showAlert(`Failed to load "${doc.name}" from Google Drive: ${error.message}`, 'danger');
        }
    }
});
