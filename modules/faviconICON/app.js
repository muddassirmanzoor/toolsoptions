function selectIconOption(option, value) {
    const options = document.querySelectorAll('.icon-option');
    options.forEach(opt => {
        opt.classList.remove('active');
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
    
    // Update the hidden radio button
    const radio = option.querySelector(`input[value="${value}"]`);
    if (radio) {
        radio.checked = true;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const imageInput = document.getElementById("imageInput");
    const fileList = document.getElementById("fileList");
    const generateIconsBtn = document.getElementById("generateIconsBtn");
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

    let imageFiles = [];

    const allowedFormats = ["image/png", "image/jpeg", "image/jpg", "image/x-icon", "image/gif", "image/webp"];

    imageInput.addEventListener("change", handleFileSelection);

    // Initial state button listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => imageInput.click());
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
        addBtn.addEventListener("click", () => imageInput.click());
    }
    if (computerBtn) {
        computerBtn.addEventListener("click", () => imageInput.click());
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
        if (imageFiles.length > 0) {
            showAlert("Only one image file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            if (allowedFormats.includes(file.type)) {
                imageFiles.push(file);
                displayImageThumbnail(file);
            } else {
                showAlert("Only PNG, JPEG, ICO, GIF, or WEBP image files are allowed.", 'danger');
            }
        });
    }

    function displayImageThumbnail(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Clear the fileList element before adding the new thumbnail
            fileList.innerHTML = "";

            const thumbnailContainer = document.createElement("div");
            thumbnailContainer.classList.add("image-thumbnail");

            const img = document.createElement("img");
            img.src = e.target.result;
            img.alt = file.name;

            const removeBtn = document.createElement("button");
            removeBtn.classList.add("delete-icon");
            removeBtn.innerHTML = "×";
            removeBtn.addEventListener("click", () => removeFile());

            thumbnailContainer.appendChild(img);
            thumbnailContainer.appendChild(removeBtn);
            fileList.appendChild(thumbnailContainer);
            
            // Update UI state
            updateUIState();
        };
        reader.readAsDataURL(file);
    }

    function updateUIState() {
        const hasFiles = imageFiles.length > 0;
        
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

    function removeFile() {
        imageFiles = [];
        fileList.innerHTML = "";
        updateUIState();
    }

    // Initialize UI state
    updateUIState();

    // Set first option as active on load
    const firstOption = document.querySelector('.icon-option');
    if (firstOption) {
        selectIconOption(firstOption, 'web');
    }

    if (generateIconsBtn) {
        generateIconsBtn.addEventListener("click", generateIcons);
    }

    async function generateIcons() {
        if (imageFiles.length === 0) {
            showAlert("Please add an image file to generate icons.", 'danger');
            return;
        }

        // Get the selected radio button value
        const iconOption = document.querySelector('input[name="iconOptions"]:checked').value;

        // Disable the generate button and show "Please Wait..." with spinner
        if (generateIconsBtn) {
            generateIconsBtn.disabled = true;
            const originalText = generateIconsBtn.innerHTML;
            generateIconsBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            const formData = new FormData();
            formData.append("image", imageFiles[0]);
            formData.append("option", iconOption); // Append the selected option

            try {
                const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
                const response = await fetch(`${SERVER_NAME}/api/generate-icons`, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Failed to generate icons.");
                }

                const blob = await response.blob();
                const originalFileName = imageFiles[0].name.split('.').slice(0, -1).join('.'); // Remove extension
                const zipFileName = `${originalFileName}-icons.zip`; // Append '-icons' to the file name
                downloadIconsZip(blob, zipFileName);
            } catch (error) {
                showAlert("An error occurred during icon generation: " + error.message, 'danger');
                console.error("Icon generation error:", error);
            } finally {
                // Re-enable the generate button and revert to original text
                if (generateIconsBtn) {
                    generateIconsBtn.disabled = false;
                    generateIconsBtn.innerHTML = originalText || 'Generate Icons';
                }
            }
        }
    }

    function downloadIconsZip(zipBlob, fileName) {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert("Icons generated successfully!", 'success');
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
