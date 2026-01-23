function selectOption(option, val) {
  const options = document.querySelectorAll('.compression-option');
    options.forEach(opt => {
        opt.classList.remove('active');
        // Reset checkmark icons to outline
        const checkmarkIcon = opt.querySelector('.checkmark-icon');
        if (checkmarkIcon) {
            checkmarkIcon.innerHTML = `
                <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15.5" cy="15.5" r="15" stroke="#E4E4E4" fill="none"/>
                </svg>
            `;
        }
    });
    
  option.classList.add('active');
    
    // Set active checkmark to orange filled
    const activeCheckmarkIcon = option.querySelector('.checkmark-icon');
    if (activeCheckmarkIcon) {
        activeCheckmarkIcon.innerHTML = `
            <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15.5" cy="15.5" r="15.5" fill="#F56129"/>
                <path d="M9 15.5L13.5 20L22 11.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
    
    const compression = document.getElementById('compression');
    if (compression) {
  compression.value = val;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfFile");
    const fileList = document.getElementById("fileList");
    const compression = document.getElementById("compression");
    const compressBtn = document.getElementById("compressBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const optimizeSlider = document.getElementById("optimizeRange");
    
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
    const fileContainer = document.querySelector('.col-lg-6.position-relative');

    let pdfFiles = [];

    // Initialize slider fill
    if (optimizeSlider) {
        updateSliderFill(optimizeSlider);
        optimizeSlider.addEventListener("input", function() {
            updateSliderFill(this);
        });
    }

    function updateSliderFill(slider) {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, #5A26EF 0%, #5A26EF ${value}%, #D3D3D3 ${value}%, #D3D3D3 100%)`;
    }

    pdfInput.addEventListener("change", handleFileSelection);

    // Initial state button listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => pdfInput.click());
    }
    if (initialGoogleDriveBtn) {
        initialGoogleDriveBtn.addEventListener("click", () => {
            showAlert("Google Drive integration coming soon!", 'primary');
        });
    }
    if (initialDropboxBtn) {
        initialDropboxBtn.addEventListener("click", () => {
            showAlert("Dropbox integration coming soon!", 'primary');
        });
    }

    // File selection buttons (shown after file is selected)
    if (addBtn) {
        addBtn.addEventListener("click", () => pdfInput.click());
    }
    if (computerBtn) {
        computerBtn.addEventListener("click", () => pdfInput.click());
    }
    if (googleDriveBtn) {
        googleDriveBtn.addEventListener("click", () => {
            showAlert("Google Drive integration coming soon!", 'primary');
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
        // Remove existing thumbnails
        var pdfThumb = document.querySelectorAll('.pdf-thumbnail');
        pdfThumb.forEach(thumb => {
            thumb.remove();
        });
        
        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.classList.add("pdf-thumbnail");
            const imgItem = document.createElement("img");
            imgItem.src = 'assets/pdf-icon.svg';
            imgItem.alt = file.name;
            const delDiv = document.createElement("div");
            delDiv.classList.add("delete-icon");
            const delImg = document.createElement("img");
            delImg.src = '/assests/Group 85.png';
            delImg.alt = 'Delete Icon';
            delDiv.addEventListener("click", () => removeFile(index));
            divItem.appendChild(imgItem);
            divItem.appendChild(delDiv);
            delDiv.appendChild(delImg);
            fileList.appendChild(divItem);
        });
        
        // Update UI state
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

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }
    
    // Initialize UI state
    updateUIState();

    compressBtn.addEventListener("click", compressPDF);

    async function compressPDF() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to compress.", 'danger');
            return;
        }

        // Disable the compress button and show "Please Wait..." with spinner
        compressBtn.disabled = true;
        compressBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        // Get user ID from Laravel (if logged in)
        let userId = null;
        try {
            const laravelUrl = 'http://82.180.132.134:8000/admin';
            const userResponse = await fetch(`${laravelUrl}/api/current-user`, {
                method: 'GET',
                credentials: 'include', // Include cookies for session
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.authenticated && userData.user_id) {
                    userId = userData.user_id;
                    console.log('User authenticated:', userId);
                } else {
                    console.log('User not authenticated, using guest mode');
                }
            }
        } catch (error) {
            console.warn('Could not fetch user ID:', error);
            // Continue without user ID (guest mode)
        }

        const formData = new FormData();
        formData.append("pdfFile", pdfFiles[0]);
        formData.append("compression", compression.value);
        if (userId) {
            formData.append("user_id", userId);
        }

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/compress-pdf`, {
                method: "POST",
                body: formData
            });
            console.log(response);
            if (!response.ok) {
                throw new Error(response);
            }

            const blob = await response.blob();
            const fileName = generateCompressedFileName(pdfFiles[0].name);
            downloadCompressedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during compression: " + error.message, 'danger');
            console.error("Compression error:", error);
        } finally {
            // Re-enable the compress button and revert to original text
            compressBtn.disabled = false;
            compressBtn.innerHTML = 'Compress PDF';
        }
    }

    function generateCompressedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_compressed.pdf`;
    }

    function downloadCompressedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF compressed successfully!", 'success');
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        // alertDiv.innerHTML = 
        //     `${message}
        //     <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        //         <span aria-hidden="true">&times;</span>
        //     </button>`;
        alertDiv.innerHTML = `${message}`;
        alertPlaceholder.innerHTML = ''; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout (optional)
        setTimeout(() => {
            $(alertDiv).alert('close');
        }, 7000); // Remove alert after 5 seconds
    }
});
