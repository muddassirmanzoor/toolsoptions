// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
    console.warn('PDF.js library not loaded yet, will configure when available');
}

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
    const pdfPreviewArea = document.getElementById("pdfPreviewArea");
    const pdfCanvas = document.getElementById("pdfCanvas");
    const pageThumbnailsColumn = document.getElementById("pageThumbnailsColumn");
    const currentPageSpan = document.getElementById("currentPage");
    const totalPagesSpan = document.getElementById("totalPages");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const goToPageDropdown = document.getElementById("goToPageDropdown");
    const pageNumberInput = document.getElementById("pageNumberInput");
    const documentName = document.getElementById("documentName");
    const signPdfBtn = document.getElementById("signPdfBtn");

    // Signature Modal Elements
    const signatureModalElement = document.getElementById("signatureModal");
    let signatureModal = null;
    
    // Initialize Bootstrap modal after Bootstrap is loaded
    if (signatureModalElement && typeof bootstrap !== 'undefined') {
        signatureModal = new bootstrap.Modal(signatureModalElement);
    } else if (signatureModalElement) {
        // Wait for Bootstrap to load
        window.addEventListener('load', () => {
            if (typeof bootstrap !== 'undefined') {
                signatureModal = new bootstrap.Modal(signatureModalElement);
            }
        });
    }
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const editSignatureBtn = document.getElementById("editSignatureBtn");
    const editInitialsBtn = document.getElementById("editInitialsBtn");
    const signatureInput = document.getElementById("signatureInput");
    const initialsInput = document.getElementById("initialsInput");

    // Signature Creation Elements
    const nameInput = document.getElementById("nameInput");
    const generateBtn = document.getElementById("generateBtn");
    const signatureCanvas = document.getElementById("signatureCanvas");
    const saveSignatureBtn = document.getElementById("saveSignatureBtn");
    const drawCanvas = document.getElementById("drawCanvas");
    const undoBtn = document.getElementById("undoBtn");
    const saveDrawBtn = document.getElementById("saveDrawBtn");
    const imageUpload = document.getElementById("imageUpload");
    const uploadCanvas = document.getElementById("uploadCanvas");
    const undoBtnUpload = document.getElementById("undoBtnUpload");
    const saveUploadBtn = document.getElementById("saveUploadBtn");
    const historyContainer = document.getElementById("historyContainer");

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

    // PDF Upload Button
    const uploadPdfBtn = document.getElementById("uploadPdfBtn");
    if (uploadPdfBtn && pdfInput) {
        uploadPdfBtn.addEventListener("click", () => {
            pdfInput.click();
        });
    }

    // PDF Upload Handler
    if (pdfInput) {
        pdfInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            if (file.type !== "application/pdf") {
                showAlert("Please select a valid PDF file.", "danger");
                pdfInput.value = "";
                return;
            }

            pdfFile = file;
            if (documentName) {
                documentName.textContent = file.name;
            }

            // Show loading state
            if (pdfPreviewArea) {
                pdfPreviewArea.innerHTML = `
                    <div class="upload-prompt">
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
                        if (pdfPreviewArea) {
                            pdfPreviewArea.innerHTML = `
                                <div class="upload-prompt">
                                    <i class="fa-regular fa-file-pdf pdf-icon-large"></i>
                                    <span class="pdf-label">PDF</span>
                                    <button class="btn-upload-pdf" id="uploadPdfBtnRetry">Upload PDF</button>
                                </div>
                            `;
                            const retryBtn = document.getElementById("uploadPdfBtnRetry");
                            if (retryBtn && pdfInput) {
                                retryBtn.addEventListener("click", () => {
                                    pdfInput.click();
                                });
                            }
                        }
                    }
                };
                fileReader.onerror = () => {
                    showAlert("Failed to read file. Please try again.", "danger");
                };
                fileReader.readAsArrayBuffer(file);
            } catch (error) {
                console.error("Error loading PDF:", error);
                showAlert("Failed to load PDF. Please try again.", "danger");
                pdfInput.value = "";
                if (pdfPreviewArea) {
                    pdfPreviewArea.innerHTML = `
                        <div class="upload-prompt">
                            <i class="fa-regular fa-file-pdf pdf-icon-large"></i>
                            <span class="pdf-label">PDF</span>
                            <button class="btn-upload-pdf" id="uploadPdfBtnRetry2">Upload PDF</button>
                        </div>
                    `;
                    const retryBtn2 = document.getElementById("uploadPdfBtnRetry2");
                    if (retryBtn2 && pdfInput) {
                        retryBtn2.addEventListener("click", () => {
                            pdfInput.click();
                        });
                    }
                }
            }
        });
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
        if (!pdfDoc || !pdfCanvas) return;

        try {
            const page = await pdfDoc.getPage(currentPage);
            const viewport = page.getViewport({ scale: scale });
            
            pdfCanvas.width = viewport.width;
            pdfCanvas.height = viewport.height;
            pdfCanvas.style.display = "block";

            const renderContext = {
                canvasContext: pdfCanvas.getContext("2d"),
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Hide placeholder, show canvas
            if (pdfPreviewArea) {
                pdfPreviewArea.style.display = "none";
            }
            if (currentPageSpan) {
                currentPageSpan.textContent = currentPage;
            }
            updateActiveThumbnail();
        } catch (error) {
            console.error("Error rendering page:", error);
            showAlert("Failed to render PDF page.", "danger");
        }
    }

    async function renderPageThumbnails() {
        if (!pdfDoc || !pageThumbnailsColumn) return;

        const addPageBtn = document.getElementById("addPageBtn");
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

        // Show add page button after thumbnails
        if (addPageBtn) {
            addPageBtn.style.display = "flex";
            pageThumbnailsColumn.appendChild(addPageBtn);
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
                }

                adjustCanvasSizes();
            });
        });
    }

    function adjustCanvasSizes() {
        const canvases = document.querySelectorAll("#signatureModal canvas");
        canvases.forEach(canvas => {
            const fixedWidth = 700;
            const fixedHeight = (fixedWidth * 1) / 4;

            canvas.width = fixedWidth;
            canvas.height = fixedHeight;
            
            // Re-initialize drawing context if it's a drawing canvas
            if (canvas.id === "drawCanvas" && drawCtx) {
                drawCtx.strokeStyle = "#000000";
                drawCtx.lineWidth = 2;
                drawCtx.lineCap = "round";
                drawCtx.lineJoin = "round";
            } else if (canvas.id === "uploadCanvas" && uploadCtx) {
                uploadCtx.strokeStyle = "#000000";
                uploadCtx.lineWidth = 2;
                uploadCtx.lineCap = "round";
                uploadCtx.lineJoin = "round";
            }
        });
    }

    // Initialize canvas sizes when modal is shown
    if (signatureModalElement) {
        signatureModalElement.addEventListener('shown.bs.modal', () => {
            adjustCanvasSizes();
        });
    }

    // Edit Signature Buttons
    if (editSignatureBtn) {
        editSignatureBtn.addEventListener("click", () => {
            currentEditingField = "signature";
            if (signatureModal) {
                signatureModal.show();
            } else if (signatureModalElement) {
                // Fallback: show modal directly if Bootstrap modal not initialized
                signatureModalElement.style.display = "block";
                signatureModalElement.classList.add("show");
            }
            // Switch to draw tab by default
            setTimeout(() => {
                const drawTab = document.querySelector('.tab-button[data-tab="draw"]');
                if (drawTab) drawTab.click();
            }, 300);
        });
    }

    if (editInitialsBtn) {
        editInitialsBtn.addEventListener("click", () => {
            currentEditingField = "initials";
            if (signatureModal) {
                signatureModal.show();
            } else if (signatureModalElement) {
                // Fallback: show modal directly if Bootstrap modal not initialized
                signatureModalElement.style.display = "block";
                signatureModalElement.classList.add("show");
            }
            // Switch to draw tab by default
            setTimeout(() => {
                const drawTab = document.querySelector('.tab-button[data-tab="draw"]');
                if (drawTab) drawTab.click();
            }, 300);
        });
    }

    // Type Tab - Generate Signatures
    const signatureCtx = signatureCanvas ? signatureCanvas.getContext("2d") : null;
    
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

    if (saveSignatureBtn && signatureCanvas) {
        saveSignatureBtn.addEventListener("click", () => {
            const dataURL = signatureCanvas.toDataURL('image/png');
            applySignatureToField(dataURL);
            saveToHistory(dataURL);
            if (signatureModal) {
                signatureModal.hide();
            } else if (signatureModalElement) {
                signatureModalElement.style.display = "none";
                signatureModalElement.classList.remove("show");
                document.body.classList.remove("modal-open");
                const backdrop = document.getElementById("modalBackdrop");
                if (backdrop) backdrop.remove();
            }
        });
    }

    function generateSignatureOptions(name) {
        const fonts = ["Arial", "Courier", "Georgia", "Verdana", "Times New Roman", "Impact", "Comic Sans MS", "Trebuchet MS", "Lucida Sans", "Garamond", "Palatino", "Bookman", "Candara", "Optima", "Rockwell"];
        return fonts.map(font => ({ font, text: name }));
    }

    function displaySignatureOptions(signatures) {
        const previewsContainer = document.getElementById("signaturePreviews");
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
        if (!signatureCtx || !signatureCanvas) return;
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureCtx.font = `30px ${signature.font}`;
        signatureCtx.textAlign = "center";
        signatureCtx.textBaseline = "middle";
        signatureCtx.fillStyle = "#000000";
        signatureCtx.fillText(signature.text, signatureCanvas.width / 2, signatureCanvas.height / 2);
    }

    // Draw Tab
    const drawCtx = drawCanvas ? drawCanvas.getContext("2d") : null;
    let drawHistory = [];
    let isDrawing = false;

    // Set drawing style
    if (drawCtx) {
        drawCtx.strokeStyle = "#000000";
        drawCtx.lineWidth = 2;
        drawCtx.lineCap = "round";
        drawCtx.lineJoin = "round";
    }

    if (drawCanvas) {
        drawCanvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        drawCtx.beginPath();
        drawCtx.moveTo(event.offsetX, event.offsetY);
            drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
        });

        drawCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing && drawCtx) {
                drawCtx.lineTo(event.offsetX, event.offsetY);
                drawCtx.stroke();
            }
        });

    if (drawCanvas) {
        drawCanvas.addEventListener("mouseup", () => {
            isDrawing = false;
            drawCtx.closePath();
        });

        drawCanvas.addEventListener("mouseleave", () => {
            if (isDrawing) {
                isDrawing = false;
                drawCtx.closePath();
            }
        });
    }

    if (undoBtn && drawCtx) {
        undoBtn.addEventListener("click", () => {
            if (drawHistory.length > 0) {
                drawCtx.putImageData(drawHistory.pop(), 0, 0);
            }
        });
    }

    if (saveDrawBtn && drawCanvas) {
        saveDrawBtn.addEventListener("click", () => {
            const dataURL = drawCanvas.toDataURL('image/png');
            applySignatureToField(dataURL);
            saveToHistory(dataURL);
            if (signatureModal) {
                signatureModal.hide();
            } else if (signatureModalElement) {
                signatureModalElement.style.display = "none";
                signatureModalElement.classList.remove("show");
                document.body.classList.remove("modal-open");
                const backdrop = document.getElementById("modalBackdrop");
                if (backdrop) backdrop.remove();
            }
        });
    }

    // Upload Tab
    const uploadCtx = uploadCanvas ? uploadCanvas.getContext("2d") : null;
    let uploadHistory = [];

    // Set drawing style
    if (uploadCtx) {
        uploadCtx.strokeStyle = "#000000";
        uploadCtx.lineWidth = 2;
        uploadCtx.lineCap = "round";
        uploadCtx.lineJoin = "round";
    }

    if (imageUpload) {
        imageUpload.addEventListener("change", handleImageUpload);
    }

    if (uploadCanvas) {
        uploadCanvas.addEventListener("mousedown", (event) => {
            isDrawing = true;
            if (uploadCtx) {
                uploadCtx.beginPath();
                uploadCtx.moveTo(event.offsetX, event.offsetY);
                uploadHistory.push(uploadCtx.getImageData(0, 0, uploadCanvas.width, uploadCanvas.height));
            }
        });

        uploadCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing && uploadCtx) {
                uploadCtx.lineTo(event.offsetX, event.offsetY);
                uploadCtx.stroke();
            }
        });
    }

    if (uploadCanvas) {
        uploadCanvas.addEventListener("mouseup", () => {
            isDrawing = false;
            if (uploadCtx) uploadCtx.closePath();
        });

        uploadCanvas.addEventListener("mouseleave", () => {
            if (isDrawing) {
                isDrawing = false;
                if (uploadCtx) uploadCtx.closePath();
            }
        });
    }

    if (undoBtnUpload && uploadCtx) {
        undoBtnUpload.addEventListener("click", () => {
            if (uploadHistory.length > 0) {
                uploadCtx.putImageData(uploadHistory.pop(), 0, 0);
            }
        });
    }

    if (saveUploadBtn && uploadCanvas) {
        saveUploadBtn.addEventListener("click", () => {
            const dataURL = uploadCanvas.toDataURL('image/png');
            applySignatureToField(dataURL);
            saveToHistory(dataURL);
            if (signatureModal) {
                signatureModal.hide();
            } else if (signatureModalElement) {
                signatureModalElement.style.display = "none";
                signatureModalElement.classList.remove("show");
                document.body.classList.remove("modal-open");
                const backdrop = document.getElementById("modalBackdrop");
                if (backdrop) backdrop.remove();
            }
        });
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && uploadCtx && uploadCanvas) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
                    uploadCtx.drawImage(img, 0, 0, uploadCanvas.width, uploadCanvas.height);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // History Tab
    function updateHistory() {
        const savedHistory = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        historyContainer.innerHTML = '';
        savedHistory.forEach(dataURL => {
            const img = document.createElement("img");
            img.src = dataURL;
            img.classList.add('history-image');
            img.addEventListener("click", () => {
                applySignatureToField(dataURL);
                if (signatureModal) {
                    signatureModal.hide();
                } else if (signatureModalElement) {
                    signatureModalElement.style.display = "none";
                    signatureModalElement.classList.remove("show");
                    document.body.classList.remove("modal-open");
                    const backdrop = document.getElementById("modalBackdrop");
                    if (backdrop) backdrop.remove();
                }
            });
            historyContainer.appendChild(img);
        });
    }

    function saveToHistory(dataURL) {
        const historyData = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        historyData.push(dataURL);
        localStorage.setItem("signatureHistory", JSON.stringify(historyData));
        updateHistory();
    }

    // Apply signature to the current editing field
    function applySignatureToField(dataURL) {
        if (currentEditingField === "signature") {
            signatureData.signature = dataURL;
            signatureInput.value = "Signature created";
            signatureInput.style.fontStyle = "italic";
            signatureInput.style.color = "green";
        } else if (currentEditingField === "initials") {
            signatureData.initials = dataURL;
            initialsInput.value = "Initials created";
            initialsInput.style.fontStyle = "italic";
            initialsInput.style.color = "green";
        }
        currentEditingField = null;
    }

    // Load history on page load
    updateHistory();

    // Sign PDF Button
    if (signPdfBtn) {
        signPdfBtn.addEventListener("click", async () => {
            if (!pdfFile) {
                showAlert("Please upload a PDF file first.", "warning");
                return;
            }

            if (!signatureData.signature) {
                showAlert("Please create a signature first.", "warning");
                return;
            }

            signPdfBtn.disabled = true;
            signPdfBtn.innerHTML = 'Signing PDF... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            try {
                const formData = new FormData();
                formData.append("pdf", pdfFile);
                formData.append("signature", signatureData.signature);
                if (signatureData.initials) {
                    formData.append("initials", signatureData.initials);
                }
                formData.append("page", currentPage);

                const SERVER_NAME = window.env ? window.env.PUBLIC_SERVER_URL : '';
                if (!SERVER_NAME) {
                    throw new Error("Server URL not configured");
                }

                const response = await fetch(`${SERVER_NAME}/api/sign-pdf`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Failed to sign PDF.");
                }

                const blob = await response.blob();
                const fileName = `signed_${pdfFile.name}`;
                downloadFile(blob, fileName);
            } catch (error) {
                showAlert("An error occurred while signing the PDF: " + error.message, "danger");
                console.error("Sign PDF error:", error);
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
        showAlert("PDF signed successfully! Downloading result.", "success");
    }


    // Initialize
    updatePageNavigation();

    // Verify critical elements exist
    if (!pdfInput) {
        console.error('PDF input element not found!');
        showAlert('PDF upload functionality not available. Please refresh the page.', 'danger');
    }
    if (!uploadPdfBtn) {
        console.error('Upload PDF button not found!');
    }
    if (!editSignatureBtn) {
        console.error('Edit signature button not found!');
    }
    if (!signPdfBtn) {
        console.error('Sign PDF button not found!');
    }

    console.log('Signature module initialized successfully');
});
