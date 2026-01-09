document.addEventListener("DOMContentLoaded", () => {
    const pptInput = document.getElementById("pptInput");
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
    const pptDropdownContainer = document.getElementById("pptDropdownContainer");
    const pptInfoAlert = document.getElementById("pptInfoAlert");

    let pptFiles = [];

    // Initial state button listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => pptInput.click());
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

    // File selection buttons (shown after files are selected)
    if (addBtn) {
        addBtn.addEventListener("click", () => pptInput.click());
    }
    if (computerBtn) {
        computerBtn.addEventListener("click", () => pptInput.click());
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

    pptInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    function handleDroppedFiles(files) {
        if (pptFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            if (extension === 'ppt' || extension === 'pptx') {
                pptFiles.push(file);
                updateFileList();
            } else {
                showAlert("Only PPT or PPTX files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        fileList.innerHTML = "";

        if (pptFiles.length === 0) {
            updateUIState();
            return;
        }

        pptFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'file-item';
            const divScnd = document.createElement("div");
            divScnd.className = 'file-icon';
            const img = document.createElement('img');
            img.src = "/assests/Group 147.png";
            img.alt = file.name;

            // Add remove button
            const removeBtn = document.createElement("button");
            removeBtn.className = 'remove-file-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove file';
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFile(index);
            });

            const nameDiv = document.createElement("div");
            nameDiv.classList.add("pdf-file-name");
            nameDiv.textContent = file.name;

            divScnd.appendChild(removeBtn);
            divScnd.appendChild(img);
            divItem.appendChild(divScnd);
            divItem.appendChild(nameDiv);
            fileList.appendChild(divItem);
        });

        updateUIState();
        updateDropdowns();
    }

    function updateUIState() {
        const hasFiles = pptFiles.length > 0;
        
        if (hasFiles) {
            // Hide initial state, show file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'none';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'flex';
            if (fileContainer) fileContainer.classList.add('has-files');
            // Show dropdowns and hide info alert on the right side
            if (pptDropdownContainer) pptDropdownContainer.style.display = 'block';
            if (pptInfoAlert) pptInfoAlert.style.display = 'none';
        } else {
            // Show initial state, hide file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'flex';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'none';
            if (fileContainer) fileContainer.classList.remove('has-files');
            // Hide dropdowns and show info alert when no files selected
            if (pptDropdownContainer) pptDropdownContainer.style.display = 'none';
            if (pptInfoAlert) pptInfoAlert.style.display = 'block';
        }
    }

    // Initialize UI state
    updateUIState();

    function removeFile(index) {
        pptFiles.splice(index, 1);
        updateFileList();
    }

    function updateDropdowns() {
        if (!pptDropdownContainer) return;
        const selects = pptDropdownContainer.querySelectorAll('select');

        selects.forEach((select) => {
            // Clear existing options
            while (select.firstChild) {
                select.removeChild(select.firstChild);
            }

            if (pptFiles.length === 0) {
                const placeholder = document.createElement('option');
                placeholder.textContent = 'No PPT file selected';
                placeholder.value = '';
                select.appendChild(placeholder);
                return;
            }

            // Populate options based on currently selected PPT files
            pptFiles.forEach((file, index) => {
                const option = document.createElement('option');
                option.value = index;
                // Show the expected PDF name for clarity
                option.textContent = generatePdfFileName(file.name);
                select.appendChild(option);
            });
        });
    }

    convertBtn.addEventListener("click", convertToPDF);

    async function convertToPDF() {
        if (pptFiles.length === 0) {
            showAlert("Please add a PPT or PPTX file to convert.", 'danger');
            return;
        }

        // Disable the convert button and show "Please Wait..." with spinner
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("ppt", pptFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-ppt-to-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert PPT/PPTX to PDF.");
            }

            const blob = await response.blob();
            const fileName = generatePdfFileName(pptFiles[0].name);
            downloadPdfFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Merge & Convert To PDF';
        }
    }

    function generatePdfFileName(pptFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pptFileName.replace(/\.(ppt|pptx)$/i, ""); // Remove the .ppt or .pptx extension
        return `${baseName}_${randomNumber}.pdf`;
    }

    function downloadPdfFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PPT/PPTX converted to PDF successfully!", 'success');
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
