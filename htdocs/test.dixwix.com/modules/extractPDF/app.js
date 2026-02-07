document.addEventListener("DOMContentLoaded", () => {
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // DOM Elements
    const pdfInputExtract = document.getElementById("pdfInputExtract");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const pdfPreview = document.getElementById("pdfPreview").querySelector('.row');
    const extractBtn = document.getElementById("extractBtn");
    const fileName = document.getElementById("fileName");
    const fileMeta = document.getElementById("fileMeta");
    const fileInfo = document.getElementById("fileInfo");
    const removeFileBtn = document.getElementById("removeFileBtn");

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

    // Tab Elements
    const rangeTab = document.getElementById("rangeTab");
    const pagesTab = document.getElementById("pagesTab");
    const sizeTab = document.getElementById("sizeTab");
    const rangeMode = document.getElementById("rangeMode");
    const pagesMode = document.getElementById("pagesMode");
    const sizeMode = document.getElementById("sizeMode");

    // Range Mode Elements
    const customRanges = document.getElementById("customRanges");
    const fixedRanges = document.getElementById("fixedRanges");
    const customRangesSection = document.getElementById("customRangesSection");
    const fixedRangesSection = document.getElementById("fixedRangesSection");
    const rangesList = document.getElementById("rangesList");
    const addRangeBtn = document.getElementById("addRangeBtn");
    const mergeRanges = document.getElementById("mergeRanges");
    const extractRange = document.getElementById("extractRange");
    const decreaseRange = document.getElementById("decreaseRange");
    const increaseRange = document.getElementById("increaseRange");
    const rangeInfoText = document.getElementById("rangeInfoText");

    // Pages Mode Elements
    const extractAll = document.getElementById("extractAll");
    const selectPages = document.getElementById("selectPages");
    const selectPagesSection = document.getElementById("selectPagesSection");
    const pagesInput = document.getElementById("pagesInput");
    const mergeExtracted = document.getElementById("mergeExtracted");
    const extractInfoText = document.getElementById("extractInfoText");

    // Size Mode Elements
    const maxSize = document.getElementById("maxSize");
    const sizeUnit = document.getElementById("sizeUnit");
    const allowCompression = document.getElementById("allowCompression");
    const sizeInfoText = document.getElementById("sizeInfoText");

    // State Variables
    let pdfFile = null;
    let pdfDoc = null;
    let pdfjsDoc = null;
    let totalPages = 0;
    let fileSizeBytes = 0;
    let customRangesList = [];
    let googleApiInitialized = false;
    let googleAccessToken = null;

    // Google Drive API Configuration
    const GOOGLE_CLIENT_ID = window.env?.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    const GOOGLE_API_KEY = window.env?.GOOGLE_API_KEY || '';
    const GOOGLE_APP_ID = window.env?.GOOGLE_APP_ID || GOOGLE_CLIENT_ID;

    // Dropbox API Configuration
    const DROPBOX_APP_KEY = window.env?.DROPBOX_APP_KEY || 'YOUR_DROPBOX_APP_KEY';

    // Initialize
    initializeEventListeners();
    updateUIState();

    function initializeEventListeners() {
        // File input
        pdfInputExtract.addEventListener("change", handleFileSelection);

        // Upload buttons
        selectFilesBtn?.addEventListener("click", () => pdfInputExtract.click());
        initialGoogleDriveBtn?.addEventListener("click", openGoogleDrivePicker);
        initialDropboxBtn?.addEventListener("click", openDropboxPicker);
        addBtn?.addEventListener("click", () => pdfInputExtract.click());
        computerBtn?.addEventListener("click", () => pdfInputExtract.click());
        googleDriveBtn?.addEventListener("click", openGoogleDrivePicker);
        dropboxBtn?.addEventListener("click", openDropboxPicker);
        removeFileBtn?.addEventListener("click", resetFile);

        // Tab navigation
        rangeTab?.addEventListener("click", () => switchTab('range'));
        pagesTab?.addEventListener("click", () => switchTab('pages'));
        sizeTab?.addEventListener("click", () => switchTab('size'));

        // Range mode
        customRanges?.addEventListener("change", updateRangeModeUI);
        fixedRanges?.addEventListener("change", updateRangeModeUI);
        addRangeBtn?.addEventListener("click", addCustomRange);
        extractRange?.addEventListener("input", updateRangeInfo);
        decreaseRange?.addEventListener("click", () => {
            const val = parseInt(extractRange.value) || 2;
            if (val > 1) extractRange.value = val - 1;
            updateRangeInfo();
        });
        increaseRange?.addEventListener("click", () => {
            const val = parseInt(extractRange.value) || 2;
            extractRange.value = val + 1;
            updateRangeInfo();
        });
        mergeRanges?.addEventListener("change", updateRangeInfo);

        // Pages mode
        extractAll?.addEventListener("change", updateExtractModeUI);
        selectPages?.addEventListener("change", updateExtractModeUI);
        pagesInput?.addEventListener("input", updateExtractInfo);
        mergeExtracted?.addEventListener("change", updateExtractInfo);

        // Size mode
        maxSize?.addEventListener("input", updateSizeInfo);
        sizeUnit?.addEventListener("change", updateSizeInfo);
        allowCompression?.addEventListener("change", updateSizeInfo);

        // Extract button
        extractBtn?.addEventListener("click", handleExtract);

        // Drag and drop
        initialUploadState?.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.add('drag-over');
        });
        initialUploadState?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.remove('drag-over');
        });
        initialUploadState?.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0 && files[0].type === 'application/pdf') {
                handleFileSelection({ target: { files: [files[0]] } });
            }
        });
    }

    function switchTab(tabName) {
        // Update tab buttons
        [rangeTab, pagesTab, sizeTab].forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        if (tabName === 'range' && rangeTab) rangeTab.classList.add('active');
        if (tabName === 'pages' && pagesTab) pagesTab.classList.add('active');
        if (tabName === 'size' && sizeTab) sizeTab.classList.add('active');

        // Update mode panels
        [rangeMode, pagesMode, sizeMode].forEach(mode => {
            if (mode) mode.classList.remove('active');
            if (mode) mode.style.display = 'none';
        });
        if (tabName === 'range' && rangeMode) {
            rangeMode.classList.add('active');
            rangeMode.style.display = 'block';
        }
        if (tabName === 'pages' && pagesMode) {
            pagesMode.classList.add('active');
            pagesMode.style.display = 'block';
        }
        if (tabName === 'size' && sizeMode) {
            sizeMode.classList.add('active');
            sizeMode.style.display = 'block';
        }

        updateInfoTexts();
    }

    async function handleFileSelection(event) {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            showAlert("Please select a valid PDF file.", 'warning');
            return;
        }

        pdfFile = file;
        fileSizeBytes = file.size;

        try {
            await loadPdfPreview(file);
            updateUIState();
            updateInfoTexts();
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Error loading PDF file. Please try again.", 'danger');
        }

        // Reset input
        pdfInputExtract.value = '';
    }

    async function loadPdfPreview(file) {
        try {
            // Load with PDF-lib for manipulation
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            totalPages = pdfDoc.getPageCount();

            // Load with PDF.js for thumbnails
            pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // Render thumbnails
            await renderPdfPreview();

            // Update file info
            if (fileName) fileName.textContent = file.name;
            if (fileMeta) {
                const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
                fileMeta.textContent = `${totalPages} pages • ${sizeMB} MB`;
            }
        } catch (error) {
            console.error("Error loading PDF:", error);
            throw error;
        }
    }

    async function renderPdfPreview() {
        if (!pdfjsDoc || !pdfPreview) return;

        pdfPreview.innerHTML = "";
        const maxPages = Math.min(totalPages, 12); // Show max 12 pages

        for (let i = 0; i < maxPages; i++) {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-3";

            const pdfPage = document.createElement("div");
            pdfPage.className = "pdf-page";

            try {
                const page = await pdfjsDoc.getPage(i + 1);
                const viewport = page.getViewport({ scale: 0.3 });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const img = document.createElement("img");
                img.src = canvas.toDataURL();
                img.alt = `Page ${i + 1}`;
                img.className = "img-fluid";
                img.style.maxWidth = "100%";
                img.style.height = "auto";

                pdfPage.appendChild(img);
            } catch (error) {
                console.error(`Error rendering page ${i + 1}:`, error);
                // Fallback placeholder
                const img = document.createElement("img");
                img.src = "../assests/pdf 2.png";
                img.alt = `Page ${i + 1}`;
                img.className = "img-fluid";
                pdfPage.appendChild(img);
            }

            const p = document.createElement("p");
            p.textContent = `Page ${i + 1}`;
            pdfPage.appendChild(p);

            col.appendChild(pdfPage);
            pdfPreview.appendChild(col);
        }

        if (totalPages > 12) {
            const moreText = document.createElement("div");
            moreText.className = "col-12 text-center mt-2";
            moreText.textContent = `... and ${totalPages - 12} more pages`;
            pdfPreview.appendChild(moreText);
        }
    }

    function updateRangeModeUI() {
        if (customRanges?.checked) {
            customRangesSection.style.display = 'block';
            fixedRangesSection.style.display = 'none';
        } else if (fixedRanges?.checked) {
            customRangesSection.style.display = 'none';
            fixedRangesSection.style.display = 'block';
        }
        updateRangeInfo();
    }

    function addCustomRange() {
        if (!rangesList) return;

        const rangeId = Date.now();
        const rangeItem = document.createElement("div");
        rangeItem.className = "range-item";
        rangeItem.dataset.rangeId = rangeId;

        rangeItem.innerHTML = `
            <span class="range-label">from page</span>
            <input type="number" class="form-control range-from" min="1" value="1" placeholder="From">
            <span class="range-label">to</span>
            <input type="number" class="form-control range-to" min="1" value="1" placeholder="To">
            <button type="button" class="btn btn-remove-range" onclick="removeRange(${rangeId})">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add event listeners
        const fromInput = rangeItem.querySelector('.range-from');
        const toInput = rangeItem.querySelector('.range-to');
        fromInput.addEventListener('input', updateRangeInfo);
        toInput.addEventListener('input', updateRangeInfo);

        rangesList.appendChild(rangeItem);
        customRangesList.push({ id: rangeId, from: 1, to: 1 });
        updateRangeInfo();
    }

    window.removeRange = function(rangeId) {
        const rangeItem = document.querySelector(`[data-range-id="${rangeId}"]`);
        if (rangeItem) {
            rangeItem.remove();
            customRangesList = customRangesList.filter(r => r.id !== rangeId);
            updateRangeInfo();
        }
    };

    function updateRangeInfo() {
        if (!rangeInfoText) return;

        if (!pdfFile) {
            rangeInfoText.innerHTML = '<small>Upload a PDF file to get started.</small>';
            return;
        }

        let infoText = '';

        if (customRanges?.checked) {
            // Update ranges from inputs
            customRangesList = [];
            rangesList.querySelectorAll('.range-item').forEach(item => {
                const from = parseInt(item.querySelector('.range-from')?.value) || 1;
                const to = parseInt(item.querySelector('.range-to')?.value) || 1;
                const rangeId = parseInt(item.dataset.rangeId);
                customRangesList.push({ id: rangeId, from, to });
            });

            if (customRangesList.length === 0) {
                infoText = '<small>Add at least one range to extract the PDF.</small>';
            } else {
                const validRanges = customRangesList.filter(r => r.from >= 1 && r.to >= r.from && r.to <= totalPages);
                const pdfCount = mergeRanges?.checked ? 1 : validRanges.length;
                infoText = `<strong>${pdfCount}</strong> PDF${pdfCount !== 1 ? 's' : ''} will be created.`;
            }
        } else if (fixedRanges?.checked) {
            const range = parseInt(extractRange?.value) || 2;
            const pdfCount = Math.ceil(totalPages / range);
            infoText = `This PDF will be extracted into files of ${range} pages.<br><strong>${pdfCount}</strong> PDF${pdfCount !== 1 ? 's' : ''} will be created.`;
        }

        rangeInfoText.innerHTML = infoText;
        updateExtractButton();
    }

    function updateExtractModeUI() {
        if (extractAll?.checked) {
            selectPagesSection.style.display = 'none';
        } else if (selectPages?.checked) {
            selectPagesSection.style.display = 'block';
        }
        updateExtractInfo();
    }

    function updateExtractInfo() {
        if (!extractInfoText) return;

        if (!pdfFile) {
            extractInfoText.innerHTML = '<small>Upload a PDF file to get started.</small>';
            return;
        }

        let infoText = '';

        if (extractAll?.checked) {
            const pdfCount = totalPages;
            infoText = `<strong>${pdfCount}</strong> PDF${pdfCount !== 1 ? 's' : ''} will be created (one per page).`;
        } else if (selectPages?.checked) {
            const pagesStr = pagesInput?.value.trim() || '';
            if (!pagesStr) {
                infoText = '<small>Enter pages to extract (e.g., 1,3-5,8).</small>';
            } else {
                const pages = parsePageRanges(pagesStr);
                const validPages = pages.filter(p => p >= 1 && p <= totalPages);
                const pdfCount = mergeExtracted?.checked ? 1 : validPages.length;
                infoText = `<strong>${pdfCount}</strong> PDF${pdfCount !== 1 ? 's' : ''} will be created.`;
            }
        }

        extractInfoText.innerHTML = infoText;
        updateExtractButton();
    }

    function updateSizeInfo() {
        if (!sizeInfoText) return;

        if (!pdfFile) {
            sizeInfoText.innerHTML = '<small>Upload a PDF file to get started.</small>';
            return;
        }

        const maxSizeVal = parseFloat(maxSize?.value) || 1;
        const unit = sizeUnit?.value || 'MB';
        const maxSizeBytes = unit === 'MB' ? maxSizeVal * 1024 * 1024 : maxSizeVal * 1024;

        if (fileSizeBytes <= maxSizeBytes) {
            sizeInfoText.innerHTML = '<small>The PDF is already smaller than the maximum size. No extraction needed.</small>';
        } else {
            const estimatedCount = Math.ceil(fileSizeBytes / maxSizeBytes);
            sizeInfoText.innerHTML = `This PDF will be extracted into files no larger than ${maxSizeVal} ${unit} each.<br><strong>${estimatedCount}</strong> PDF${estimatedCount !== 1 ? 's' : ''} will be created.`;
        }

        updateExtractButton();
    }

    function updateInfoTexts() {
        updateRangeInfo();
        updateExtractInfo();
        updateSizeInfo();
    }

    function updateExtractButton() {
        if (!extractBtn) return;

        let shouldShow = false;

        if (rangeMode?.classList.contains('active')) {
            if (customRanges?.checked) {
                shouldShow = customRangesList.length > 0;
            } else if (fixedRanges?.checked) {
                shouldShow = true;
            }
        } else if (pagesMode?.classList.contains('active')) {
            if (extractAll?.checked) {
                shouldShow = true;
            } else if (selectPages?.checked) {
                shouldShow = pagesInput?.value.trim().length > 0;
            }
        } else if (sizeMode?.classList.contains('active')) {
            shouldShow = true;
        }

        extractBtn.style.display = (shouldShow && pdfFile) ? 'block' : 'none';
    }

    function updateUIState() {
        const hasFile = pdfFile !== null;

        if (initialUploadState) {
            initialUploadState.style.display = hasFile ? 'none' : 'flex';
        }
        if (fileSelectionButtons) {
            fileSelectionButtons.style.display = hasFile ? 'flex' : 'none';
        }
        if (fileInfo) {
            fileInfo.style.display = hasFile ? 'block' : 'none';
        }
        if (fileContainer) {
            if (hasFile) {
                fileContainer.classList.add('has-files');
            } else {
                fileContainer.classList.remove('has-files');
            }
        }
    }

    function resetFile() {
        pdfFile = null;
        pdfDoc = null;
        pdfjsDoc = null;
        totalPages = 0;
        fileSizeBytes = 0;
        customRangesList = [];
        pdfPreview.innerHTML = "";
        if (rangesList) rangesList.innerHTML = "";
        updateUIState();
        updateInfoTexts();
        pdfInputExtract.value = "";
    }

    async function handleExtract() {
        if (!pdfFile || !pdfDoc) {
            showAlert("Please upload a PDF file first.", 'warning');
            return;
        }

        extractBtn.disabled = true;
        extractBtn.innerHTML = 'Extracting PDF... <span class="spinner-border spinner-border-sm" role="status"></span>';

        try {
            const activeMode = rangeMode?.classList.contains('active') ? 'range' :
                             pagesMode?.classList.contains('active') ? 'pages' : 'size';

            if (activeMode === 'range') {
                await extractByRange();
            } else if (activeMode === 'pages') {
                await extractByPages();
            } else if (activeMode === 'size') {
                await extractBySize();
            }
        } catch (error) {
            console.error("Error extracting PDF:", error);
            showAlert("An error occurred while extracting the PDF. Please try again.", 'danger');
        } finally {
            extractBtn.disabled = false;
            extractBtn.innerHTML = 'Extract PDF';
        }
    }

    async function extractByRange() {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const sourceDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const outputPdfs = [];

        if (customRanges?.checked) {
            // Custom ranges
            for (const range of customRangesList) {
                const from = Math.max(1, Math.min(range.from, totalPages));
                const to = Math.max(from, Math.min(range.to, totalPages));

                if (from > totalPages || to < 1) continue;

                const newDoc = await PDFLib.PDFDocument.create();
                const pages = [];
                for (let i = from - 1; i < to; i++) {
                    pages.push(i);
                }
                const copiedPages = await newDoc.copyPages(sourceDoc, pages);
                copiedPages.forEach(page => newDoc.addPage(page));

                const pdfBytes = await newDoc.save();
                outputPdfs.push({ bytes: pdfBytes, name: `range_${from}-${to}.pdf` });
            }

            if (mergeRanges?.checked) {
                // Merge all ranges into one PDF
                const mergedDoc = await PDFLib.PDFDocument.create();
                for (const pdf of outputPdfs) {
                    const tempDoc = await PDFLib.PDFDocument.load(pdf.bytes);
                    const pages = await mergedDoc.copyPages(tempDoc, tempDoc.getPageIndices());
                    pages.forEach(page => mergedDoc.addPage(page));
                }
                const mergedBytes = await mergedDoc.save();
                downloadPDF(mergedBytes, `extract_${pdfFile.name.replace('.pdf', '')}_merged.pdf`);
                showAlert("PDF extracted and merged successfully!", 'success');
            } else {
                await downloadMultiplePDFs(outputPdfs);
                showAlert(`Successfully created ${outputPdfs.length} PDF file(s)!`, 'success');
            }
        } else if (fixedRanges?.checked) {
            // Fixed ranges
            const range = parseInt(extractRange?.value) || 2;
            for (let i = 0; i < totalPages; i += range) {
                const newDoc = await PDFLib.PDFDocument.create();
                const pages = [];
                for (let j = i; j < Math.min(i + range, totalPages); j++) {
                    pages.push(j);
                }
                const copiedPages = await newDoc.copyPages(sourceDoc, pages);
                copiedPages.forEach(page => newDoc.addPage(page));

                const pdfBytes = await newDoc.save();
                const startPage = i + 1;
                const endPage = Math.min(i + range, totalPages);
                outputPdfs.push({ bytes: pdfBytes, name: `extract_${startPage}-${endPage}.pdf` });
            }

            await downloadMultiplePDFs(outputPdfs);
            showAlert(`Successfully created ${outputPdfs.length} PDF file(s)!`, 'success');
        }
    }

    async function extractByPages() {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const sourceDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const outputPdfs = [];

        if (extractAll?.checked) {
            // Extract all pages
            for (let i = 0; i < totalPages; i++) {
                const newDoc = await PDFLib.PDFDocument.create();
                const [page] = await newDoc.copyPages(sourceDoc, [i]);
                newDoc.addPage(page);
                const pdfBytes = await newDoc.save();
                outputPdfs.push({ bytes: pdfBytes, name: `page_${i + 1}.pdf` });
            }

            await downloadMultiplePDFs(outputPdfs);
            showAlert(`Successfully extracted ${outputPdfs.length} page(s)!`, 'success');
        } else if (selectPages?.checked) {
            // Select pages
            const pagesStr = pagesInput?.value.trim() || '';
            const pageNumbers = parsePageRanges(pagesStr);
            const validPages = pageNumbers.filter(p => p >= 1 && p <= totalPages);

            if (validPages.length === 0) {
                showAlert("Please enter valid page numbers.", 'warning');
                return;
            }

            if (mergeExtracted?.checked) {
                // Merge into one PDF
                const newDoc = await PDFLib.PDFDocument.create();
                const uniquePages = [...new Set(validPages)].sort((a, b) => a - b);
                const pages = uniquePages.map(p => p - 1);
                const copiedPages = await newDoc.copyPages(sourceDoc, pages);
                copiedPages.forEach(page => newDoc.addPage(page));
                const pdfBytes = await newDoc.save();
                downloadPDF(pdfBytes, `extracted_${pdfFile.name.replace('.pdf', '')}_merged.pdf`);
                showAlert("Pages extracted and merged successfully!", 'success');
            } else {
                // Separate PDFs
                for (const pageNum of validPages) {
                    const newDoc = await PDFLib.PDFDocument.create();
                    const [page] = await newDoc.copyPages(sourceDoc, [pageNum - 1]);
                    newDoc.addPage(page);
                    const pdfBytes = await newDoc.save();
                    outputPdfs.push({ bytes: pdfBytes, name: `page_${pageNum}.pdf` });
                }

                await downloadMultiplePDFs(outputPdfs);
                showAlert(`Successfully extracted ${outputPdfs.length} page(s)!`, 'success');
            }
        }
    }

    async function extractBySize() {
        const maxSizeVal = parseFloat(maxSize?.value) || 1;
        const unit = sizeUnit?.value || 'MB';
        const maxSizeBytes = unit === 'MB' ? maxSizeVal * 1024 * 1024 : maxSizeVal * 1024;

        if (fileSizeBytes <= maxSizeBytes) {
            showAlert("The PDF is already smaller than the maximum size. No extraction needed.", 'info');
            return;
        }

        const arrayBuffer = await pdfFile.arrayBuffer();
        const sourceDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const outputPdfs = [];
        let currentDoc = await PDFLib.PDFDocument.create();
        let currentSize = 0;
        let fileIndex = 1;

        for (let i = 0; i < totalPages; i++) {
            const tempDoc = await PDFLib.PDFDocument.create();
            const [page] = await tempDoc.copyPages(sourceDoc, [i]);
            tempDoc.addPage(page);
            const tempBytes = await tempDoc.save();
            const pageSize = tempBytes.length;

            if (currentSize + pageSize > maxSizeBytes && currentDoc.getPageCount() > 0) {
                // Save current PDF and start new one
                const currentBytes = await currentDoc.save();
                outputPdfs.push({ bytes: currentBytes, name: `extract_part_${fileIndex}.pdf` });
                currentDoc = await PDFLib.PDFDocument.create();
                currentSize = 0;
                fileIndex++;
            }

            const [copiedPage] = await currentDoc.copyPages(sourceDoc, [i]);
            currentDoc.addPage(copiedPage);
            currentSize += pageSize;
        }

        // Save last PDF
        if (currentDoc.getPageCount() > 0) {
            const currentBytes = await currentDoc.save();
            outputPdfs.push({ bytes: currentBytes, name: `extract_part_${fileIndex}.pdf` });
        }

        await downloadMultiplePDFs(outputPdfs);
        showAlert(`Successfully created ${outputPdfs.length} PDF file(s)!`, 'success');
    }

    function parsePageRanges(pagesStr) {
        const pages = [];
        const parts = pagesStr.split(',').map(p => p.trim());

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                if (start && end && start <= end) {
                    for (let i = start; i <= end; i++) {
                        pages.push(i);
                    }
                }
            } else {
                const num = parseInt(part);
                if (num) pages.push(num);
            }
        }

        return pages;
    }

    async function downloadMultiplePDFs(pdfs) {
        if (pdfs.length === 1) {
            downloadPDF(pdfs[0].bytes, pdfs[0].name);
        } else {
            // Create ZIP file
            const zip = new JSZip();
            pdfs.forEach((pdf, index) => {
                zip.file(pdf.name, pdf.bytes);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extract_${pdfFile.name.replace('.pdf', '')}.zip`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
            }, 100);
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
            formData.append('tool_name', 'Extract PDF');
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

    // Google Drive Integration
    function initializeGoogleAPI() {
        if (typeof gapi === 'undefined') return;

        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            console.warn('Google Drive API credentials not configured.');
            return;
        }

        gapi.load('picker', () => {
            googleApiInitialized = true;
        });
    }

    function openGoogleDrivePicker() {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
            showAlert('Google Drive API credentials not configured.', 'warning');
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
                            showAlert('Failed to authenticate with Google: ' + response.error, 'danger');
                        }
                    },
                });
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                console.error('Error initializing token client:', error);
                showAlert('Failed to initialize Google authentication.', 'danger');
            }
        } else {
            if (typeof google !== 'undefined' && typeof google.picker !== 'undefined') {
                createPickerWithoutAuth();
            } else {
                showAlert('Google authentication not available.', 'danger');
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
                    showAlert('Google Picker API not loaded.', 'danger');
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
        }
    }

    async function loadFileFromGoogleDrive(doc) {
        try {
            if (!googleAccessToken) {
                throw new Error('No access token available.');
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                headers: { 'Authorization': `Bearer ${googleAccessToken}` }
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
            await handleFileSelection({ target: { files: [file] } });
            showAlert('Successfully loaded file from Google Drive!', 'success');
        } catch (error) {
            console.error('Error loading file from Google Drive:', error);
            showAlert(`Failed to load "${doc.name}" from Google Drive: ${error.message}`, 'danger');
        }
    }

    // Dropbox Integration
    function openDropboxPicker() {
        if (!DROPBOX_APP_KEY || DROPBOX_APP_KEY === 'YOUR_DROPBOX_APP_KEY') {
            showAlert('Dropbox API credentials not configured.', 'warning');
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
            showAlert('Failed to open Dropbox file picker.', 'danger');
        }
    }

    async function loadFileFromDropbox(file) {
        try {
            const response = await fetch(file.link, {
                method: 'GET',
                headers: { 'Accept': 'application/pdf' }
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            const fileObj = new File([blob], file.name, { type: 'application/pdf' });
            await handleFileSelection({ target: { files: [fileObj] } });
            showAlert('Successfully loaded file from Dropbox!', 'success');
        } catch (error) {
            console.error('Error loading file from Dropbox:', error);
            showAlert(`Failed to load "${file.name}" from Dropbox: ${error.message}`, 'danger');
        }
    }

    // Initialize Google API
    if (typeof gapi !== 'undefined') {
        initializeGoogleAPI();
    }

    // Add initial range
    if (addRangeBtn) {
        addRangeBtn.click();
    }
});
