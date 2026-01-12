// Configure PDF.js worker - try immediately and also on load
(function configurePdfJsWorker() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('PDF.js worker configured');
    } else {
        // Try again when window loads
        window.addEventListener('load', function() {
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('PDF.js worker configured (on load)');
            } else {
                console.error('PDF.js library failed to load');
            }
        });
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    // Define showAlert function first so it can be used everywhere
    function showAlert(message, type) {
        const alertPlaceholder = document.getElementById("alertPlaceholder");
        if (!alertPlaceholder) {
            console.error("Alert placeholder not found");
            alert(message); // Fallback to browser alert
            return;
        }

        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", `alert-${type}`, "alert-dismissible", "fade", "show");
        alertDiv.setAttribute("role", "alert");

        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="btn-close" aria-label="Close"></button>
        `;

        alertPlaceholder.innerHTML = "";
        alertPlaceholder.appendChild(alertDiv);

        const closeBtn = alertDiv.querySelector(".btn-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                alertDiv.remove();
            });
        }

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 7000);
    }

    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library is not loaded. Please check the script tag.');
        showAlert('PDF.js library failed to load. Please refresh the page.', 'danger');
    }
    
    // PDF Elements
    const pdfInput = document.getElementById("pdfInput");
    const pdfCanvas = document.getElementById("pdfCanvas");
    const pageThumbnailsColumn = document.getElementById("pageThumbnailsColumn");
    const documentPreviewArea = document.getElementById("documentPreviewArea");
    const currentPageSpan = document.getElementById("currentPage");
    const totalPagesSpan = document.getElementById("totalPages");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const goToPageDropdown = document.getElementById("goToPageDropdown");
    const pageNumberInput = document.getElementById("pageNumberInput");
    const documentName = document.getElementById("documentName");
    const signPdfBtn = document.getElementById("signPdfBtn");

    // Upload UI Elements (Merge PDF style)
    const initialUploadState = document.getElementById("initialUploadState");
    const fileSelectionButtons = document.getElementById("fileSelectionButtons");
    const selectFilesBtn = document.getElementById("selectFilesBtn");
    const initialGoogleDriveBtn = document.getElementById("initialGoogleDriveBtn");
    const initialDropboxBtn = document.getElementById("initialDropboxBtn");
    const addBtn = document.getElementById("addBtn");
    const computerBtn = document.getElementById("computerBtn");
    const googleDriveBtn = document.getElementById("googleDriveBtn");
    const dropboxBtn = document.getElementById("dropboxBtn");
    const documentPreviewWrapper = document.querySelector('.document-preview-wrapper');

    // Signature Modal Elements
    const signatureModalElement = document.getElementById("signatureModal");
    let signatureModal = null;
    
    // Initialize Bootstrap modal properly
    function initializeModal() {
        if (signatureModalElement) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                // Dispose existing modal if any
                const existingModal = bootstrap.Modal.getInstance(signatureModalElement);
                if (existingModal) {
                    existingModal.dispose();
                }
                signatureModal = new bootstrap.Modal(signatureModalElement, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                console.log('Modal initialized');
            } else {
                console.warn('Bootstrap not loaded, will try again');
                setTimeout(initializeModal, 100);
            }
        }
    }
    
    // Try to initialize immediately
    initializeModal();
    
    // Also try on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModal);
    }
    
    window.addEventListener('load', initializeModal);
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const editSignatureBtn = document.getElementById("editSignatureBtn");
    const editInitialsBtn = document.getElementById("editInitialsBtn");
    const signatureInput = document.getElementById("signatureInput");
    const initialsInput = document.getElementById("initialsInput");
    const signatureField = document.getElementById("signatureField");
    const initialsField = document.getElementById("initialsField");
    const nameField = document.getElementById("nameField");
    const dateField = document.getElementById("dateField");
    const textField = document.getElementById("textField");

    // Signature Creation Elements
    const nameInput = document.getElementById("nameInput");
    const generateBtn = document.getElementById("generateBtn");
    const signatureCanvas = document.getElementById("signatureCanvas");
    const drawCanvas = document.getElementById("drawCanvas");
    const undoBtn = document.getElementById("undoBtn");
    const clearDrawBtn = document.getElementById("clearDrawBtn");
    const imageUpload = document.getElementById("imageUpload");
    const uploadCanvas = document.getElementById("uploadCanvas");
    const undoBtnUpload = document.getElementById("undoBtnUpload");
    const clearUploadBtn = document.getElementById("clearUploadBtn");
    const historyContainer = document.getElementById("historyContainer");
    const applySignatureBtn = document.getElementById("applySignatureBtn");

    // PDF State
    let pdfDoc = null;
    let pdfFile = null;
    let currentPage = 1;
    let scale = 1.0;
    let currentEditingField = null; // Track which field is being edited

    // Signature State
    let signatureData = {
        signature: null,
        initials: null
    };
    
    // Placed fields on PDF - stores all field types at specific positions
    // Structure: { pageNumber: [{ id, type, dataURL (for signatures), text (for text fields), x, y, width, height }] }
    let placedSignatures = {};
    
    // Field placement mode - which field type is selected for placement
    let placementMode = null; // 'signature', 'initials', 'name', 'date', 'text'
    let placementData = null; // dataURL for signatures, null for text fields
    
    // Drag state for signature fields
    let draggedSignatureType = null;
    let draggedSignatureData = null;
    
    // Canvas contexts - declare here so they're available everywhere
    let drawCtx = null;
    let drawHistory = [];
    let isDrawing = false;
    let uploadCtx = null;
    let uploadHistory = [];
    let signatureCtx = null;
    let activeCanvas = null;
    let activeCanvasCtx = null;

    // File input change handler
    if (pdfInput) {
        pdfInput.addEventListener("change", handleFileSelection);
    }

    // Initial state button listeners
    if (selectFilesBtn && pdfInput) {
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
    if (addBtn && pdfInput) {
        addBtn.addEventListener("click", () => pdfInput.click());
    }
    if (computerBtn && pdfInput) {
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
            if (files.length > 0) {
                const pdfFile = files.find(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf'));
                if (pdfFile) {
                    handlePdfFile(pdfFile);
                } else {
                    showAlert("Please drop a valid PDF file.", "danger");
                }
            }
        });
    }

    function handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            handlePdfFile(file);
        }
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    // Helper function to handle PDF file
    async function handlePdfFile(file) {
        if (!file) {
            return;
        }

        // Check file type
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
            showAlert("Please select a valid PDF file.", "danger");
            return;
        }

        pdfFile = file;
        if (documentName) {
            documentName.textContent = file.name;
        }

        // Update UI state - hide initial upload, show file selection buttons
        updateUIState(true);

        // Show loading state
        if (documentPreviewArea) {
            documentPreviewArea.style.display = "flex";
            documentPreviewArea.innerHTML = `
                <div class="upload-prompt" style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p style="margin-top: 10px;">Loading PDF...</p>
                </div>
            `;
        }

        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }

            const fileReader = new FileReader();
            fileReader.onload = async function(e) {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    
                    currentPage = 1;
                    if (totalPagesSpan) {
                        totalPagesSpan.textContent = pdfDoc.numPages;
                    }
                    updatePageNavigation();
                    await renderPageThumbnails();
                    await renderCurrentPage();
                } catch (error) {
                    console.error("Error parsing PDF:", error);
                    showAlert("Failed to parse PDF. The file may be corrupted.", "danger");
                    resetUploadArea();
                }
            };
            fileReader.onerror = () => {
                showAlert("Failed to read file. Please try again.", "danger");
                resetUploadArea();
            };
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Failed to load PDF. Please try again.", "danger");
            resetUploadArea();
        }
    }

    // Helper function to update UI state
    function updateUIState(hasFile) {
        if (hasFile) {
            // Hide initial state, show file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'none';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'flex';
            if (documentPreviewWrapper) documentPreviewWrapper.classList.add('has-file');
            if (pageThumbnailsColumn) pageThumbnailsColumn.style.display = 'flex';
        } else {
            // Show initial state, hide file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'flex';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'none';
            if (documentPreviewWrapper) documentPreviewWrapper.classList.remove('has-file');
            if (pageThumbnailsColumn) pageThumbnailsColumn.style.display = 'none';
            if (documentPreviewArea) documentPreviewArea.style.display = 'none';
        }
    }

    // Helper function to reset upload area
    function resetUploadArea() {
        pdfFile = null;
        pdfDoc = null;
        currentPage = 1;
        updateUIState(false);
        if (pdfInput) {
            pdfInput.value = "";
        }
        if (pdfCanvas) {
            pdfCanvas.style.display = "none";
        }
        if (pageThumbnailsColumn) {
            pageThumbnailsColumn.innerHTML = "";
        }
        if (documentName) {
            documentName.textContent = "No file selected";
        }
        if (totalPagesSpan) {
            totalPagesSpan.textContent = "1";
        }
        if (currentPageSpan) {
            currentPageSpan.textContent = "1";
        }
        updatePageNavigation();
    }

    // Page Navigation
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
                updatePageNavigation();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            if (pdfDoc && currentPage < pdfDoc.numPages) {
                currentPage++;
                renderCurrentPage();
                updatePageNavigation();
            }
        });
    }

    // Go to Page Dropdown
    if (goToPageDropdown && pageNumberInput) {
        goToPageDropdown.addEventListener("click", () => {
            if (pageNumberInput.style.display === "none" || !pageNumberInput.style.display) {
                pageNumberInput.style.display = "inline-block";
                pageNumberInput.value = currentPage;
                pageNumberInput.max = pdfDoc ? pdfDoc.numPages : 1;
                pageNumberInput.focus();
                goToPageDropdown.style.display = "none";
            }
        });

        pageNumberInput.addEventListener("blur", () => {
            const pageNum = parseInt(pageNumberInput.value);
            if (pageNum >= 1 && pageNum <= (pdfDoc ? pdfDoc.numPages : 1)) {
                currentPage = pageNum;
                renderCurrentPage();
                updatePageNavigation();
            }
            pageNumberInput.style.display = "none";
            goToPageDropdown.style.display = "flex";
        });

        pageNumberInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                pageNumberInput.blur();
            }
        });
    }

    async function renderCurrentPage() {
        if (!pdfDoc || !pdfCanvas || !documentPreviewArea) return;

        try {
            const page = await pdfDoc.getPage(currentPage);
            const container = documentPreviewArea;
            // Calculate container width with minimal padding
            const containerWidth = container ? (container.clientWidth || container.offsetWidth) - 16 : 800;
            const maxWidth = Math.min(containerWidth, 1200);
            
            // Get initial viewport
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Calculate scale to fit container width while maintaining aspect ratio
            const calculatedScale = Math.min(maxWidth / viewport.width, 2.0);
            const scaledViewport = page.getViewport({ scale: calculatedScale });
            
            // Set canvas dimensions (device pixel ratio for crisp rendering)
            const outputScale = window.devicePixelRatio || 1;
            pdfCanvas.width = Math.floor(scaledViewport.width * outputScale);
            pdfCanvas.height = Math.floor(scaledViewport.height * outputScale);
            
            // Set CSS display size - remove extra spacing
            pdfCanvas.style.width = scaledViewport.width + 'px';
            pdfCanvas.style.height = 'auto';
            pdfCanvas.style.display = "block";
            pdfCanvas.style.maxWidth = "100%";
            pdfCanvas.style.margin = "0 auto";
            pdfCanvas.style.padding = "0";

            const ctx = pdfCanvas.getContext("2d");
            ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
            ctx.scale(outputScale, outputScale);

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            await page.render(renderContext).promise;
            
            // Render placed signatures on this page (async)
            await renderPlacedSignatures(ctx, scaledViewport, outputScale);

            // Update preview area - minimize padding
            documentPreviewArea.innerHTML = '';
            documentPreviewArea.style.padding = "8px";
            documentPreviewArea.style.alignItems = "flex-start";
            documentPreviewArea.style.justifyContent = "center";
            
            // Create container for PDF canvas and signature overlays
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'pdf-canvas-container';
            canvasContainer.style.position = 'relative';
            canvasContainer.style.display = 'inline-block';
            canvasContainer.style.width = scaledViewport.width + 'px';
            canvasContainer.style.height = scaledViewport.height + 'px';
            
            // Wrap canvas in container
            canvasContainer.appendChild(pdfCanvas);
            documentPreviewArea.appendChild(canvasContainer);
            documentPreviewArea.style.display = "flex";

            if (currentPageSpan) {
                currentPageSpan.textContent = currentPage;
            }
            updateActiveThumbnail();
            
            // Set up drop zone
            setupCanvasDropZone(canvasContainer, scaledViewport, outputScale);
            
            // Create overlay divs for placed signatures (for dragging)
            setTimeout(() => {
                makePlacedSignaturesDraggable(canvasContainer, scaledViewport, outputScale);
            }, 100);
        } catch (error) {
            console.error("Error rendering page:", error);
            showAlert("Failed to render PDF page: " + error.message, "danger");
            if (documentPreviewArea) {
                documentPreviewArea.style.display = "flex";
            }
            if (pdfCanvas) {
                pdfCanvas.style.display = "none";
            }
        }
    }

    async function renderPageThumbnails() {
        if (!pdfDoc || !pageThumbnailsColumn) return;

        pageThumbnailsColumn.innerHTML = "";

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const thumbnail = document.createElement("div");
            thumbnail.className = `page-thumbnail-small ${i === currentPage ? 'active' : ''}`;
            thumbnail.addEventListener("click", () => {
                currentPage = i;
                renderCurrentPage();
                updatePageNavigation();
            });

            const canvas = document.createElement("canvas");
            thumbnail.appendChild(canvas);

            try {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.2 });
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: canvas.getContext("2d"),
                    viewport: viewport
                };

                await page.render(renderContext).promise;
            } catch (error) {
                console.error(`Error rendering thumbnail for page ${i}:`, error);
            }

            pageThumbnailsColumn.appendChild(thumbnail);
        }
    }

    function updateActiveThumbnail() {
        if (!pageThumbnailsColumn) return;
        const thumbnails = pageThumbnailsColumn.querySelectorAll(".page-thumbnail-small");
        thumbnails.forEach((thumb, index) => {
            if (index + 1 === currentPage) {
                thumb.classList.add("active");
            } else {
                thumb.classList.remove("active");
            }
        });
    }

    function updatePageNavigation() {
        if (!pdfDoc) {
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            return;
        }

        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= pdfDoc.numPages;
    }
    
    // Render placed signatures on PDF canvas (for visual display only)
    // Actual signatures will be rendered as overlay divs for dragging
    async function renderPlacedSignatures(ctx, viewport, outputScale) {
        // Signatures are now rendered as overlay divs, not on canvas
        // This function is kept for compatibility but doesn't draw on canvas
        // The overlay rendering is handled by makePlacedSignaturesDraggable
        return;
    }
    
    // Setup drop zone on PDF canvas to place signatures
    let currentDropZoneSetup = null;
    
    function setupCanvasDropZone(canvasContainer, viewport, outputScale) {
        if (!canvasContainer) return;
        
        // Remove previous setup if exists
        if (currentDropZoneSetup && currentDropZoneSetup.container) {
            currentDropZoneSetup.container.removeEventListener('dragover', currentDropZoneSetup.dragOver);
            currentDropZoneSetup.container.removeEventListener('drop', currentDropZoneSetup.drop);
            currentDropZoneSetup.container.removeEventListener('dragleave', currentDropZoneSetup.dragLeave);
        }
        
        // Create handler functions
        const dragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedSignatureType && draggedSignatureData) {
                canvasContainer.style.border = '2px dashed var(--color-primary-purple)';
                canvasContainer.style.backgroundColor = 'rgba(90, 38, 239, 0.05)';
                canvasContainer.style.cursor = 'copy';
            }
        };
        
        const dragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove highlight if we're actually leaving the container
            if (!canvasContainer.contains(e.relatedTarget)) {
                canvasContainer.style.border = '';
                canvasContainer.style.backgroundColor = '';
                canvasContainer.style.cursor = '';
            }
        };
        
        const drop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            canvasContainer.style.border = '';
            canvasContainer.style.backgroundColor = '';
            canvasContainer.style.cursor = '';
            
            // Try to get data from drag transfer
            const dragData = e.dataTransfer.getData('application/json');
            if (dragData) {
                try {
                    const data = JSON.parse(dragData);
                    draggedSignatureType = data.type;
                    draggedSignatureData = data.dataURL;
                } catch (err) {
                    console.error("Error parsing drag data:", err);
                }
            }
            
            // Check global drag state (set in dragstart) or use fallback from dataTransfer
            if (!draggedSignatureType || !draggedSignatureData) {
                // Fallback: use stored signature data from fields
                const dragType = e.dataTransfer.getData('text/plain');
                if (dragType === 'signature' && signatureData.signature) {
                    draggedSignatureType = 'signature';
                    draggedSignatureData = signatureData.signature;
                    console.log("Using signature data from signatureData.signature");
                } else if (dragType === 'initials' && signatureData.initials) {
                    draggedSignatureType = 'initials';
                    draggedSignatureData = signatureData.initials;
                    console.log("Using initials data from signatureData.initials");
                } else {
                    console.error("No signature data available for drag. Type:", dragType);
                    showAlert("Please create a signature first, then drag it to the PDF.", "warning");
                    return;
                }
            }
            
            // Place signature at drop position
            placeFieldOnPdf(e.clientX, e.clientY, draggedSignatureType, draggedSignatureData, canvasContainer);
            
            // Reset drag state after a delay
            setTimeout(() => {
                draggedSignatureType = null;
                draggedSignatureData = null;
            }, 500);
        };
        
        // Add click handler for click-to-place functionality
        const handleCanvasClick = (e) => {
            // Don't place if clicking on existing overlay or input
            if (e.target.closest('.signature-overlay') || 
                e.target.closest('.text-field-overlay') || 
                e.target.classList.contains('pdf-text-input') ||
                e.target.classList.contains('signature-delete-btn')) {
                return;
            }
            
            // Only handle clicks if in placement mode (field type selected)
            if (!placementMode) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Get position relative to container
            const containerRect = canvasContainer.getBoundingClientRect();
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            
            // Validate position
            if (x < 0 || y < 0 || x > containerRect.width || y > containerRect.height) {
                return;
            }
            
            // For signature/initials: need dataURL
            if (placementMode === 'signature' || placementMode === 'initials') {
                const dataURL = placementMode === 'signature' ? signatureData.signature : signatureData.initials;
                if (!dataURL || dataURL.length < 100) {
                    showAlert(`Please create ${placementMode === 'signature' ? 'a signature' : 'initials'} first by clicking 'Edit'.`, "warning");
                    exitPlacementMode();
                    return;
                }
                placeFieldOnPdf(e.clientX, e.clientY, placementMode, dataURL, canvasContainer);
            } else {
                // For text fields: place editable input
                placeTextFieldOnPdf(x, y, placementMode, canvasContainer);
            }
            
            // Exit placement mode after placing
            exitPlacementMode();
        };
        
        canvasContainer.addEventListener('click', handleCanvasClick);
        
        // Add event listeners
        canvasContainer.addEventListener('dragover', dragOver);
        canvasContainer.addEventListener('drop', drop);
        canvasContainer.addEventListener('dragleave', dragLeave);
        
        // Store setup for cleanup
        currentDropZoneSetup = {
            container: canvasContainer,
            dragOver: dragOver,
            drop: drop,
            dragLeave: dragLeave,
            click: handleCanvasClick
        };
    }
    
    // Place field on PDF (for signatures/initials with images)
    function placeFieldOnPdf(clientX, clientY, fieldType, dataURL, canvasContainer) {
        if (!pdfCanvas) {
            showAlert("Please load a PDF first.", "warning");
            return;
        }
        
        const containerRect = canvasContainer.getBoundingClientRect();
        const x = clientX - containerRect.left;
        const y = clientY - containerRect.top;
        
        // Validate position
        if (x < 0 || y < 0 || x > containerRect.width || y > containerRect.height) {
            return;
        }
        
        // Default signature size (in viewport pixels)
        const sigWidth = 200;
        const sigHeight = 60;
        
        // Store placed field (coordinates in viewport space)
        if (!placedSignatures[currentPage]) {
            placedSignatures[currentPage] = [];
        }
        
        const fieldId = `${fieldType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        placedSignatures[currentPage].push({
            id: fieldId,
            type: fieldType,
            dataURL: dataURL,
            x: x,
            y: y,
            width: sigWidth,
            height: sigHeight
        });
        
        console.log(`${fieldType} placed at:`, x, y, "on page", currentPage);
        showAlert(`${fieldType === 'signature' ? 'Signature' : 'Initials'} placed on PDF!`, "success");
        
        // Re-render page to show field
        setTimeout(() => {
            renderCurrentPage();
        }, 100);
    }
    
    // Place text field on PDF (for Name, Date, Text fields)
    function placeTextFieldOnPdf(x, y, fieldType, canvasContainer) {
        if (!pdfCanvas) {
            showAlert("Please load a PDF first.", "warning");
            return;
        }
        
        // Default text field size
        const fieldWidth = 200;
        const fieldHeight = 30;
        
        // Store placed text field
        if (!placedSignatures[currentPage]) {
            placedSignatures[currentPage] = [];
        }
        
        // Default text values based on field type
        let defaultText = '';
        if (fieldType === 'name') {
            defaultText = 'Name';
        } else if (fieldType === 'date') {
            defaultText = new Date().toLocaleDateString();
        } else if (fieldType === 'text') {
            defaultText = 'Text';
        }
        
        const fieldId = `${fieldType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        placedSignatures[currentPage].push({
            id: fieldId,
            type: fieldType,
            text: defaultText,
            x: x,
            y: y,
            width: fieldWidth,
            height: fieldHeight
        });
        
        console.log(`${fieldType} field placed at:`, x, y, "on page", currentPage);
        showAlert(`${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} field placed! Click to edit.`, "success");
        
        // Re-render page to show field
        setTimeout(() => {
            renderCurrentPage();
        }, 100);
    }
    
    // Enter placement mode when field is clicked
    function enterPlacementMode(fieldType, fieldElement) {
        // Remove active class from all fields
        document.querySelectorAll('.field-item').forEach(item => {
            item.classList.remove('field-active');
        });
        
        // Add active class to selected field
        if (fieldElement) {
            fieldElement.classList.add('field-active');
        }
        
        // Set placement mode
        placementMode = fieldType;
        
        // For signature/initials: check if data exists
        if ((fieldType === 'signature' || fieldType === 'initials')) {
            const dataURL = fieldType === 'signature' ? signatureData.signature : signatureData.initials;
            if (!dataURL || dataURL.length < 100) {
                showAlert(`Please create ${fieldType === 'signature' ? 'a signature' : 'initials'} first by clicking 'Edit'.`, "warning");
                exitPlacementMode();
                return;
            }
            placementData = dataURL;
        } else {
            placementData = null;
        }
        
        // Change cursor on canvas to indicate placement mode
        const canvasContainer = document.querySelector('.pdf-canvas-container');
        if (canvasContainer) {
            canvasContainer.style.cursor = 'crosshair';
            showAlert(`Click on the PDF to place ${fieldType} field. Press ESC to cancel.`, "info");
        } else if (pdfCanvas && pdfCanvas.parentElement) {
            // Fallback: use parent element
            pdfCanvas.parentElement.style.cursor = 'crosshair';
            showAlert(`Click on the PDF to place ${fieldType} field. Press ESC to cancel.`, "info");
        } else {
            showAlert(`Please load a PDF first, then click to place ${fieldType} field.`, "warning");
            exitPlacementMode();
        }
    }
    
    // Exit placement mode
    function exitPlacementMode() {
        placementMode = null;
        placementData = null;
        
        // Remove active class from all fields
        document.querySelectorAll('.field-item').forEach(item => {
            item.classList.remove('field-active');
        });
        
        // Reset cursor
        const canvasContainer = document.querySelector('.pdf-canvas-container');
        if (canvasContainer) {
            canvasContainer.style.cursor = '';
        } else if (pdfCanvas && pdfCanvas.parentElement) {
            pdfCanvas.parentElement.style.cursor = '';
        }
    }
    
    // Allow ESC key to exit placement mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && placementMode) {
            exitPlacementMode();
            showAlert('Placement mode cancelled.', 'info');
        }
    });
    
    // Make signature field draggable
    function makeFieldDraggable(fieldId, fieldType, dataURL) {
        const fieldElement = document.getElementById(fieldId);
        if (!fieldElement) {
            console.error("Field element not found:", fieldId);
            return;
        }
        
        // Set draggable attribute
        fieldElement.draggable = true;
        fieldElement.classList.add('draggable-signature-field');
        
        // Remove existing dragstart listener if any (to avoid duplicates)
        const existingDragStart = fieldElement.getAttribute('data-drag-handler');
        if (existingDragStart === 'true') {
            return; // Already set up
        }
        
        // Mark as having drag handler
        fieldElement.setAttribute('data-drag-handler', 'true');
        
        // Add drag start handler
        fieldElement.addEventListener('dragstart', function(e) {
            // Get current signature data from signatureData (it may have been updated)
            const currentDataURL = fieldType === 'signature' ? signatureData.signature : signatureData.initials;
            
            if (!currentDataURL || currentDataURL.length < 100) {
                e.preventDefault();
                showAlert(`Please create ${fieldType === 'signature' ? 'a signature' : 'initials'} first by clicking 'Edit'.`, "warning");
                return;
            }
            
            // Use current data URL
            draggedSignatureType = fieldType;
            draggedSignatureData = currentDataURL;
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', fieldType);
            e.dataTransfer.setData('application/json', JSON.stringify({ type: fieldType, dataURL: currentDataURL }));
            
            // Visual feedback
            this.style.opacity = '0.5';
            this.style.cursor = 'grabbing';
            console.log("Drag started for", fieldType, "signature. Data URL length:", currentDataURL.length);
        });
        
        // Add drag end handler
        fieldElement.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
            this.style.cursor = 'grab';
        });
        
        // Add cursor style
        fieldElement.style.cursor = 'grab';
    }
    
    // Make placed signatures and fields draggable (for repositioning on PDF)
    function makePlacedSignaturesDraggable(canvasContainer, viewport, outputScale) {
        if (!canvasContainer || !placedSignatures[currentPage] || placedSignatures[currentPage].length === 0) {
            return;
        }
        
        // Remove existing overlays
        const existingOverlays = canvasContainer.querySelectorAll('.signature-overlay, .text-field-overlay');
        existingOverlays.forEach(overlay => overlay.remove());
        
        // Create overlay divs for each field
        placedSignatures[currentPage].forEach((field, index) => {
            // Handle signature/initials (image-based fields)
            if (field.type === 'signature' || field.type === 'initials') {
                if (!field.dataURL) return;
                
                const overlay = document.createElement('div');
                overlay.className = 'signature-overlay';
                overlay.dataset.fieldId = field.id;
                overlay.dataset.fieldIndex = index;
                overlay.style.position = 'absolute';
                overlay.style.left = field.x + 'px';
                overlay.style.top = field.y + 'px';
                overlay.style.width = (field.width || 200) + 'px';
                overlay.style.height = (field.height || 60) + 'px';
                overlay.style.cursor = 'move';
                overlay.style.border = '2px dashed transparent';
                overlay.style.borderRadius = '4px';
                overlay.style.transition = 'border-color 0.2s ease';
                
                // Create image element
                const img = document.createElement('img');
                img.src = field.dataURL;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.pointerEvents = 'none';
                overlay.appendChild(img);
                
                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'signature-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete ' + field.type;
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '-8px';
                deleteBtn.style.right = '-8px';
                deleteBtn.style.width = '24px';
                deleteBtn.style.height = '24px';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.background = '#ff4444';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontSize = '18px';
                deleteBtn.style.lineHeight = '1';
                deleteBtn.style.display = 'none';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete this ${field.type}?`)) {
                        placedSignatures[currentPage].splice(index, 1);
                        renderCurrentPage();
                    }
                });
                overlay.appendChild(deleteBtn);
                
                // Show delete button on hover
                overlay.addEventListener('mouseenter', () => {
                    overlay.style.borderColor = 'var(--color-primary-purple)';
                    deleteBtn.style.display = 'block';
                });
                overlay.addEventListener('mouseleave', () => {
                    overlay.style.borderColor = 'transparent';
                    deleteBtn.style.display = 'none';
                });
                
                // Make draggable
                makeSignatureOverlayDraggable(overlay, field, viewport, outputScale);
                
                canvasContainer.appendChild(overlay);
            } 
            // Handle text fields (Name, Date, Text)
            else if (field.type === 'name' || field.type === 'date' || field.type === 'text') {
                const overlay = document.createElement('div');
                overlay.className = 'text-field-overlay';
                overlay.dataset.fieldId = field.id;
                overlay.dataset.fieldIndex = index;
                overlay.style.position = 'absolute';
                overlay.style.left = field.x + 'px';
                overlay.style.top = field.y + 'px';
                overlay.style.width = (field.width || 200) + 'px';
                overlay.style.height = (field.height || 30) + 'px';
                overlay.style.cursor = 'move';
                overlay.style.border = '2px dashed transparent';
                overlay.style.borderRadius = '4px';
                overlay.style.transition = 'border-color 0.2s ease';
                
                // Create editable input element
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'pdf-text-input';
                input.value = field.text || '';
                input.placeholder = field.type === 'name' ? 'Name' : field.type === 'date' ? 'Date' : 'Text';
                input.style.width = '100%';
                input.style.height = '100%';
                input.style.padding = '4px 8px';
                input.style.border = '1px solid #ddd';
                input.style.borderRadius = '4px';
                input.style.fontSize = '14px';
                input.style.fontFamily = 'Arial, sans-serif';
                input.style.background = 'white';
                
                // Update field text on input change
                input.addEventListener('input', (e) => {
                    field.text = e.target.value;
                });
                
                // Prevent input from triggering placement mode
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                
                overlay.appendChild(input);
                
                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'signature-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete ' + field.type;
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '-8px';
                deleteBtn.style.right = '-8px';
                deleteBtn.style.width = '24px';
                deleteBtn.style.height = '24px';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.background = '#ff4444';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontSize = '18px';
                deleteBtn.style.lineHeight = '1';
                deleteBtn.style.display = 'none';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete this ${field.type} field?`)) {
                        placedSignatures[currentPage].splice(index, 1);
                        renderCurrentPage();
                    }
                });
                overlay.appendChild(deleteBtn);
                
                // Show delete button on hover
                overlay.addEventListener('mouseenter', () => {
                    overlay.style.borderColor = 'var(--color-primary-purple)';
                    deleteBtn.style.display = 'block';
                });
                overlay.addEventListener('mouseleave', () => {
                    overlay.style.borderColor = 'transparent';
                    deleteBtn.style.display = 'none';
                });
                
                // Make draggable (but allow input to be editable)
                makeTextFieldOverlayDraggable(overlay, input, field, viewport, outputScale);
                
                canvasContainer.appendChild(overlay);
            }
        });
    }
    
    // Make signature overlay draggable
    function makeSignatureOverlayDraggable(overlay, field, viewport, outputScale) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragHandle = null;
        
        // Create drag handle (invisible area for dragging, but show on hover)
        dragHandle = document.createElement('div');
        dragHandle.className = 'field-drag-handle';
        dragHandle.style.position = 'absolute';
        dragHandle.style.top = '0';
        dragHandle.style.left = '0';
        dragHandle.style.right = '0';
        dragHandle.style.bottom = '0';
        dragHandle.style.cursor = 'move';
        dragHandle.style.zIndex = '1';
        
        overlay.insertBefore(dragHandle, overlay.firstChild);
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = overlay.getBoundingClientRect();
            initialX = rect.left - overlay.parentElement.getBoundingClientRect().left;
            initialY = rect.top - overlay.parentElement.getBoundingClientRect().top;
            
            overlay.style.zIndex = '1000';
            overlay.style.opacity = '0.8';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Constrain to container bounds
            const maxX = containerRect.width - (field.width || 200);
            const maxY = containerRect.height - (field.height || 60);
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            overlay.style.left = newX + 'px';
            overlay.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            overlay.style.zIndex = '10';
            overlay.style.opacity = '1';
            
            // Update field position in data
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            field.x = overlayRect.left - containerRect.left;
            field.y = overlayRect.top - containerRect.top;
            
            console.log(`${field.type} moved to:`, field.x, field.y);
        });
    }
    
    // Make text field overlay draggable (but allow input editing)
    function makeTextFieldOverlayDraggable(overlay, input, field, viewport, outputScale) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragHandle = null;
        
        // Create drag handle area (on the border/edge, not the input itself)
        dragHandle = document.createElement('div');
        dragHandle.className = 'text-field-drag-handle';
        dragHandle.style.position = 'absolute';
        dragHandle.style.top = '0';
        dragHandle.style.left = '0';
        dragHandle.style.width = '20px';
        dragHandle.style.height = '100%';
        dragHandle.style.cursor = 'move';
        dragHandle.style.zIndex = '2';
        dragHandle.style.backgroundColor = 'transparent';
        
        overlay.insertBefore(dragHandle, input);
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = overlay.getBoundingClientRect();
            initialX = rect.left - overlay.parentElement.getBoundingClientRect().left;
            initialY = rect.top - overlay.parentElement.getBoundingClientRect().top;
            
            overlay.style.zIndex = '1000';
            overlay.style.opacity = '0.8';
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Also allow dragging by clicking on the overlay border (not the input)
        overlay.addEventListener('mousedown', (e) => {
            // Only start dragging if clicking outside the input
            if (e.target === overlay || e.target === dragHandle || e.target === overlay.querySelector('.signature-delete-btn')) {
                if (e.target.classList.contains('signature-delete-btn')) return;
                
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = overlay.getBoundingClientRect();
                initialX = rect.left - overlay.parentElement.getBoundingClientRect().left;
                initialY = rect.top - overlay.parentElement.getBoundingClientRect().top;
                
                overlay.style.zIndex = '1000';
                overlay.style.opacity = '0.8';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Constrain to container bounds
            const maxX = containerRect.width - (field.width || 200);
            const maxY = containerRect.height - (field.height || 30);
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            overlay.style.left = newX + 'px';
            overlay.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            overlay.style.zIndex = '10';
            overlay.style.opacity = '1';
            
            // Update field position in data
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            field.x = overlayRect.left - containerRect.left;
            field.y = overlayRect.top - containerRect.top;
            
            console.log(`${field.type} text field moved to:`, field.x, field.y);
        });
    }

    // Signature Modal Tab Switching
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                tabButtons.forEach(btn => btn.classList.remove("active"));
                tabContents.forEach(content => content.classList.remove("active"));

                button.classList.add("active");
                const tabId = button.dataset.tab;
                const tabContent = document.getElementById(tabId + "Tab");
                if (tabContent) {
                    tabContent.classList.add("active");
                    
                    // Reinitialize contexts when switching tabs
                    if (tabId === "draw") {
                        initializeDrawCanvas();
                        activeCanvas = drawCanvas;
                        activeCanvasCtx = drawCtx;
                    } else if (tabId === "upload") {
                        initializeUploadCanvas();
                        activeCanvas = uploadCanvas;
                        activeCanvasCtx = uploadCtx;
                    } else if (tabId === "type") {
                        initializeSignatureCanvas();
                        activeCanvas = signatureCanvas;
                        activeCanvasCtx = signatureCtx;
                    } else {
                        activeCanvas = null;
                        activeCanvasCtx = null;
                    }
                }

                // Adjust canvas sizes after tab switch
                setTimeout(() => {
                    adjustCanvasSizes();
                }, 50);
            });
        });
    }

    function adjustCanvasSizes() {
        const fixedWidth = 700;
        const fixedHeight = 200;
        
        // Adjust draw canvas
        if (drawCanvas) {
            drawCanvas.width = fixedWidth;
            drawCanvas.height = fixedHeight;
            drawCanvas.style.width = fixedWidth + 'px';
            drawCanvas.style.height = fixedHeight + 'px';
            
            // Reinitialize context after resize
            drawCtx = drawCanvas.getContext("2d", { willReadFrequently: true });
            if (drawCtx) {
                drawCtx.strokeStyle = "#000000";
                drawCtx.lineWidth = 2;
                drawCtx.lineCap = "round";
                drawCtx.lineJoin = "round";
                drawCtx.fillStyle = "#000000";
            }
        }
        
        // Adjust upload canvas
        if (uploadCanvas) {
            uploadCanvas.width = fixedWidth;
            uploadCanvas.height = fixedHeight;
            uploadCanvas.style.width = fixedWidth + 'px';
            uploadCanvas.style.height = fixedHeight + 'px';
            
            // Reinitialize context after resize
            uploadCtx = uploadCanvas.getContext("2d", { willReadFrequently: true });
            if (uploadCtx) {
                uploadCtx.strokeStyle = "#000000";
                uploadCtx.lineWidth = 2;
                uploadCtx.lineCap = "round";
                uploadCtx.lineJoin = "round";
                uploadCtx.fillStyle = "#000000";
            }
        }
        
        // Adjust signature canvas (for typed signatures)
        if (signatureCanvas) {
            signatureCanvas.width = fixedWidth;
            signatureCanvas.height = fixedHeight;
            signatureCanvas.style.width = fixedWidth + 'px';
            signatureCanvas.style.height = fixedHeight + 'px';
            
            // Reinitialize context after resize
            signatureCtx = signatureCanvas.getContext("2d", { willReadFrequently: true });
            if (signatureCtx) {
                signatureCtx.textAlign = "center";
                signatureCtx.textBaseline = "middle";
                signatureCtx.fillStyle = "#000000";
                signatureCtx.strokeStyle = "#000000";
            }
        }
        
        console.log("Canvas sizes adjusted - Draw:", !!drawCtx, "Upload:", !!uploadCtx, "Signature:", !!signatureCtx);
    }

    // Initialize canvas sizes when modal is shown
    if (signatureModalElement) {
        signatureModalElement.addEventListener('shown.bs.modal', () => {
            // Remove aria-hidden when modal is shown (Bootstrap sets it incorrectly sometimes)
            signatureModalElement.removeAttribute('aria-hidden');
            
            // Reinitialize all canvas contexts
            initializeDrawCanvas();
            initializeUploadCanvas();
            initializeSignatureCanvas();
            
            // Adjust canvas sizes
            adjustCanvasSizes();
            
            // Set active canvas based on active tab
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
                const tabId = activeTab.dataset.tab;
                if (tabId === "draw") {
                    activeCanvas = drawCanvas;
                    activeCanvasCtx = drawCtx;
                } else if (tabId === "upload") {
                    activeCanvas = uploadCanvas;
                    activeCanvasCtx = uploadCtx;
                } else if (tabId === "type") {
                    activeCanvas = signatureCanvas;
                    activeCanvasCtx = signatureCtx;
                }
            }
            
            // Clear any previous drawing when modal opens (optional - you might want to keep it)
            // Uncomment below if you want to clear on each open
            /*
            if (drawCanvas && drawCtx) {
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                drawHistory = [];
            }
            if (uploadCanvas && uploadCtx) {
                uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
                uploadHistory = [];
            }
            if (signatureCanvas && signatureCtx) {
                signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            }
            */
            
            console.log("Modal shown, currentEditingField:", currentEditingField);
        });
        
        signatureModalElement.addEventListener('hide.bs.modal', (e) => {
            // Before modal hides, remove focus from buttons to prevent aria-hidden warning
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'BUTTON' && signatureModalElement.contains(activeElement)) {
                activeElement.blur();
            }
        });
        
        signatureModalElement.addEventListener('hidden.bs.modal', () => {
            // Set aria-hidden when modal is fully hidden
            signatureModalElement.setAttribute('aria-hidden', 'true');
            // Clean up when modal is hidden
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            // Reset current editing field after modal is fully closed
            currentEditingField = null;
            console.log("Modal hidden, currentEditingField reset");
        });
    }

    // Simple Signature and Digital Signature Type Buttons
    const simpleSignatureBtn = document.getElementById("simpleSignatureBtn");
    const digitalSignatureBtn = document.getElementById("digitalSignatureBtn");
    let selectedSignatureType = "simple"; // Default to simple
    
    if (simpleSignatureBtn) {
        simpleSignatureBtn.addEventListener("click", () => {
            selectedSignatureType = "simple";
            simpleSignatureBtn.classList.add("active");
            if (digitalSignatureBtn) digitalSignatureBtn.classList.remove("active");
            console.log("Simple Signature selected");
        });
        // Set as active by default
        simpleSignatureBtn.classList.add("active");
    }
    
    if (digitalSignatureBtn) {
        digitalSignatureBtn.addEventListener("click", () => {
            selectedSignatureType = "digital";
            digitalSignatureBtn.classList.add("active");
            if (simpleSignatureBtn) simpleSignatureBtn.classList.remove("active");
            showAlert("Digital Signature is a premium feature. Using Simple Signature for now.", "primary");
            console.log("Digital Signature selected");
        });
    }

    // Edit Signature Buttons
    if (editSignatureBtn) {
        editSignatureBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentEditingField = "signature";
            
            // Ensure modal is initialized
            if (!signatureModal) {
                initializeModal();
            }
            
            if (signatureModal) {
                try {
                    // Set aria-hidden to false before showing
                    if (signatureModalElement) {
                        signatureModalElement.removeAttribute('aria-hidden');
                    }
                    signatureModal.show();
                    // Switch to draw tab by default
                    setTimeout(() => {
                        const drawTab = document.querySelector('.tab-button[data-tab="draw"]');
                        if (drawTab) {
                            drawTab.click();
                        }
                        adjustCanvasSizes();
                        // Focus first input or canvas to prevent aria-hidden warning
                        const firstInput = signatureModalElement.querySelector('input, canvas, button');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 300);
                } catch (error) {
                    console.error("Error showing modal:", error);
                    showAlert("Error opening signature editor. Please try again.", "danger");
                }
            } else {
                showAlert("Signature editor is not ready. Please refresh the page.", "warning");
            }
        });
    }

    if (editInitialsBtn) {
        editInitialsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentEditingField = "initials";
            
            // Ensure modal is initialized
            if (!signatureModal) {
                initializeModal();
            }
            
            if (signatureModal) {
                try {
                    // Set aria-hidden to false before showing
                    if (signatureModalElement) {
                        signatureModalElement.removeAttribute('aria-hidden');
                    }
                    signatureModal.show();
                    // Switch to draw tab by default
                    setTimeout(() => {
                        const drawTab = document.querySelector('.tab-button[data-tab="draw"]');
                        if (drawTab) {
                            drawTab.click();
                        }
                        adjustCanvasSizes();
                        // Focus first input or canvas to prevent aria-hidden warning
                        const firstInput = signatureModalElement.querySelector('input, canvas, button');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 300);
                } catch (error) {
                    console.error("Error showing modal:", error);
                    showAlert("Error opening initials editor. Please try again.", "danger");
                }
            } else {
                showAlert("Signature editor is not ready. Please refresh the page.", "warning");
            }
        });
    }
    
    // Add click handlers for all field types to enable click-to-place
    // Signature field - click to place (if signature exists) or edit
    if (signatureField) {
        signatureField.addEventListener('click', (e) => {
            // Don't trigger if clicking edit button or drag handle
            if (e.target.closest('.field-edit-btn') || e.target.closest('.drag-handle')) return;
            
            if (signatureData.signature && signatureData.signature.length > 100) {
                enterPlacementMode('signature', signatureField);
            } else {
                // If no signature, open edit modal
                if (editSignatureBtn) {
                    editSignatureBtn.click();
                }
            }
        });
    }
    
    // Initials field - click to place (if initials exists) or edit
    if (initialsField) {
        initialsField.addEventListener('click', (e) => {
            // Don't trigger if clicking edit button or drag handle
            if (e.target.closest('.field-edit-btn') || e.target.closest('.drag-handle')) return;
            
            if (signatureData.initials && signatureData.initials.length > 100) {
                enterPlacementMode('initials', initialsField);
            } else {
                // If no initials, open edit modal
                if (editInitialsBtn) {
                    editInitialsBtn.click();
                }
            }
        });
    }
    
    // Name field - click to place
    if (nameField) {
        nameField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle
            if (e.target.closest('.drag-handle')) return;
            
            e.preventDefault();
            e.stopPropagation();
            enterPlacementMode('name', nameField);
        });
    }
    
    // Date field - click to place
    if (dateField) {
        dateField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle
            if (e.target.closest('.drag-handle')) return;
            
            e.preventDefault();
            e.stopPropagation();
            enterPlacementMode('date', dateField);
        });
    }
    
    // Text field - click to place
    if (textField) {
        textField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle
            if (e.target.closest('.drag-handle')) return;
            
            e.preventDefault();
            e.stopPropagation();
            enterPlacementMode('text', textField);
        });
    }
    
    // Close modal when clicking close button or backdrop
    if (signatureModalElement) {
        // Wait for DOM to be ready
        setTimeout(() => {
            const closeButtons = signatureModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close, .btn-secondary');
            closeButtons.forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                });
            });
        }, 100);
        
        // Handle backdrop click - but prevent closing when clicking inside modal content
        signatureModalElement.addEventListener("click", (e) => {
            if (e.target === signatureModalElement) {
                if (signatureModal) {
                    signatureModal.hide();
                } else {
                    closeModal();
                }
            }
        });
        
        // Prevent closing when clicking inside modal content
        const modalContent = signatureModalElement.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }
    }

    // Helper function to close modal properly
    function closeModal() {
        console.log("Closing modal...");
        if (signatureModal) {
            try {
                // Remove aria-hidden before closing to prevent accessibility warnings
                if (signatureModalElement) {
                    signatureModalElement.removeAttribute('aria-hidden');
                }
                signatureModal.hide();
                
                // Wait for Bootstrap animation to complete, then clean up
                setTimeout(() => {
                    if (signatureModalElement) {
                        signatureModalElement.setAttribute('aria-hidden', 'true');
                        signatureModalElement.style.display = "none";
                        signatureModalElement.classList.remove("show");
                    }
                    document.body.classList.remove("modal-open");
                    document.body.style.overflow = "";
                    document.body.style.paddingRight = "";
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    console.log("Modal closed successfully");
                }, 300);
            } catch (error) {
                console.error("Error closing modal:", error);
                // Fallback manual close
                if (signatureModalElement) {
                    signatureModalElement.style.display = "none";
                    signatureModalElement.classList.remove("show");
                    signatureModalElement.setAttribute('aria-hidden', 'true');
                }
                document.body.classList.remove("modal-open");
                document.body.style.overflow = "";
                document.body.style.paddingRight = "";
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        } else if (signatureModalElement) {
            signatureModalElement.style.display = "none";
            signatureModalElement.classList.remove("show");
            signatureModalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            console.log("Modal closed (fallback)");
        }
    }
    
    // Type Tab - Generate Signatures - Initialize context properly
    function initializeSignatureCanvas() {
        if (signatureCanvas) {
            signatureCtx = signatureCanvas.getContext("2d", { willReadFrequently: true });
            if (signatureCtx) {
                signatureCtx.textAlign = "center";
                signatureCtx.textBaseline = "middle";
                signatureCtx.fillStyle = "#000000";
            }
        }
    }
    
    // Initialize signature canvas
    if (signatureCanvas) {
        initializeSignatureCanvas();
    }

    if (generateBtn && nameInput) {
        generateBtn.addEventListener("click", () => {
            const name = nameInput.value;
            if (!name) {
                showAlert("Please enter a name.", "warning");
                return;
            }
            const randomSignatures = generateSignatureOptions(name);
            displaySignatureOptions(randomSignatures);
        });
    }

    // Helper function to check if canvas has content
    function canvasHasContent(canvas, ctx) {
        if (!canvas || !ctx) {
            console.log("Canvas or context is null - canvas:", !!canvas, "ctx:", !!ctx);
            return false;
        }
        try {
            // Quick check: Try to get data URL first (fastest method)
            const dataURL = canvas.toDataURL('image/png');
            // A blank white canvas PNG data URL is typically around 20-50 characters
            // A canvas with actual content (even typed text) will be much longer (500+)
            if (dataURL && dataURL.length > 500) {
                console.log("Canvas has content (dataURL length check):", dataURL.length);
                return true;
            }
            
            // If dataURL is short, do pixel-level check as backup
            const sampleWidth = Math.min(canvas.width, 300);
            const sampleHeight = Math.min(canvas.height, 100);
            const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
            const data = imageData.data;
            
            // Check pixels for non-white content (for typed signatures with white background)
            let nonWhitePixels = 0;
            let nonTransparentPixels = 0;
            
            // Sample every 4th pixel for performance
            for (let i = 0; i < data.length; i += 16) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const alpha = data[i + 3];
                
                if (alpha > 10) { // Not fully transparent
                    nonTransparentPixels++;
                    // Check if pixel is not white (allowing some tolerance)
                    if (!(r > 235 && g > 235 && b > 235)) {
                        nonWhitePixels++;
                    }
                }
            }
            
            // Canvas has content if we found enough non-white pixels
            // Lower threshold for typed signatures which have white backgrounds
            const hasContent = nonWhitePixels > 3 || (nonTransparentPixels > 100 && nonWhitePixels > 1);
            console.log("Canvas content check - non-transparent:", nonTransparentPixels, "non-white:", nonWhitePixels, "hasContent:", hasContent);
            return hasContent;
        } catch (error) {
            console.error("Error checking canvas content:", error);
            // Final fallback: check data URL length
            try {
                const dataURL = canvas.toDataURL('image/png');
                return dataURL && dataURL.length > 500;
            } catch (e) {
                console.error("Error in fallback check:", e);
                return false;
            }
        }
    }
    
    // Get signature from active tab
    function getSignatureFromActiveTab() {
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) {
            console.log("No active tab found");
            return null;
        }
        
        const tabId = activeTab.dataset.tab;
        console.log("Getting signature from tab:", tabId);
        
        let canvas = null;
        let ctx = null;
        
        if (tabId === "draw") {
            canvas = drawCanvas;
            if (!drawCtx && canvas) {
                initializeDrawCanvas();
            }
            ctx = drawCtx;
        } else if (tabId === "upload") {
            canvas = uploadCanvas;
            if (!uploadCtx && canvas) {
                initializeUploadCanvas();
            }
            ctx = uploadCtx;
        } else if (tabId === "type") {
            canvas = signatureCanvas;
            if (!signatureCtx && canvas) {
                initializeSignatureCanvas();
            }
            ctx = signatureCtx;
        } else if (tabId === "history") {
            // History is handled separately
            console.log("History tab selected - user should click on a signature");
            return null;
        }
        
        if (!canvas) {
            console.log("Canvas not found for tab:", tabId);
            return null;
        }
        
        if (!ctx) {
            console.log("Context not found for canvas:", tabId);
            return null;
        }
        
        // Check if canvas has content
        const hasContent = canvasHasContent(canvas, ctx);
        if (!hasContent) {
            console.log("Canvas has no content for tab:", tabId);
            return null;
        }
        
        try {
            const dataURL = canvas.toDataURL('image/png');
            console.log("Successfully got signature data URL, length:", dataURL.length);
            return dataURL;
        } catch (error) {
            console.error("Error getting signature data:", error);
            return null;
        }
    }

    function generateSignatureOptions(name) {
        const fonts = ["Arial", "Courier", "Georgia", "Verdana", "Times New Roman", "Impact", "Comic Sans MS", "Trebuchet MS", "Lucida Sans", "Garamond", "Palatino", "Bookman", "Candara", "Optima", "Rockwell"];
        return fonts.map(font => ({ font, text: name }));
    }

    function displaySignatureOptions(signatures) {
        const previewsContainer = document.getElementById("signaturePreviews");
        if (!previewsContainer) return;
        previewsContainer.innerHTML = "";

        signatures.forEach(signature => {
            const option = document.createElement('div');
            option.textContent = signature.text;
            option.style.fontFamily = signature.font;
            option.classList.add('signature-option');
            option.addEventListener('click', () => drawSignature(signature));
            previewsContainer.appendChild(option);
        });
    }

    function drawSignature(signature) {
        if (!signatureCanvas) {
            console.error("Signature canvas not found");
            return;
        }
        if (!signatureCtx) {
            initializeSignatureCanvas();
        }
        if (!signatureCtx) {
            console.error("Signature context could not be initialized");
            return;
        }
        
        // Ensure canvas has proper size before drawing
        if (signatureCanvas.width === 0 || signatureCanvas.height === 0) {
            adjustCanvasSizes();
        }
        
        // Clear and draw signature
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureCtx.fillStyle = "#000000";
        signatureCtx.strokeStyle = "#000000";
        signatureCtx.font = `bold 48px "${signature.font}", Arial, sans-serif`;
        signatureCtx.textAlign = "center";
        signatureCtx.textBaseline = "middle";
        
        // Draw the text with black color
        signatureCtx.fillText(signature.text, signatureCanvas.width / 2, signatureCanvas.height / 2);
        
        console.log("Signature drawn on canvas:", signature.text, "font:", signature.font);
        console.log("Canvas dimensions:", signatureCanvas.width, "x", signatureCanvas.height);
    }

    // Draw Tab - Initialize context properly
    function initializeDrawCanvas() {
        if (drawCanvas) {
            drawCtx = drawCanvas.getContext("2d", { willReadFrequently: true });
            if (drawCtx) {
                drawCtx.strokeStyle = "#000000";
                drawCtx.lineWidth = 2;
                drawCtx.lineCap = "round";
                drawCtx.lineJoin = "round";
            }
        }
    }
    
    // Initialize draw canvas
    if (drawCanvas) {
        initializeDrawCanvas();
    }

    // Drawing event handlers for draw canvas
    if (drawCanvas) {
        // Initialize canvas if not already initialized
        if (!drawCtx) {
            initializeDrawCanvas();
        }
        
        drawCanvas.addEventListener("mousedown", (event) => {
            if (!drawCtx) {
                initializeDrawCanvas();
            }
            if (drawCtx) {
                isDrawing = true;
                const rect = drawCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                drawCtx.beginPath();
                drawCtx.moveTo(x, y);
                // Save current state for undo
                drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
            }
        });

        drawCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing && drawCtx) {
                const rect = drawCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                drawCtx.lineTo(x, y);
                drawCtx.stroke();
            }
        });

        drawCanvas.addEventListener("mouseup", () => {
            isDrawing = false;
            if (drawCtx) {
                drawCtx.closePath();
            }
        });

        drawCanvas.addEventListener("mouseleave", () => {
            if (isDrawing && drawCtx) {
                isDrawing = false;
                drawCtx.closePath();
            }
        });
        
        // Touch events for mobile support
        drawCanvas.addEventListener("touchstart", (event) => {
            event.preventDefault();
            if (!drawCtx) {
                initializeDrawCanvas();
            }
            if (drawCtx) {
                isDrawing = true;
                const touch = event.touches[0];
                const rect = drawCanvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                drawCtx.beginPath();
                drawCtx.moveTo(x, y);
                drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
            }
        });
        
        drawCanvas.addEventListener("touchmove", (event) => {
            event.preventDefault();
            if (isDrawing && drawCtx) {
                const touch = event.touches[0];
                const rect = drawCanvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                drawCtx.lineTo(x, y);
                drawCtx.stroke();
            }
        });
        
        drawCanvas.addEventListener("touchend", (event) => {
            event.preventDefault();
            isDrawing = false;
            if (drawCtx) {
                drawCtx.closePath();
            }
        });
    }

    if (undoBtn) {
        undoBtn.addEventListener("click", () => {
            if (!drawCtx) {
                initializeDrawCanvas();
            }
            if (drawCtx && drawHistory.length > 0) {
                drawCtx.putImageData(drawHistory.pop(), 0, 0);
            } else {
                showAlert("Nothing to undo.", "info");
            }
        });
    }

    // Clear buttons for draw and upload canvases
    if (clearDrawBtn && drawCanvas && drawCtx) {
        clearDrawBtn.addEventListener("click", () => {
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            drawHistory = [];
        });
    }
    
    if (clearUploadBtn && uploadCanvas && uploadCtx) {
        clearUploadBtn.addEventListener("click", () => {
            uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
            uploadHistory = [];
            if (imageUpload) {
                imageUpload.value = "";
            }
        });
    }

    // Upload Tab - Initialize context properly
    function initializeUploadCanvas() {
        if (uploadCanvas) {
            uploadCtx = uploadCanvas.getContext("2d", { willReadFrequently: true });
            if (uploadCtx) {
                uploadCtx.strokeStyle = "#000000";
                uploadCtx.lineWidth = 2;
                uploadCtx.lineCap = "round";
                uploadCtx.lineJoin = "round";
            }
        }
    }
    
    // Initialize upload canvas
    if (uploadCanvas) {
        initializeUploadCanvas();
    }

    if (imageUpload) {
        imageUpload.addEventListener("change", handleImageUpload);
    }

    // Drawing event handlers for upload canvas (for editing uploaded images)
    if (uploadCanvas) {
        // Initialize canvas if not already initialized
        if (!uploadCtx) {
            initializeUploadCanvas();
        }
        
        uploadCanvas.addEventListener("mousedown", (event) => {
            if (!uploadCtx) {
                initializeUploadCanvas();
            }
            if (uploadCtx) {
                isDrawing = true;
                const rect = uploadCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                uploadCtx.beginPath();
                uploadCtx.moveTo(x, y);
                uploadHistory.push(uploadCtx.getImageData(0, 0, uploadCanvas.width, uploadCanvas.height));
            }
        });

        uploadCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing && uploadCtx) {
                const rect = uploadCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                uploadCtx.lineTo(x, y);
                uploadCtx.stroke();
            }
        });

        uploadCanvas.addEventListener("mouseup", () => {
            isDrawing = false;
            if (uploadCtx) {
                uploadCtx.closePath();
            }
        });

        uploadCanvas.addEventListener("mouseleave", () => {
            if (isDrawing && uploadCtx) {
                isDrawing = false;
                uploadCtx.closePath();
            }
        });
    }

    if (undoBtnUpload) {
        undoBtnUpload.addEventListener("click", () => {
            if (!uploadCtx) {
                initializeUploadCanvas();
            }
            if (uploadCtx && uploadHistory.length > 0) {
                uploadCtx.putImageData(uploadHistory.pop(), 0, 0);
            } else {
                showAlert("Nothing to undo.", "info");
            }
        });
    }

    // Apply button - main button to apply signature from any tab
    if (applySignatureBtn) {
        applySignatureBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const activeTab = document.querySelector('.tab-button.active');
            if (!activeTab) {
                showAlert("Please select a tab to create a signature.", "warning");
                return;
            }
            
            const tabId = activeTab.dataset.tab;
            let dataURL = null;
            
            // Handle history tab separately
            if (tabId === "history") {
                showAlert("Please click on a signature from history to apply it.", "info");
                return;
            }
            
            // Get signature from active canvas
            dataURL = getSignatureFromActiveTab();
            
            if (!dataURL) {
                if (tabId === "type") {
                    showAlert("Please generate and select a signature style first.", "warning");
                } else if (tabId === "draw") {
                    showAlert("Please draw a signature first.", "warning");
                } else if (tabId === "upload") {
                    showAlert("Please upload an image first.", "warning");
                }
                return;
            }
            
            // Validate data URL format
            if (!dataURL || typeof dataURL !== 'string') {
                console.error("Invalid signature data - not a string. Type:", typeof dataURL);
                showAlert("Signature data is invalid. Please try again.", "danger");
                return;
            }
            
            if (!dataURL.startsWith('data:image')) {
                console.error("Invalid signature data URL format. Starts with:", dataURL.substring(0, 20));
                showAlert("Invalid signature format. Please create a signature again.", "danger");
                return;
            }
            
            // Check length - blank white canvas PNG is ~20-50 chars
            // Typed signatures with text should be 300+ chars, drawn/uploaded 500+
            if (dataURL.length < 150) {
                console.error("Signature data URL too short - likely empty canvas. Length:", dataURL.length);
                showAlert("Signature appears to be empty. Please create a signature first.", "warning");
                return;
            }
            
            console.log("Applying signature from tab:", tabId);
            console.log("Data URL length:", dataURL.length);
            console.log("Data URL preview:", dataURL.substring(0, 50) + "...");
            console.log("Current editing field:", currentEditingField);
            
            if (!currentEditingField) {
                showAlert("No field selected. Please click 'Edit' on Signature or Initials field first.", "warning");
                return;
            }
            
            // Apply signature to field - this will validate and apply
            const success = applySignatureToField(dataURL);
            
            if (success) {
                // Save to history
                saveToHistory(dataURL);
                
                // Close modal after a short delay to allow UI update
                setTimeout(() => {
                    closeModal();
                }, 300);
            } else {
                console.error("Failed to apply signature");
                // Don't close modal if application failed - let user try again
            }
        });
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|svg)$/i)) {
            showAlert("Please upload a valid image file (PNG, JPG, or SVG).", "danger");
            return;
        }
        
        if (uploadCanvas) {
            // Initialize context if needed
            if (!uploadCtx) {
                initializeUploadCanvas();
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate dimensions to fit canvas while maintaining aspect ratio
                    const canvasWidth = uploadCanvas.width;
                    const canvasHeight = uploadCanvas.height;
                    const imgAspect = img.width / img.height;
                    const canvasAspect = canvasWidth / canvasHeight;
                    
                    let drawWidth, drawHeight, x, y;
                    
                    if (imgAspect > canvasAspect) {
                        // Image is wider
                        drawWidth = canvasWidth;
                        drawHeight = canvasWidth / imgAspect;
                        x = 0;
                        y = (canvasHeight - drawHeight) / 2;
                    } else {
                        // Image is taller
                        drawHeight = canvasHeight;
                        drawWidth = canvasHeight * imgAspect;
                        x = (canvasWidth - drawWidth) / 2;
                        y = 0;
                    }
                    
                    if (uploadCtx) {
                        uploadCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                        uploadCtx.drawImage(img, x, y, drawWidth, drawHeight);
                        uploadHistory = [];
                        showAlert("Image uploaded successfully. You can draw on it if needed.", "success");
                    }
                };
                img.onerror = () => {
                    showAlert("Failed to load image. Please try another file.", "danger");
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                showAlert("Failed to read file. Please try again.", "danger");
            };
            reader.readAsDataURL(file);
        }
    }

    // History Tab
    function updateHistory() {
        const savedHistory = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        if (savedHistory.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "text-muted text-center";
            emptyMsg.style.width = "100%";
            emptyMsg.textContent = "No saved signatures yet. Create a signature to see it here.";
            historyContainer.appendChild(emptyMsg);
        } else {
            savedHistory.forEach((dataURL, index) => {
                const img = document.createElement("img");
                img.src = dataURL;
                img.classList.add('history-image');
                img.alt = `Saved signature ${index + 1}`;
                img.title = "Click to use this signature";
                img.addEventListener("click", () => {
                    if (!currentEditingField) {
                        showAlert("Please click 'Edit' on Signature or Initials field first.", "warning");
                        return;
                    }
                    console.log("Applying signature from history");
                    const success = applySignatureToField(dataURL);
                    if (success) {
                        setTimeout(() => {
                            closeModal();
                        }, 300);
                    }
                });
                historyContainer.appendChild(img);
            });
        }
    }

    function saveToHistory(dataURL) {
        const historyData = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        historyData.push(dataURL);
        localStorage.setItem("signatureHistory", JSON.stringify(historyData));
        updateHistory();
    }

    // Apply signature to the current editing field
    function applySignatureToField(dataURL) {
        console.log("applySignatureToField called - currentEditingField:", currentEditingField);
        console.log("Data URL length:", dataURL ? dataURL.length : 0);
        
        // Validate data URL
        if (!dataURL) {
            console.error("Data URL is null or undefined");
            showAlert("Signature data is invalid. Please try again.", "danger");
            return false;
        }
        
        if (typeof dataURL !== 'string') {
            console.error("Data URL is not a string. Type:", typeof dataURL);
            showAlert("Invalid signature data type. Please try again.", "danger");
            return false;
        }
        
        if (!dataURL.startsWith('data:image')) {
            console.error("Invalid data URL format. Starts with:", dataURL.substring(0, 30));
            showAlert("Invalid signature format. Please create a signature again.", "danger");
            return false;
        }
        
        // Check length - blank white canvas PNG is ~20-50 chars
        // Real signatures (typed, drawn, or uploaded) should be much longer
        if (dataURL.length < 150) {
            console.error("Signature data URL too short. Length:", dataURL.length);
            showAlert("Signature appears to be empty. Please create a signature first.", "warning");
            return false;
        }
        
        if (!currentEditingField) {
            console.error("No current editing field set");
            showAlert("No field selected. Please click 'Edit' on Signature or Initials field first.", "warning");
            return false;
        }
        
        if (currentEditingField === "signature") {
            signatureData.signature = dataURL;
            if (signatureInput) {
                signatureInput.value = "Signature created ✓";
                signatureInput.style.fontStyle = "italic";
                signatureInput.style.color = "#28a745";
                signatureInput.style.fontWeight = "600";
                console.log("✓ Signature applied to signature field");
                
                // Store for drag and drop (update global state)
                draggedSignatureType = "signature";
                draggedSignatureData = dataURL;
                
                // Make signature field draggable immediately
                setTimeout(() => {
                    makeFieldDraggable("signatureField", "signature", dataURL);
                }, 100);
            } else {
                console.error("✗ Signature input element not found");
                return false;
            }
        } else if (currentEditingField === "initials") {
            signatureData.initials = dataURL;
            if (initialsInput) {
                initialsInput.value = "Initials created ✓";
                initialsInput.style.fontStyle = "italic";
                initialsInput.style.color = "#28a745";
                initialsInput.style.fontWeight = "600";
                console.log("✓ Signature applied to initials field");
                
                // Store for drag and drop (update global state)
                draggedSignatureType = "initials";
                draggedSignatureData = dataURL;
                
                // Make initials field draggable immediately
                setTimeout(() => {
                    makeFieldDraggable("initialsField", "initials", dataURL);
                }, 100);
            } else {
                console.error("✗ Initials input element not found");
                return false;
            }
        } else {
            console.warn("Unknown editing field:", currentEditingField);
            return false;
        }
        
        // Don't reset currentEditingField immediately - let it be reset after modal closes
        // This allows the user to change their mind and select a different signature
        console.log("Signature successfully applied!");
        return true;
    }

    // Load history on page load
    updateHistory();

    // Sign PDF Button - Use pdf-lib to embed signatures client-side
    if (signPdfBtn) {
        signPdfBtn.addEventListener("click", async () => {
            if (!pdfFile) {
                showAlert("Please upload a PDF file first.", "warning");
                return;
            }

            if (!placedSignatures || Object.keys(placedSignatures).length === 0) {
                showAlert("Please place at least one signature on the PDF by dragging it to the document.", "warning");
                return;
            }

            // Check if pdf-lib is available
            if (typeof PDFLib === 'undefined') {
                showAlert("PDF library not loaded. Please refresh the page.", "danger");
                return;
            }

            signPdfBtn.disabled = true;
            signPdfBtn.innerHTML = 'Signing PDF... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            try {
                // Check if PDF is already loaded
                if (!pdfDoc) {
                    showAlert("PDF is not loaded. Please upload a PDF file first.", "warning");
                    return;
                }
                
                // Read the original PDF file for pdf-lib
                const arrayBuffer = await pdfFile.arrayBuffer();
                
                // Load the PDF document using pdf-lib
                const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                
                // Use existing pdfDoc (PDF.js) that was already loaded - DON'T reload it
                // pdfDoc is already available from when user uploaded the file
                
                // Embed Helvetica font once for all text fields (if there are any text fields)
                let hasTextFields = false;
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    if (placedSignatures[pageNum]) {
                        hasTextFields = placedSignatures[pageNum].some(f => f.type === 'name' || f.type === 'date' || f.type === 'text');
                        if (hasTextFields) break;
                    }
                }
                
                let helveticaFont = null;
                if (hasTextFields) {
                    helveticaFont = await pdfLibDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                }
                
                // Process each page with placed signatures
                const pages = pdfLibDoc.getPages();
                const totalPages = pdfDoc.numPages;
                
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    if (!placedSignatures[pageNum] || placedSignatures[pageNum].length === 0) {
                        continue;
                    }
                    
                    const pdfLibPage = pages[pageNum - 1]; // pdf-lib uses 0-based indexing
                    const { width: pageWidth, height: pageHeight } = pdfLibPage.getSize();
                    
                    // Get PDF.js page using the existing pdfDoc (0-based index)
                    let scaledViewport;
                    try {
                        const pdfJsPage = await pdfDoc.getPage(pageNum - 1);
                        
                        // Calculate the scale that was used for rendering (same as in renderCurrentPage)
                        const containerWidth = documentPreviewArea ? (documentPreviewArea.clientWidth || documentPreviewArea.offsetWidth) - 16 : 800;
                        const maxWidth = Math.min(containerWidth, 1200);
                        const viewport = pdfJsPage.getViewport({ scale: 1.0 });
                        const calculatedScale = Math.min(maxWidth / viewport.width, 2.0);
                        scaledViewport = pdfJsPage.getViewport({ scale: calculatedScale });
                        
                        console.log(`Page ${pageNum}: PDF size (${pageWidth.toFixed(2)} x ${pageHeight.toFixed(2)}), Viewport (${scaledViewport.width.toFixed(2)} x ${scaledViewport.height.toFixed(2)})`);
                    } catch (pdfJsError) {
                        console.error(`Error getting PDF.js page ${pageNum}:`, pdfJsError);
                        // Fallback: use page dimensions directly
                        scaledViewport = { width: pageWidth, height: pageHeight };
                        console.log(`Using fallback viewport for page ${pageNum}: (${pageWidth} x ${pageHeight})`);
                    }
                    
                    // Calculate scale factors (rendered viewport pixels to PDF points)
                    // The signature positions are stored in viewport pixel coordinates
                    const scaleX = pageWidth / scaledViewport.width;
                    const scaleY = pageHeight / scaledViewport.height;
                    
                    console.log(`Page ${pageNum} scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
                    
                    // Embed each field on this page (signatures/images and text fields)
                    for (const field of placedSignatures[pageNum]) {
                        try {
                            // Handle signature/initials (image-based fields)
                            if (field.type === 'signature' || field.type === 'initials') {
                                if (!field.dataURL || field.dataURL.length < 100) {
                                    console.warn(`Skipping invalid ${field.type} on page ${pageNum}`);
                                    continue;
                                }
                                
                                // Convert data URL to PNG bytes
                                const base64Data = field.dataURL.split(',')[1];
                                if (!base64Data) {
                                    console.error(`Invalid data URL format for ${field.type} on page ${pageNum}`);
                                    continue;
                                }
                                
                                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                                
                                // Embed the PNG image
                                const signatureImage = await pdfLibDoc.embedPng(imageBytes);
                                
                                // Calculate position in PDF coordinates
                                const sigWidth = field.width || 200;
                                const sigHeight = field.height || 60;
                                
                                // Convert viewport coordinates to PDF coordinates
                                const pdfX = field.x * scaleX;
                                // Y coordinate needs to be flipped: PDF y = pageHeight - (viewportY + sigHeight) * scaleY
                                const pdfY = pageHeight - (field.y * scaleY) - (sigHeight * scaleY);
                                const pdfWidth = sigWidth * scaleX;
                                const pdfHeight = sigHeight * scaleY;
                                
                                console.log(`Drawing ${field.type} on page ${pageNum}:`);
                                console.log(`  Viewport position: (${field.x.toFixed(2)}, ${field.y.toFixed(2)}) size: (${sigWidth}, ${sigHeight})`);
                                console.log(`  PDF position: (${pdfX.toFixed(2)}, ${pdfY.toFixed(2)}) size: (${pdfWidth.toFixed(2)}, ${pdfHeight.toFixed(2)})`);
                                
                                // Draw signature on PDF page
                                pdfLibPage.drawImage(signatureImage, {
                                    x: pdfX,
                                    y: pdfY,
                                    width: pdfWidth,
                                    height: pdfHeight,
                                });
                            }
                            // Handle text fields (Name, Date, Text)
                            else if (field.type === 'name' || field.type === 'date' || field.type === 'text') {
                                if (!helveticaFont) {
                                    console.error(`Helvetica font not embedded, cannot draw text for ${field.type} on page ${pageNum}`);
                                    continue;
                                }
                                
                                const fieldWidth = field.width || 200;
                                const fieldHeight = field.height || 30;
                                let text = field.text || '';
                                
                                // Set default text if empty
                                if (!text || text.trim() === '') {
                                    if (field.type === 'name') {
                                        text = 'Name';
                                    } else if (field.type === 'date') {
                                        text = new Date().toLocaleDateString();
                                    } else {
                                        text = 'Text';
                                    }
                                }
                                
                                // Calculate position in PDF coordinates
                                const pdfX = field.x * scaleX;
                                const pdfY = pageHeight - (field.y * scaleY) - (fieldHeight * scaleY);
                                const fontSize = Math.max(10, Math.min(16, fieldHeight * scaleY * 0.6)); // Reasonable font size (10-16pt)
                                
                                console.log(`Drawing ${field.type} text on page ${pageNum}:`);
                                console.log(`  Viewport position: (${field.x.toFixed(2)}, ${field.y.toFixed(2)})`);
                                console.log(`  PDF position: (${pdfX.toFixed(2)}, ${pdfY.toFixed(2)}) text: "${text}" fontSize: ${fontSize.toFixed(2)}`);
                                
                                // Draw text on PDF page
                                pdfLibPage.drawText(text, {
                                    x: pdfX + 4, // Small padding from left
                                    y: pdfY + fontSize + 2, // Position text in middle of field (accounting for font baseline)
                                    size: fontSize,
                                    color: PDFLib.rgb(0, 0, 0),
                                    font: helveticaFont,
                                });
                                
                                // Draw border/box around text field (optional, comment out if not needed)
                                pdfLibPage.drawRectangle({
                                    x: pdfX,
                                    y: pdfY,
                                    width: fieldWidth * scaleX,
                                    height: fieldHeight * scaleY,
                                    borderColor: PDFLib.rgb(0.7, 0.7, 0.7),
                                    borderWidth: 0.5,
                                });
                            }
                            
                        } catch (fieldError) {
                            console.error(`Error embedding ${field.type} on page ${pageNum}:`, fieldError);
                            console.error("Error details:", fieldError.message);
                        }
                    }
                }
                
                // Save the PDF
                const pdfBytes = await pdfLibDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const fileName = `signed_${pdfFile.name.replace('.pdf', '')}_${Date.now()}.pdf`;
                
                // Download the signed PDF
                downloadFile(blob, fileName);
                
            } catch (error) {
                showAlert("An error occurred while signing the PDF: " + error.message, "danger");
                console.error("Sign PDF error:", error);
                console.error("Error stack:", error.stack);
            } finally {
                if (signPdfBtn) {
                    signPdfBtn.disabled = false;
                    signPdfBtn.textContent = "Sign PDF";
                }
            }
        });
    }

    function downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert("PDF signed successfully! Download starting...", "success");
    }

    // Initialize
    updatePageNavigation();
    updateUIState(false);

    // Verify critical elements exist
    if (!pdfInput) {
        console.error('PDF input element not found!');
        showAlert('PDF upload functionality not available. Please refresh the page.', 'danger');
    } else {
        console.log('PDF input element found');
    }
    if (!selectFilesBtn) {
        console.warn('Select files button not found!');
    } else {
        console.log('Select files button found');
    }
    if (!editSignatureBtn) {
        console.warn('Edit signature button not found!');
    }
    if (!signPdfBtn) {
        console.error('Sign PDF button not found!');
    }

    // Check PDF.js availability
    if (typeof pdfjsLib === 'undefined') {
        console.warn('PDF.js library not yet loaded - will check again when needed');
    } else {
        console.log('PDF.js library available');
    }

    console.log('Signature module initialized successfully');
});
