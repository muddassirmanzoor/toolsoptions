document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const convertBtn = document.getElementById("convertBtn");
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
    const fileContainer = document.querySelector('.col-md-6.position-relative');

    let pdfFiles = [];
    let googleApiInitialized = false;
    let googleAccessToken = null;

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || '102744766704-ed1ch4pgc1j33hm831v41jfr6lgn021o.apps.googleusercontent.com';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || '';
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    // Initialize Google API
    initializeGoogleAPI();

    // Initial state button listeners
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
            showAlert("Dropbox integration coming soon!", 'primary');
        });
    }

    // File selection buttons (shown after files are selected)
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
            showAlert("Dropbox integration coming soon!", 'primary');
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

    // File input change handler
    pdfInput.addEventListener("change", handleFileSelection);

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
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        // Clear any previous items
        fileList.innerHTML = "";

        if (pdfFiles.length === 0) {
            updateUIState();
            return;
        }

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
            delDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFile(index);
            });

            divItem.appendChild(iconWrapper);
            divItem.appendChild(nameDiv);
            divItem.appendChild(delDiv);

            fileList.appendChild(divItem);
        });
        
        updateUIState();
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

    // Initialize UI state
    updateUIState();

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }

    convertBtn.addEventListener("click", convertToPowerPoint);

    async function convertToPowerPoint() {
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
            const response = await fetch(`${SERVER_NAME}/api/convert-pdf-to-pptx`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert PDF to PowerPoint.");
            }

            const blob = await response.blob();
            const fileName = generatePptxFileName(pdfFiles[0].name);
            downloadPptxFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert To PowerPoint';
        }
    }

    function generatePptxFileName(pdfFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_${randomNumber}.pptx`;
    }

    function downloadPptxFile(pptxBlob, fileName) {
        const url = URL.createObjectURL(pptxBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF converted to PowerPoint successfully!", 'success');
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
            
            // Only allow one file for PDF to PPT conversion
            if (docs.length > 1) {
                showAlert('Only one file can be selected. Please select a single PDF file.', 'warning');
                return;
            }
            
            if (pdfFiles.length > 0) {
                showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
                return;
            }
            
            showAlert(`Loading file from Google Drive...`, 'info');
            
            // Load the selected file
            loadFileFromGoogleDrive(docs[0], true);
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
                showAlert(`Successfully loaded file from Google Drive!`, 'success');
            }
        } catch (error) {
            console.error('Error loading file from Google Drive:', error);
            showAlert(`Failed to load "${doc.name}" from Google Drive: ${error.message}`, 'danger');
        }
    }
});
