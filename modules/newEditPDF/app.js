document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInputOrganizer");
    const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
    const sortAscBtn = document.getElementById("sortAscBtn");
    const sortDescBtn = document.getElementById("sortDescBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const addTextBtn = document.getElementById("addTextBtn");
    const addShapeBtn = document.getElementById("addShapeBtn");
    const imageInput = document.getElementById("imageInput");
    const saveChangesBtn = document.getElementById("saveChangesBtn");

    let pdfDoc;
    let pdfPages = [];
    let pageRotations = {}; // Track rotation for each page
    let originalFileName = "";
    let randomSuffix = "";
    let currentPageIndex = null;

    // Initialize Bootstrap Modal
    const editPdfModal = new bootstrap.Modal(document.getElementById("editPdfModal"));

    pdfInput.addEventListener("change", handleFileSelection);
    addTextBtn.addEventListener("click", addTextToPage);
    addShapeBtn.addEventListener("click", addShapeToPage);
    imageInput.addEventListener("change", addImageToPage);
    saveChangesBtn.addEventListener("click", saveChanges);

    async function handleFileSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileBytes = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
            pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Track page indexes
            originalFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
            randomSuffix = generateRandomNumber();
            displayPdfPreview();
        } else {
            showAlert("Please upload a valid PDF file.", 'danger');
        }
    }

    function displayPdfPreview() {
        pdfPreviewContainer.innerHTML = ""; // Clear any previous previews

        pdfPages.forEach((pageIndex) => {
            const pageContainer = document.createElement("div");
            pageContainer.classList.add("pdf-page");
            pageContainer.setAttribute("data-page", pageIndex); // Add page index attribute

            const canvas = document.createElement("canvas");
            pageContainer.appendChild(canvas);

            // Create and append buttons
            const addPageBtnLeft = document.createElement("button");
            addPageBtnLeft.classList.add("btn", "btn-sm", "btn-primary", "add-page-btn-left");
            addPageBtnLeft.textContent = "+";
            addPageBtnLeft.addEventListener("click", () => addBlankPage(pageIndex, 'left'));
            pageContainer.appendChild(addPageBtnLeft);

            const addPageBtnRight = document.createElement("button");
            addPageBtnRight.classList.add("btn", "btn-sm", "btn-primary", "add-page-btn-right");
            addPageBtnRight.textContent = "+";
            addPageBtnRight.addEventListener("click", () => addBlankPage(pageIndex, 'right'));
            pageContainer.appendChild(addPageBtnRight);

            const removePageBtn = document.createElement("button");
            removePageBtn.classList.add("btn", "btn-sm", "btn-danger", "remove-page-btn");
            removePageBtn.textContent = "-";
            removePageBtn.addEventListener("click", () => removePage(pageIndex));
            pageContainer.appendChild(removePageBtn);

            const editPageBtn = document.createElement("button");
            editPageBtn.classList.add("btn", "btn-sm", "btn-warning", "edit-page-btn");
            editPageBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>'; // Pencil icon
            editPageBtn.addEventListener("click", () => {
                currentPageIndex = pageIndex;
                showEditPdfModal(pageIndex);
            });
            pageContainer.appendChild(editPageBtn);

            const rotateLeftBtn = document.createElement("button");
            rotateLeftBtn.classList.add("btn", "btn-sm", "btn-info", "rotate-page-btn");
            rotateLeftBtn.textContent = "⟲";
            rotateLeftBtn.addEventListener("click", () => rotatePage(pageIndex, -90));
            pageContainer.appendChild(rotateLeftBtn);

            const rotateRightBtn = document.createElement("button");
            rotateRightBtn.classList.add("btn", "btn-sm", "btn-info", "rotate-page-btn");
            rotateRightBtn.textContent = "⟳";
            rotateRightBtn.addEventListener("click", () => rotatePage(pageIndex, 90));
            pageContainer.appendChild(rotateRightBtn);

            pdfPreviewContainer.appendChild(pageContainer);

            renderPageThumbnail(pageIndex, canvas);
        });
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

    function showEditPdfModal(pageNumber) {
        const canvas = document.getElementById('editCanvas');
        const editPdfModal = new bootstrap.Modal(document.getElementById("editPdfModal"));
        
        // Extract the current page from the pdfDoc
        pdfDoc.save().then(pdfBytes => {
            pdfjsLib.getDocument({ data: pdfBytes }).promise.then(pdf => {
                return pdf.getPage(pageNumber + 1); // PDF.js uses 1-based indexing
            }).then(page => {
                const scale = 1.0; // Set the scale to keep high resolution
                const viewport = page.getViewport({ scale: scale });
                
                // Set the canvas dimensions
                canvas.width = viewport.width;
                canvas.height = viewport.height;
    
                // Reduce canvas size for a medium view
                const mediumScale = 0.5; // Adjust this value as needed for medium size
                const mediumViewport = page.getViewport({ scale: mediumScale });
                
                // Create a temporary canvas to render at high resolution
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
    
                const tempRenderContext = {
                    canvasContext: tempCtx,
                    viewport: viewport
                };
    
                // Render the page to the temporary high-resolution canvas
                return page.render(tempRenderContext).promise.then(() => {
                    // Draw the high-resolution image onto the medium-sized canvas
                    const mediumCtx = canvas.getContext('2d');
                    mediumCtx.drawImage(tempCanvas, 0, 0, mediumViewport.width, mediumViewport.height);
                    
                    console.log("Page rendered to canvas for editing.");
                    // Open the modal
                    editPdfModal.show();
                });
            }).catch(error => {
                console.error("Error rendering page to canvas:", error);
            });
        }).catch(error => {
            console.error("Error saving PDF:", error);
        });
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
    
    async function addTextToPage() {
        if (currentPageIndex !== null) {
            const page = pdfDoc.getPage(currentPageIndex);
            const text = prompt('Enter text:');
            const color = document.getElementById('textColor').value;
            const size = parseInt(document.getElementById('textSize').value);
    
            if (text) {
                // Embed a standard font
                let font;
                try {
                    font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                } catch (error) {
                    console.error("Error embedding font:", error);
                    showAlert("Error embedding font.", "danger");
                    return;
                }
    
                page.drawText(text, {
                    x: 50,
                    y: page.getHeight() - 100,
                    size: size,
                    color: PDFLib.rgb(
                        parseInt(color.slice(1, 3), 16) / 255,
                        parseInt(color.slice(3, 5), 16) / 255,
                        parseInt(color.slice(5, 7), 16) / 255
                    ),
                    font: font,
                });
                displayPdfPreview();
            }
        }
    }
       

    async function addShapeToPage() {
        if (currentPageIndex !== null) {
            const page = pdfDoc.getPage(currentPageIndex);
            const shapeColor = document.getElementById('shapeColor').value;
            const borderColor = document.getElementById('shapeBorderColor').value;
            const width = 100;
            const height = 100;

            page.drawRectangle({
                x: 50,
                y: page.getHeight() - 200,
                width: width,
                height: height,
                borderColor: PDFLib.rgb(
                    parseInt(borderColor.slice(1, 3), 16) / 255,
                    parseInt(borderColor.slice(3, 5), 16) / 255,
                    parseInt(borderColor.slice(5, 7), 16) / 255
                ),
                borderWidth: 2,
                color: PDFLib.rgb(
                    parseInt(shapeColor.slice(1, 3), 16) / 255,
                    parseInt(shapeColor.slice(3, 5), 16) / 255,
                    parseInt(shapeColor.slice(5, 7), 16) / 255
                ),
            });
            displayPdfPreview();
        }
    }

    async function addImageToPage(event) {
        if (currentPageIndex !== null) {
            const page = pdfDoc.getPage(currentPageIndex);
            const file = event.target.files[0];
            const imageBytes = await file.arrayBuffer();
            const image = await pdfDoc.embedPng(imageBytes);

            page.drawImage(image, {
                x: 50,
                y: 50,
                width: 200,
                height: 200,
            });
            displayPdfPreview();
        }
    }

    function saveChanges() {
        displayPdfPreview();
        editPdfModal.hide();
    }

    pdfPreviewContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('pdf-page')) {
            currentPageIndex = parseInt(event.target.getAttribute('data-page'));
            showEditPdfModal(currentPageIndex);
        }
    });

    async function sortPages(ascending) {
        pdfPages.sort((a, b) => ascending ? a - b : b - a);
        displayPdfPreview();
    }

    sortAscBtn.addEventListener("click", () => sortPages(true));
    sortDescBtn.addEventListener("click", () => sortPages(false));

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
        return Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
    }
});
