document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const mergeBtn = document.getElementById("mergeBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const addBtn = document.getElementById("addBtn");
    let selectedFiles = [];
    let draggedItem = null;
    let pdfFiles = [];

    pdfInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (file.type === "application/pdf") {
                if (pdfFiles.some(f => f.name === file.name)) {
                    showAlert(`File "${file.name}" is already added.`, 'warning');
                } else {
                    pdfFiles.push(file);
                    updateFileList();
                }
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        fileList.innerHTML = "";
        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'col-6 col-sm-6 col-md-6 col-lg-6 mb-4 list-item';
            divItem.dataset.id = index;
            divItem.setAttribute('draggable', true);
            divItem.addEventListener('dragstart', handleDragStart);
            divItem.addEventListener('dragover', handleDragOver);
            divItem.addEventListener('dragenter', handleDragEnter);
            divItem.addEventListener('dragleave', handleDragLeave);
            divItem.addEventListener('drop', handleDrop);
            divItem.addEventListener('dragend', handleDragEnd);
            const divScnd = document.createElement("div");
            divScnd.className = 'pdf-card selected';
            divScnd.id = file.name;
            divScnd.addEventListener("click", () => toggleSelection(divScnd));
            const tickBtn = document.createElement("span");
            tickBtn.classList.add("checkmark");
            tickBtn.textContent = "✔";
            const imgItem = document.createElement("img");
            imgItem.src = '/assests/pdf 2.png';
            imgItem.alt = file.name;
            const nameDiv = document.createElement("div");
            nameDiv.classList.add("pdf-name");
            nameDiv.textContent = file.name;

            selectedFiles.push(file.name);
            divScnd.appendChild(tickBtn);
            divScnd.appendChild(imgItem);
            divScnd.appendChild(nameDiv);
            divItem.appendChild(divScnd);
            fileList.appendChild(divItem);
        });
    }
    addBtn.addEventListener("click", function(){pdfInput.click()});

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
            const items = Array.from(fileList.querySelectorAll('.list-item'));
            
            // Find the index of the dragged item and the target item
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = items.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                // Insert after the target
                fileList.insertBefore(draggedItem, this.nextSibling);
            } else {
                // Insert before the target
                fileList.insertBefore(draggedItem, this);
            }
            
            // Save the new order
            saveOrder();
        }
        
        this.classList.remove('over');
        return false;
    }
    
    function handleDragEnd(e) {
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.remove('dragging');
            item.classList.remove('over');
        });
    }
    
    function saveOrder() {
        const items = Array.from(fileList.querySelectorAll('.list-item'));
        const order = items.map(item => item.getAttribute('data-id'));
        pdfFiles = order.map(index => pdfFiles[index]);
        items.forEach((item, index) => {
            item.dataset.id = index;
        });
        console.log(pdfFiles);
        localStorage.setItem('draggableListOrder', JSON.stringify(order));
    }
    
    function loadSavedOrder() {
        const savedOrder = localStorage.getItem('draggableListOrder');
        if (savedOrder) {
            const order = JSON.parse(savedOrder);
            const items = Array.from(fileList.querySelectorAll('.list-item'));
            
            // Sort items based on saved order
            const sortedItems = order.map(id => 
                items.find(item => item.getAttribute('data-id') === id)
            ).filter(item => item !== undefined);
            
            // Clear the list and append sorted items
            fileList.innerHTML = '';
            sortedItems.forEach(item => fileList.appendChild(item));
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
      const selectedCards = document.querySelectorAll('.pdf-card.selected').length;
      document.getElementById('selected-count').textContent = selectedCards;
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }

    mergeBtn.addEventListener("click", mergePDFs);

    async function mergePDFs() {
        pdfFiles.forEach((file, index) => {
            if(!selectedFiles.includes(file.name)){
                pdfFiles.splice(index, 1);
            }
        });
        if (pdfFiles.length === 0) {
            showAlert("Please add at least one PDF file to merge.", 'danger');
            return;
        }

        const { PDFDocument } = PDFLib;

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of pdfFiles) {
                const existingPdfBytes = await pdfFile.arrayBuffer();
                const existingPdf = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
            }

            const mergedPdfBytes = await mergedPdf.save();
            downloadMergedPDF(mergedPdfBytes);
        } catch (error) {
            showAlert("An error occurred while merging the PDFs: " + error.message, 'danger');
            console.error("Error merging PDFs:", error);
        }
    }

    function generateUniqueName() {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
        return `merged_${timestamp}.pdf`;
    }

    function downloadMergedPDF(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateUniqueName(); // Use the unique name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDFs merged successfully!", 'success');
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        alertPlaceholder.innerHTML = ''; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout (optional)
        setTimeout(() => {
            $(alertDiv).alert('close');
        }, 7000); // Remove alert after 5 seconds
    }
});
