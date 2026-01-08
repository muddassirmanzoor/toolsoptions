document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const protectBtn = document.getElementById("protectBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const passwordInput = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    
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
    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", () => {
            removeFile(0);
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
            if (files.length > 0 && files[0].type === 'application/pdf') {
                handleDroppedFiles(files);
            }
        });
    }

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
        fileList.innerHTML = "";
        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'file-item';
            const divScnd = document.createElement("div");
            divScnd.className = 'file-icon';
            const imgItem = document.createElement("img");
            imgItem.src = '/assests/pdf 2.png';
            imgItem.alt = file.name;
            const namePar = document.createElement("p");
            namePar.classList.add("file-name");
            namePar.textContent = file.name;

            divScnd.appendChild(imgItem);
            divItem.appendChild(divScnd);
            divItem.appendChild(namePar);
            fileList.appendChild(divItem);
        });
        
        // Update UI state (this will show/hide appropriate elements)
        updateUIState();
    }

    function updateUIState() {
        const hasFiles = pdfFiles.length > 0;
        
        if (hasFiles) {
            // Hide initial state, show file selection buttons and file info
            if (initialUploadState) {
                initialUploadState.style.display = 'none';
            }
            if (fileSelectionButtons) {
                fileSelectionButtons.style.display = 'flex';
                fileSelectionButtons.style.visibility = 'visible';
                fileSelectionButtons.style.opacity = '1';
            }
            if (fileInfo) {
                fileInfo.style.display = 'block';
            }
            if (fileContainer) {
                fileContainer.classList.add('has-files');
            }
            if (fileName && pdfFiles.length > 0) {
                fileName.textContent = pdfFiles[0].name;
            }
        } else {
            // Show initial state, hide file selection buttons and file info
            if (initialUploadState) {
                initialUploadState.style.display = 'flex';
            }
            if (fileSelectionButtons) {
                fileSelectionButtons.style.display = 'none';
            }
            if (fileInfo) {
                fileInfo.style.display = 'none';
            }
            if (fileContainer) {
                fileContainer.classList.remove('has-files');
            }
        }
    }

    function removeFile(index) {
        if (index >= 0 && index < pdfFiles.length) {
            pdfFiles.splice(index, 1);
            updateFileList();
            // Clear password fields when file is removed
            if (passwordInput) passwordInput.value = '';
            if (confirmPassword) confirmPassword.value = '';
        }
    }
    
    // Initialize UI state
    updateUIState();

    protectBtn.addEventListener("click", protectPDF);

    async function protectPDF() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to protect.", 'danger');
            return;
        }

        const password = passwordInput.value.trim();
        if (!password) {
            showAlert("Please enter a password to protect the PDF.", 'danger');
            return;
        }
        const conPassword = confirmPassword.value.trim();
        if (conPassword !== password) {
            showAlert("Password and confirm password should be the same", 'danger');
            return;
        }

        // Disable the protect button and show "Please Wait..." with spinner
        protectBtn.disabled = true;
        protectBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
        formData.append("password", password);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/protect-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to protect PDF.");
            }

            const blob = await response.blob();
            const fileName = generateProtectedFileName(pdfFiles[0].name);
            downloadProtectedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during protection: " + error.message, 'danger');
            console.error("Protection error:", error);
        } finally {
            // Re-enable the protect button and revert to original text
            protectBtn.disabled = false;
            protectBtn.innerHTML = 'Protect PDF';
        }
    }

    function generateProtectedFileName(pdfFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_protected_${randomNumber}.pdf`;
    }

    function downloadProtectedFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF protected successfully!", 'success');
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
});
