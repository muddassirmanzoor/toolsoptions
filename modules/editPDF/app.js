document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const uploadSection = document.getElementById("uploadSection");
    const editingSection = document.getElementById("editingSection");
    const canvasContainer = document.getElementById("canvasContainer");
    // Removed pageSelect - showing all pages now
    
    // Upload UI Elements
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
    
    // Editing UI Elements
    const addTextBtn = document.getElementById("addTextBtn");
    const addImageBtn = document.getElementById("addImageBtn");
    const addRectBtn = document.getElementById("addRectBtn");
    const addCircleBtn = document.getElementById("addCircleBtn");
    const addLineBtn = document.getElementById("addLineBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const resetPdfBtn = document.getElementById("resetPdfBtn");
    const imageInput = document.getElementById("imageInput");
    const textModal = new bootstrap.Modal(document.getElementById("textModal"));
    const confirmTextBtn = document.getElementById("confirmTextBtn");
    
    // Text Formatting Toolbar Elements
    const textFormatToolbar = document.getElementById("textFormatToolbar");
    const fontFamilySelect = document.getElementById("fontFamilySelect");
    const fontSizeSelect = document.getElementById("fontSizeSelect");
    const boldBtn = document.getElementById("boldBtn");
    const italicBtn = document.getElementById("italicBtn");
    const underlineBtn = document.getElementById("underlineBtn");
    const alignLeftBtn = document.getElementById("alignLeftBtn");
    const alignCenterBtn = document.getElementById("alignCenterBtn");
    const alignRightBtn = document.getElementById("alignRightBtn");
    const textColorPicker = document.getElementById("textColorPicker");
    const deleteTextBtn = document.getElementById("deleteTextBtn");
    
    // Track currently editing text span
    let currentEditingTextSpan = null;
    
    // State
    let pdfFile = null;
    let pdfJsDoc = null;
    let pdfLibDoc = null;
    let currentPageNumber = 1;
    let scale = 1.0;
    let pdfBytes = null;
    let editingObjects = {}; // Store editing objects per page (newly added elements)
    let pdfTextItems = {}; // Store extracted text items from PDF per page
    let editedTextItems = {}; // Store edited text items (textId -> {content, x, y, fontSize, color})
    let currentCanvas = null;
    let currentViewport = null;
    let draggedElement = null;
    let dragOffset = { x: 0, y: 0 };
    let selectedElement = null;
    let selectedOverlayObject = null; // Track selected overlay object (for tool-added elements)
    
    // Initialize PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // Upload event listeners
    if (selectFilesBtn) selectFilesBtn.addEventListener("click", () => {
        if (pdfInput) pdfInput.click();
    });
    if (addBtn) addBtn.addEventListener("click", () => {
        if (pdfInput) pdfInput.click();
    });
    if (computerBtn) computerBtn.addEventListener("click", () => {
        if (pdfInput) pdfInput.click();
    });
    if (initialGoogleDriveBtn) initialGoogleDriveBtn.addEventListener("click", () => showAlert("Google Drive integration coming soon!", 'primary'));
    if (initialDropboxBtn) initialDropboxBtn.addEventListener("click", () => showAlert("Dropbox integration coming soon!", 'primary'));
    if (googleDriveBtn) googleDriveBtn.addEventListener("click", () => showAlert("Google Drive integration coming soon!", 'primary'));
    if (dropboxBtn) dropboxBtn.addEventListener("click", () => showAlert("Dropbox integration coming soon!", 'primary'));
    
    if (pdfInput) {
    pdfInput.addEventListener("change", handleFileSelection);
    }
    
    // Drag and drop
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
            if (files.length > 0 && files[0].type === "application/pdf") {
                handleDroppedFile(files[0]);
        } else {
                showAlert("Please drop a valid PDF file.", 'danger');
            }
        });
    }
    
    // Editing event listeners
    if (addTextBtn) {
        addTextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!pdfJsDoc) {
                showAlert("Please upload a PDF first.", 'warning');
                return;
            }
            if (textModal) {
                textModal.show();
            }
        });
    }
    
    if (addImageBtn) {
        addImageBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!pdfJsDoc) {
                showAlert("Please upload a PDF first.", 'warning');
                return;
            }
            if (imageInput) {
                imageInput.click();
            }
        });
    }
    
    if (addRectBtn) {
        addRectBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            addShape('rectangle');
        });
    }
    
    if (addCircleBtn) {
        addCircleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            addShape('circle');
        });
    }
    
    if (addLineBtn) {
        addLineBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            addShape('line');
        });
    }
    
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => { 
        scale = Math.min(scale + 0.2, 3.0); 
        if (pdfJsDoc) renderAllPages(); 
    });
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => { 
        scale = Math.max(scale - 0.2, 0.5); 
        if (pdfJsDoc) renderAllPages(); 
    });
    if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", downloadEditedPDF);
    if (resetPdfBtn) resetPdfBtn.addEventListener("click", resetPDF);
    // Remove page select since we're showing all pages
    if (confirmTextBtn) confirmTextBtn.addEventListener("click", handleTextAddition);
    if (imageInput) imageInput.addEventListener("change", handleImageAddition);
    
    function handleDroppedFile(file) {
        if (file && file.type === "application/pdf") {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            if (pdfInput) {
                pdfInput.files = dataTransfer.files;
                handleFileSelection({ target: pdfInput });
            }
        }
    }
    
    async function handleFileSelection(event) {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) {
            showAlert("Please select a PDF file.", 'warning');
            return;
        }
        
        if (file.type !== "application/pdf") {
            showAlert("Please upload a valid PDF file.", 'danger');
            return;
        }
        
        pdfFile = file;
        
        try {
            showAlert("Loading PDF...", 'info');
            
            // Check if PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                showAlert("PDF.js library is not loaded. Please refresh the page.", 'danger');
                return;
            }
            
            // Check if PDF-lib is loaded
            if (typeof PDFLib === 'undefined') {
                showAlert("PDF-lib library is not loaded. Please refresh the page.", 'danger');
                return;
            }
            
            // Set worker source
            if (pdfjsLib.GlobalWorkerOptions) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
            
            // Read file as array buffer - need separate copies for each library to avoid detached ArrayBuffer error
            const fileArrayBuffer = await file.arrayBuffer();
            pdfBytes = fileArrayBuffer;
            
            // Create a proper copy of the ArrayBuffer for PDF-lib
            const pdfLibBytes = fileArrayBuffer.slice(0);
            
            // Load PDF with PDF.js for rendering (using Uint8Array view of original)
            pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) }).promise;
            
            // Load PDF with PDF-lib for editing (using copied ArrayBuffer)
            pdfLibDoc = await PDFLib.PDFDocument.load(pdfLibBytes);
            
            // Extract text from all pages
            await extractAllText();
            
            updateFileDisplay();
            updateUIState(true);
            await renderAllPages();
            
            // Show editing section
            if (uploadSection) uploadSection.style.display = 'none';
            if (editingSection) editingSection.style.display = 'block';
            
            // Show floating download button
            if (downloadPdfBtn) downloadPdfBtn.style.display = 'flex';
            
            showAlert("PDF loaded successfully! Click any text to edit it. Scroll to see all pages.", 'success');
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Error loading PDF: " + (error.message || "Please try another file."), 'danger');
        }
    }
    
    async function extractAllText() {
        pdfTextItems = {};
        editedTextItems = {};
        
        for (let pageNum = 1; pageNum <= pdfJsDoc.numPages; pageNum++) {
            try {
                const page = await pdfJsDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                pdfTextItems[pageNum] = textContent.items;
            } catch (error) {
                console.error(`Error extracting text from page ${pageNum}:`, error);
                pdfTextItems[pageNum] = [];
            }
        }
    }
    
    function updateFileDisplay() {
        if (!fileList || !pdfFile) return;
        
        fileList.innerHTML = "";
        const divItem = document.createElement("div");
        divItem.classList.add("pdf-thumbnail");
        
        const imgItem = document.createElement("img");
        imgItem.src = '/assests/pdf 2.png';
        imgItem.alt = pdfFile.name;
        imgItem.classList.add("pdf-icon-preview");
        
        const fileName = document.createElement("div");
        fileName.classList.add("pdf-file-name");
        fileName.textContent = pdfFile.name;
        
        const delDiv = document.createElement("div");
        delDiv.classList.add("delete-icon");
        const delImg = document.createElement("img");
        delImg.src = '/assests/Group 85.png';
        delImg.alt = 'Delete Icon';
        delDiv.addEventListener("click", resetPDF);
        delDiv.appendChild(delImg);
        
        divItem.appendChild(imgItem);
        divItem.appendChild(fileName);
        divItem.appendChild(delDiv);
        fileList.appendChild(divItem);
    }
    
    function updateUIState(hasFiles) {
        if (hasFiles) {
            if (initialUploadState) initialUploadState.style.display = 'none';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'flex';
            if (fileContainer) fileContainer.classList.add('has-files');
        } else {
            if (initialUploadState) initialUploadState.style.display = 'flex';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'none';
            if (fileContainer) fileContainer.classList.remove('has-files');
        }
    }
    
    // Removed updatePageSelect - showing all pages now
    
    async function renderAllPages() {
        if (!pdfJsDoc || !canvasContainer) return;
        
        try {
            canvasContainer.innerHTML = "";
            
            // Calculate optimal scale based on container width to ensure PDF fits
            const containerWidth = canvasContainer.clientWidth || 800;
            const firstPage = await pdfJsDoc.getPage(1);
            const firstViewport = firstPage.getViewport({ scale: 1.0 });
            const maxWidth = containerWidth - 80; // Account for padding
            const fitScale = maxWidth / firstViewport.width;
            const actualScale = Math.max(0.5, Math.min(scale, fitScale, 2.0)); // Limit between 0.5x and 2.0x, but fit to container
            
            // Render all pages
            for (let pageNum = 1; pageNum <= pdfJsDoc.numPages; pageNum++) {
                const page = await pdfJsDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: actualScale });
                
                // Create page wrapper
                const pageWrapper = document.createElement("div");
                pageWrapper.className = "pdf-page-wrapper";
                pageWrapper.setAttribute("data-page-number", pageNum);
                pageWrapper.style.position = "relative";
                pageWrapper.style.marginBottom = "20px";
                pageWrapper.style.display = "flex";
                pageWrapper.style.flexDirection = "column";
                pageWrapper.style.alignItems = "center";
                
                // Create wrapper for canvas and overlays
                const wrapper = document.createElement("div");
                wrapper.className = "pdf-wrapper";
                wrapper.style.position = "relative";
                wrapper.style.display = "inline-block";
                
                const canvas = document.createElement("canvas");
                canvas.className = "pdf-canvas";
                canvas.setAttribute("data-page-number", pageNum);
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const context = canvas.getContext("2d");
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
                
        await page.render(renderContext).promise;

                // Cover PDF text with white rectangles to prevent shadow/double text
                await coverPdfTextWithWhiteRectanglesForPage(canvas, viewport, page, pageNum);
                
                wrapper.appendChild(canvas);
                
                // Create overlay container for editable text elements
                const overlayContainer = document.createElement("div");
                overlayContainer.className = "text-overlay-container";
                overlayContainer.setAttribute("data-page-number", pageNum);
                overlayContainer.style.position = "absolute";
                overlayContainer.style.top = "0";
                overlayContainer.style.left = "0";
                overlayContainer.style.width = viewport.width + "px";
                overlayContainer.style.height = viewport.height + "px";
                overlayContainer.style.pointerEvents = "none";
                
                wrapper.appendChild(overlayContainer);
                
                // Create draggable overlay container for editing objects
                const editingOverlayContainer = document.createElement("div");
                editingOverlayContainer.className = "editing-overlay-container";
                editingOverlayContainer.setAttribute("data-page-number", pageNum);
                editingOverlayContainer.style.position = "absolute";
                editingOverlayContainer.style.top = "0";
                editingOverlayContainer.style.left = "0";
                editingOverlayContainer.style.width = viewport.width + "px";
                editingOverlayContainer.style.height = viewport.height + "px";
                editingOverlayContainer.style.pointerEvents = "auto";
                
                wrapper.appendChild(editingOverlayContainer);
                
                // Render editing objects (newly added elements) on canvas
                // Skip text rendering on canvas (shown as draggable overlay instead)
                renderEditingObjectsForPage(canvas, viewport, pageNum, actualScale, true);
                
                // Create draggable overlays for editing objects
                createDraggableOverlaysForPage(editingOverlayContainer, viewport, pageNum, actualScale);
                
                // Create clickable, editable text overlays
                await createEditableTextLayerForPage(page, viewport, overlayContainer, pageNum);
                
                // Add page label
                const pageLabel = document.createElement("div");
                pageLabel.className = "page-label";
                pageLabel.textContent = `Page ${pageNum}`;
                pageLabel.style.textAlign = "center";
                pageLabel.style.marginBottom = "10px";
                pageLabel.style.fontWeight = "bold";
                pageLabel.style.color = "#666";
                
                pageWrapper.appendChild(pageLabel);
                pageWrapper.appendChild(wrapper);
                canvasContainer.appendChild(pageWrapper);
            }
        } catch (error) {
            console.error("Error rendering pages:", error);
            showAlert("Error rendering PDF pages: " + (error.message || ""), 'danger');
        }
    }
    
    // Cover PDF text areas with white rectangles to prevent shadow effect
    async function coverPdfTextWithWhiteRectanglesForPage(canvas, viewport, page, pageNum) {
        if (!pdfTextItems[pageNum]) return;
        
        const textItems = pdfTextItems[pageNum];
        const context = canvas.getContext("2d");
        
        // Group text items into words/lines
        const textGroups = groupTextItemsIntoWords(textItems);
        
        // Draw white rectangles over each text group to cover original PDF text
        textGroups.forEach((group) => {
            if (!group.text || group.text.trim() === '') return;
            
            const firstItem = group.items[0];
            const lastItem = group.items[group.items.length - 1];
            const transform = firstItem.transform;
            const x = transform[4];
            const y = transform[5];
            const fontSize = Math.abs(transform[0]) || Math.abs(transform[2]) || 12;
            
            const lastX = lastItem.transform[4];
            const lastWidth = lastItem.width * fontSize;
            const width = (lastX + lastWidth) - x;
            const height = fontSize * 1.3;
            
            // Transform coordinates
            const viewportX = x * scale;
            const viewportY = viewport.height - (y * scale);
            
            // Draw white rectangle to cover original text
            context.fillStyle = "#FFFFFF";
            context.fillRect(
                viewportX - 2,
                (viewportY - (fontSize * scale)) - 3,
                (width * scale) + 4,
                (height * scale) + 6
            );
        });
    }
    
    // Create editable text layer - grouped text editing with proper positioning
    async function createEditableTextLayerForPage(page, viewport, overlayContainer, pageNum) {
        if (!pdfTextItems[pageNum]) return;
        
        const textItems = pdfTextItems[pageNum];
        const textLayerDiv = document.createElement("div");
        textLayerDiv.className = "text-layer";
        textLayerDiv.style.position = "absolute";
        textLayerDiv.style.top = "0";
        textLayerDiv.style.left = "0";
        textLayerDiv.style.width = viewport.width + "px";
        textLayerDiv.style.height = viewport.height + "px";
        textLayerDiv.style.fontSize = "0";
        textLayerDiv.style.overflow = "visible";
        
        // Group text items into words/lines to preserve text integrity
        const textGroups = groupTextItemsIntoWords(textItems);
        
        // Process each group (word or line) for editing
        textGroups.forEach((group, groupIndex) => {
            if (!group.text || group.text.trim() === '') return;
            
            const firstItem = group.items[0];
            const lastItem = group.items[group.items.length - 1];
            
            // Get transform matrix values from first item
            const transform = firstItem.transform;
            const x = transform[4];
            const y = transform[5];
            const fontSize = Math.abs(transform[0]) || Math.abs(transform[2]) || 12;
            
            // Calculate width from first to last item
            const lastX = lastItem.transform[4];
            const lastWidth = lastItem.width * fontSize;
            const width = (lastX + lastWidth) - x;
            
            // Transform from PDF coordinates to viewport coordinates
            const viewportX = x * scale;
            const viewportY = viewport.height - (y * scale); // Flip Y coordinate
            
            // Check if this text has been edited
            const textId = `text-${pageNum}-${groupIndex}`;
            const editedText = editedTextItems[textId];
            const displayText = editedText ? editedText.content : group.text;
            const actualFontSize = editedText ? editedText.fontSize : fontSize;
            
            // Create editable text span
            const textSpan = document.createElement("span");
            textSpan.className = "editable-text-span";
            textSpan.style.position = "absolute";
            textSpan.style.left = viewportX + "px";
            textSpan.style.top = (viewportY - (actualFontSize * scale)) + "px";
            textSpan.style.fontSize = (actualFontSize * scale) + "px";
            textSpan.style.fontFamily = firstItem.fontName || 'Arial, sans-serif';
            const textColor = editedText ? (editedText.color || "#000000") : "#000000";
            textSpan.style.color = textColor;
            textSpan.style.cursor = "text";
            textSpan.style.whiteSpace = "pre";
            textSpan.style.lineHeight = "1";
            textSpan.style.userSelect = "text";
            textSpan.style.padding = "0";
            textSpan.style.margin = "0";
            textSpan.style.backgroundColor = "transparent";
            textSpan.style.border = "none";
            textSpan.style.borderRadius = "0";
            textSpan.style.transition = "background-color 0.15s ease";
            textSpan.style.display = "inline-block";
            textSpan.style.verticalAlign = "baseline";
            textSpan.style.textShadow = "none";
            textSpan.style.filter = "none";
            textSpan.textContent = displayText;
            textSpan.contentEditable = false;
            textSpan.style.pointerEvents = "auto";
            
            // Store metadata
            textSpan.setAttribute("data-text-id", textId);
            textSpan.setAttribute("data-x", x.toString());
            textSpan.setAttribute("data-y", y.toString());
            textSpan.setAttribute("data-font-size", actualFontSize.toString());
            textSpan.setAttribute("data-width", width.toString());
            textSpan.setAttribute("data-original-text", group.text);
            textSpan.setAttribute("data-font-name", firstItem.fontName || 'Arial');
            
            // Hover effect
            textSpan.addEventListener("mouseenter", () => {
                if (!textSpan.contentEditable && !textSpan.classList.contains('editing')) {
                    textSpan.style.backgroundColor = "rgba(90, 38, 239, 0.05)";
                    textSpan.style.outline = "1px dashed rgba(90, 38, 239, 0.3)";
                    textSpan.style.outlineOffset = "1px";
                }
            });
            
            textSpan.addEventListener("mouseleave", () => {
                if (!textSpan.contentEditable && !textSpan.classList.contains('editing')) {
                    textSpan.style.backgroundColor = "transparent";
                    textSpan.style.outline = "none";
                }
            });
            
            // Click to edit
            textSpan.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Close any other editing spans
                document.querySelectorAll('.editable-text-span.editing').forEach(span => {
                    if (span !== textSpan) {
                        span.blur();
                    }
                });
                
                // Make this text span editable
                textSpan.contentEditable = true;
                textSpan.classList.add('editing');
                textSpan.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
                textSpan.style.border = "2px solid #5A26EF";
                textSpan.style.boxShadow = "0 0 8px rgba(90, 38, 239, 0.4)";
                textSpan.style.outline = "none";
                textSpan.style.padding = "2px 4px";
                textSpan.style.minWidth = "20px";
                textSpan.style.zIndex = "1000";
                
                // Set current editing span and show formatting toolbar
                currentEditingTextSpan = textSpan;
                showTextFormatToolbar(textSpan);
                
                textSpan.focus();
                
                // Place cursor at click position
                setTimeout(() => {
                    try {
                        const range = document.caretRangeFromPoint ? 
                            document.caretRangeFromPoint(e.clientX, e.clientY) :
                            null;
                        if (range) {
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                        } else {
                            const range = document.createRange();
                            range.selectNodeContents(textSpan);
                            range.collapse(false);
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    } catch (err) {
                        const range = document.createRange();
                        range.selectNodeContents(textSpan);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }, 10);
            });
            
            // Handle blur - save changes (but delay to allow toolbar clicks)
            let blurTimeout = null;
            textSpan.addEventListener("blur", (e) => {
                // Delay blur handling to allow clicks on toolbar
                blurTimeout = setTimeout(() => {
                    // Check if focus moved to toolbar
                    const activeElement = document.activeElement;
                    if (activeElement && textFormatToolbar && textFormatToolbar.contains(activeElement)) {
                        return; // Don't hide toolbar if focus is on toolbar
                    }
                    
                    textSpan.contentEditable = false;
                    textSpan.classList.remove('editing');
                    const newText = textSpan.textContent;
                    const originalText = textSpan.getAttribute("data-original-text");
                    
                    // Get computed styles for formatting
                    const computedStyle = window.getComputedStyle(textSpan);
                    const fontWeight = computedStyle.fontWeight;
                    const fontStyle = computedStyle.fontStyle;
                    const textDecoration = computedStyle.textDecoration;
                    
                    if (newText !== originalText || editedTextItems[textId]) {
                        editedTextItems[textId] = {
                            content: newText || originalText,
                            x: parseFloat(textSpan.getAttribute("data-x")),
                            y: parseFloat(textSpan.getAttribute("data-y")),
                            fontSize: parseFloat(textSpan.getAttribute("data-font-size")),
                            width: parseFloat(textSpan.getAttribute("data-width")),
                            height: actualFontSize * 1.2,
                            color: computedStyle.color || "#000000",
                            fontName: textSpan.getAttribute("data-font-name"),
                            fontWeight: fontWeight,
                            fontStyle: fontStyle,
                            textDecoration: textDecoration
                        };
                        
                        textSpan.textContent = newText || originalText;
                    }
                    
                    // Reset styling
                    textSpan.style.backgroundColor = "transparent";
                    textSpan.style.border = "none";
                    textSpan.style.boxShadow = "none";
                    textSpan.style.padding = "0";
                    textSpan.style.minWidth = "auto";
                    textSpan.style.zIndex = "auto";
                    textSpan.style.outline = "none";
                    textSpan.style.textShadow = "none";
                    textSpan.style.filter = "none";
                    
                    // Hide formatting toolbar
                    currentEditingTextSpan = null;
                    if (textFormatToolbar) textFormatToolbar.style.display = 'none';
                }, 150);
            });
            
            // Cancel blur if focusing back on text span
            textSpan.addEventListener("focus", () => {
                if (blurTimeout) {
                    clearTimeout(blurTimeout);
                    blurTimeout = null;
                }
            });
            
            // Handle keydown events
            textSpan.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    textSpan.blur();
                }
                if (e.key === "Escape") {
                    e.preventDefault();
                    const originalText = textSpan.getAttribute("data-original-text");
                    textSpan.textContent = editedTextItems[textId] ? editedTextItems[textId].content : originalText;
                    textSpan.blur();
                }
            });
            
            textLayerDiv.appendChild(textSpan);
        });
        
        overlayContainer.appendChild(textLayerDiv);
    }
    
    // Group text items into words/lines preserving text integrity
    function groupTextItemsIntoWords(textItems) {
        const groups = [];
        let currentGroup = [];
        let lastY = null;
        let lastXEnd = null;
        
        for (let i = 0; i < textItems.length; i++) {
            const item = textItems[i];
            if (!item.str || item.str.trim() === '') continue;
            
            const x = item.transform[4];
            const y = item.transform[5];
            const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[2]) || 12;
            const itemWidth = item.width * fontSize;
            const xEnd = x + itemWidth;
            
            // Check if same line (Y coordinate similar)
            const sameLine = lastY === null || Math.abs(y - lastY) < fontSize * 0.8;
            
            // Check if should group with previous (same line and close X - within 2x font size)
            const shouldGroup = sameLine && lastXEnd !== null && (x - lastXEnd) < fontSize * 2.5;
            
            if (shouldGroup && currentGroup.length > 0) {
                // Add to current group (same word/line)
                currentGroup.push(item);
                lastXEnd = xEnd;
            } else {
                // Save previous group and start new one
                if (currentGroup.length > 0) {
                    groups.push({
                        items: [...currentGroup],
                        text: currentGroup.map(item => item.str).join(''),
                        y: lastY
                    });
                }
                // Start new group
                currentGroup = [item];
                lastY = y;
                lastXEnd = xEnd;
            }
        }
        
        // Add last group
        if (currentGroup.length > 0) {
            groups.push({
                items: [...currentGroup],
                text: currentGroup.map(item => item.str).join(''),
                y: lastY
            });
        }
        
        return groups;
    }
    
    // Show text formatting toolbar and sync with current text
    function showTextFormatToolbar(textSpan) {
        if (!textFormatToolbar) return;
        
        textFormatToolbar.style.display = 'flex';
        
        // Sync toolbar with current text styles
        const computedStyle = window.getComputedStyle(textSpan);
        const fontSize = parseFloat(computedStyle.fontSize) / scale;
        const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '');
        const color = computedStyle.color || "#000000";
        const fontWeight = computedStyle.fontWeight;
        const fontStyle = computedStyle.fontStyle;
        const textDecoration = computedStyle.textDecoration;
        
        if (fontFamilySelect) {
            // Try to match font family or default to Arial
            const fontOptions = Array.from(fontFamilySelect.options);
            const matchedOption = fontOptions.find(opt => 
                fontFamily.toLowerCase().includes(opt.value.toLowerCase()) ||
                opt.value.toLowerCase().includes(fontFamily.toLowerCase())
            );
            fontFamilySelect.value = matchedOption ? matchedOption.value : 'Arial';
        }
        if (fontSizeSelect) {
            const size = Math.round(fontSize) || 16;
            // Find closest size option
            const sizeOptions = Array.from(fontSizeSelect.options).map(opt => parseInt(opt.value));
            const closestSize = sizeOptions.reduce((prev, curr) => 
                Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
            );
            fontSizeSelect.value = closestSize.toString();
        }
        if (textColorPicker) {
            textColorPicker.value = rgbToHex(color);
        }
        if (boldBtn) {
            const isBold = parseInt(fontWeight) >= 600 || fontWeight === 'bold' || fontWeight === '700';
            boldBtn.classList.toggle('active', isBold);
            if (!boldBtn.classList.contains('active') && isBold) {
                boldBtn.classList.add('active');
            } else if (boldBtn.classList.contains('active') && !isBold) {
                boldBtn.classList.remove('active');
            }
        }
        if (italicBtn) {
            const isItalic = fontStyle === 'italic';
            italicBtn.classList.toggle('active', isItalic);
            if (!italicBtn.classList.contains('active') && isItalic) {
                italicBtn.classList.add('active');
            } else if (italicBtn.classList.contains('active') && !isItalic) {
                italicBtn.classList.remove('active');
            }
        }
        if (underlineBtn) {
            const isUnderlined = textDecoration && textDecoration.includes('underline');
            underlineBtn.classList.toggle('active', isUnderlined);
            if (!underlineBtn.classList.contains('active') && isUnderlined) {
                underlineBtn.classList.add('active');
            } else if (underlineBtn.classList.contains('active') && !isUnderlined) {
                underlineBtn.classList.remove('active');
            }
        }
    }
    
    // Convert RGB color to hex
    function rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        const match = rgb.match(/\d+/g);
        if (match && match.length >= 3) {
            return "#" + match.slice(0, 3).map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            }).join("");
        }
        return "#000000";
    }
    
    // Apply formatting to current editing text
    function applyTextFormatting(property, value) {
        if (!currentEditingTextSpan) return;
        
        // Check if this is tool-added text (has the class)
        if (currentEditingTextSpan.classList && currentEditingTextSpan.classList.contains('tool-added-text')) {
            updateToolAddedTextFormatting(property, value);
            return;
        }
        
        // Handle PDF-extracted text
        if (property === 'fontFamily') {
            currentEditingTextSpan.style.fontFamily = value + ', Arial, sans-serif';
            currentEditingTextSpan.setAttribute("data-font-name", value);
        } else if (property === 'fontSize') {
            const newSize = parseFloat(value);
            const currentFontSize = parseFloat(currentEditingTextSpan.getAttribute("data-font-size")) || newSize;
            currentEditingTextSpan.style.fontSize = (newSize * scale) + "px";
            currentEditingTextSpan.setAttribute("data-font-size", newSize.toString());
        } else if (property === 'color') {
            currentEditingTextSpan.style.color = value;
        } else if (property === 'bold') {
            const computedStyle = window.getComputedStyle(currentEditingTextSpan);
            const isBold = computedStyle.fontWeight === 'bold' || 
                          computedStyle.fontWeight === '700' ||
                          parseInt(computedStyle.fontWeight) >= 600;
            currentEditingTextSpan.style.fontWeight = isBold ? 'normal' : 'bold';
            if (boldBtn) boldBtn.classList.toggle('active', !isBold);
        } else if (property === 'italic') {
            const computedStyle = window.getComputedStyle(currentEditingTextSpan);
            const isItalic = computedStyle.fontStyle === 'italic';
            currentEditingTextSpan.style.fontStyle = isItalic ? 'normal' : 'italic';
            if (italicBtn) italicBtn.classList.toggle('active', !isItalic);
        } else if (property === 'underline') {
            const computedStyle = window.getComputedStyle(currentEditingTextSpan);
            const isUnderlined = computedStyle.textDecoration && computedStyle.textDecoration.includes('underline');
            currentEditingTextSpan.style.textDecoration = isUnderlined ? 'none' : 'underline';
            if (underlineBtn) underlineBtn.classList.toggle('active', !isUnderlined);
        }
    }
    
    // Show formatting toolbar for tool-added text overlay
    function showTextFormatToolbarForOverlay(textSpan, obj, pageNum, index) {
        if (!textFormatToolbar) return;
        
        // Set current editing text span to this one for toolbar compatibility
        currentEditingTextSpan = textSpan;
        
        // Sync toolbar with current text styles
        if (fontFamilySelect && obj.fontName) {
            fontFamilySelect.value = obj.fontName;
        }
        if (fontSizeSelect && obj.fontSize) {
            fontSizeSelect.value = obj.fontSize.toString();
        }
        if (textColorPicker && obj.color) {
            textColorPicker.value = obj.color;
        }
        
        // Update button states
        if (boldBtn) {
            const isBold = textSpan.style.fontWeight === 'bold' || parseInt(textSpan.style.fontWeight) >= 600;
            boldBtn.classList.toggle('active', isBold);
        }
        if (italicBtn) {
            const isItalic = textSpan.style.fontStyle === 'italic';
            italicBtn.classList.toggle('active', isItalic);
        }
        if (underlineBtn) {
            const isUnderlined = textSpan.style.textDecoration && textSpan.style.textDecoration.includes('underline');
            underlineBtn.classList.toggle('active', isUnderlined);
        }
        
        // Show toolbar (keep it in its original position)
        if (textFormatToolbar) {
            textFormatToolbar.style.display = 'flex';
            // Remove any inline position styles to use CSS default
            textFormatToolbar.style.position = '';
            textFormatToolbar.style.top = '';
            textFormatToolbar.style.left = '';
            textFormatToolbar.style.zIndex = '';
        }
        
        // Store reference for toolbar updates
        textSpan.setAttribute("data-page-num", pageNum);
        textSpan.setAttribute("data-obj-index", index);
    }
    
    // Update formatting toolbar to work with tool-added text
    function updateToolAddedTextFormatting(property, value) {
        if (!currentEditingTextSpan || !currentEditingTextSpan.classList.contains('tool-added-text')) {
            // Use existing function for PDF-extracted text
            updateTextFormatting(property, value);
            return;
        }
        
        const pageNum = parseInt(currentEditingTextSpan.getAttribute("data-page-num"));
        const index = parseInt(currentEditingTextSpan.getAttribute("data-obj-index"));
        const obj = editingObjects[pageNum] && editingObjects[pageNum][index];
        if (!obj) return;
        
        const renderScale = scale;
        
        if (property === 'fontFamily') {
            currentEditingTextSpan.style.fontFamily = value + ', Arial, sans-serif';
            obj.fontName = value;
            if (fontFamilySelect) fontFamilySelect.value = value;
        } else if (property === 'fontSize') {
            const newSize = parseFloat(value);
            currentEditingTextSpan.style.fontSize = (newSize * renderScale) + "px";
            obj.fontSize = newSize;
            if (fontSizeSelect) fontSizeSelect.value = value;
            
            // Recalculate overlay width
            const tempCanvas = document.createElement("canvas");
            const tempContext = tempCanvas.getContext("2d");
            tempContext.font = `${newSize * renderScale}px ${obj.fontName || 'Arial'}`;
            const textMetrics = tempContext.measureText(obj.content);
            const overlay = currentEditingTextSpan.closest('.draggable-editing-object');
            if (overlay) {
                overlay.style.width = textMetrics.width + "px";
            }
        } else if (property === 'color') {
            currentEditingTextSpan.style.color = value;
            obj.color = value;
            if (textColorPicker) textColorPicker.value = value;
        } else if (property === 'bold') {
            const computedStyle = window.getComputedStyle(currentEditingTextSpan);
            const isBold = computedStyle.fontWeight === 'bold' || 
                          computedStyle.fontWeight === '700' ||
                          parseInt(computedStyle.fontWeight) >= 600;
            currentEditingTextSpan.style.fontWeight = isBold ? 'normal' : 'bold';
            obj.fontWeight = isBold ? 'normal' : 'bold';
            if (boldBtn) boldBtn.classList.toggle('active', !isBold);
        } else if (property === 'italic') {
            const computedStyle = window.getComputedStyle(currentEditingTextSpan);
            const isItalic = computedStyle.fontStyle === 'italic';
            currentEditingTextSpan.style.fontStyle = isItalic ? 'normal' : 'italic';
            obj.fontStyle = isItalic ? 'normal' : 'italic';
            if (italicBtn) italicBtn.classList.toggle('active', !isItalic);
        } else if (property === 'underline') {
            const computedStyle = window.getComputedStyle(currentEditingTextSpan);
            const isUnderlined = computedStyle.textDecoration && computedStyle.textDecoration.includes('underline');
            currentEditingTextSpan.style.textDecoration = isUnderlined ? 'none' : 'underline';
            obj.textDecoration = isUnderlined ? 'none' : 'underline';
            if (underlineBtn) underlineBtn.classList.toggle('active', !isUnderlined);
        }
        
        // Re-render to update canvas
        setTimeout(() => {
            renderAllPages();
        }, 10);
    }
    
    // Setup text formatting toolbar event listeners
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        fontFamilySelect.addEventListener("change", (e) => {
            e.stopPropagation();
            applyTextFormatting('fontFamily', e.target.value);
            if (currentEditingTextSpan) {
                setTimeout(() => currentEditingTextSpan.focus(), 50);
            }
        });
    }
    
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        fontSizeSelect.addEventListener("change", (e) => {
            e.stopPropagation();
            applyTextFormatting('fontSize', e.target.value);
            if (currentEditingTextSpan) {
                setTimeout(() => currentEditingTextSpan.focus(), 50);
            }
        });
    }
    
    if (boldBtn) {
        boldBtn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            applyTextFormatting('bold');
            if (currentEditingTextSpan) {
                setTimeout(() => currentEditingTextSpan.focus(), 50);
            }
        });
    }
    
    if (italicBtn) {
        italicBtn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            applyTextFormatting('italic');
            if (currentEditingTextSpan) {
                setTimeout(() => currentEditingTextSpan.focus(), 50);
            }
        });
    }
    
    if (underlineBtn) {
        underlineBtn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            applyTextFormatting('underline');
            if (currentEditingTextSpan) {
                setTimeout(() => currentEditingTextSpan.focus(), 50);
            }
        });
    }
    
    if (textColorPicker) {
        textColorPicker.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        textColorPicker.addEventListener("change", (e) => {
            e.stopPropagation();
            applyTextFormatting('color', e.target.value);
            if (currentEditingTextSpan) {
                setTimeout(() => currentEditingTextSpan.focus(), 50);
            }
        });
    }
    
    // Delete button - works for both PDF text and tool-added elements
    if (deleteTextBtn) {
        deleteTextBtn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Delete PDF-extracted text
            if (currentEditingTextSpan && !currentEditingTextSpan.classList.contains('tool-added-text')) {
                const textId = currentEditingTextSpan.getAttribute("data-text-id");
                if (textId && editedTextItems[textId]) {
                    delete editedTextItems[textId];
                }
                currentEditingTextSpan.remove();
                currentEditingTextSpan = null;
                if (textFormatToolbar) textFormatToolbar.style.display = 'none';
                showAlert("Text deleted.", 'success');
                return;
            }
            
            // Delete tool-added element (text, image, shape)
            if (selectedOverlayObject && selectedElement) {
                const pageNum = parseInt(selectedElement.getAttribute("data-page"));
                const index = parseInt(selectedElement.getAttribute("data-index"));
                
                if (editingObjects[pageNum] && editingObjects[pageNum][index]) {
                    editingObjects[pageNum].splice(index, 1);
                    selectedElement.remove();
                    selectedElement = null;
                    selectedOverlayObject = null;
                    currentEditingTextSpan = null;
                    if (textFormatToolbar) textFormatToolbar.style.display = 'none';
                    renderAllPages();
                    showAlert("Element deleted.", 'success');
                }
            }
        });
    }
    
    // Keyboard delete key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
            if (document.activeElement && document.activeElement.contentEditable === "true") {
                return; // Don't delete if user is editing text
            }
            
            // Delete tool-added element
            if (selectedOverlayObject && selectedElement) {
                // Check if it's not a PDF-extracted text span
                const isToolAdded = !currentEditingTextSpan || 
                    (currentEditingTextSpan.classList && currentEditingTextSpan.classList.contains('tool-added-text'));
                
                if (isToolAdded) {
                    e.preventDefault();
                    const pageNum = parseInt(selectedElement.getAttribute("data-page"));
                    const index = parseInt(selectedElement.getAttribute("data-index"));
                    
                    if (editingObjects[pageNum] && editingObjects[pageNum][index]) {
                        editingObjects[pageNum].splice(index, 1);
                        selectedElement.remove();
                        selectedElement = null;
                        selectedOverlayObject = null;
                        currentEditingTextSpan = null;
                        if (textFormatToolbar) textFormatToolbar.style.display = 'none';
                        renderAllPages();
                        showAlert("Element deleted.", 'success');
                    }
                }
            }
        }
    });
    
    // Click outside to unselect
    document.addEventListener("click", (e) => {
        // Check if click is outside all overlays and text spans
        const clickedOverlay = e.target.closest('.draggable-editing-object');
        const clickedTextSpan = e.target.closest('.editable-text-span');
        const isToolbarClick = textFormatToolbar && textFormatToolbar.contains(e.target);
        
        if (!clickedOverlay && !clickedTextSpan && !isToolbarClick && !e.target.classList.contains('resize-handle')) {
            // Unselect overlay
            if (selectedElement && selectedElement !== e.target) {
                selectedElement.style.borderColor = "transparent";
                // Remove resize handles
                const resizeHandles = selectedElement.querySelectorAll('.resize-handle');
                resizeHandles.forEach(h => h.remove());
                selectedElement = null;
                selectedOverlayObject = null;
            }
            
            // Unselect text span (if not editing)
            if (currentEditingTextSpan && !currentEditingTextSpan.contentEditable) {
                if (currentEditingTextSpan.classList && !currentEditingTextSpan.classList.contains('tool-added-text')) {
                    currentEditingTextSpan.style.backgroundColor = "transparent";
                    currentEditingTextSpan.style.outline = "none";
                }
                currentEditingTextSpan = null;
                if (textFormatToolbar) textFormatToolbar.style.display = 'none';
            }
        }
    });
    
    // Prevent toolbar clicks from causing blur
    if (textFormatToolbar) {
        textFormatToolbar.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
    }
    
    function renderEditingObjectsForPage(canvas, viewport, pageNum, actualScale, skipText = false) {
        if (!editingObjects[pageNum]) return;
        
        const context = canvas.getContext("2d");
        const objects = editingObjects[pageNum];
        const renderScale = actualScale || scale;
        
        objects.forEach((obj, index) => {
            switch (obj.type) {
                case 'text':
                    // Skip rendering text on canvas during preview (it's shown as draggable overlay)
                    // Only render on canvas when generating final PDF
                    if (skipText) break;
                    
                    // Draw white background first to cover any PDF text
                    const fontName = obj.fontName || 'Arial';
                    context.font = `${obj.fontSize * renderScale}px ${fontName}`;
                    const textMetrics = context.measureText(obj.content);
                    const textWidth = textMetrics.width;
                    const textHeight = obj.fontSize * renderScale;
                    context.fillStyle = "#FFFFFF";
                    context.fillRect(
                        obj.x * renderScale - 2,
                        (obj.y * renderScale) - textHeight - 2,
                        textWidth + 4,
                        textHeight + 4
                    );
                    // Then draw the text
                    context.fillStyle = obj.color || '#000000';
                    context.fillText(obj.content, obj.x * renderScale, obj.y * renderScale);
                    break;
                case 'image':
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        context.drawImage(img, obj.x * renderScale, obj.y * renderScale, obj.width * renderScale, obj.height * renderScale);
                    };
                    img.onerror = () => {
                        console.error("Error loading image:", obj.src);
                    };
                    img.src = obj.src;
                    break;
                case 'rectangle':
                    context.strokeStyle = obj.borderColor || '#000000';
                    context.fillStyle = obj.fillColor || 'rgba(90, 38, 239, 0.3)';
                    context.lineWidth = 2 * renderScale;
                    context.strokeRect(obj.x * renderScale, obj.y * renderScale, obj.width * renderScale, obj.height * renderScale);
                    context.fillRect(obj.x * renderScale, obj.y * renderScale, obj.width * renderScale, obj.height * renderScale);
                    break;
                case 'circle':
                    context.strokeStyle = obj.borderColor || '#000000';
                    context.fillStyle = obj.fillColor || 'rgba(245, 97, 41, 0.3)';
                    context.lineWidth = 2 * renderScale;
                    context.beginPath();
                    context.arc((obj.x + obj.width/2) * renderScale, (obj.y + obj.height/2) * renderScale, (obj.width/2) * renderScale, 0, Math.PI * 2);
                    context.stroke();
                    context.fill();
                    break;
                case 'line':
                    context.strokeStyle = obj.borderColor || '#000000';
                    context.lineWidth = 2 * renderScale;
                    context.beginPath();
                    context.moveTo(obj.x * renderScale, obj.y * renderScale);
                    context.lineTo((obj.x + obj.width) * renderScale, (obj.y + obj.height) * renderScale);
                    context.stroke();
                    break;
            }
        });
    }
    
    // Add resize handles to image
    function addResizeHandles(overlay, container, pageNum, index, renderScale) {
        // Create resize handles (corners)
        const handles = ['nw', 'ne', 'sw', 'se']; // northwest, northeast, southwest, southeast
        handles.forEach(handle => {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.setAttribute('data-handle', handle);
            resizeHandle.style.cssText = `
                position: absolute;
                width: 12px;
                height: 12px;
                background-color: #5A26EF;
                border: 2px solid white;
                border-radius: 50%;
                cursor: ${handle === 'nw' ? 'nw-resize' : handle === 'ne' ? 'ne-resize' : handle === 'sw' ? 'sw-resize' : 'se-resize'};
                z-index: 1000;
                pointer-events: auto;
            `;
            
            // Position handle
            if (handle === 'nw') {
                resizeHandle.style.top = '-6px';
                resizeHandle.style.left = '-6px';
            } else if (handle === 'ne') {
                resizeHandle.style.top = '-6px';
                resizeHandle.style.right = '-6px';
            } else if (handle === 'sw') {
                resizeHandle.style.bottom = '-6px';
                resizeHandle.style.left = '-6px';
            } else { // se
                resizeHandle.style.bottom = '-6px';
                resizeHandle.style.right = '-6px';
            }
            
            // Resize functionality
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = parseFloat(overlay.style.width);
                const startHeight = parseFloat(overlay.style.height);
                const startLeft = parseFloat(overlay.style.left);
                const startTop = parseFloat(overlay.style.top);
                
                const obj = editingObjects[pageNum][index];
                const originalAspectRatio = obj.width / obj.height;
                
                const onMouseMove = (e) => {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    
                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    let newLeft = startLeft;
                    let newTop = startTop;
                    
                    // Check if shift key is pressed to maintain aspect ratio
                    const maintainAspectRatio = e.shiftKey;
                    
                    if (handle === 'se') {
                        // Bottom-right: adjust width and height
                        newWidth = startWidth + deltaX;
                        newHeight = startHeight + deltaY;
                        if (maintainAspectRatio) {
                            newHeight = newWidth / originalAspectRatio;
                        }
                    } else if (handle === 'sw') {
                        // Bottom-left: adjust width (left), height (bottom)
                        newWidth = startWidth - deltaX;
                        newHeight = startHeight + deltaY;
                        if (maintainAspectRatio) {
                            newHeight = newWidth / originalAspectRatio;
                        }
                        newLeft = startLeft + (startWidth - newWidth);
                    } else if (handle === 'ne') {
                        // Top-right: adjust width (right), height (top)
                        newWidth = startWidth + deltaX;
                        newHeight = startHeight - deltaY;
                        if (maintainAspectRatio) {
                            newHeight = newWidth / originalAspectRatio;
                        }
                        newTop = startTop + (startHeight - newHeight);
                    } else if (handle === 'nw') {
                        // Top-left: adjust width (left), height (top)
                        newWidth = startWidth - deltaX;
                        newHeight = startHeight - deltaY;
                        if (maintainAspectRatio) {
                            newHeight = newWidth / originalAspectRatio;
                        }
                        newLeft = startLeft + (startWidth - newWidth);
                        newTop = startTop + (startHeight - newHeight);
                    }
                    
                    // Minimum size constraints
                    const minSize = 20;
                    if (newWidth < minSize) {
                        const adjust = minSize - newWidth;
                        newWidth = minSize;
                        if (handle === 'nw' || handle === 'sw') {
                            newLeft -= adjust;
                        }
                    }
                    if (newHeight < minSize) {
                        const adjust = minSize - newHeight;
                        newHeight = minSize;
                        if (handle === 'nw' || handle === 'ne') {
                            newTop -= adjust;
                        }
                    }
                    
                    overlay.style.width = newWidth + 'px';
                    overlay.style.height = newHeight + 'px';
                    overlay.style.left = newLeft + 'px';
                    overlay.style.top = newTop + 'px';
                };
                
                const onMouseUp = () => {
                    // Update object dimensions in PDF coordinates
                    const obj = editingObjects[pageNum][index];
                    const newWidth = parseFloat(overlay.style.width);
                    const newHeight = parseFloat(overlay.style.height);
                    const newLeft = parseFloat(overlay.style.left);
                    const newTop = parseFloat(overlay.style.top);
                    
                    obj.width = newWidth / renderScale;
                    obj.height = newHeight / renderScale;
                    obj.x = newLeft / renderScale;
                    obj.y = newTop / renderScale;
                    
                    // Re-render
                    setTimeout(() => {
                        renderAllPages();
                    }, 10);
                    
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            
            overlay.appendChild(resizeHandle);
        });
    }
    
    function createDraggableOverlaysForPage(container, viewport, pageNum, actualScale) {
        if (!editingObjects[pageNum]) return;
        
        // Clear existing overlays for this page
        container.innerHTML = '';
        
        const objects = editingObjects[pageNum];
        const renderScale = actualScale || scale;
        
        objects.forEach((obj, index) => {
            const overlay = document.createElement("div");
            overlay.className = "draggable-editing-object";
            overlay.setAttribute("data-page", pageNum);
            overlay.setAttribute("data-index", index);
            overlay.setAttribute("data-type", obj.type);
            
            // Calculate position and size in viewport coordinates
            let left, top, width, height;
            
            switch (obj.type) {
                case 'text':
                    const fontName = obj.fontName || 'Arial';
                    const tempCanvas = document.createElement("canvas");
                    const tempContext = tempCanvas.getContext("2d");
                    tempContext.font = `${obj.fontSize * renderScale}px ${fontName}`;
                    const textMetrics = tempContext.measureText(obj.content);
                    width = textMetrics.width;
                    height = obj.fontSize * renderScale;
                    left = obj.x * renderScale;
                    top = (obj.y * renderScale) - height;
                    break;
                case 'image':
                    left = obj.x * renderScale;
                    top = obj.y * renderScale;
                    width = obj.width * renderScale;
                    height = obj.height * renderScale;
                    break;
                case 'rectangle':
                case 'circle':
                    left = obj.x * renderScale;
                    top = obj.y * renderScale;
                    width = obj.width * renderScale;
                    height = obj.height * renderScale;
                    break;
                case 'line':
                    const lineLength = Math.sqrt(obj.width * obj.width + obj.height * obj.height);
                    left = Math.min(obj.x * renderScale, (obj.x + obj.width) * renderScale);
                    top = Math.min(obj.y * renderScale, (obj.y + obj.height) * renderScale);
                    width = Math.abs(obj.width * renderScale);
                    height = Math.abs(obj.height * renderScale);
                    break;
            }
            
            overlay.style.position = "absolute";
            overlay.style.left = left + "px";
            overlay.style.top = top + "px";
            overlay.style.width = width + "px";
            overlay.style.height = height + "px";
            overlay.style.cursor = obj.type === 'text' ? "move" : "move";
            overlay.style.border = "2px dashed transparent";
            overlay.style.transition = "border-color 0.2s";
            overlay.style.zIndex = "10";
            
            // Add visual content based on type
            if (obj.type === 'text') {
                // Make overlay cursor move for text
                overlay.style.cursor = "move";
                const textSpan = document.createElement("span");
                textSpan.className = "tool-added-text";
                textSpan.style.cssText = `
                    font-size: ${obj.fontSize * renderScale}px;
                    font-family: ${obj.fontName || 'Arial, Helvetica, "DejaVu Sans", "Liberation Sans", sans-serif'};
                    color: ${obj.color || '#000000'};
                    white-space: pre;
                    display: block;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    cursor: default;
                    outline: none;
                `;
                textSpan.textContent = obj.content;
                textSpan.contentEditable = false;
                overlay.appendChild(textSpan);
                
                // Double-click on overlay to edit text
                let clickTimeout;
                let isDoubleClick = false;
                
                overlay.addEventListener("dblclick", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    clearTimeout(clickTimeout);
                    isDoubleClick = true;
                    
                    // Make editable
                    textSpan.contentEditable = true;
                    textSpan.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
                    textSpan.style.border = "2px solid #5A26EF";
                    textSpan.style.padding = "2px 4px";
                    textSpan.style.minWidth = "50px";
                    textSpan.style.width = "auto";
                    overlay.style.cursor = "text";
                    overlay.style.pointerEvents = "auto";
                    textSpan.focus();
                    
                    // Select all text initially for easy editing
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(textSpan);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    
                    selectedElement = overlay;
                    selectedOverlayObject = obj;
                    overlay.style.borderColor = "#5A26EF";
                    overlay.style.borderStyle = "solid";
                    overlay.style.borderWidth = "2px";
                    
                    // Show formatting toolbar
                    showTextFormatToolbarForOverlay(textSpan, obj, pageNum, index);
                    
                    // Save on blur
                    const saveOnBlur = function onBlur() {
                        textSpan.contentEditable = false;
                        textSpan.style.backgroundColor = "transparent";
                        textSpan.style.border = "none";
                        textSpan.style.padding = "0";
                        textSpan.style.width = "100%";
                        overlay.style.cursor = "move";
                        
                        const newContent = textSpan.textContent.trim() || textSpan.textContent;
                        if (editingObjects[pageNum] && editingObjects[pageNum][index]) {
                            editingObjects[pageNum][index].content = newContent;
                            // Recalculate width based on new content
                            const tempCanvas = document.createElement("canvas");
                            const tempContext = tempCanvas.getContext("2d");
                            tempContext.font = `${obj.fontSize * renderScale}px ${obj.fontName || 'Arial'}`;
                            const textMetrics = tempContext.measureText(newContent);
                            overlay.style.width = textMetrics.width + "px";
                            obj.width = textMetrics.width / renderScale;
                            
                            renderAllPages();
                        }
                        textSpan.removeEventListener("blur", saveOnBlur);
                    };
                    
                    textSpan.addEventListener("blur", saveOnBlur, { once: true });
                    
                    // Also save on Enter key
                    textSpan.addEventListener("keydown", (ke) => {
                        if (ke.key === "Enter" && !ke.shiftKey) {
                            ke.preventDefault();
                            textSpan.blur();
                        }
                    }, { once: true });
                });
            } else if (obj.type === 'image') {
                overlay.innerHTML = `<img src="${obj.src}" style="
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    pointer-events: none;
                ">`;
                
                // Add resize handles
                overlay.classList.add('resizable-image');
            
            } else if (obj.type === 'rectangle') {
                overlay.style.border = `2px solid ${obj.borderColor || '#000000'}`;
                overlay.style.backgroundColor = obj.fillColor || 'rgba(90, 38, 239, 0.3)';
                overlay.style.background = obj.fillColor || 'rgba(90, 38, 239, 0.3)';
            } else if (obj.type === 'circle') {
                overlay.style.border = `2px solid ${obj.borderColor || '#000000'}`;
                overlay.style.backgroundColor = obj.fillColor || 'rgba(245, 97, 41, 0.3)';
                overlay.style.borderRadius = "50%";
                overlay.style.background = obj.fillColor || 'rgba(245, 97, 41, 0.3)';
            } else if (obj.type === 'line') {
                // For lines, create a larger clickable area
                overlay.style.border = "2px dashed transparent";
                overlay.style.backgroundColor = "transparent";
                overlay.style.minWidth = "20px";
                overlay.style.minHeight = "20px";
                
                // Draw the actual line inside
                const lineDiv = document.createElement("div");
                const lineLength = Math.sqrt(obj.width * obj.width + obj.height * obj.height);
                const angle = Math.atan2(obj.height, obj.width) * 180 / Math.PI;
                
                lineDiv.style.cssText = `
                    position: absolute;
                    width: ${lineLength * renderScale}px;
                    height: 3px;
                    background-color: ${obj.borderColor || '#000000'};
                    pointer-events: none;
                    transform: rotate(${angle}deg);
                    transform-origin: 0 50%;
                    left: 0;
                    top: 50%;
                    margin-top: -1.5px;
                `;
                overlay.appendChild(lineDiv);
            }
            
            // Hover effect
            overlay.addEventListener("mouseenter", () => {
                if (overlay !== draggedElement) {
                    overlay.style.borderColor = "#5A26EF";
                }
            });
            overlay.addEventListener("mouseleave", () => {
                if (overlay !== selectedElement && overlay !== draggedElement) {
                    overlay.style.borderColor = "transparent";
                }
            });
            
            // Ensure overlay is pointer-events enabled and can be clicked/dragged
            overlay.style.pointerEvents = "auto";
            
            // Click to select (only for non-text elements, text handled separately)
            if (obj.type !== 'text') {
                overlay.addEventListener("click", (e) => {
                    // Don't select if we're in the middle of a drag or clicking on resize handle
                    if (draggedElement || e.target.classList.contains('resize-handle')) return;
                    
                    e.stopPropagation();
                    if (selectedElement && selectedElement !== overlay) {
                        selectedElement.style.borderColor = "transparent";
                        // Remove resize handles from previously selected element
                        const prevResizeHandles = selectedElement.querySelectorAll('.resize-handle');
                        prevResizeHandles.forEach(h => h.remove());
                    }
                    selectedElement = overlay;
                    selectedOverlayObject = obj;
                    overlay.style.borderColor = "#5A26EF";
                    overlay.style.borderStyle = "solid";
                    overlay.style.borderWidth = "2px";
                    
                    // Add resize handles for images
                    if (obj.type === 'image' && !overlay.querySelector('.resize-handle')) {
                        addResizeHandles(overlay, container, pageNum, index, renderScale);
                    }
                    
                    // Hide text formatting toolbar for non-text elements
                    if (textFormatToolbar) textFormatToolbar.style.display = 'none';
                });
            }
            
            // Drag functionality
            overlay.addEventListener("mousedown", (e) => {
                // Don't start drag if clicking on resize handle
                if (e.target.classList.contains('resize-handle')) {
                    return;
                }
                
                // Don't start drag if clicking on text span that's being edited
                if (obj.type === 'text') {
                    const textSpan = overlay.querySelector('.tool-added-text');
                    if (textSpan && (e.target === textSpan || textSpan.contains(e.target))) {
                        if (textSpan.contentEditable === true) {
                            return; // Don't drag when editing
                        }
                        if (e.detail === 2) {
                            return; // Don't drag on double-click
                        }
                    }
                }
                
                e.stopPropagation();
                e.preventDefault();
                
                selectedElement = overlay;
                selectedOverlayObject = obj;
                draggedElement = overlay;
                overlay.style.borderColor = "#F56129";
                overlay.style.cursor = "grabbing";
                overlay.style.zIndex = "100"; // Bring to front while dragging
                
                const rect = container.getBoundingClientRect();
                const overlayLeft = parseFloat(overlay.style.left) || 0;
                const overlayTop = parseFloat(overlay.style.top) || 0;
                dragOffset.x = e.clientX - rect.left - overlayLeft;
                dragOffset.y = e.clientY - rect.top - overlayTop;
                
                let hasMoved = false;
                
                const onMouseMove = (e) => {
                    if (!draggedElement) return;
                    hasMoved = true;
                    
                    const containerRect = container.getBoundingClientRect();
                    let newX = e.clientX - containerRect.left - dragOffset.x;
                    let newY = e.clientY - containerRect.top - dragOffset.y;
                    
                    // Keep within bounds
                    const overlayWidth = parseFloat(overlay.style.width) || 0;
                    const overlayHeight = parseFloat(overlay.style.height) || 0;
                    newX = Math.max(0, Math.min(newX, containerRect.width - overlayWidth));
                    newY = Math.max(0, Math.min(newY, containerRect.height - overlayHeight));
                    
                    overlay.style.left = newX + "px";
                    overlay.style.top = newY + "px";
                };
                
                const onMouseUp = () => {
                    if (!draggedElement) return;
                    
                    // Only update position if we actually moved
                    if (hasMoved) {
                        // Update position in editingObjects (convert back to PDF coordinates)
                        const pageNum = parseInt(draggedElement.getAttribute("data-page"));
                        const index = parseInt(draggedElement.getAttribute("data-index"));
                        
                        if (editingObjects[pageNum] && editingObjects[pageNum][index]) {
                            const obj = editingObjects[pageNum][index];
                            const left = parseFloat(draggedElement.style.left);
                            const top = parseFloat(draggedElement.style.top);
                            const overlayWidth = parseFloat(draggedElement.style.width) || 0;
                            const overlayHeight = parseFloat(draggedElement.style.height) || 0;
                            
                            if (obj.type === 'line') {
                                // For lines, calculate the original end point
                                const originalEndX = obj.x + obj.width;
                                const originalEndY = obj.y + obj.height;
                                
                                // Update the start position
                                const newStartX = left / renderScale;
                                const newStartY = top / renderScale;
                                
                                // Calculate the offset from the original start
                                const deltaX = newStartX - obj.x;
                                const deltaY = newStartY - obj.y;
                                
                                // Update both start and end positions (move the whole line)
                                obj.x = newStartX;
                                obj.y = newStartY;
                                obj.width = (originalEndX + deltaX) - obj.x;
                                obj.height = (originalEndY + deltaY) - obj.y;
                            } else if (obj.type === 'text') {
                                // For text, y is the baseline, need to adjust
                                obj.x = left / renderScale;
                                const textHeight = obj.fontSize * renderScale;
                                obj.y = (top + textHeight) / renderScale;
        } else {
                                // For rectangle, circle, image
                                obj.x = left / renderScale;
                                obj.y = top / renderScale;
                            }
                            
                            // Re-render the canvas with new positions (will also recreate overlays)
                            setTimeout(() => {
                                renderAllPages();
                            }, 10);
                        }
                    }
                    
                    draggedElement.style.zIndex = "10"; // Reset z-index
                    draggedElement.style.cursor = obj.type === 'text' ? "text" : "move";
                    if (draggedElement === selectedElement) {
                        draggedElement.style.borderColor = "#5A26EF";
                    }
                    draggedElement = null;
                    
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });
            
            container.appendChild(overlay);
        });
    }

    function handleTextAddition() {
        const textContent = document.getElementById("textContent");
        const textFontSize = document.getElementById("textFontSize");
        const textColor = document.getElementById("textColor");
        
        if (!textContent || !textContent.value.trim()) {
            showAlert("Please enter some text.", 'warning');
            return;
        }
        
        // Adding new text - add to first page by default
        const pageToAdd = 1;
        if (!editingObjects[pageToAdd]) {
            editingObjects[pageToAdd] = [];
        }
        
        // Replace bullet point characters that may display incorrectly
        let content = textContent.value;
        // Normalize common bullet-like characters
        content = content.replace(/\u2022/g, '•'); // Bullet (U+2022) -> bullet symbol
        content = content.replace(/\u25CF/g, '●'); // Black circle -> bullet
        content = content.replace(/\u25E6/g, '◦'); // White bullet -> bullet
        
        editingObjects[pageToAdd].push({
                type: 'text',
            content: content,
            fontSize: parseFloat(textFontSize.value) || 16,
            color: textColor.value || '#000000',
                fontName: 'Arial',
                x: 50,
            y: 100 // Position it so it's visible
        });
        
        if (textModal) textModal.hide();
        if (textContent) textContent.value = '';
        renderAllPages();
        showAlert("Text added successfully! It appears on the PDF preview.", 'success');
    }
    
    function handleImageAddition(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            showAlert("Please select a valid image file.", 'danger');
            return;
        }
        
        if (!pdfJsDoc) {
            showAlert("Please upload a PDF first.", 'warning');
            return;
        }
        
            const reader = new FileReader();
        reader.onload = (e) => {
            const pageToAdd = currentPageNumber || 1; // Default to first page or current page
            if (!editingObjects[pageToAdd]) {
                editingObjects[pageToAdd] = [];
            }
            
                const img = new Image();
                img.onload = () => {
                // Scale image to fit nicely (max 300px width/height)
                const maxSize = 300;
                let width = img.width;
                let height = img.height;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = width * ratio;
                    height = height * ratio;
                }
                
                editingObjects[pageToAdd].push({
                        type: 'image',
                    src: e.target.result,
                        x: 50,
                    y: 150,
                    width: width,
                    height: height
                });
                renderAllPages();
                showAlert("Image added successfully!", 'success');
            };
            img.onerror = () => {
                showAlert("Error loading image.", 'danger');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            showAlert("Error reading image file.", 'danger');
            };
            reader.readAsDataURL(file);
        if (imageInput) imageInput.value = '';
    }
    
    function addShape(shapeType) {
        if (!pdfJsDoc) {
            showAlert("Please upload a PDF first.", 'warning');
            return;
        }
        
        const pageToAdd = currentPageNumber || 1; // Default to first page or current page
        if (!editingObjects[pageToAdd]) {
            editingObjects[pageToAdd] = [];
        }
        
        const colors = {
            rectangle: { border: '#000000', fill: 'rgba(90, 38, 239, 0.3)' },
            circle: { border: '#000000', fill: 'rgba(245, 97, 41, 0.3)' },
            line: { border: '#000000', fill: '#000000' }
        };
        
        const color = colors[shapeType] || colors.rectangle;
        editingObjects[pageToAdd].push({
            type: shapeType,
            x: 100,
            y: 200,
            width: 100,
            height: shapeType === 'line' ? 0 : 100,
            borderColor: color.border,
            fillColor: color.fill
        });
        
        renderAllPages();
        showAlert(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} added successfully!`, 'success');
    }
    
    async function downloadEditedPDF() {
        if (!pdfLibDoc) {
            showAlert("No PDF loaded. Please upload a PDF first.", 'warning');
            return;
        }
        
        try {
            showAlert("Processing PDF...", 'info');
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.innerHTML = 'Processing... <span class="spinner-border spinner-border-sm"></span>';
            
            // Create a copy of the PDF for editing
            const editedPdf = await PDFLib.PDFDocument.create();
            const pages = pdfLibDoc.getPages();
            
            // Copy all pages
            const copiedPages = await editedPdf.copyPages(pdfLibDoc, pages.map((_, i) => i));
            copiedPages.forEach((page) => {
                editedPdf.addPage(page);
            });
            
            // Process each page
            for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
                const page = editedPdf.getPage(pageNum - 1);
                const originalPage = pages[pageNum - 1];
                const pageHeight = originalPage.getHeight();
                const pageWidth = originalPage.getWidth();
                
                // Cover edited text areas with white rectangles and draw edited text
                if (editedTextItems) {
                    const pageTextIds = Object.keys(editedTextItems).filter(id => id.startsWith(`text-${pageNum}-`));
                    for (const textId of pageTextIds) {
                        const editedText = editedTextItems[textId];
                        // Cover the original text area with white rectangle
                        page.drawRectangle({
                            x: editedText.x,
                            y: pageHeight - editedText.y - editedText.height,
                            width: editedText.width,
                            height: editedText.height * 1.2,
                            color: PDFLib.rgb(1, 1, 1) // White
                        });
                        
                        // Draw the edited text
                        const font = await editedPdf.embedFont(PDFLib.StandardFonts.Helvetica);
                        const [r, g, b] = hexToRgb(editedText.color || "#000000");
                        page.drawText(editedText.content, {
                            x: editedText.x,
                            y: pageHeight - editedText.y - editedText.fontSize,
                            size: editedText.fontSize,
                            font: font,
                            color: PDFLib.rgb(r / 255, g / 255, b / 255)
                        });
                    }
                }
                
                // Add newly added editing objects
                if (editingObjects[pageNum] && editingObjects[pageNum].length > 0) {
                    const pageObjects = editingObjects[pageNum];
                    
                    for (const obj of pageObjects) {
                        try {
                            switch (obj.type) {
                                case 'text':
                                    const font = await editedPdf.embedFont(PDFLib.StandardFonts.Helvetica);
                    const [r, g, b] = hexToRgb(obj.color);
                    page.drawText(obj.content, {
                        x: obj.x,
                                        y: pageHeight - obj.y - obj.fontSize,
                                        size: obj.fontSize,
                                        color: PDFLib.rgb(r / 255, g / 255, b / 255),
                                        font: font
                                    });
                                    break;
                                case 'image':
                                    try {
                                        let imageBytes;
                                        
                                        // Handle data URL (from file upload)
                                        if (obj.src.startsWith('data:')) {
                                            // Extract base64 data from data URL
                                            const base64Data = obj.src.split(',')[1];
                                            // Convert base64 to Uint8Array
                                            const binaryString = atob(base64Data);
                                            const bytes = new Uint8Array(binaryString.length);
                                            for (let i = 0; i < binaryString.length; i++) {
                                                bytes[i] = binaryString.charCodeAt(i);
                                            }
                                            imageBytes = bytes.buffer;
                                        } else {
                                            // Handle regular URL
                                            imageBytes = await fetch(obj.src).then(res => res.arrayBuffer());
                                        }
                                        
                                        // Detect image format from data URL or try both
                                        let image;
                                        if (obj.src.includes('image/png') || obj.src.includes('data:image/png')) {
                                            image = await editedPdf.embedPng(imageBytes);
                                        } else if (obj.src.includes('image/jpeg') || obj.src.includes('image/jpg') || obj.src.includes('data:image/jpeg') || obj.src.includes('data:image/jpg')) {
                                            image = await editedPdf.embedJpg(imageBytes);
                                        } else {
                                            // Try PNG first, then JPG if it fails
                                            try {
                                                image = await editedPdf.embedPng(imageBytes);
                                            } catch (pngErr) {
                                                try {
                                                    image = await editedPdf.embedJpg(imageBytes);
                                                } catch (jpgErr) {
                                                    console.error("Could not embed image as PNG or JPG:", pngErr, jpgErr);
                                                    throw new Error("Unsupported image format");
                                                }
                                            }
                                        }
                                        
                                        page.drawImage(image, {
                        x: obj.x,
                                            y: pageHeight - obj.y - obj.height,
                        width: obj.width,
                        height: obj.height
                    });
                                    } catch (err) {
                                        console.error("Error embedding image:", err);
                                        showAlert("Error embedding image in PDF: " + (err.message || "Unknown error"), 'warning');
                                    }
                                    break;
                                case 'rectangle':
                                    const [br, bg, bb] = hexToRgb(obj.borderColor);
                                    const fillColor = obj.fillColor && obj.fillColor !== 'transparent' ? hexToRgb(obj.fillColor) : null;
                    page.drawRectangle({
                        x: obj.x,
                                        y: pageHeight - obj.y - obj.height,
                        width: obj.width,
                        height: obj.height,
                                        borderColor: PDFLib.rgb(br / 255, bg / 255, bb / 255),
                                        borderWidth: 2,
                                        color: fillColor ? PDFLib.rgb(fillColor[0] / 255, fillColor[1] / 255, fillColor[2] / 255) : undefined
                                    });
                                    break;
                                case 'circle':
                                    const [cr, cg, cb] = hexToRgb(obj.borderColor);
                                    const circleFillColor = obj.fillColor && obj.fillColor !== 'transparent' ? hexToRgb(obj.fillColor) : null;
                    page.drawEllipse({
                        x: obj.x + obj.width / 2,
                                        y: pageHeight - obj.y - obj.height / 2,
                        xScale: obj.width / 2,
                        yScale: obj.height / 2,
                                        borderColor: PDFLib.rgb(cr / 255, cg / 255, cb / 255),
                                        borderWidth: 2,
                                        color: circleFillColor ? PDFLib.rgb(circleFillColor[0] / 255, circleFillColor[1] / 255, circleFillColor[2] / 255) : undefined
                    });
                                    break;
                                case 'line':
                                    const [lr, lg, lb] = hexToRgb(obj.borderColor);
                    page.drawLine({
                                        start: { x: obj.x, y: pageHeight - obj.y },
                                        end: { x: obj.x + obj.width, y: pageHeight - (obj.y + obj.height) },
                                        thickness: 2,
                                        color: PDFLib.rgb(lr / 255, lg / 255, lb / 255)
                                    });
                                    break;
                            }
                        } catch (objError) {
                            console.error("Error adding object to PDF:", objError);
                        }
                    }
                }
            }
            
            const pdfBytes = await editedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
        a.href = url;
            a.download = pdfFile ? `edited_${pdfFile.name}` : 'edited.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert("PDF downloaded successfully!", 'success');
        } catch (error) {
            console.error("Error saving PDF:", error);
            showAlert("Error saving PDF: " + (error.message || "Please try again."), 'danger');
        } finally {
            downloadPdfBtn.disabled = false;
            downloadPdfBtn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
        }
    }
    
    function resetPDF() {
        pdfFile = null;
        pdfJsDoc = null;
        pdfLibDoc = null;
        pdfBytes = null;
        currentPageNumber = 1;
        scale = 1.0;
        editingObjects = {};
        pdfTextItems = {};
        editedTextItems = {};
        
        if (fileList) fileList.innerHTML = "";
        if (canvasContainer) canvasContainer.innerHTML = "";
        updateUIState(false);
        if (pdfInput) pdfInput.value = '';
        
        // Hide floating download button
        if (downloadPdfBtn) downloadPdfBtn.style.display = 'none';
        
        // Hide formatting toolbar
        if (textFormatToolbar) textFormatToolbar.style.display = 'none';
        currentEditingTextSpan = null;
        
        if (uploadSection) uploadSection.style.display = 'block';
        if (editingSection) editingSection.style.display = 'none';
    }

    function hexToRgb(hex) {
        if (!hex) return [0, 0, 0];
        
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r || 0, g || 0, b || 0];
        } else if (hex.startsWith('rgba')) {
            const matches = hex.match(/\d+/g);
            return [parseInt(matches[0]) || 0, parseInt(matches[1]) || 0, parseInt(matches[2]) || 0];
        } else if (hex.startsWith('rgb')) {
            const matches = hex.match(/\d+/g);
            return [parseInt(matches[0]) || 0, parseInt(matches[1]) || 0, parseInt(matches[2]) || 0];
        }
        return [0, 0, 0];
    }

    function showAlert(message, type) {
        if (!alertPlaceholder) return;
        
        alertPlaceholder.innerHTML = '';
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = 
            `${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        alertPlaceholder.appendChild(alertDiv);
        
        setTimeout(() => {
            try {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            } catch (e) {
                alertDiv.remove();
            }
        }, 5000);
    }
});
