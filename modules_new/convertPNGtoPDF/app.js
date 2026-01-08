document.addEventListener("DOMContentLoaded", () => {
    const pngInput = document.getElementById("pngInput");
    const imageList = document.getElementById("imageList");
    const convertBtn = document.getElementById("convertBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    let selectedFiles = [];
    let draggedItem = null;

    let pngFiles = [];

    pngInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (file.type === "image/png") {
                pngFiles.push(file);
                updateImageList();
            } else {
                showAlert("Only PNG files are allowed.", 'danger');
            }
        });

        // Reset the input value so files can be re-added
        pngInput.value = "";
    }

    function updateImageList() {
        imageList.innerHTML = "";
        pngFiles.forEach((file, index) => {const divItem = document.createElement("div");
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
            // const listItem = document.createElement("li");
            // listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            // const thumbnail = document.createElement("div");
            // thumbnail.classList.add("thumbnail");
            // const img = document.createElement("img");
            // img.src = URL.createObjectURL(file);
            // thumbnail.appendChild(img);

            // listItem.appendChild(thumbnail);
            // listItem.appendChild(document.createTextNode(file.name));

            // const removeBtn = document.createElement("button");
            // removeBtn.textContent = "Remove";
            // removeBtn.classList.add("btn", "btn-danger", "btn-sm");
            // removeBtn.addEventListener("click", () => removeFile(index));

            // listItem.appendChild(removeBtn);
            // imageList.appendChild(listItem);
        });
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
        pngFiles = order.map(index => pngFiles[index]);
        items.forEach((item, index) => {
            item.dataset.id = index;
        });
        localStorage.setItem('draggableListOrder', JSON.stringify(order));
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
        pngFiles.splice(index, 1);
        updateImageList();
    }

    convertBtn.addEventListener("click", convertToPdf);

    async function convertToPdf() {
        if (pngFiles.length === 0) {
            showAlert("Please add image files to convert.", 'danger');
            return;
        }
    
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
        const formData = new FormData();
        pngFiles.forEach(file => {
            formData.append('images', file);
        });
    
        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL;
            const response = await fetch(`${SERVER_NAME}/api/convert-pngs-to-pdf`, {
                method: "POST",
                body: formData
            });
    
            if (!response.ok) {
                throw new Error("Failed to convert images to PDF.");
            }
    
            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
    
            // Get the name of the first image file
            const firstImageName = pngFiles[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
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
