document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const convertBtn = document.getElementById("convertBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    
    // UI State Elements
    const initialUploadState = document.getElementById("initialUploadState");
    const fileSelectionButtons = document.getElementById("fileSelectionButtons");
    const selectFilesBtn = document.getElementById("selectFilesBtn");
    const initialGoogleDriveBtn = document.getElementById("initialGoogleDriveBtn");
    const initialDropboxBtn = document.getElementById("initialDropboxBtn");
    const addBtn = document.getElementById("addBtn");
    const computerBtn = document.getElementById("computerBtn");
    const googleDriveBtn = document.getElementById("googleDriveBtn");
    const dropboxBtn = document.getElementById("dropboxBtn");
    const fileContainer = document.querySelector('.col-md-6.position-relative');

    let pdfFiles = [];
    let googleApiInitialized = false;
    let googleAccessToken = null;

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || '102744766704-ed1ch4pgc1j33hm831v41jfr6lgn021o.apps.googleusercontent.com';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || ''; // API Key is optional for Picker API
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    // Dropbox API Configuration
    const DROPBOX_APP_KEY = window.env?.DROPBOX_APP_KEY || 'YOUR_DROPBOX_APP_KEY';

    pdfInput.addEventListener("change", handleFileSelection);

    // Initialize Google API
    initializeGoogleAPI();

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    function handleDroppedFiles(files) {
        if (pdfFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            if (file.type === "application/pdf") {
                pdfFiles.push(file);
                updateFileList();
                updateUIState();
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        // Clear existing items
        fileList.innerHTML = "";

        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'file-item';

            const iconWrapper = document.createElement("div");
            iconWrapper.className = 'file-icon';
            const img = document.createElement('img');
            img.src = "/assests/pdf 2.png";
            img.alt = file.name;
            iconWrapper.appendChild(img);

            const nameDiv = document.createElement("div");
            nameDiv.classList.add("pdf-file-name");
            const displayName = file.name.length > 30 ? file.name.substring(0, 27) + "..." : file.name;
            nameDiv.textContent = displayName;
            nameDiv.title = file.name;

            const delDiv = document.createElement("div");
            delDiv.classList.add("delete-icon");
            const delImg = document.createElement("img");
            delImg.src = "/assests/Group 85.png";
            delImg.alt = "Delete Icon";
            delDiv.appendChild(delImg);
            delDiv.addEventListener("click", () => removeFile(index));

            divItem.appendChild(iconWrapper);
            divItem.appendChild(nameDiv);
            divItem.appendChild(delDiv);

            fileList.appendChild(divItem);
        });
    }

    function updateUIState() {
        const hasFiles = pdfFiles.length > 0;

        if (hasFiles) {
            // Hide initial upload state
            if (initialUploadState) {
                initialUploadState.style.display = 'none';
            }
            // Show file selection buttons
            if (fileSelectionButtons) {
                fileSelectionButtons.style.display = 'flex';
            }
            // Add has-files class to container
            if (fileContainer) {
                fileContainer.classList.add('has-files');
            }
        } else {
            // Show initial upload state
            if (initialUploadState) {
                initialUploadState.style.display = 'flex';
            }
            // Hide file selection buttons
            if (fileSelectionButtons) {
                fileSelectionButtons.style.display = 'none';
            }
            // Remove has-files class from container
            if (fileContainer) {
                fileContainer.classList.remove('has-files');
            }
        }
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
        updateUIState();
    }

    // Button event listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => pdfInput.click());
    }

    if (initialGoogleDriveBtn) {
        initialGoogleDriveBtn.addEventListener("click", () => {
            openGoogleDrivePicker();
        });
    }

    if (initialDropboxBtn) {
        initialDropboxBtn.addEventListener("click", () => {
            openDropboxPicker();
        });
    }

    if (addBtn) {
        addBtn.addEventListener("click", () => pdfInput.click());
    }

    if (computerBtn) {
        computerBtn.addEventListener("click", () => pdfInput.click());
    }

    if (googleDriveBtn) {
        googleDriveBtn.addEventListener("click", () => {
            openGoogleDrivePicker();
        });
    }

    if (dropboxBtn) {
        dropboxBtn.addEventListener("click", () => {
            openDropboxPicker();
        });
    }

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

    // Initialize UI state
    updateUIState();

    // Google Drive Integration Functions
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
            
            // For single file selection, only take the first file
            if (docs.length > 0) {
                showAlert('Loading file from Google Drive...', 'info');
                loadFileFromGoogleDrive(docs[0]);
            }
        } else if (data.action === google.picker.Action.CANCEL) {
            console.log('User cancelled the picker');
        } else if (data.action === google.picker.Action.LOADED) {
            console.log('Picker loaded successfully');
        }
    }

    async function loadFileFromGoogleDrive(doc) {
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

            // Handle single file selection (replace existing file if any)
            if (pdfFiles.length > 0) {
                pdfFiles = [file];
            } else {
                pdfFiles.push(file);
            }
            
            // Update the file list and UI
            updateFileList();
            updateUIState();
            
            showAlert('Successfully loaded file from Google Drive!', 'success');
        } catch (error) {
            console.error('Error loading file from Google Drive:', error);
            showAlert(`Failed to load "${doc.name}" from Google Drive: ${error.message}`, 'danger');
        }
    }

    convertBtn.addEventListener("click", convertToJpg);

    async function convertToJpg() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to convert.", 'danger');
            return;
        }

        // Disable the convert button and show "Please Wait..." with spinner
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-pdf-to-jpg`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert PDF to JPG.");
            }

            const data = await response.json();
            if (data.files && data.files.length > 0) {
                // Handle the list of files
                data.files.forEach(file => {
                    const fileUrl = `${SERVER_NAME}/uploads/${file}`;
                    const fileName = generateJpgFileName(file);
                    // Automatically trigger file downloads
                    downloadFile(fileUrl, fileName);
                });
                showAlert("PDF converted to JPG successfully!", 'success');
            } else {
                showAlert("No JPG files found.", 'danger');
            }
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert to JPG';
        }
    }

    function generateJpgFileName(fileName) {
        // Generate a filename based on the current time to avoid conflicts
        const timestamp = new Date().getTime();
        const baseName = fileName.replace(/\.jpg$/i, ""); // Remove .jpg extension
        return `${baseName}_${timestamp}.jpg`;
    }

    function downloadFile(fileUrl, fileName) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = 
            `${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>`;
        alertPlaceholder.innerHTML = ''; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout (optional)
        setTimeout(() => {
            $(alertDiv).alert('close');
        }, 7000); // Remove alert after 5 seconds
    }

    // Dropbox Integration Functions
    function openDropboxPicker() {
        if (!DROPBOX_APP_KEY || DROPBOX_APP_KEY === 'YOUR_DROPBOX_APP_KEY') {
            showAlert('Dropbox API credentials not configured. Please contact the administrator.', 'warning');
            return;
        }

        // Wait for Dropbox to be available (it loads asynchronously)
        if (typeof Dropbox === 'undefined') {
            // Try waiting a bit for the script to load
            let attempts = 0;
            const checkDropbox = setInterval(() => {
                attempts++;
                if (typeof Dropbox !== 'undefined') {
                    clearInterval(checkDropbox);
                    openDropboxPicker();
                } else if (attempts > 10) {
                    clearInterval(checkDropbox);
                    showAlert('Dropbox Chooser not loaded. Please refresh the page.', 'danger');
                }
            }, 200);
            return;
        }

        // Update the app key if it's set in environment
        const dropboxScript = document.getElementById('dropboxjs');
        if (dropboxScript && DROPBOX_APP_KEY !== 'YOUR_DROPBOX_APP_KEY') {
            dropboxScript.setAttribute('data-app-key', DROPBOX_APP_KEY);
        }

        try {
            Dropbox.choose({
                success: function(files) {
                    if (files && files.length > 0) {
                        // For single file selection, only take the first file
                        showAlert('Loading file from Dropbox...', 'info');
                        loadFileFromDropbox(files[0]);
                    }
                },
                linkType: 'direct',
                multiselect: false,
                extensions: ['.pdf'],
                folderselect: false
            });
        } catch (error) {
            console.error('Error opening Dropbox picker:', error);
            showAlert('Failed to open Dropbox file picker. Please try again.', 'danger');
        }
    }

    async function loadFileFromDropbox(file) {
        try {
            // Download the file from Dropbox
            const response = await fetch(file.link, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            
            // Convert blob to File object
            const fileObj = new File([blob], file.name, { type: 'application/pdf' });

            // Handle single file selection (replace existing file if any)
            if (pdfFiles.length > 0) {
                pdfFiles = [fileObj];
            } else {
                pdfFiles.push(fileObj);
            }
            
            // Update the file list and UI
            updateFileList();
            updateUIState();
            
            showAlert('Successfully loaded file from Dropbox!', 'success');
        } catch (error) {
            console.error('Error loading file from Dropbox:', error);
            showAlert(`Failed to load "${file.name}" from Dropbox: ${error.message}`, 'danger');
        }
    }
});
