document.addEventListener("DOMContentLoaded", () => {
    // Configure pdf.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
    
    const pdfInput = document.getElementById("pdfInputOrganizer");
    const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
    const downloadBtn = document.getElementById("downloadBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const addBtn = document.getElementById("addBtn");
    const resetBtn = document.getElementById("resetBtn");
    const totalPagesSpan = document.getElementById("totalPages");

    let pdfDoc;
    let pdfPages = [];
    let pageRotations = {}; // Track rotation for each page
    let originalFileName = "";
    let randomSuffix = "";

    pdfInput.addEventListener("change", handleFileSelection);

    if (addBtn) {
        addBtn.addEventListener("click", function () {
            pdfInput.click();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            pdfPages = [];
            pageRotations = {};
            pdfPreviewContainer.innerHTML = "";
            const addBlankPageContainer = document.getElementById("addBlankPageContainer");
            if (addBlankPageContainer) {
                addBlankPageContainer.style.display = "none";
            }
            if (totalPagesSpan) {
                totalPagesSpan.textContent = "0";
            }
            pdfInput.value = "";
        });
    }

    async function handleFileSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileBytes = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
            pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Track page indexes
            originalFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
            randomSuffix = generateRandomNumber();
            if (totalPagesSpan) {
                totalPagesSpan.textContent = pdfDoc.getPageCount();
            }
            displayPdfPreview();
        } else {
            showAlert("Please upload a valid PDF file.", 'danger');
        }
    }

    function displayPdfPreview() {
        if (!pdfPreviewContainer) {
            console.error("pdfPreviewContainer not found");
            return;
        }
        
        pdfPreviewContainer.innerHTML = ""; // Clear any previous previews
        
        // Show "Add Blank Page" button if pages exist
        const addBlankPageContainer = document.getElementById("addBlankPageContainer");
        if (addBlankPageContainer && pdfPages.length > 0) {
            addBlankPageContainer.style.display = "block";
        }
    
        pdfPages.forEach((pageIndex, idx) => {
            // Create thumbnail div
            const thumbnailDiv = document.createElement("div");
            thumbnailDiv.className = "pdf-thumbnail";
            if (idx === 0) {
                thumbnailDiv.classList.add("active"); // First page is active by default
            }
            thumbnailDiv.style.cursor = "pointer";
            thumbnailDiv.addEventListener("click", () => selectThumbnail(thumbnailDiv, idx));
            
            // Create inner container
            const innerDiv = document.createElement("div");
            innerDiv.className = "pdf-thumbnail-inner";
            
            // Add page icons for active page only
            if (idx === 0) {
                const iconsDiv = document.createElement("div");
                iconsDiv.className = "page-icons position-absolute top-0 end-0 p-2 align-items-center";
                
                // Add icon (first)
                const addPageBtn = document.createElement("img");
                addPageBtn.classList.add("icon");
                addPageBtn.src = "/assests/Group 90 (1).png";
                addPageBtn.alt = "Add";
                addPageBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    addBlankPageFromIcon(pageIndex, 'right');
                });
                iconsDiv.appendChild(addPageBtn);
                
                // Rotate icon (second)
                const rotateBtn = document.createElement("img");
                rotateBtn.classList.add("icon");
                rotateBtn.src = "/assests/sync 1.png";
                rotateBtn.alt = "Rotate";
                rotateBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    rotatePage(pageIndex, 90);
                });
                iconsDiv.appendChild(rotateBtn);
                
                // Delete icon (third)
                const removeBtn = document.createElement("img");
                removeBtn.classList.add("icon");
                removeBtn.src = "/assests/delete 2.png";
                removeBtn.alt = "Remove";
                removeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    removePage(pageIndex);
                });
                iconsDiv.appendChild(removeBtn);
                
                innerDiv.appendChild(iconsDiv);
            }
            
            // Add placeholder image
            const placeholderImg = document.createElement("img");
            placeholderImg.src = "/assests/pdf 2.png";
            placeholderImg.alt = `PDF ${idx + 1}`;
            placeholderImg.style.maxWidth = "90.44px";
            placeholderImg.style.maxHeight = "90.44px";
            placeholderImg.style.width = "90.44px";
            placeholderImg.style.height = "auto";
            placeholderImg.style.display = "block";
            placeholderImg.style.margin = "0 auto";
            placeholderImg.style.visibility = "visible";
            placeholderImg.style.opacity = "1";
            placeholderImg.className = "pdf-placeholder-img";
            innerDiv.appendChild(placeholderImg);
            
            // Add canvas
            const canvas = document.createElement("canvas");
            canvas.style.display = "none";
            canvas.className = "pdf-canvas";
            innerDiv.appendChild(canvas);
            
            thumbnailDiv.appendChild(innerDiv);
            
            // Add page label
            const pageLabel = document.createElement("p");
            pageLabel.className = "pdf-page-label";
            pageLabel.textContent = `PDF ${idx + 1}`;
            thumbnailDiv.appendChild(pageLabel);
            
            pdfPreviewContainer.appendChild(thumbnailDiv);
            
            // Render the page thumbnail
            renderPageThumbnail(pageIndex, canvas, placeholderImg).catch(error => {
                console.error("Error rendering page thumbnail:", error);
                placeholderImg.style.display = 'block';
                canvas.style.display = 'none';
            });
    
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
            const icons = page.querySelector('.page-icons');
            if (icons) {
                icons.classList.add('d-none');
            }
        });

        // Add active class to selected page and show icons
        if (element) {
            element.classList.add('active');
            const icons = element.querySelector('.page-icons');
            if (icons) {
                icons.classList.remove('d-none');
            }
        }
    }
    
    function selectThumbnail(element, index) {
        // Remove active class from all thumbnails
        document.querySelectorAll('.pdf-thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
            const icons = thumb.querySelector('.page-icons');
            if (icons) {
                icons.remove();
            }
        });

        // Add active class to selected thumbnail
        element.classList.add('active');
        
        // Add icons to active thumbnail
        const innerDiv = element.querySelector('.pdf-thumbnail-inner');
        if (innerDiv) {
            const iconsDiv = document.createElement("div");
            iconsDiv.className = "page-icons position-absolute top-0 end-0 p-2 align-items-center";
            
            // Add icon (first)
            const addPageBtn = document.createElement("img");
            addPageBtn.classList.add("icon");
            addPageBtn.src = "/assests/Group 90 (1).png";
            addPageBtn.alt = "Add";
            addPageBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                addBlankPageFromIcon(pdfPages[index], 'right');
            });
            iconsDiv.appendChild(addPageBtn);
            
            // Rotate icon (second)
            const rotateBtn = document.createElement("img");
            rotateBtn.classList.add("icon");
            rotateBtn.src = "/assests/sync 1.png";
            rotateBtn.alt = "Rotate";
            rotateBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                rotatePage(pdfPages[index], 90);
            });
            iconsDiv.appendChild(rotateBtn);
            
            // Delete icon (third)
            const removeBtn = document.createElement("img");
            removeBtn.classList.add("icon");
            removeBtn.src = "/assests/delete 2.png";
            removeBtn.alt = "Remove";
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                removePage(pdfPages[index]);
            });
            iconsDiv.appendChild(removeBtn);
            
            innerDiv.appendChild(iconsDiv);
        }
    }
    
    // Function to add blank page (called from the "Add a Blank Page" button)
    async function addBlankPage() {
        if (!pdfDoc || pdfPages.length === 0) {
            showAlert("Please upload a PDF first.", 'warning');
            return;
        }
        
        const tempPdfDoc = await PDFLib.PDFDocument.create();
        const [firstPage] = await pdfDoc.getPages();
        const { width, height } = firstPage.getSize();
        tempPdfDoc.addPage([width, height]);
        const [blankPageInTempDoc] = await tempPdfDoc.getPages();
    
        const newPdfDoc = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfPages);
    
        const [blankPageInNewDoc] = await newPdfDoc.copyPages(tempPdfDoc, [0]);
        const orderedPages = [...copiedPages, blankPageInNewDoc];
    
        for (const page of orderedPages) {
            newPdfDoc.addPage(page);
        }
    
        pdfDoc = newPdfDoc;
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
        if (totalPagesSpan) {
            totalPagesSpan.textContent = pdfDoc.getPageCount();
        }
        displayPdfPreview();
    }
    
    // Function to add blank page from icon (inserts at specific position)
    async function addBlankPageFromIcon(position, side) {
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
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
        if (totalPagesSpan) {
            totalPagesSpan.textContent = pdfDoc.getPageCount();
        }
        displayPdfPreview();
    }
    
    // Make addBlankPage available globally
    window.addBlankPage = addBlankPage;

    async function renderPageThumbnail(pageIndex, canvas) {
        try {
            const context = canvas.getContext('2d');
            
            // Get the page from PDFLib
            const page = await pdfDoc.getPage(pageIndex);
            const { width, height } = page.getSize();
            
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
    
            // Use pdf.js to render the page
            const pdf = await pdfjsLib.getDocument({ url: url }).promise;
            const pdfPageToRender = await pdf.getPage(1);
            
            // Scale down for thumbnail (0.2 = 20% of original size)
            const viewportScale = 0.2;
            const scaledViewport = pdfPageToRender.getViewport({ scale: viewportScale });
    
            // Set canvas dimensions
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
    
            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
            };
    
            await pdfPageToRender.render(renderContext).promise;
            URL.revokeObjectURL(url); // Clean up the object URL
        } catch (error) {
            console.error("Error in renderPageThumbnail:", error);
            throw error;
        }
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
        if (totalPagesSpan) {
            totalPagesSpan.textContent = pdfDoc.getPageCount();
        }
        displayPdfPreview();
    }

    async function removePage(pageIndex) {
        const newPdfDoc = await PDFLib.PDFDocument.create();
    
        const pagesToCopy = pdfPages.filter(idx => idx !== pageIndex);
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
    
        copiedPages.forEach(page => newPdfDoc.addPage(page));
    
        pdfDoc = newPdfDoc;
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Update page tracking
        if (totalPagesSpan) {
            totalPagesSpan.textContent = pdfDoc.getPageCount();
        }
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

            
            // Apply the rotation to the preview page
            const rotation = pageRotations[pageIndex] || 0;
            pdfPage.setRotation(PDFLib.degrees(rotation));
    
            previewDoc.addPage(pdfPage);
            const pdfBytes = await previewDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
    
            // Use pdf.js to render the page
            const pdf = await pdfjsLib.getDocument({ url: url }).promise;
            const pdfPageToRender = await pdf.getPage(1);
            
            // Scale down for thumbnail (0.2 = 20% of original size)
            const viewportScale = 0.2;
            const scaledViewport = pdfPageToRender.getViewport({ scale: viewportScale });
    
            // Set canvas dimensions
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
    
            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
            };
    
            await pdfPageToRender.render(renderContext).promise;
            URL.revokeObjectURL(url); // Clean up the object URL
        } catch (error) {
            console.error("Error in renderPageThumbnail:", error);
            throw error;
        }
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
        if (totalPagesSpan) {
            totalPagesSpan.textContent = pdfDoc.getPageCount();
        }
        displayPdfPreview();
    }

    async function removePage(pageIndex) {
        const newPdfDoc = await PDFLib.PDFDocument.create();
    
        const pagesToCopy = pdfPages.filter(idx => idx !== pageIndex);
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
    
        copiedPages.forEach(page => newPdfDoc.addPage(page));
    
        pdfDoc = newPdfDoc;
        pdfPages = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i); // Update page tracking
        if (totalPagesSpan) {
            totalPagesSpan.textContent = pdfDoc.getPageCount();
        }
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
