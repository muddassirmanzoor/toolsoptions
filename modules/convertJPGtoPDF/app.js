document.addEventListener("DOMContentLoaded", () => {
    const jpgInput = document.getElementById("jpgInput");
    const imageList = document.getElementById("imageList");
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
    const fileCountBadge = document.getElementById("fileCountBadge");
    const fileContainer = document.querySelector('.col-md-6.position-relative');
    
    let selectedFiles = [];
    let draggedItem = null;
    let jpgFiles = [];

    jpgInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset the input value so files can be re-added
        jpgInput.value = "";
    }

    function handleDroppedFiles(files) {
        files.forEach(file => {
            if (file.type === "image/jpeg" || file.type === "image/jpg") {
                jpgFiles.push(file);
                updateImageList();
                updateUIState();
            } else {
                showAlert("Only JPG files are allowed.", 'danger');
            }
        });
    }

    function updateImageList() {
        imageList.innerHTML = "";
        if (jpgFiles.length > 0) {
            jpgFiles.forEach((file, index) => {
                const divItem = document.createElement("div");
                divItem.className = 'file-item';
                divItem.dataset.id = index;
                divItem.setAttribute('draggable', true);
                divItem.addEventListener('dragstart', handleDragStart);
                divItem.addEventListener('dragover', handleDragOver);
                divItem.addEventListener('dragenter', handleDragEnter);
                divItem.addEventListener('dragleave', handleDragLeave);
                divItem.addEventListener('drop', handleDrop);
                divItem.addEventListener('dragend', handleDragEnd);
                const divScnd = document.createElement("div");
                divScnd.className = 'file-icon selected';
                divScnd.id = file.name;
                divScnd.addEventListener("click", () => toggleSelection(divScnd));
                const tickBtn = document.createElement("span");
                tickBtn.classList.add("check-icon");
                tickBtn.textContent = "✔";
                const imgItem = document.createElement("img");
                imgItem.src = URL.createObjectURL(file);
                imgItem.alt = file.name;

                selectedFiles.push(file.name);
                divScnd.appendChild(tickBtn);
                divScnd.appendChild(imgItem);
                divItem.appendChild(divScnd);
                imageList.appendChild(divItem);
            });
        }
    }

    function updateUIState() {
        if (jpgFiles.length > 0) {
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
            // Update file count badge
            if (fileCountBadge) {
                fileCountBadge.textContent = jpgFiles.length;
                fileCountBadge.style.display = 'flex';
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
            // Hide file count badge
            if (fileCountBadge) {
                fileCountBadge.style.display = 'none';
            }
        }
    }

    function updateFileCountBadge() {
        if (fileCountBadge) {
            if (jpgFiles.length > 0) {
                fileCountBadge.textContent = jpgFiles.length;
                fileCountBadge.style.display = 'flex';
            } else {
                fileCountBadge.style.display = 'none';
            }
        }
    }

    loadSavedOrder();

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        
        // Add dragging class after a short delay for better visual effect
        setTimeout(() => this.classList.add('dragging'), 0);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (draggedItem !== this) {
            // Get all list items
            const items = Array.from(imageList.querySelectorAll('.file-item'));
            
            // Find the index of the dragged item and the target item
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = items.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                // Insert after the target
                imageList.insertBefore(draggedItem, this.nextSibling);
            } else {
                // Insert before the target
                imageList.insertBefore(draggedItem, this);
            }
            
            // Save the new order
            saveOrder();
        }
        
        this.classList.remove('over');
        return false;
    }
    
    function handleDragEnd(e) {
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('dragging');
            item.classList.remove('over');
        });
    }
    
    function saveOrder() {
        const items = Array.from(imageList.querySelectorAll('.file-item'));
        const order = items.map(item => item.getAttribute('data-id'));
        jpgFiles = order.map(index => jpgFiles[index]);
        items.forEach((item, index) => {
            item.dataset.id = index;
        });
        localStorage.setItem('draggableListOrder', JSON.stringify(order));
        updateFileCountBadge();
    }
    
    function loadSavedOrder() {
        const savedOrder = localStorage.getItem('draggableListOrder');
        if (savedOrder) {
            const order = JSON.parse(savedOrder);
            const items = Array.from(imageList.querySelectorAll('.file-item'));
            
            // Sort items based on saved order
            const sortedItems = order.map(id => 
                items.find(item => item.getAttribute('data-id') === id)
            ).filter(item => item !== undefined);
            
            // Clear the list and append sorted items
            imageList.innerHTML = '';
            sortedItems.forEach(item => imageList.appendChild(item));
        }
    }

    function toggleSelection(card) {
      card.classList.toggle('selected');
      if (card.classList.contains("selected")){
        selectedFiles.push(card.id);
      }else{
        selectedFiles = selectedFiles.filter(item => item !== card.id);
      }
      updateSelectedCount();
    }
  
    function updateSelectedCount() {
      const selectedCards = document.querySelectorAll('.file-icon.selected').length;
      // document.getElementById('selected-count').textContent = selectedCards;
    }

    function removeFile(index) {
        jpgFiles.splice(index, 1);
        updateImageList();
        updateUIState();
        updateFileCountBadge();
    }

    // Button event listeners
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener("click", () => jpgInput.click());
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
        addBtn.addEventListener("click", () => jpgInput.click());
    }

    if (computerBtn) {
        computerBtn.addEventListener("click", () => jpgInput.click());
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
    updateFileCountBadge();

    convertBtn.addEventListener("click", convertToPdf);

    async function convertToPdf() {
        if (jpgFiles.length === 0) {
            showAlert("Please add image files to convert.", 'danger');
            return;
        }
    
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
        const formData = new FormData();
        jpgFiles.forEach(file => {
            formData.append('images', file);
        });
    
        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL;
            const response = await fetch(`${SERVER_NAME}/api/convert-jpgs-to-pdf`, {
                method: "POST",
                body: formData
            });
    
            if (!response.ok) {
                throw new Error("Failed to convert images to PDF.");
            }
    
            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
    
            // Get the name of the first image file
            const firstImageName = jpgFiles[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
            const pdfFileName = `${firstImageName}.pdf`;
    
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = pdfFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            showAlert("Images converted to PDF successfully!", 'success');
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert to PDF';
        }
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

        setTimeout(() => {
            $(alertDiv).alert('close');
        }, 7000);
    }
});
