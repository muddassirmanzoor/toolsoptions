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
            // Hide initial state, show file selection buttons
            if (initialUploadState) {
                initialUploadState.style.display = 'none';
            }
            if (fileSelectionButtons) {
                fileSelectionButtons.style.display = 'flex';
                fileSelectionButtons.style.visibility = 'visible';
                fileSelectionButtons.style.opacity = '1';
            }
            if (fileContainer) {
                fileContainer.classList.add('has-files');
            }
        } else {
            // Show initial state, hide file selection buttons
            if (initialUploadState) {
                initialUploadState.style.display = 'flex';
            }
            if (fileSelectionButtons) {
                fileSelectionButtons.style.display = 'none';
            }
            if (fileContainer) {
                fileContainer.classList.remove('has-files');
            }
        }
    }

    // Initial state button listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => {
            pdfInput.click();
        });
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

    // File selection buttons listeners
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            pdfInput.click();
        });
    }
    if (computerBtn) {
        computerBtn.addEventListener("click", () => {
            pdfInput.click();
        });
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
            initialUploadState.classList.add('drag-over');
        });

        initialUploadState.addEventListener('dragleave', () => {
            initialUploadState.classList.remove('drag-over');
        });

        initialUploadState.addEventListener('drop', (e) => {
            e.preventDefault();
            initialUploadState.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
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
        });
    }

    function removeFile(index) {
        if (index >= 0 && index < pdfFiles.length) {
            pdfFiles.splice(index, 1);
            updateFileList();
            updateUIState();
        }
    }
    
    // Initialize UI state
    updateUIState();

    convertBtn.addEventListener("click", convertToExcel);

    function generateExcelFileName(pdfFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove .pdf extension
        return `${baseName}_${randomNumber}.xlsx`;
    }

    async function convertToExcel() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to convert.", 'danger');
            return;
        }
    
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
    
        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-pdf-to-excel`, {
                method: "POST",
                body: formData
            });
    
            if (!response.ok) {
                throw new Error("Failed to convert PDF to Excel.");
            }
    
            const blob = await response.blob();
            const fileName = generateExcelFileName(pdfFiles[0].name);
            downloadExcelFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert to Excel';
        }
    }
    
    function downloadExcelFile(excelBlob, fileName) {
        const url = URL.createObjectURL(excelBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up URL object
        showAlert("PDF converted to Excel successfully!", 'success');
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
