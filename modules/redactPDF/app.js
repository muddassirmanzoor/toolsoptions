// Configure PDF.js worker
(function configurePdfJsWorker() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('PDF.js worker configured');
    } else {
        window.addEventListener('load', () => {
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
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const redactTextBtn = document.getElementById("redactTextBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const wordsTextarea = document.getElementById("words");
    const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
    const pdfCanvas = document.getElementById("pdfCanvas");
    const pageSelect = document.getElementById("pageSelect");
    const pageInfo = document.getElementById("pageInfo");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const highlightsInfo = document.getElementById("highlightsInfo");
    
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
    
    let pdfFiles = [];
    let pdfDoc = null;
    let currentPage = 1;
    let scale = 1.2;
    let searchTerms = [];
    let textMatches = {}; // Store matches per page: { pageNum: [{term, rects: [...]}] }
    let currentViewport = null;
    let currentPageObj = null;

    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library is not loaded. Please check the script tag.');
        showAlert('PDF.js library failed to load. Please refresh the page.', 'danger');
    }

    // Initial state button listeners
    if (selectFilesBtn) {
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
    if (addBtn) {
        addBtn.addEventListener("click", () => pdfInput.click());
    }
    if (computerBtn) {
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

    // Zoom controls
    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", () => {
            scale = Math.min(scale + 0.2, 3);
            if (pdfDoc) renderPage(currentPage);
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", () => {
            scale = Math.max(scale - 0.2, 0.5);
            if (pdfDoc) renderPage(currentPage);
        });
    }
    
    // Page navigation
    if (pageSelect) {
        pageSelect.addEventListener("change", (e) => {
            currentPage = parseInt(e.target.value);
            renderPage(currentPage);
            // Re-search if there are search terms
            if (searchTerms.length > 0 && pdfDoc) {
                searchAndHighlight(currentPage);
            }
        });
    }

    // Watch textarea for changes to search and highlight
    if (wordsTextarea) {
        wordsTextarea.addEventListener("input", () => {
            if (pdfDoc) {
                updateSearchTerms();
                searchAndHighlight(currentPage);
            }
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

    pdfInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        event.target.value = '';
    }

    async function handleDroppedFiles(files) {
        if (pdfFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(async file => {
            if (file.type === "application/pdf") {
                pdfFiles.push(file);
                await loadPdfFile(file);
                updateFileList();
                updateUIState();
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
    }

    async function loadPdfFile(file) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }

            const fileReader = new FileReader();
            fileReader.onload = async function(e) {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    
                    // Initialize page selector
                    if (pageSelect) {
                        pageSelect.innerHTML = '';
                        for (let i = 1; i <= pdfDoc.numPages; i++) {
                            const option = document.createElement('option');
                            option.value = i;
                            option.textContent = `Page ${i}`;
                            pageSelect.appendChild(option);
                        }
                    }
                    
                    currentPage = 1;
                    textMatches = {};
                    updatePageInfo();
                    
                    // Show PDF preview instead of thumbnail
                    if (fileList) fileList.style.display = 'none';
                    if (pdfPreviewContainer) {
                        pdfPreviewContainer.style.display = 'block';
                    }
                    
                    // Render first page
                    await renderPage(1);
                    
                    // Update search terms and highlight if textarea has content
                    if (wordsTextarea && wordsTextarea.value.trim()) {
                        updateSearchTerms();
                        searchAndHighlight(1);
                    }
                } catch (error) {
                    console.error('Error loading PDF:', error);
                    showAlert('Failed to load PDF: ' + error.message, 'danger');
                }
            };
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error reading file:', error);
            showAlert('Failed to read PDF file: ' + error.message, 'danger');
        }
    }

    async function renderPage(pageNumber) {
        if (!pdfDoc || !pdfCanvas) return;

        try {
            const page = await pdfDoc.getPage(pageNumber);
            currentPageObj = page;
            const viewport = page.getViewport({ scale });
            currentViewport = viewport;

            // Set canvas size to match viewport dimensions
            pdfCanvas.width = viewport.width;
            pdfCanvas.height = viewport.height;

            const context = pdfCanvas.getContext('2d');
            
            // Clear canvas
            context.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
            
            // Render the PDF page
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
            
            // Apply highlights after rendering
            await highlightMatches(pageNumber, page, viewport, context);
            
            updatePageInfo();
        } catch (error) {
            console.error('Error rendering page:', error);
            showAlert('Failed to render PDF page: ' + error.message, 'danger');
        }
    }

    async function highlightMatches(pageNumber, page, viewport, context) {
        if (searchTerms.length === 0) {
            textMatches[pageNumber] = [];
            return;
        }

        try {
            const textContent = await page.getTextContent();
            const textItems = textContent.items;
            const matches = [];
            
            // Search for each term in text items
            searchTerms.forEach(term => {
                const termLower = term.toLowerCase().trim();
                if (!termLower) return;
                
                textItems.forEach((item, itemIndex) => {
                    const itemText = item.str.toLowerCase();
                    
                    // Check if term appears in this item
                    if (itemText.includes(termLower)) {
                        const transform = item.transform;
                        // Transform matrix: [a, b, c, d, e, f]
                        // e = x translation (horizontal position)
                        // f = y translation (vertical position, measured from bottom in PDF coordinates)
                        const x = transform[4];
                        const y = transform[5];
                        
                        // Get font size from transform (d component is vertical scale, usually negative)
                        const fontSize = Math.abs(transform[3]) || 12;
                        // Get horizontal scale (a component)
                        const hScale = Math.abs(transform[0]) || fontSize * 0.6;
                        
                        // Calculate width - use item.width if available, otherwise estimate
                        let itemWidth;
                        if (item.width && item.width > 0) {
                            itemWidth = item.width;
                        } else {
                            // Estimate width from character count
                            itemWidth = item.str.length * hScale;
                        }
                        
                        // Calculate height - use item.height if available, otherwise use font size
                        let itemHeight;
                        if (item.height && item.height > 0) {
                            itemHeight = item.height;
                        } else {
                            itemHeight = fontSize;
                        }
                        
                        // Find the position within the item where the term starts
                        const termStartInItem = itemText.indexOf(termLower);
                        const termWidth = termLower.length * (itemWidth / item.str.length);
                        
                        // Calculate highlight position
                        const highlightX = x + (termStartInItem * (itemWidth / item.str.length));
                        
                        // Convert PDF coordinates (bottom-left origin) to canvas coordinates (top-left origin)
                        // In PDF: y is measured from bottom, so higher y values are higher on page
                        // In Canvas: y is measured from top, so we need to flip
                        // The item's y coordinate is at the baseline, so we subtract height to get bottom
                        const canvasX = highlightX;
                        const canvasY = viewport.height - (y + itemHeight);
                        
                        matches.push({
                            term: term,
                            text: item.str.substring(termStartInItem, termStartInItem + term.length),
                            x: canvasX,
                            y: canvasY,
                            width: termWidth,
                            height: itemHeight,
                            originalX: highlightX,
                            originalY: y,
                            itemIndex: itemIndex
                        });
                    }
                });
            });
            
            textMatches[pageNumber] = matches;
            
            // Draw highlights
            if (matches.length > 0) {
                context.save();
                context.globalAlpha = 0.5;
                context.fillStyle = '#ff0000';
                context.strokeStyle = '#cc0000';
                context.lineWidth = 2;
                
                matches.forEach(match => {
                    // Fill rectangle
                    context.fillRect(match.x, match.y, match.width, match.height);
                    // Draw border
                    context.strokeRect(match.x, match.y, match.width, match.height);
                });
                
                context.globalAlpha = 1.0;
                context.restore();
            }
            
            updateHighlightsInfo();
        } catch (error) {
            console.error('Error highlighting matches:', error);
            showAlert('Error highlighting text: ' + error.message, 'warning');
        }
    }


    function updateSearchTerms() {
        const text = wordsTextarea.value.trim();
        if (!text) {
            searchTerms = [];
            textMatches = {};
            return;
        }

        // Split by newlines and filter empty strings
        searchTerms = text.split('\n')
            .map(term => term.trim())
            .filter(term => term.length > 0);
    }

    async function searchAndHighlight(pageNumber) {
        if (!pdfDoc) return;
        await renderPage(pageNumber);
    }

    function updateHighlightsInfo() {
        if (!highlightsInfo) return;
        
        const pageMatches = textMatches[currentPage] || [];
        const totalMatches = pageMatches.length;
        
        if (searchTerms.length === 0) {
            highlightsInfo.textContent = 'Enter text to search and redact';
            highlightsInfo.style.color = '#666';
        } else if (totalMatches > 0) {
            highlightsInfo.textContent = `Found ${totalMatches} text match(es) for: ${searchTerms.join(', ')}`;
            highlightsInfo.style.color = '#ff0000';
        } else {
            highlightsInfo.textContent = 'No matches found. Try different search terms.';
            highlightsInfo.style.color = '#ff0000';
        }
    }

    function updatePageInfo() {
        if (pageInfo && pdfDoc) {
            pageInfo.textContent = `${currentPage} / ${pdfDoc.numPages}`;
        }
    }

    function updateFileList() {
        // Remove existing thumbnails
        var pdfThumb = document.querySelectorAll('.pdf-thumbnail');
        pdfThumb.forEach(thumb => {
            thumb.remove();
        });
        
        if (fileList && !pdfDoc) {
            fileList.innerHTML = "";
            
            pdfFiles.forEach((file, index) => {
                const divItem = document.createElement("div");
                divItem.classList.add("pdf-thumbnail");
                
                const imgItem = document.createElement("img");
                imgItem.src = '../compressPDF/assets/pdf-icon.svg';
                imgItem.alt = file.name;
                imgItem.classList.add('pdf-icon-preview');
                
                const delDiv = document.createElement("div");
                delDiv.classList.add("delete-icon");
                const delImg = document.createElement("img");
                delImg.src = '/assests/Group 85.png';
                delImg.alt = 'Delete Icon';
                delDiv.addEventListener("click", () => removeFile(index));
                delDiv.appendChild(delImg);
                
                const nameDiv = document.createElement("div");
                nameDiv.classList.add("pdf-file-name");
                nameDiv.textContent = file.name;
                
                divItem.appendChild(imgItem);
                divItem.appendChild(nameDiv);
                divItem.appendChild(delDiv);
                
                fileList.appendChild(divItem);
            });
        }
    }

    function updateUIState() {
        const hasFiles = pdfFiles.length > 0;
        
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
            
            // Hide PDF preview
            if (pdfPreviewContainer) pdfPreviewContainer.style.display = 'none';
            if (fileList) fileList.style.display = 'block';
            pdfDoc = null;
            currentPageObj = null;
            currentViewport = null;
        }
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        pdfDoc = null;
        searchTerms = [];
        textMatches = {};
        currentPage = 1;
        scale = 1.2;
        currentPageObj = null;
        currentViewport = null;
        updateFileList();
        updateUIState();
        
        // Reset page selector
        if (pageSelect) pageSelect.innerHTML = '';
        if (pageInfo) pageInfo.textContent = '';
        if (highlightsInfo) highlightsInfo.textContent = 'Text matches will be highlighted in red';
    }
    
    // Initialize UI state
    updateUIState();

    redactTextBtn.addEventListener("click", redactText);

    async function redactText() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to redact text from.", 'danger');
            return;
        }
    
        // Collect all search terms from textarea
        const words = wordsTextarea.value.trim().split('\n').filter(Boolean);
        
        // Validate that text is provided
        if (words.length === 0) {
            showAlert("Please enter words or sentences to redact (one per line).", 'danger');
            return;
        }
    
        redactTextBtn.disabled = true;
        redactTextBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
        try {
            const formData = new FormData();
            formData.append("pdf", pdfFiles[0]);
            formData.append("textToRedact", words.join(','));
        
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL;
        
            console.log('Sending request to:', `${SERVER_NAME}/api/redact-pdf`);
            const response = await fetch(`${SERVER_NAME}/api/redact-pdf`, {
                method: "POST",
                body: formData
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                // Try to get error message from response
                let errorText = '';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorJson = await response.json();
                        errorText = errorJson.error || errorJson.message || JSON.stringify(errorJson);
                        console.error('Error response (JSON):', errorJson);
                    } else {
                        errorText = await response.text();
                        console.error('Error response (text):', errorText);
                    }
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);
                    errorText = `Server returned ${response.status} ${response.statusText}`;
                }
                throw new Error(errorText || "Failed to redact text.");
            }
            
            const blob = await response.blob();
            const fileName = generateRedactedFileName(pdfFiles[0].name);
            downloadRedactedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during redaction: " + error.message, 'danger');
        } finally {
            redactTextBtn.disabled = false;
            redactTextBtn.innerHTML = 'Redact Text';
        }
    }
    

    function generateRedactedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, "");
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        return `${baseName}_redacted_${randomNumber}.pdf`;
    }

    function downloadRedactedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Text redacted successfully! Total matches found and redacted.", 'success');
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `${message}`;
        alertPlaceholder.innerHTML = '';
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout
        setTimeout(() => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const alert = new bootstrap.Alert(alertDiv);
                alert.close();
            } else {
                alertDiv.remove();
            }
        }, 7000);
    }
});
