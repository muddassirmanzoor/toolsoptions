document.addEventListener("DOMContentLoaded", () => {
    const pdfInputRemove = document.getElementById("pdfInputRemove");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const pdfPreview = document.getElementById("pdfPreview").querySelector('.row');
    const removePagesBtn = document.getElementById("removePagesBtn");
    const selectAllBtn = document.getElementById("selectAllBtn");
    const deselectAllBtn = document.getElementById("deselectAllBtn");
    const totalPagesSpan = document.getElementById("totalPages");
    const pagesToRemoveSpan = document.getElementById("pagesToRemove");

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
    const fileInfo = document.getElementById("fileInfo");
    const fileName = document.getElementById("fileName");
    const removeFileBtn = document.getElementById("removeFileBtn");
    const fileContainer = document.querySelector('.col-lg-6.position-relative');

    let pdfFile = null;
    let pdfDoc = null;
    let totalPages = 0;
    let selectedPages = new Set(); // Set of page indices (0-based) to remove
    let lastSelectedIndex = null; // For shift-click range selection
    let googleApiInitialized = false;
    let googleAccessToken = null;

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || '';
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    // Dropbox API Configuration
    const DROPBOX_APP_KEY = window.env?.DROPBOX_APP_KEY || 'YOUR_DROPBOX_APP_KEY';

    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // File input handler
    pdfInputRemove.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            await handleFileSelection(files[0]);
        }
    });

    // Button event listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => pdfInputRemove.click());
    }
    if (initialGoogleDriveBtn) {
        initialGoogleDriveBtn.addEventListener("click", () => openGoogleDrivePicker());
    }
    if (initialDropboxBtn) {
        initialDropboxBtn.addEventListener("click", () => openDropboxPicker());
    }
    if (addBtn) {
        addBtn.addEventListener("click", () => pdfInputRemove.click());
    }
    if (computerBtn) {
        computerBtn.addEventListener("click", () => pdfInputRemove.click());
    }
    if (googleDriveBtn) {
        googleDriveBtn.addEventListener("click", () => openGoogleDrivePicker());
    }
    if (dropboxBtn) {
        dropboxBtn.addEventListener("click", () => openDropboxPicker());
    }
    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetFile();
        });
    }

    // Select All / Deselect All buttons
    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", () => {
            for (let i = 0; i < totalPages; i++) {
                selectedPages.add(i);
            }
            updatePageSelection();
            updateUI();
        });
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener("click", () => {
            selectedPages.clear();
            lastSelectedIndex = null;
            updatePageSelection();
            updateUI();
        });
    }

    // Remove Pages button
    if (removePagesBtn) {
        removePagesBtn.addEventListener("click", async () => {
            if (selectedPages.size === 0) {
                showAlert("Please select at least one page to remove.", 'warning');
                return;
            }
            await removeSelectedPages();
        });
    }

    // Drag and drop
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
            if (files.length > 0 && files[0].type === 'application/pdf') {
                handleFileSelection(files[0]);
            } else {
                showAlert("Please drop a valid PDF file.", 'warning');
            }
        });
    }

    async function handleFileSelection(file) {
        if (file.type !== 'application/pdf') {
            showAlert("Please select a valid PDF file.", 'warning');
            return;
        }

        pdfFile = file;
        selectedPages.clear();
        lastSelectedIndex = null;
        
        try {
            await loadPdfPreview(file);
            updateUIState();
            updateUI();
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Error loading PDF file. Please try again.", 'danger');
        }
    }

    async function loadPdfPreview(file) {
        try {
            // Load PDF using PDF.js
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDoc.numPages;

            // Render all pages
            await renderPdfPreview();
        } catch (error) {
            console.error("Error loading PDF:", error);
            throw error;
        }
    }

    async function renderPdfPreview() {
        pdfPreview.innerHTML = "";
        
        for (let i = 0; i < totalPages; i++) {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-3";
            
            const pdfPage = document.createElement("div");
            pdfPage.className = "pdf-page";
            pdfPage.dataset.pageIndex = i;
            
            // Render page thumbnail
            try {
                const page = await pdfDoc.getPage(i + 1);
                const viewport = page.getViewport({ scale: 0.5 });
                
                const canvas = document.createElement("canvas");
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                const img = document.createElement("img");
                img.src = canvas.toDataURL();
                img.alt = `Page ${i + 1}`;
                img.className = "img-fluid";
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                
                pdfPage.appendChild(img);
            } catch (error) {
                console.error(`Error rendering page ${i + 1}:`, error);
                // Fallback to placeholder
                const img = document.createElement("img");
                img.src = "../assests/pdf 2.png";
                img.alt = `Page ${i + 1}`;
                img.className = "img-fluid";
                pdfPage.appendChild(img);
            }
            
            const p = document.createElement("p");
            p.textContent = `Page ${i + 1}`;
            
            pdfPage.appendChild(p);
            
            // Click handler for page selection
            pdfPage.addEventListener("click", (e) => {
                if (e.shiftKey && lastSelectedIndex !== null) {
                    // Range selection
                    const start = Math.min(lastSelectedIndex, i);
                    const end = Math.max(lastSelectedIndex, i);
                    for (let j = start; j <= end; j++) {
                        selectedPages.add(j);
                    }
                } else {
                    // Toggle single page
                    if (selectedPages.has(i)) {
                        selectedPages.delete(i);
                    } else {
                        selectedPages.add(i);
                    }
                }
                lastSelectedIndex = i;
                updatePageSelection();
                updateUI();
            });
            
            col.appendChild(pdfPage);
            pdfPreview.appendChild(col);
        }
    }

    function updatePageSelection() {
        const pageElements = pdfPreview.querySelectorAll('.pdf-page');
        pageElements.forEach((pageEl, index) => {
            if (selectedPages.has(index)) {
                pageEl.classList.add('selected');
            } else {
                pageEl.classList.remove('selected');
            }
        });
    }

    function updateUI() {
        // Update statistics
        totalPagesSpan.textContent = totalPages;
        pagesToRemoveSpan.textContent = selectedPages.size;

        // Show/hide buttons
        if (totalPages > 0) {
            selectAllBtn.style.display = selectedPages.size < totalPages ? 'inline-block' : 'none';
            deselectAllBtn.style.display = selectedPages.size > 0 ? 'inline-block' : 'none';
            removePagesBtn.style.display = selectedPages.size > 0 ? 'block' : 'none';
        } else {
            selectAllBtn.style.display = 'none';
            deselectAllBtn.style.display = 'none';
            removePagesBtn.style.display = 'none';
        }
    }

    async function removeSelectedPages() {
        if (!pdfFile || selectedPages.size === 0) {
            return;
        }

        removePagesBtn.disabled = true;
        removePagesBtn.innerHTML = 'Removing pages... <span class="spinner-border spinner-border-sm" role="status"></span>';

        try {
            const { PDFDocument } = PDFLib;
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const totalPagesInDoc = pdfDoc.getPageCount();

            // Create new PDF with pages that are NOT in selectedPages
            const newPdfDoc = await PDFDocument.create();
            const pagesToKeep = [];

            for (let i = 0; i < totalPagesInDoc; i++) {
                if (!selectedPages.has(i)) {
                    pagesToKeep.push(i);
                }
            }

            if (pagesToKeep.length === 0) {
                showAlert("Cannot remove all pages. At least one page must remain.", 'warning');
                removePagesBtn.disabled = false;
                removePagesBtn.innerHTML = 'Remove Pages';
                return;
            }

            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToKeep);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const newPdfBytes = await newPdfDoc.save();
            const originalName = pdfFile.name.replace('.pdf', '');
            const newFileName = `${originalName}_pages_removed.pdf`;
            
            downloadPDF(newPdfBytes, newFileName);
            showAlert(`Successfully removed ${selectedPages.size} page(s)!`, 'success');
            
            // Reset selection
            selectedPages.clear();
            lastSelectedIndex = null;
            updatePageSelection();
            updateUI();
        } catch (error) {
            console.error("Error removing pages:", error);
            showAlert("An error occurred while removing pages. Please try again.", 'danger');
        } finally {
            removePagesBtn.disabled = false;
            removePagesBtn.innerHTML = 'Remove Pages';
        }
    }

    function downloadPDF(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 100);
    }

    function resetFile() {
        pdfFile = null;
        pdfDoc = null;
        totalPages = 0;
        selectedPages.clear();
        lastSelectedIndex = null;
        pdfPreview.innerHTML = "";
        updateUIState();
        updateUI();
        pdfInputRemove.value = "";
    }

    function updateUIState() {
        const hasFile = pdfFile !== null;
        
        if (initialUploadState) {
            initialUploadState.style.display = hasFile ? 'none' : 'flex';
        }
        if (fileSelectionButtons) {
            fileSelectionButtons.style.display = hasFile ? 'flex' : 'none';
        }
        if (fileInfo) {
            fileInfo.style.display = hasFile ? 'block' : 'none';
            if (hasFile && fileName && pdfFile) {
                fileName.textContent = pdfFile.name;
            }
        }
        if (fileContainer) {
            if (hasFile) {
                fileContainer.classList.add('has-files');
            } else {
                fileContainer.classList.remove('has-files');
            }
        }
    }

    function showAlert(message, type) {
        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = "alert";
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertPlaceholder.innerHTML = "";
        alertPlaceholder.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

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

                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                console.error('Error initializing token client:', error);
                showAlert('Failed to initialize Google authentication. Please refresh the page.', 'danger');
            }
        } else {
            console.warn('Google Identity Services not available, trying direct picker');
            if (typeof google !== 'undefined' && typeof google.picker !== 'undefined') {
                createPickerWithoutAuth();
            } else {
                showAlert('Google authentication not available. Please refresh the page.', 'danger');
            }
        }
    }

    function createPickerWithoutAuth() {
        showPicker();
    }

    function createPicker() {
        if (typeof google === 'undefined' || typeof google.picker === 'undefined') {
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
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/pdf');

        const pickerBuilder = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .addView(view)
            .setCallback(pickerCallback);

        if (googleAccessToken) {
            pickerBuilder.setOAuthToken(googleAccessToken);
        } else {
            pickerBuilder.setAppId(GOOGLE_APP_ID);
        }

        const picker = pickerBuilder.build();
        picker.setVisible(true);
    }

    function pickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            const docs = data.docs;
            
            if (data[google.picker.Response.TOKEN]) {
                googleAccessToken = data[google.picker.Response.TOKEN];
            }
            
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

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    googleAccessToken = null;
                    showAlert('Session expired. Please select files from Google Drive again.', 'warning');
                    return;
                }
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            const file = new File([blob], doc.name, { type: 'application/pdf' });

            await handleFileSelection(file);
            showAlert('Successfully loaded file from Google Drive!', 'success');
        } catch (error) {
            console.error('Error loading file from Google Drive:', error);
            showAlert(`Failed to load "${doc.name}" from Google Drive: ${error.message}`, 'danger');
        }
    }

    // Dropbox Integration Functions
    function openDropboxPicker() {
        if (!DROPBOX_APP_KEY || DROPBOX_APP_KEY === 'YOUR_DROPBOX_APP_KEY') {
            showAlert('Dropbox API credentials not configured. Please contact the administrator.', 'warning');
            return;
        }

        if (typeof Dropbox === 'undefined') {
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

        const dropboxScript = document.getElementById('dropboxjs');
        if (dropboxScript && DROPBOX_APP_KEY !== 'YOUR_DROPBOX_APP_KEY') {
            dropboxScript.setAttribute('data-app-key', DROPBOX_APP_KEY);
        }

        try {
            Dropbox.choose({
                success: function(files) {
                    if (files && files.length > 0) {
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
            const fileObj = new File([blob], file.name, { type: 'application/pdf' });

            await handleFileSelection(fileObj);
            showAlert('Successfully loaded file from Dropbox!', 'success');
        } catch (error) {
            console.error('Error loading file from Dropbox:', error);
            showAlert(`Failed to load "${file.name}" from Dropbox: ${error.message}`, 'danger');
        }
    }

    // Initialize
    updateUIState();
    updateUI();
    
    // Initialize Google API
    if (typeof gapi !== 'undefined') {
        initializeGoogleAPI();
    }
});
