document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInputOrganizer");
    const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
    // const sortAscBtn = document.getElementById("sortAscBtn");
    // const sortDescBtn = document.getElementById("sortDescBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const initialUploadState = document.getElementById("initialUploadState");
    const fileSelectionButtons = document.getElementById("fileSelectionButtons");
    const selectFilesBtn = document.getElementById("selectFilesBtn");
    const initialGoogleDriveBtn = document.getElementById("initialGoogleDriveBtn");
    const initialDropboxBtn = document.getElementById("initialDropboxBtn");
    const addBtn = document.getElementById("addBtn");
    const computerBtn = document.getElementById("computerBtn");
    const googleDriveBtn = document.getElementById("googleDriveBtn");
    const dropboxBtn = document.getElementById("dropboxBtn");
    const fileContainer = document.querySelector('.col-md-6.position-relative');

    let pdfDoc;
    let pdfPages = [];
    let pageRotations = {}; // Track rotation for each page
    let originalFileName = "";
    let randomSuffix = "";

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

    async function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        await handleDroppedFiles(files);
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    async function handleDroppedFiles(files) {
        const file = files[0];
        if (!file) return;

        if (file && file.type === "application/pdf") {
            await loadPdfFile(file);
        } else {
            showAlert("Please upload a valid PDF file.", 'danger');
        }
    }

    async function loadPdfFile(file) {
        const fileBytes = await file.arrayBuffer();
        pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Track page indexes
        pageRotations = {};
        originalFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        randomSuffix = generateRandomNumber();
        displayPdfPreview();
        updateUIState();
    }

    function displayPdfPreview() {
        pdfPreviewContainer.innerHTML = ""; // Clear any previous previews
    
        pdfPages.forEach((pageIndex) => {
            const mainDiv = document.createElement("div");
            mainDiv.classList.add("col-3");

            const pageContainer = document.createElement("div");
            pageContainer.className = "pdf-page position-relative";
            pageContainer.addEventListener("click", () => selectPage(pageContainer));
            mainDiv.appendChild(pageContainer);
    
            const canvas = document.createElement("canvas");
            pageContainer.appendChild(canvas);

            const btnDiv = document.createElement("div");
            btnDiv.className = "page-icons position-absolute top-0 end-0 p-2 align-items-center d-none";
            pageContainer.appendChild(btnDiv);
    
            const addPageBtnRight = document.createElement("img");
            addPageBtnRight.classList.add("icon");
            addPageBtnRight.src = "/assests/Group 90 (1).png";
            addPageBtnRight.alt = "Add";
            addPageBtnRight.addEventListener("click", () => addBlankPage(pageIndex, 'right'));
            btnDiv.appendChild(addPageBtnRight);
    
            const rotateRightBtn = document.createElement("img");
            rotateRightBtn.classList.add("icon");
            rotateRightBtn.src = "/assests/sync 1.png";
            rotateRightBtn.alt = "Rotate";
            rotateRightBtn.addEventListener("click", () => rotatePage(pageIndex, 90));
            btnDiv.appendChild(rotateRightBtn);
    
            const removePageBtn = document.createElement("img");
            removePageBtn.classList.add("icon");
            removePageBtn.src = "/assests/delete 2.png";
            removePageBtn.alt = "Remove";
            removePageBtn.addEventListener("click", () => removePage(pageIndex));
            btnDiv.appendChild(removePageBtn);
    
            pdfPreviewContainer.appendChild(mainDiv);
    
            renderPageThumbnail(pageIndex, canvas);
    
            // const addPageBtnLeft = document.createElement("button");
            // addPageBtnLeft.classList.add("btn", "btn-sm", "btn-primary", "add-page-btn-left");
            // addPageBtnLeft.textContent = "+";
            // addPageBtnLeft.addEventListener("click", () => addBlankPage(pageIndex, 'left'));
            // btnDiv.appendChild(addPageBtnLeft);
    
            // const rotateLeftBtn = document.createElement("button");
            // rotateLeftBtn.classList.add("btn", "btn-sm", "btn-info", "rotate-page-btn");
            // rotateLeftBtn.textContent = "⟲";
            // rotateLeftBtn.addEventListener("click", () => rotatePage(pageIndex, -90));
            // btnDiv.appendChild(rotateLeftBtn);
        });
    }
    function selectPage(element) {
        // Remove active class from all pages
        document.querySelectorAll('.pdf-page').forEach(page => {
            page.classList.remove('active');
            page.querySelector('.page-icons').classList.add('d-none');
        });

        // Add active class to selected page and show icons
        element.classList.add('active');
        element.querySelector('.page-icons').classList.remove('d-none');
    }

    async function renderPageThumbnail(pageIndex, canvas) {
        const page = pdfDoc.getPage(pageIndex);
        const { width, height } = page.getSize();
        const viewport = { width: width * 0.2, height: height * 0.2 };
        const context = canvas.getContext('2d');
        
        // Clear the canvas before drawing
        context.clearRect(0, 0, canvas.width, canvas.height);
    
        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
    
        // Create a new PDF document to render the page
        const previewDoc = await PDFLib.PDFDocument.create();
        const [pdfPage] = await previewDoc.copyPages(pdfDoc, [pageIndex]);
        
        // Apply the rotation to the preview page
        const rotation = pageRotations[pageIndex] || 0;
        pdfPage.setRotation(PDFLib.degrees(rotation));
    
        previewDoc.addPage(pdfPage);
        const pdfBytes = await previewDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
    
        const pdf = await pdfjsLib.getDocument(url).promise;
        const pdfPageToRender = await pdf.getPage(1);
        const viewportScale = 0.2;
        const scaledViewport = pdfPageToRender.getViewport({ scale: viewportScale });
    
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
    
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
        };
    
        await pdfPageToRender.render(renderContext).promise;
        URL.revokeObjectURL(url); // Clean up the object URL
    }    

    async function addBlankPage(position, side) {
        const tempPdfDoc = await PDFLib.PDFDocument.create();
        const [firstPage] = await pdfDoc.getPages();
        const { width, height } = firstPage.getSize();
        tempPdfDoc.addPage([width, height]);
        const [blankPageInTempDoc] = await tempPdfDoc.getPages();
    
        const newPdfDoc = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfPages);
    
        let orderedPages = [];
        const [blankPageInNewDoc] = await newPdfDoc.copyPages(tempPdfDoc, [0]);
    
        if (side === 'left') {
            orderedPages = [
                ...copiedPages.slice(0, position),
                blankPageInNewDoc,
                ...copiedPages.slice(position)
            ];
        } else if (side === 'right') {
            orderedPages = [
                ...copiedPages.slice(0, position + 1),
                blankPageInNewDoc,
                ...copiedPages.slice(position + 1)
            ];
        }
    
        for (const page of orderedPages) {
            newPdfDoc.addPage(page);
        }
    
        pdfDoc = newPdfDoc;
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Update page tracking
        displayPdfPreview();
    }

    async function removePage(pageIndex) {
        const newPdfDoc = await PDFLib.PDFDocument.create();
    
        const pagesToCopy = pdfPages.filter(idx => idx !== pageIndex);
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
    
        copiedPages.forEach(page => newPdfDoc.addPage(page));
    
        pdfDoc = newPdfDoc;
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Update page tracking
        displayPdfPreview();
    }

    function rotatePage(pageIndex, angle) {
        // Track the rotation for the specific page
        pageRotations[pageIndex] = (pageRotations[pageIndex] || 0) + angle;
        pageRotations[pageIndex] %= 360; // Normalize rotation
    
        showAlert(`Page ${pageIndex + 1} rotated ${angle > 0 ? "right" : "left"} by ${Math.abs(angle)} degrees.`, "info");
    
        // Redraw the PDF preview after rotation
        displayPdfPreview();
    }
    

    // async function sortPages(ascending) {
    //     pdfPages.sort((a, b) => ascending ? a - b : b - a);
    //     displayPdfPreview();
    // }

    // sortAscBtn.addEventListener("click", () => sortPages(true));
    // sortDescBtn.addEventListener("click", () => sortPages(false));

    downloadBtn.addEventListener("click", async () => {
        const sortedPdfDoc = await PDFLib.PDFDocument.create();
    
        for (const pageIndex of pdfPages) {
            const [newPage] = await sortedPdfDoc.copyPages(pdfDoc, [pageIndex]);
            const rotation = pageRotations[pageIndex] || 0;
            newPage.setRotation(PDFLib.degrees(rotation)); // Apply rotation before adding to the new document
            sortedPdfDoc.addPage(newPage);
        }
    
        const pdfBytes = await sortedPdfDoc.save();
        const fileName = `${originalFileName}_${randomSuffix}.pdf`;
        downloadPdf(pdfBytes, fileName);
    });

    function updateUIState() {
        const hasFile = !!pdfDoc;
        
        if (hasFile) {
            if (initialUploadState) initialUploadState.style.display = 'none';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'flex';
            if (fileContainer) fileContainer.classList.add('has-files');
        } else {
            if (initialUploadState) initialUploadState.style.display = 'flex';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'none';
            if (fileContainer) fileContainer.classList.remove('has-files');
        }
    }

    function downloadPdf(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
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
        alert.className = `alert alert-${type}`;
        alert.role = "alert";
        alert.textContent = message;
        alertPlaceholder.appendChild(alert);
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    function generateRandomNumber() {
        return Math.floor(1000000000 + Math.random() * 9000000000); // 10-digit random number for uniqueness
    }

    // Initialize UI state on load
    updateUIState();
});
