document.addEventListener("DOMContentLoaded", () => {
    const excelInput = document.getElementById("excelInput");
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
    const fileInfo = document.getElementById("fileInfo");
    const fileName = document.getElementById("fileName");
    const removeFileBtn = document.getElementById("removeFileBtn");
    const fileContainer = document.querySelector('.col-md-6.position-relative');

    let excelFiles = [];

    excelInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        if (excelFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
                excelFiles.push(file);
                updateFileList();
                updateUIState();
            } else {
                showAlert("Only Excel files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        fileList.innerHTML = "";
        excelFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.classList.add("excel-thumbnail");

            const iconWrapper = document.createElement("div");
            iconWrapper.classList.add("excel-icon-wrapper");
            const img = document.createElement('img');
            img.src = "/assests/Vector.png";
            img.alt = file.name;
            img.classList.add("excel-icon-preview");
            iconWrapper.appendChild(img);

            const nameDiv = document.createElement("div");
            nameDiv.classList.add("excel-file-name");
            const displayName = file.name.length > 30 ? file.name.substring(0, 27) + "..." : file.name;
            nameDiv.textContent = displayName;
            nameDiv.title = file.name;

            divItem.appendChild(iconWrapper);
            divItem.appendChild(nameDiv);
            fileList.appendChild(divItem);
        });
    }

    function updateUIState() {
        const hasFiles = excelFiles.length > 0;
        
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
            if (fileName && excelFiles.length > 0) {
                fileName.textContent = excelFiles[0].name;
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

    // Initial state button listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => {
            excelInput.click();
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
            excelInput.click();
        });
    }
    if (computerBtn) {
        computerBtn.addEventListener("click", () => {
            excelInput.click();
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
    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", () => {
            removeFile(0);
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
                if (excelFiles.length > 0) {
                    showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
                    return;
                }
                files.forEach(file => {
                    if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
                        excelFiles.push(file);
                        updateFileList();
                        updateUIState();
                    } else {
                        showAlert("Only Excel files are allowed.", 'danger');
                    }
                });
            }
        });
    }

    function removeFile(index) {
        if (index >= 0 && index < excelFiles.length) {
            excelFiles.splice(index, 1);
            updateFileList();
            updateUIState();
        }
    }
    
    // Initialize UI state
    updateUIState();

    convertBtn.addEventListener("click", convertToPdf);

    async function convertToPdf() {
        if (excelFiles.length === 0) {
            showAlert("Please add an Excel file to convert.", 'danger');
            return;
        }

        // Disable the convert button and show "Please Wait..." with spinner
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("excel", excelFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-excel-to-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert Excel to PDF.");
            }

            const blob = await response.blob();
            const fileName = generatePdfFileName(excelFiles[0].name);
            downloadPdfFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert to PDF';
        }
    }

    function generatePdfFileName(excelFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = excelFileName.replace(/\.xlsx$|\.xls$/i, ""); // Remove .xlsx or .xls extension
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
        showAlert("Excel converted to PDF successfully!", 'success');
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
