document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInputOrganizer");
    const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
    // const sortAscBtn = document.getElementById("sortAscBtn");
    // const sortDescBtn = document.getElementById("sortDescBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");

    let pdfDoc;
    let pdfPages = [];
    let pageRotations = {}; // Track rotation for each page
    let originalFileName = "";
    let randomSuffix = "";

    pdfInput.addEventListener("change", handleFileSelection);

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
    
            const rotateRightBtn = document.createElement("img");
            rotateRightBtn.classList.add("icon");
            rotateRightBtn.src = "/assests/sync 1.png";
            rotateRightBtn.alt = "Rotate";
            rotateRightBtn.addEventListener("click", () => rotatePage(pageIndex, 90));
            btnDiv.appendChild(rotateRightBtn);
    
            pdfPreviewContainer.appendChild(mainDiv);
    
            renderPageThumbnail(pageIndex, canvas);
            // const pageContainer = document.createElement("div");
            // pageContainer.classList.add("pdf-page");
    
            // const canvas = document.createElement("canvas");
            // pageContainer.appendChild(canvas);
    
            // const addPageBtnLeft = document.createElement("button");
            // addPageBtnLeft.classList.add("btn", "btn-sm", "btn-primary", "add-page-btn-left", "hidden");
            // addPageBtnLeft.textContent = "+";
            // addPageBtnLeft.addEventListener("click", () => addBlankPage(pageIndex, 'left'));
            // pageContainer.appendChild(addPageBtnLeft);
    
            // const addPageBtnRight = document.createElement("button");
            // addPageBtnRight.classList.add("btn", "btn-sm", "btn-primary", "add-page-btn-right", "hidden");
            // addPageBtnRight.textContent = "+";
            // addPageBtnRight.addEventListener("click", () => addBlankPage(pageIndex, 'right'));
            // pageContainer.appendChild(addPageBtnRight);
    
            // const removePageBtn = document.createElement("button");
            // removePageBtn.classList.add("btn", "btn-sm", "btn-danger", "remove-page-btn", "hidden");
            // removePageBtn.textContent = "-";
            // removePageBtn.addEventListener("click", () => removePage(pageIndex));
            // pageContainer.appendChild(removePageBtn);
    
            // const rotateLeftBtn = document.createElement("button");
            // rotateLeftBtn.classList.add("btn", "btn-sm", "btn-info", "rotate-page-btn");
            // rotateLeftBtn.textContent = "⟲";
            // rotateLeftBtn.addEventListener("click", () => rotatePage(pageIndex, -90));
            // pageContainer.appendChild(rotateLeftBtn);
    
            // const rotateRightBtn = document.createElement("button");
            // rotateRightBtn.classList.add("btn", "btn-sm", "btn-info", "rotate-page-btn");
            // rotateRightBtn.textContent = "⟳";
            // rotateRightBtn.addEventListener("click", () => rotatePage(pageIndex, 90));
            // pageContainer.appendChild(rotateRightBtn);
    
            // pdfPreviewContainer.appendChild(pageContainer);
    
            // renderPageThumbnail(pageIndex, canvas);
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
