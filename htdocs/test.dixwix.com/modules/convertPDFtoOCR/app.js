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

    pdfInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    function handleDroppedFiles(files) {
        if (pdfFiles.length > 0) {
            showAlert("Only one PDF file can be selected at a time. Please remove the current file to select another.", 'warning');
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
        // Clear current items
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
            showAlert("Google Drive integration coming soon!", 'primary');
            // TODO: Implement Google Drive file picker
        });
    }

    if (initialDropboxBtn) {
        initialDropboxBtn.addEventListener("click", () => {
            showAlert("Dropbox integration coming soon!", 'primary');
            // TODO: Implement Dropbox file picker
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
            showAlert("Google Drive integration coming soon!", 'primary');
            // TODO: Implement Google Drive file picker
        });
    }

    if (dropboxBtn) {
        dropboxBtn.addEventListener("click", () => {
            showAlert("Dropbox integration coming soon!", 'primary');
            // TODO: Implement Dropbox file picker
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

    convertBtn.addEventListener("click", convertToOcr);

    async function convertToOcr() {
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
            const response = await fetch(`${SERVER_NAME}/api/convert-pdf-to-ocr`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert PDF to OCR.");
            }

            const blob = await response.blob();
            const fileName = generateOcrFileName(pdfFiles[0].name);
            downloadOcrFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Apply OCR';
        }
    }

    function generateOcrFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, "");
        const randomNumber = Math.floor(Math.random() * 9000) + 1000; // Generate a random number between 1000 and 9999
        return `${baseName}_ocr_${randomNumber}.pdf`;
    }

    function downloadOcrFile(ocrBlob, fileName) {
        const url = URL.createObjectURL(ocrBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF document converted to OCR successfully!", 'success');
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
