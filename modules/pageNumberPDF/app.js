document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const addPageNumberBtn = document.getElementById("addPageNumberBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const transparency = document.getElementById("transparency");
    const pageSize = document.getElementById("pageSize");
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
    const fileContainer = document.querySelector('.col-lg-6.position-relative');
    let pdfFiles = [];
    let selectedPosition = "middle-center"; // default matches UI
    let googleApiInitialized = false;
    let googleAccessToken = null;
    
    // New feature state variables
    let pageType = "single"; // "single" or "facing"
    let pageMargin = "medium"; // "small", "medium", "large"
    let startPage = 1;
    let endPage = 1;
    let totalPages = 0;
    let textTemplate = ""; // empty means just page number
    let customText = "";
    let fontFamily = "Helvetica";
    let textBold = false;
    let textItalic = false;
    let textUnderline = false;
    let textColor = "#000000";

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || '102744766704-ed1ch4pgc1j33hm831v41jfr6lgn021o.apps.googleusercontent.com';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || '';
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    if (pdfInput) {
        pdfInput.addEventListener("change", handleFileSelection);
    }
    if (addPageNumberBtn) {
        addPageNumberBtn.addEventListener("click", addPageNumber);
    }

    // Initialize Google API
    initializeGoogleAPI();
    
    // Initialize new feature handlers
    initializePageTypeSelection();
    initializeMarginSelection();
    initializePageRangeInputs();
    initializeTextInput();
    initializeTextFormat();
    initializeSizeTransparency();

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

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    async function handleDroppedFiles(files) {
        if (pdfFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        for (const file of files) {
            if (file.type === "application/pdf") {
                pdfFiles.push(file);
                // Get page count
                try {
                    totalPages = await getPDFPageCount(file);
                    updatePageCountDisplay();
                    // Set default end page to total pages
                    const endPageInput = document.getElementById("endPage");
                    if (endPageInput) {
                        endPageInput.value = totalPages;
                        endPageInput.max = totalPages;
                        endPage = totalPages;
                    }
                    const startPageInput = document.getElementById("startPage");
                    if (startPageInput) {
                        startPageInput.max = totalPages;
                        startPageInput.value = 1;
                        startPage = 1;
                    }
                } catch (error) {
                    console.error("Error getting page count:", error);
                    totalPages = 1;
                    endPage = 1;
                }
                updateFileList();
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        }
    }
    
    function updatePageCountDisplay() {
        const totalPagesDisplay = document.getElementById("totalPagesDisplay");
        if (totalPagesDisplay) {
            totalPagesDisplay.querySelector("span").textContent = totalPages;
        }
        // Update text preview when page count changes
        const textPreview = document.getElementById("textPreview");
        if (textPreview) {
            const textTemplateSelect = document.getElementById("textTemplate");
            const customTextInput = document.getElementById("customText");
            let previewText = "";
            if (customText && customTextInput && customTextInput.style.display !== "none") {
                previewText = customText.replace("{n}", "3").replace("{t}", totalPages || "10");
            } else if (textTemplate) {
                previewText = textTemplate.replace("{n}", "3").replace("{t}", totalPages || "10");
            } else {
                previewText = "3";
            }
            textPreview.textContent = `Preview: ${previewText}`;
        }
    }

    function updateFileList() {
        if (!fileList) return;

        fileList.innerHTML = "";

        if (pdfFiles.length === 0) {
            updateUIState();
            return;
        }

        pdfFiles.forEach((file, index) => {
            const thumb = document.createElement("div");
            thumb.className = "pdf-thumbnail";

            const img = document.createElement("img");
            // Use the same generic PDF icon used in the grid
            img.src = "../compressPDF/assets/pdf-icon.svg";
            img.alt = file.name;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-icon";
            deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            deleteBtn.addEventListener("click", () => removeFile(index));

            thumb.appendChild(img);
            thumb.appendChild(deleteBtn);
            fileList.appendChild(thumb);
        });

        // Update file count badge and UI state
        updateFileCountBadge();
        updateUIState();
    }

    function updateFileCountBadge() {
        if (!fileCountBadge) return;
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

    // Initialize UI state
    updateUIState();

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        totalPages = 0;
        updatePageCountDisplay();
        updateFileList();
    }

    function addPageNumber() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to add page numbers.", 'danger');
            return;
        }

        if (!selectedPosition) {
            showAlert("Please select a position for the page number.", 'danger');
            return;
        }
        
        // Validate page range
        if (startPage < 1 || endPage < 1 || startPage > endPage || endPage > totalPages) {
            showAlert("Please enter a valid page range.", 'danger');
            return;
        }

        if (!addPageNumberBtn) return;

        addPageNumberBtn.disabled = true;
        addPageNumberBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
        formData.append("position", selectedPosition);
        formData.append("transparency", transparency ? transparency.value : "50");
        formData.append("pageSize", pageSize ? pageSize.value : "12");
        
        // New parameters - ensure endPage is set to totalPages if not specified
        const finalEndPage = endPage > 0 ? endPage : totalPages;
        const finalStartPage = startPage > 0 ? startPage : 1;
        
        formData.append("pageType", pageType);
        formData.append("pageMargin", pageMargin);
        formData.append("startPage", finalStartPage.toString());
        formData.append("endPage", finalEndPage.toString());
        formData.append("textTemplate", textTemplate || "");
        formData.append("customText", customText || "");
        formData.append("fontFamily", fontFamily);
        formData.append("textBold", textBold ? "true" : "false");
        formData.append("textItalic", textItalic ? "true" : "false");
        formData.append("textUnderline", textUnderline ? "true" : "false");
        formData.append("textColor", textColor || "#000000");
        formData.append("totalPages", totalPages.toString());
        
        // Debug: Log what we're sending
        console.log("Sending page number request:", {
            position: selectedPosition,
            pageType: pageType,
            startPage: finalStartPage,
            endPage: finalEndPage,
            textTemplate: textTemplate,
            customText: customText,
            fontFamily: fontFamily,
            textBold: textBold,
            textItalic: textItalic,
            textUnderline: textUnderline,
            textColor: textColor,
            totalPages: totalPages
        });

        const SERVER_NAME = window.env && window.env.PUBLIC_SERVER_URL ? window.env.PUBLIC_SERVER_URL : "";

        fetch(`${SERVER_NAME}/api/add-page-number`, {
            method: "POST",
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to add page number.");
                }
                return response.blob();
            })
            .then(blob => {
                const fileName = generatePageNumberedFileName(pdfFiles[0].name);
                downloadPageNumberedFile(blob, fileName);
            })
            .catch(error => {
                showAlert("An error occurred during page numbering: " + error.message, 'danger');
            })
            .finally(() => {
                addPageNumberBtn.disabled = false;
                addPageNumberBtn.innerHTML = 'Add Page Numbers';
            });
    }

    function generatePageNumberedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, "");
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        return `${baseName}_page_numbered_${randomNumber}.pdf`;
    }

    function downloadPageNumberedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Page number added successfully!", 'success');
    }

    function showAlert(message, type) {
        if (!alertPlaceholder) return;

        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", `alert-${type}`, "alert-dismissible", "fade", "show");
        alertDiv.setAttribute("role", "alert");
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertPlaceholder.innerHTML = "";
        alertPlaceholder.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.classList.remove("show");
            alertDiv.addEventListener("transitionend", () => alertDiv.remove(), { once: true });
        }, 5000);
    }

    const positionBoxes = document.querySelectorAll(".position-box");
    positionBoxes.forEach(box => {
        box.addEventListener("click", function () {
            positionBoxes.forEach(box => box.classList.remove("active"));
            this.classList.add("active");
            selectedPosition = this.getAttribute("data-position");
        });
    });
    
    // ===================================
    // New Feature Handlers
    // ===================================
    
    function initializePageTypeSelection() {
        const pageTypeSingle = document.getElementById("pageTypeSingle");
        const pageTypeFacing = document.getElementById("pageTypeFacing");
        
        if (pageTypeSingle) {
            pageTypeSingle.addEventListener("click", () => {
                pageType = "single";
                pageTypeSingle.classList.add("active");
                pageTypeFacing.classList.remove("active");
                // When single page is selected, set end page to total pages
                if (totalPages > 0) {
                    const endPageInput = document.getElementById("endPage");
                    if (endPageInput) {
                        endPage = totalPages;
                        endPageInput.value = totalPages;
                    }
                }
            });
        }
        
        if (pageTypeFacing) {
            pageTypeFacing.addEventListener("click", () => {
                pageType = "facing";
                pageTypeFacing.classList.add("active");
                pageTypeSingle.classList.remove("active");
                // When facing page is selected, set end page to total pages
                if (totalPages > 0) {
                    const endPageInput = document.getElementById("endPage");
                    if (endPageInput) {
                        endPage = totalPages;
                        endPageInput.value = totalPages;
                    }
                }
            });
        }
    }
    
    function initializeMarginSelection() {
        const marginSmall = document.getElementById("marginSmall");
        const marginMedium = document.getElementById("marginMedium");
        const marginLarge = document.getElementById("marginLarge");
        
        if (marginSmall) {
            marginSmall.addEventListener("click", () => {
                pageMargin = "small";
                marginSmall.classList.add("margin-option-selected");
                marginMedium.classList.remove("margin-option-selected");
                marginLarge.classList.remove("margin-option-selected");
            });
        }
        
        if (marginMedium) {
            marginMedium.addEventListener("click", () => {
                pageMargin = "medium";
                marginMedium.classList.add("margin-option-selected");
                marginSmall.classList.remove("margin-option-selected");
                marginLarge.classList.remove("margin-option-selected");
            });
        }
        
        if (marginLarge) {
            marginLarge.addEventListener("click", () => {
                pageMargin = "large";
                marginLarge.classList.add("margin-option-selected");
                marginSmall.classList.remove("margin-option-selected");
                marginMedium.classList.remove("margin-option-selected");
            });
        }
    }
    
    function initializePageRangeInputs() {
        const startPageInput = document.getElementById("startPage");
        const endPageInput = document.getElementById("endPage");
        
        if (startPageInput) {
            startPageInput.addEventListener("change", (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                    startPage = value;
                    if (endPageInput && value > endPage) {
                        endPage = value;
                        endPageInput.value = value;
                    }
                    // Ensure start page doesn't exceed total pages
                    if (totalPages > 0 && value > totalPages) {
                        startPage = totalPages;
                        startPageInput.value = totalPages;
                    }
                }
            });
            
            startPageInput.addEventListener("input", (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                    startPage = value;
                }
            });
        }
        
        if (endPageInput) {
            endPageInput.addEventListener("change", (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                    endPage = value;
                    if (startPageInput && value < startPage) {
                        startPage = value;
                        startPageInput.value = value;
                    }
                    // Ensure end page doesn't exceed total pages
                    if (totalPages > 0 && value > totalPages) {
                        endPage = totalPages;
                        endPageInput.value = totalPages;
                    }
                }
            });
            
            endPageInput.addEventListener("input", (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                    endPage = value;
                }
            });
        }
    }
    
    function initializeTextInput() {
        const textTemplateSelect = document.getElementById("textTemplate");
        const customTextInput = document.getElementById("customText");
        const textPreview = document.getElementById("textPreview");
        
        function updatePreview() {
            if (!textPreview) return;
            let previewText = "";
            if (customText && customTextInput && customTextInput.style.display !== "none") {
                previewText = customText.replace("{n}", "3").replace("{t}", totalPages || "10");
            } else if (textTemplate) {
                previewText = textTemplate.replace("{n}", "3").replace("{t}", totalPages || "10");
            } else {
                previewText = "3"; // Just page number
            }
            textPreview.textContent = `Preview: ${previewText}`;
        }
        
        if (textTemplateSelect) {
            textTemplateSelect.addEventListener("change", (e) => {
                const value = e.target.value;
                if (value === "custom") {
                    if (customTextInput) {
                        customTextInput.style.display = "block";
                        customTextInput.focus();
                    }
                    textTemplate = "";
                } else {
                    if (customTextInput) {
                        customTextInput.style.display = "none";
                        customTextInput.value = "";
                    }
                    textTemplate = value;
                    customText = "";
                }
                updatePreview();
            });
        }
        
        if (customTextInput) {
            customTextInput.addEventListener("input", (e) => {
                customText = e.target.value;
                updatePreview();
            });
        }
        
        // Initial preview
        updatePreview();
    }
    
    function initializeTextFormat() {
        const fontFamilySelect = document.getElementById("fontFamily");
        const formatBold = document.getElementById("formatBold");
        const formatItalic = document.getElementById("formatItalic");
        const formatUnderline = document.getElementById("formatUnderline");
        const textColorInput = document.getElementById("textColor");
        
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener("change", (e) => {
                fontFamily = e.target.value;
            });
        }
        
        if (formatBold) {
            formatBold.addEventListener("click", () => {
                textBold = !textBold;
                formatBold.classList.toggle("active", textBold);
            });
        }
        
        if (formatItalic) {
            formatItalic.addEventListener("click", () => {
                textItalic = !textItalic;
                formatItalic.classList.toggle("active", textItalic);
            });
        }
        
        if (formatUnderline) {
            formatUnderline.addEventListener("click", () => {
                textUnderline = !textUnderline;
                formatUnderline.classList.toggle("active", textUnderline);
            });
        }
        
        if (textColorInput) {
            textColorInput.addEventListener("change", (e) => {
                textColor = e.target.value;
            });
        }
    }
    
    function initializeSizeTransparency() {
        const sizeInput = document.getElementById("pageSize");
        const transparencyInput = document.getElementById("transparency");
        const sizeValue = document.getElementById("sizeValue");
        const transparencyValue = document.getElementById("transparencyValue");
        
        if (sizeInput && sizeValue) {
            sizeInput.addEventListener("input", (e) => {
                sizeValue.textContent = `${e.target.value}pt`;
            });
            sizeValue.textContent = `${sizeInput.value}pt`;
        }
        
        if (transparencyInput && transparencyValue) {
            transparencyInput.addEventListener("input", (e) => {
                transparencyValue.textContent = `${e.target.value}%`;
            });
            transparencyValue.textContent = `${transparencyInput.value}%`;
        }
    }
    
    // Function to get PDF page count
    async function getPDFPageCount(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Simple PDF page count extraction
                // Look for /Count pattern in PDF
                const text = new TextDecoder('latin1').decode(uint8Array);
                const countMatch = text.match(/\/Count\s+(\d+)/);
                if (countMatch) {
                    resolve(parseInt(countMatch[1]));
                } else {
                    // Fallback: count /Page objects
                    const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
                    resolve(pageMatches ? pageMatches.length : 1);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
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
            
            // For pageNumberPDF, only allow one file
            if (docs.length > 1) {
                showAlert("Only one PDF file can be selected. Please select a single file.", 'warning');
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
            if (pdfFiles.length > 0) {
                showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
                return;
            }

            // Add to pdfFiles array
            pdfFiles.push(file);
            
            // Get page count
            getPDFPageCount(file).then(count => {
                totalPages = count;
                updatePageCountDisplay();
                // Set default end page to total pages
                const endPageInput = document.getElementById("endPage");
                if (endPageInput) {
                    endPageInput.value = totalPages;
                    endPageInput.max = totalPages;
                    endPage = totalPages;
                }
                const startPageInput = document.getElementById("startPage");
                if (startPageInput) {
                    startPageInput.max = totalPages;
                }
            }).catch(error => {
                console.error("Error getting page count:", error);
                totalPages = 1;
            });
            
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
