document.addEventListener("DOMContentLoaded", () => {
    const pdfInputSplit = document.getElementById("pdfInputSplit");
    const fileListSplit = document.getElementById("fileListSplit");
    const splitBtn = document.getElementById("splitBtn");
    const extractAllPagesBtn = document.getElementById("extractAllPagesBtn");
    const extractSplitBtn = document.getElementById("extractSplitBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const startRange = document.getElementById("startRange");
    const endRange = document.getElementById("endRange");
    const splitRange = document.getElementById("splitRange");
    const customRange = document.getElementById("customRange");
    const fixedRangeRadio = document.getElementById("fixedRangeRadio");
    const customRangeInputs = document.getElementById("customRangeInputs");
    const rangeInfoText = document.getElementById("rangeInfoText");
    const fromPage = document.getElementById("fromPage");
    const toPage = document.getElementById("toPage");
    const selectPages = document.getElementById("selectPages");
    const extractAll = document.getElementById("extractAll");
    const selectPagesRadio = document.getElementById("selectPagesRadio");
    const mergeOption = document.getElementById("mergeOption");
    const decreaseRange = document.getElementById("decreaseRange");
    const increaseRange = document.getElementById("increaseRange");
    const pagesInputContainer = document.getElementById("pagesInputContainer");
    const pdfPreviewRange = document.getElementById("pdfPreviewRange").querySelector('.row');
    const pdfPreviewExtract = document.getElementById("pdfPreviewExtract").querySelector('.row');

    // UI State Elements for Range Section
    const initialUploadStateRange = document.getElementById("initialUploadStateRange");
    const fileSelectionButtonsRange = document.getElementById("fileSelectionButtonsRange");
    const selectFilesBtnRange = document.getElementById("selectFilesBtnRange");
    const initialGoogleDriveBtnRange = document.getElementById("initialGoogleDriveBtnRange");
    const initialDropboxBtnRange = document.getElementById("initialDropboxBtnRange");
    const addBtnRange = document.getElementById("addBtnRange");
    const computerBtnRange = document.getElementById("computerBtnRange");
    const googleDriveBtnRange = document.getElementById("googleDriveBtnRange");
    const dropboxBtnRange = document.getElementById("dropboxBtnRange");
    const fileInfoRange = document.getElementById("fileInfoRange");
    const fileNameRange = document.getElementById("fileNameRange");
    const removeFileBtnRange = document.getElementById("removeFileBtnRange");
    const fileContainerRange = document.querySelector('.col-lg-6.position-relative:first-of-type');

    // UI State Elements for Extract Section
    const initialUploadStateExtract = document.getElementById("initialUploadStateExtract");
    const fileSelectionButtonsExtract = document.getElementById("fileSelectionButtonsExtract");
    const selectFilesBtnExtract = document.getElementById("selectFilesBtnExtract");
    const initialGoogleDriveBtnExtract = document.getElementById("initialGoogleDriveBtnExtract");
    const initialDropboxBtnExtract = document.getElementById("initialDropboxBtnExtract");
    const addBtnExtract = document.getElementById("addBtnExtract");
    const computerBtnExtract = document.getElementById("computerBtnExtract");
    const googleDriveBtnExtract = document.getElementById("googleDriveBtnExtract");
    const dropboxBtnExtract = document.getElementById("dropboxBtnExtract");
    const fileInfoExtract = document.getElementById("fileInfoExtract");
    const fileNameExtract = document.getElementById("fileNameExtract");
    const removeFileBtnExtract = document.getElementById("removeFileBtnExtract");
    const fileContainerExtract = document.querySelector('.col-lg-6.position-relative:last-of-type');

    let pdfFiles = [];
    let currentPdfDoc = null;
    let totalPages = 0;
    let googleApiInitialized = false;
    let googleAccessToken = null;

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || '';
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    // Dropbox API Configuration
    const DROPBOX_APP_KEY = window.env?.DROPBOX_APP_KEY || 'YOUR_DROPBOX_APP_KEY';

    // Range mode radio button handlers
    customRange.addEventListener("change", () => {
        if (customRange.checked) {
            customRangeInputs.style.display = "block";
            updateRangeInfoText();
        }
    });

    fixedRangeRadio.addEventListener("change", () => {
        if (fixedRangeRadio.checked) {
            customRangeInputs.style.display = "none";
            updateRangeInfoText();
        }
    });

    // Extract mode radio button handlers
    extractAll.addEventListener("change", () => {
        if (extractAll.checked) {
            pagesInputContainer.style.display = "none";
            selectPages.style.display = "none";
        }
    });

    selectPagesRadio.addEventListener("change", () => {
        if (selectPagesRadio.checked) {
            pagesInputContainer.style.display = "flex";
            selectPages.style.display = "block";
        }
    });

    // Update range info text
    function updateRangeInfoText() {
        if (fixedRangeRadio.checked) {
            const range = parseInt(splitRange.value, 10) || 2;
            rangeInfoText.textContent = `This PDF will be split into files of ${range} pages.`;
        } else {
            rangeInfoText.textContent = "Enter start and end page numbers.";
        }
    }

    // Split range increment/decrement
    decreaseRange.addEventListener("click", () => {
        const current = parseInt(splitRange.value, 10) || 2;
        if (current > 1) {
            splitRange.value = current - 1;
            updateRangeInfoText();
        }
    });

    increaseRange.addEventListener("click", () => {
        const current = parseInt(splitRange.value, 10) || 2;
        splitRange.value = current + 1;
        updateRangeInfoText();
    });

    splitRange.addEventListener("input", () => {
        updateRangeInfoText();
    });

    pdfInputSplit.addEventListener("change", handleFileSelection);

    async function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    async function handleDroppedFiles(files) {
        for (const file of files) {
            if (file.type === "application/pdf") {
                if (pdfFiles.some(f => f.name === file.name)) {
                    showAlert(`File "${file.name}" is already added.`, 'warning');
                } else {
                    pdfFiles.push(file);
                    await loadPdfPreview(file);
                    updateFileList();
                    updateUIState();
                }
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        }
    }

    async function loadPdfPreview(file) {
        try {
            const { PDFDocument } = PDFLib;
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            currentPdfDoc = pdfDoc;
            totalPages = pdfDoc.getPageCount();

            // Render preview for both sections
            renderPdfPreview(pdfPreviewRange, totalPages);
            renderPdfPreview(pdfPreviewExtract, totalPages);
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Error loading PDF file.", 'danger');
        }
    }

    function renderPdfPreview(container, pageCount) {
        container.innerHTML = "";
        const maxPages = Math.min(pageCount, 6); // Show max 6 pages in preview
        
        for (let i = 0; i < maxPages; i++) {
            const col = document.createElement("div");
            col.className = "col-4";
            
            const pdfPage = document.createElement("div");
            pdfPage.className = "pdf-page";
            
            const img = document.createElement("img");
            img.src = "/assests/pdf 2.png";
            img.alt = `PDF ${i + 1}`;
            img.className = "img-fluid";
            
            const p = document.createElement("p");
            p.className = "text-center";
            p.textContent = `Page ${i + 1}`;
            
            pdfPage.appendChild(img);
            pdfPage.appendChild(p);
            col.appendChild(pdfPage);
            container.appendChild(col);
        }
    }

    function updateFileList() {
        fileListSplit.innerHTML = "";
        pdfFiles.forEach((file, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            listItem.textContent = file.name;
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.classList.add("btn", "btn-danger", "btn-sm");
            removeBtn.addEventListener("click", () => removeFile(index));
            listItem.appendChild(removeBtn);
            fileListSplit.appendChild(listItem);
        });
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        if (pdfFiles.length === 0) {
            currentPdfDoc = null;
            totalPages = 0;
            pdfPreviewRange.innerHTML = "";
            pdfPreviewExtract.innerHTML = "";
        } else {
            // Reload preview for the first file
            loadPdfPreview(pdfFiles[0]);
        }
        updateFileList();
        updateUIState();
    }

    function updateUIState() {
        const hasFiles = pdfFiles.length > 0;
        
        // Update Range Section
        if (initialUploadStateRange) {
            initialUploadStateRange.style.display = hasFiles ? 'none' : 'flex';
        }
        if (fileSelectionButtonsRange) {
            fileSelectionButtonsRange.style.display = hasFiles ? 'flex' : 'none';
        }
        if (fileInfoRange) {
            fileInfoRange.style.display = hasFiles ? 'block' : 'none';
            if (hasFiles && fileNameRange && pdfFiles[0]) {
                fileNameRange.textContent = pdfFiles[0].name;
            }
        }
        if (fileContainerRange) {
            if (hasFiles) {
                fileContainerRange.classList.add('has-files');
            } else {
                fileContainerRange.classList.remove('has-files');
            }
        }

        // Update Extract Section
        if (initialUploadStateExtract) {
            initialUploadStateExtract.style.display = hasFiles ? 'none' : 'flex';
        }
        if (fileSelectionButtonsExtract) {
            fileSelectionButtonsExtract.style.display = hasFiles ? 'flex' : 'none';
        }
        if (fileInfoExtract) {
            fileInfoExtract.style.display = hasFiles ? 'block' : 'none';
            if (hasFiles && fileNameExtract && pdfFiles[0]) {
                fileNameExtract.textContent = pdfFiles[0].name;
            }
        }
        if (fileContainerExtract) {
            if (hasFiles) {
                fileContainerExtract.classList.add('has-files');
            } else {
                fileContainerExtract.classList.remove('has-files');
            }
        }
    }

    // Button event listeners for Range Section
    if (selectFilesBtnRange) {
        selectFilesBtnRange.addEventListener("click", () => pdfInputSplit.click());
    }
    if (initialGoogleDriveBtnRange) {
        initialGoogleDriveBtnRange.addEventListener("click", () => openGoogleDrivePicker());
    }
    if (initialDropboxBtnRange) {
        initialDropboxBtnRange.addEventListener("click", () => openDropboxPicker());
    }
    if (addBtnRange) {
        addBtnRange.addEventListener("click", () => pdfInputSplit.click());
    }
    if (computerBtnRange) {
        computerBtnRange.addEventListener("click", () => pdfInputSplit.click());
    }
    if (googleDriveBtnRange) {
        googleDriveBtnRange.addEventListener("click", () => openGoogleDrivePicker());
    }
    if (dropboxBtnRange) {
        dropboxBtnRange.addEventListener("click", () => openDropboxPicker());
    }
    if (removeFileBtnRange) {
        removeFileBtnRange.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (pdfFiles.length > 0) {
                removeFile(0);
            }
        });
    }

    // Button event listeners for Extract Section
    if (selectFilesBtnExtract) {
        selectFilesBtnExtract.addEventListener("click", () => pdfInputSplit.click());
    }
    if (initialGoogleDriveBtnExtract) {
        initialGoogleDriveBtnExtract.addEventListener("click", () => openGoogleDrivePicker());
    }
    if (initialDropboxBtnExtract) {
        initialDropboxBtnExtract.addEventListener("click", () => openDropboxPicker());
    }
    if (addBtnExtract) {
        addBtnExtract.addEventListener("click", () => pdfInputSplit.click());
    }
    if (computerBtnExtract) {
        computerBtnExtract.addEventListener("click", () => pdfInputSplit.click());
    }
    if (googleDriveBtnExtract) {
        googleDriveBtnExtract.addEventListener("click", () => openGoogleDrivePicker());
    }
    if (dropboxBtnExtract) {
        dropboxBtnExtract.addEventListener("click", () => openDropboxPicker());
    }
    if (removeFileBtnExtract) {
        removeFileBtnExtract.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (pdfFiles.length > 0) {
                removeFile(0);
            }
        });
    }

    // Drag and drop for initial upload areas
    [initialUploadStateRange, initialUploadStateExtract].forEach(uploadState => {
        if (uploadState) {
            uploadState.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadState.classList.add('drag-over');
            });

            uploadState.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadState.classList.remove('drag-over');
            });

            uploadState.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadState.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                handleDroppedFiles(files);
            });
        }
    });

    // Split button handler
    splitBtn.addEventListener("click", async () => {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file first.", 'danger');
            return;
        }

        if (customRange.checked) {
            const start = parseInt(startRange.value, 10);
            const end = parseInt(endRange.value, 10);
            
            if (!start || !end) {
                showAlert("Please specify both start and end page numbers.", 'danger');
                return;
            }
            
            if (start > end) {
                showAlert("Start page must be less than or equal to end page.", 'danger');
                return;
            }
            
            await splitByRange(start, end);
        } else if (fixedRangeRadio.checked) {
            const range = parseInt(splitRange.value, 10);
            
            if (!range || range < 1) {
                showAlert("Please specify a valid range (minimum 1).", 'danger');
                return;
            }
            
            await splitByFixedRange(range);
        } else {
            showAlert("Please select a range mode.", 'danger');
        }
    });

    // Extract split button handler
    extractSplitBtn.addEventListener("click", async () => {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file first.", 'danger');
            return;
        }

        if (extractAll.checked) {
            await extractAllPages();
        } else if (selectPagesRadio.checked) {
            const from = parseInt(fromPage.value, 10);
            const to = parseInt(toPage.value, 10);
            const customPages = selectPages.value.trim();
            
            if (customPages) {
                // Use custom page selection
                const pageRanges = customPages.split(',').map(range => range.trim());
                await extractSelectedPages(pageRanges, mergeOption.checked);
            } else if (from && to) {
                // Use from/to range
                if (from > to) {
                    showAlert("From page must be less than or equal to to page.", 'danger');
                    return;
                }
                await extractSelectedPages([`${from}-${to}`], mergeOption.checked);
            } else {
                showAlert("Please specify pages to extract.", 'danger');
            }
        }
    });

    // Extract all pages button handler
    if (extractAllPagesBtn) {
        extractAllPagesBtn.addEventListener("click", async () => {
            if (pdfFiles.length === 0) {
                showAlert("Please add a PDF file first.", 'danger');
                return;
            }
            await extractAllPages();
        });
    }

    async function splitByRange(start, end) {
        splitBtn.disabled = true;
        splitBtn.innerHTML = 'Processing... <span class="spinner-border spinner-border-sm" role="status"></span>';
        
        try {
            for (const file of pdfFiles) {
                const { PDFDocument } = PDFLib;
                const pdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes);

                if (end > pdfDoc.getPageCount()) {
                    showAlert(`End page exceeds total number of pages (${pdfDoc.getPageCount()}).`, 'danger');
                    return;
                }

                if (start < 1 || start > pdfDoc.getPageCount()) {
                    showAlert(`Start page is out of range (1-${pdfDoc.getPageCount()}).`, 'danger');
                    return;
                }

                for (let i = start - 1; i < end; i++) {
                    const newPdfDoc = await PDFDocument.create();
                    const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
                    newPdfDoc.addPage(page);

                    const newPdfBytes = await newPdfDoc.save();
                    downloadPDF(newPdfBytes, `split_${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`);
                }
            }
            showAlert("PDF split completed successfully!", 'success');
        } catch (error) {
            console.error("Error splitting PDF:", error);
            showAlert("An error occurred while splitting the PDF.", 'danger');
        } finally {
            splitBtn.disabled = false;
            splitBtn.innerHTML = 'Split PDF';
        }
    }

    async function splitByFixedRange(range) {
        splitBtn.disabled = true;
        splitBtn.innerHTML = 'Processing... <span class="spinner-border spinner-border-sm" role="status"></span>';
        
        try {
            for (const file of pdfFiles) {
                const { PDFDocument } = PDFLib;
                const pdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const totalPages = pdfDoc.getPageCount();

                for (let i = 0; i < totalPages; i += range) {
                    const newPdfDoc = await PDFDocument.create();
                    const pages = await newPdfDoc.copyPages(pdfDoc, Array.from({ length: Math.min(range, totalPages - i) }, (_, idx) => i + idx));
                    pages.forEach(page => newPdfDoc.addPage(page));

                    const newPdfBytes = await newPdfDoc.save();
                    downloadPDF(newPdfBytes, `split_${file.name.replace('.pdf', '')}_range_${i + 1}-${Math.min(i + range, totalPages)}.pdf`);
                }
            }
            showAlert("PDF split completed successfully!", 'success');
        } catch (error) {
            console.error("Error splitting PDF:", error);
            showAlert("An error occurred while splitting the PDF.", 'danger');
        } finally {
            splitBtn.disabled = false;
            splitBtn.innerHTML = 'Split PDF';
        }
    }

    async function extractAllPages() {
        extractSplitBtn.disabled = true;
        extractSplitBtn.innerHTML = 'Processing... <span class="spinner-border spinner-border-sm" role="status"></span>';
        
        try {
            for (const file of pdfFiles) {
                const { PDFDocument } = PDFLib;
                const pdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes);

                for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                    const newPdfDoc = await PDFDocument.create();
                    const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
                    newPdfDoc.addPage(page);

                    const newPdfBytes = await newPdfDoc.save();
                    downloadPDF(newPdfBytes, `extracted_${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`);
                }
            }
            showAlert("All pages extracted successfully!", 'success');
        } catch (error) {
            console.error("Error extracting pages:", error);
            showAlert("An error occurred while extracting pages.", 'danger');
        } finally {
            extractSplitBtn.disabled = false;
            extractSplitBtn.innerHTML = 'Split PDF';
        }
    }

    async function extractSelectedPages(pages, merge = false) {
        extractSplitBtn.disabled = true;
        extractSplitBtn.innerHTML = 'Processing... <span class="spinner-border spinner-border-sm" role="status"></span>';
        
        try {
            for (const file of pdfFiles) {
                const { PDFDocument } = PDFLib;
                const pdfBytes = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const totalPages = pdfDoc.getPageCount();

                if (merge) {
                    // Merge all selected pages into one PDF
                    const newPdfDoc = await PDFDocument.create();
                    const pagesToExtract = [];

                    for (const pageRange of pages) {
                        if (pageRange.includes('-')) {
                            const [start, end] = pageRange.split('-').map(Number);
                            if (start < 1 || end > totalPages || start > end) {
                                showAlert(`Invalid page range: ${pageRange}`, 'danger');
                                continue;
                            }
                            for (let i = start - 1; i < end; i++) {
                                pagesToExtract.push(i);
                            }
                        } else {
                            const pageNum = Number(pageRange);
                            if (pageNum < 1 || pageNum > totalPages) {
                                showAlert(`Invalid page number: ${pageNum}`, 'danger');
                                continue;
                            }
                            pagesToExtract.push(pageNum - 1);
                        }
                    }

                    // Remove duplicates and sort
                    const uniquePages = [...new Set(pagesToExtract)].sort((a, b) => a - b);
                    const pagesList = await newPdfDoc.copyPages(pdfDoc, uniquePages);
                    pagesList.forEach(page => newPdfDoc.addPage(page));

                    const newPdfBytes = await newPdfDoc.save();
                    downloadPDF(newPdfBytes, `extracted_${file.name.replace('.pdf', '')}_merged.pdf`);
                } else {
                    // Extract pages separately
                    for (const pageRange of pages) {
                        if (pageRange.includes('-')) {
                            const [start, end] = pageRange.split('-').map(Number);
                            if (start < 1 || end > totalPages || start > end) {
                                showAlert(`Invalid page range: ${pageRange}`, 'danger');
                                continue;
                            }
                            const newPdfDoc = await PDFDocument.create();
                            const pagesToExtract = Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx);
                            const pagesList = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
                            pagesList.forEach(page => newPdfDoc.addPage(page));

                            const newPdfBytes = await newPdfDoc.save();
                            downloadPDF(newPdfBytes, `extracted_${file.name.replace('.pdf', '')}_pages_${start}-${end}.pdf`);
                        } else {
                            const pageNum = Number(pageRange);
                            if (pageNum < 1 || pageNum > totalPages) {
                                showAlert(`Invalid page number: ${pageNum}`, 'danger');
                                continue;
                            }
                            const newPdfDoc = await PDFDocument.create();
                            const [page] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
                            newPdfDoc.addPage(page);

                            const newPdfBytes = await newPdfDoc.save();
                            downloadPDF(newPdfBytes, `extracted_${file.name.replace('.pdf', '')}_page_${pageNum}.pdf`);
                        }
                    }
                }
            }
            showAlert("Pages extracted successfully!", 'success');
        } catch (error) {
            console.error("Error extracting pages:", error);
            showAlert("An error occurred while extracting pages.", 'danger');
        } finally {
            extractSplitBtn.disabled = false;
            extractSplitBtn.innerHTML = 'Split PDF';
        }
    }

    async function downloadPDF(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Get user ID
        let userId = null;
        try {
            const laravelUrl = 'http://82.180.132.134:8000';
            const userResponse = await fetch(`${laravelUrl}/api/current-user`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.authenticated && userData.user_id) {
                    userId = userData.user_id;
                }
            }
        } catch (error) {
            console.warn('Could not fetch user ID:', error);
        }
        
        // Record file in database
        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL || 'http://82.180.132.134:3000';
            const formData = new FormData();
            formData.append('file', blob, filename);
            formData.append('tool_name', 'Split PDF');
            if (userId) formData.append('user_id', userId);
            formData.append('original_filename', filename);
            
            await fetch(`${SERVER_NAME}/api/record-processed-file`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.warn('Failed to record file in database:', error);
        }
        
        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 100);
    }

    function showAlert(message, type) {
        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = "alert";
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertPlaceholder.innerHTML = "";
        alertPlaceholder.appendChild(alert);
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Google Drive Integration Functions
    function initializeGoogleAPI() {
        if (typeof gapi === 'undefined') {
            console.warn('Google API not loaded. Please check if the script is included.');
            return;
        }

        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            console.warn('Google Drive API credentials not configured. Please set GOOGLE_CLIENT_ID in your environment variables.');
            return;
        }

        gapi.load('picker', () => {
            googleApiInitialized = true;
            console.log('Google Picker API loaded successfully');
        });
    }

    function openGoogleDrivePicker() {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            showAlert('Google Drive API credentials not configured. Please contact the administrator.', 'warning');
            return;
        }

        if (!googleApiInitialized) {
            showAlert('Google Drive is initializing. Please try again in a moment.', 'info');
            initializeGoogleAPI();
            setTimeout(() => {
                if (googleApiInitialized) {
                    authenticateAndCreatePicker();
                } else {
                    showAlert('Failed to initialize Google Drive. Please refresh the page.', 'danger');
                }
            }, 1500);
            return;
        }

        authenticateAndCreatePicker();
    }

    function authenticateAndCreatePicker() {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            try {
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.readonly',
                    callback: (response) => {
                        if (response && response.access_token) {
                            googleAccessToken = response.access_token;
                            createPicker();
                        } else if (response && response.error) {
                            console.error('OAuth error:', response.error);
                            showAlert('Failed to authenticate with Google: ' + response.error, 'danger');
                        } else {
                            showAlert('Failed to authenticate with Google. Please try again.', 'danger');
                        }
                    },
                });

                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                console.error('Error initializing token client:', error);
                showAlert('Failed to initialize Google authentication. Please refresh the page.', 'danger');
            }
        } else {
            console.warn('Google Identity Services not available, trying direct picker');
            if (typeof google !== 'undefined' && typeof google.picker !== 'undefined') {
                createPickerWithoutAuth();
            } else {
                showAlert('Google authentication not available. Please refresh the page.', 'danger');
            }
        }
    }

    function createPickerWithoutAuth() {
        showPicker();
    }

    function createPicker() {
        if (typeof google === 'undefined' || typeof google.picker === 'undefined') {
            gapi.load('picker', () => {
                if (typeof google !== 'undefined' && typeof google.picker !== 'undefined') {
                    showPicker();
                } else {
                    showAlert('Google Picker API not loaded. Please refresh the page.', 'danger');
                }
            });
            return;
        }

        showPicker();
    }

    function showPicker() {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/pdf');

        const pickerBuilder = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .addView(view)
            .setCallback(pickerCallback);

        if (googleAccessToken) {
            pickerBuilder.setOAuthToken(googleAccessToken);
        } else {
            pickerBuilder.setAppId(GOOGLE_APP_ID);
        }

        const picker = pickerBuilder.build();
        picker.setVisible(true);
    }

    function pickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            const docs = data.docs;
            
            if (data[google.picker.Response.TOKEN]) {
                googleAccessToken = data[google.picker.Response.TOKEN];
            }
            
            if (docs.length > 0) {
                showAlert('Loading file from Google Drive...', 'info');
                loadFileFromGoogleDrive(docs[0]);
            }
        } else if (data.action === google.picker.Action.CANCEL) {
            console.log('User cancelled the picker');
        } else if (data.action === google.picker.Action.LOADED) {
            console.log('Picker loaded successfully');
        }
    }

    async function loadFileFromGoogleDrive(doc) {
        try {
            if (!googleAccessToken) {
                throw new Error('No access token available. Please try selecting files again.');
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    googleAccessToken = null;
                    showAlert('Session expired. Please select files from Google Drive again.', 'warning');
                    return;
                }
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            const file = new File([blob], doc.name, { type: 'application/pdf' });

            if (pdfFiles.length > 0) {
                pdfFiles = [file];
            } else {
                pdfFiles.push(file);
            }
            
            await loadPdfPreview(file);
            updateFileList();
            updateUIState();
            
            showAlert('Successfully loaded file from Google Drive!', 'success');
        } catch (error) {
            console.error('Error loading file from Google Drive:', error);
            showAlert(`Failed to load "${doc.name}" from Google Drive: ${error.message}`, 'danger');
        }
    }

    // Dropbox Integration Functions
    function openDropboxPicker() {
        if (!DROPBOX_APP_KEY || DROPBOX_APP_KEY === 'YOUR_DROPBOX_APP_KEY') {
            showAlert('Dropbox API credentials not configured. Please contact the administrator.', 'warning');
            return;
        }

        if (typeof Dropbox === 'undefined') {
            let attempts = 0;
            const checkDropbox = setInterval(() => {
                attempts++;
                if (typeof Dropbox !== 'undefined') {
                    clearInterval(checkDropbox);
                    openDropboxPicker();
                } else if (attempts > 10) {
                    clearInterval(checkDropbox);
                    showAlert('Dropbox Chooser not loaded. Please refresh the page.', 'danger');
                }
            }, 200);
            return;
        }

        const dropboxScript = document.getElementById('dropboxjs');
        if (dropboxScript && DROPBOX_APP_KEY !== 'YOUR_DROPBOX_APP_KEY') {
            dropboxScript.setAttribute('data-app-key', DROPBOX_APP_KEY);
        }

        try {
            Dropbox.choose({
                success: function(files) {
                    if (files && files.length > 0) {
                        showAlert('Loading file from Dropbox...', 'info');
                        loadFileFromDropbox(files[0]);
                    }
                },
                linkType: 'direct',
                multiselect: false,
                extensions: ['.pdf'],
                folderselect: false
            });
        } catch (error) {
            console.error('Error opening Dropbox picker:', error);
            showAlert('Failed to open Dropbox file picker. Please try again.', 'danger');
        }
    }

    async function loadFileFromDropbox(file) {
        try {
            const response = await fetch(file.link, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            const fileObj = new File([blob], file.name, { type: 'application/pdf' });

            if (pdfFiles.length > 0) {
                pdfFiles = [fileObj];
            } else {
                pdfFiles.push(fileObj);
            }
            
            await loadPdfPreview(fileObj);
            updateFileList();
            updateUIState();
            
            showAlert('Successfully loaded file from Dropbox!', 'success');
        } catch (error) {
            console.error('Error loading file from Dropbox:', error);
            showAlert(`Failed to load "${file.name}" from Dropbox: ${error.message}`, 'danger');
        }
    }

    // Initialize
    updateRangeInfoText();
    updateUIState();
});

