document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const repairBtn = document.getElementById("repairBtn");
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
    const fileContainer = document.querySelector('.col-lg-6.position-relative');

    let pdfFiles = [];

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
        
        fileList.innerHTML = "";
        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.classList.add("pdf-thumbnail");
            
            const imgItem = document.createElement("img");
            imgItem.src = '/assests/pdf 2.png';
            imgItem.alt = file.name;
            imgItem.classList.add("pdf-icon-preview");
            
            const fileName = document.createElement("div");
            fileName.classList.add("pdf-file-name");
            fileName.textContent = file.name;
            
            const delDiv = document.createElement("div");
            delDiv.classList.add("delete-icon");
            const delImg = document.createElement("img");
            delImg.src = '/assests/Group 85.png';
            delImg.alt = 'Delete Icon';
            delDiv.addEventListener("click", () => removeFile(index));
            delDiv.appendChild(delImg);
            
            divItem.appendChild(imgItem);
            divItem.appendChild(fileName);
            divItem.appendChild(delDiv);
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

    if (repairBtn) {
    repairBtn.addEventListener("click", repairPDF);
    }

    async function repairPDF() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to repair.", 'danger');
            return;
        }

        showAlert("We will try to repair your PDF.", 'info');

        // Disable the repair button and show "Please Wait..." with spinner
        if (repairBtn) {
        repairBtn.disabled = true;
            const originalText = repairBtn.innerHTML;
        repairBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/repair-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to repair PDF. Also We can't process damaged or corrupted files");
            }

            const blob = await response.blob();
            const fileName = generateRepairedFileName(pdfFiles[0].name);
            downloadRepairedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during repair: " + error.message, 'danger');
            console.error("Repair error:", error);
        } finally {
            // Re-enable the repair button and revert to original text
                if (repairBtn) {
            repairBtn.disabled = false;
                    repairBtn.innerHTML = originalText || 'Repair PDF';
                }
            }
        }
    }

    function generateRepairedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_repaired.pdf`;
    }

    function downloadRepairedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert("PDF repaired successfully!", 'success');
    }

    function showAlert(message, type) {
        // Clear any existing alerts
        if (alertPlaceholder) {
            alertPlaceholder.innerHTML = '';
            
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = 
            `${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        alertPlaceholder.appendChild(alertDiv);

            // Automatically remove the alert after a timeout
        setTimeout(() => {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }, 7000);
        }
    }
});
