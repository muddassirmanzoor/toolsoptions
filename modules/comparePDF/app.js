// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const pdfInput1 = document.getElementById("pdfInput1");
    const pdfInput2 = document.getElementById("pdfInput2");
    const uploadBox1 = document.getElementById("uploadBox1");
    const uploadBox2 = document.getElementById("uploadBox2");
    const previewWrapper1 = document.getElementById("previewWrapper1");
    const previewWrapper2 = document.getElementById("previewWrapper2");
    const pdfCanvas1 = document.getElementById("pdfCanvas1");
    const pdfCanvas2 = document.getElementById("pdfCanvas2");
    const compareBtn = document.getElementById("compareBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const scrollSyncToggle = document.getElementById("scrollSyncToggle");
    const semanticBtn = document.getElementById("semanticBtn");
    const overlayBtn = document.getElementById("overlayBtn");
    const semanticModeContent = document.getElementById("semanticModeContent");
    const overlayModeContent = document.getElementById("overlayModeContent");

    // PDF state
    let pdfDoc1 = null;
    let pdfDoc2 = null;
    let pdfFile1 = null;
    let pdfFile2 = null;
    let currentPage1 = 1;
    let currentPage2 = 1;
    let scale1 = 1.0;
    let scale2 = 1.0;
    let scrollSyncEnabled = false;
    let currentMode = 'overlay'; // 'semantic' or 'overlay'

    // Initialize PDF.js
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not loaded');
        showAlert('PDF.js library failed to load. Please refresh the page.', 'danger');
    }

    // Get label elements
    const label1 = document.getElementById("label1");
    const label2 = document.getElementById("label2");

    // Make upload boxes clickable (but not if clicking on label, which already triggers input)
    uploadBox1.addEventListener("click", (e) => {
        // Don't trigger if clicking on label (label already handles it via 'for' attribute)
        if (e.target.closest("label") || e.target === label1) return;
        // Don't trigger if clicking on action buttons or close buttons
        if (e.target.closest(".action-btn") || e.target.closest(".btn-close-pdf")) return;
        // Only trigger if clicking on the upload box itself or its children (except label)
        pdfInput1.click();
    });

    uploadBox2.addEventListener("click", (e) => {
        // Don't trigger if clicking on label (label already handles it via 'for' attribute)
        if (e.target.closest("label") || e.target === label2) return;
        // Don't trigger if clicking on action buttons or close buttons
        if (e.target.closest(".action-btn") || e.target.closest(".btn-close-pdf")) return;
        // Only trigger if clicking on the upload box itself or its children (except label)
        pdfInput2.click();
    });

    // Prevent label click from bubbling to upload box
    if (label1) {
        label1.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering uploadBox1 click
        });
    }
    if (label2) {
        label2.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering uploadBox2 click
        });
    }

    // File input handlers
    pdfInput1.addEventListener("change", (e) => handleFileSelection(e, 1));
    pdfInput2.addEventListener("change", (e) => handleFileSelection(e, 2));

    // Scroll sync toggle
    scrollSyncToggle.addEventListener("click", () => {
        scrollSyncEnabled = !scrollSyncEnabled;
        scrollSyncToggle.classList.toggle("active", scrollSyncEnabled);
    });

    // Mode switching
    semanticBtn.addEventListener("click", () => switchMode('semantic'));
    overlayBtn.addEventListener("click", () => switchMode('overlay'));

    // PDF navigation controls
    document.getElementById("prevPage1").addEventListener("click", () => changePage(1, -1));
    document.getElementById("nextPage1").addEventListener("click", () => changePage(1, 1));
    document.getElementById("prevPage2").addEventListener("click", () => changePage(2, -1));
    document.getElementById("nextPage2").addEventListener("click", () => changePage(2, 1));

    // Zoom controls
    document.getElementById("zoomOut1").addEventListener("click", () => changeZoom(1, -0.1));
    document.getElementById("zoomIn1").addEventListener("click", () => changeZoom(1, 0.1));
    document.getElementById("zoomOut2").addEventListener("click", () => changeZoom(2, -0.1));
    document.getElementById("zoomIn2").addEventListener("click", () => changeZoom(2, 0.1));

    // Close PDF buttons
    document.getElementById("closePdf1").addEventListener("click", () => removePdf(1));
    document.getElementById("closePdf2").addEventListener("click", () => removePdf(2));

    // Scroll sync implementation
    const previewContent1 = document.getElementById("pdfPreview1");
    const previewContent2 = document.getElementById("pdfPreview2");

    let isScrolling1 = false;
    let isScrolling2 = false;

    previewContent1.addEventListener("scroll", () => {
        if (scrollSyncEnabled && !isScrolling2 && pdfDoc1 && pdfDoc2) {
            isScrolling1 = true;
            const scrollPercent = previewContent1.scrollTop / (previewContent1.scrollHeight - previewContent1.clientHeight);
            previewContent2.scrollTop = scrollPercent * (previewContent2.scrollHeight - previewContent2.clientHeight);
            setTimeout(() => { isScrolling1 = false; }, 100);
        }
    });

    previewContent2.addEventListener("scroll", () => {
        if (scrollSyncEnabled && !isScrolling1 && pdfDoc1 && pdfDoc2) {
            isScrolling2 = true;
            const scrollPercent = previewContent2.scrollTop / (previewContent2.scrollHeight - previewContent2.clientHeight);
            previewContent1.scrollTop = scrollPercent * (previewContent1.scrollHeight - previewContent1.clientHeight);
            setTimeout(() => { isScrolling2 = false; }, 100);
        }
    });

    // Compare button
    compareBtn.addEventListener("click", comparePdfs);

    async function handleFileSelection(event, pdfNumber) {
        const file = event.target.files[0];
        if (!file) {
            // Reset input if no file selected
            event.target.value = "";
            return;
        }

        if (file.type !== "application/pdf") {
            showAlert("Only PDF files are allowed.", "danger");
            event.target.value = "";
            return;
        }

        // Check if file is already loaded
        if (pdfNumber === 1 && pdfFile1 && pdfFile1.name === file.name && pdfFile1.size === file.size) {
            // Same file, don't reload
            return;
        }
        if (pdfNumber === 2 && pdfFile2 && pdfFile2.name === file.name && pdfFile2.size === file.size) {
            // Same file, don't reload
            return;
        }

        try {
            // Show loading state
            const uploadBox = pdfNumber === 1 ? uploadBox1 : uploadBox2;
            const originalContent = uploadBox.querySelector(".file-list-container").innerHTML;
            uploadBox.querySelector(".file-list-container").innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p style="margin-top: 10px;">Loading PDF...</p>
                </div>
            `;

            if (pdfNumber === 1) {
                pdfFile1 = file;
                await loadPdf(file, 1);
            } else {
                pdfFile2 = file;
                await loadPdf(file, 2);
            }
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Failed to load PDF. Please try again.", "danger");
            event.target.value = "";
            
            // Restore upload box
            const uploadBox = pdfNumber === 1 ? uploadBox1 : uploadBox2;
            uploadBox.style.display = "flex";
            const previewWrapper = pdfNumber === 1 ? previewWrapper1 : previewWrapper2;
            previewWrapper.style.display = "none";
        }
    }

    async function loadPdf(file, pdfNumber) {
        const fileReader = new FileReader();
        
        fileReader.onload = async function(e) {
            try {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                
                if (pdfNumber === 1) {
                    pdfDoc1 = pdf;
                    currentPage1 = 1;
                    scale1 = 1.0;
                    uploadBox1.style.display = "none";
                    previewWrapper1.style.display = "flex";
                    document.getElementById("filename1").textContent = file.name;
                    await renderPage(1, 1);
                } else {
                    pdfDoc2 = pdf;
                    currentPage2 = 1;
                    scale2 = 1.0;
                    uploadBox2.style.display = "none";
                    previewWrapper2.style.display = "flex";
                    document.getElementById("filename2").textContent = file.name;
                    await renderPage(2, 1);
                }

                // Update document selectors in overlay mode
                if (currentMode === 'overlay') {
                    updateDocumentSelectors();
                }

                // If both PDFs are loaded and in semantic mode, perform comparison
                if (pdfDoc1 && pdfDoc2 && currentMode === 'semantic') {
                    performSemanticComparison();
                }
            } catch (error) {
                console.error("Error parsing PDF:", error);
                showAlert("Failed to parse PDF. The file may be corrupted.", "danger");
            }
        };

        fileReader.readAsArrayBuffer(file);
    }

    async function renderPage(pdfNumber, pageNum) {
        const pdfDoc = pdfNumber === 1 ? pdfDoc1 : pdfDoc2;
        const canvas = pdfNumber === 1 ? pdfCanvas1 : pdfCanvas2;
        const scale = pdfNumber === 1 ? scale1 : scale2;
        const pageInfo = pdfNumber === 1 ? document.getElementById("pageInfo1") : document.getElementById("pageInfo2");
        const zoomInfo = pdfNumber === 1 ? document.getElementById("zoomInfo1") : document.getElementById("zoomInfo2");
        const prevBtn = pdfNumber === 1 ? document.getElementById("prevPage1") : document.getElementById("prevPage2");
        const nextBtn = pdfNumber === 1 ? document.getElementById("nextPage2") : document.getElementById("nextPage2");

        if (!pdfDoc) return;

        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: scale });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: canvas.getContext("2d"),
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Update UI
            pageInfo.textContent = `${pageNum} / ${pdfDoc.numPages}`;
            zoomInfo.textContent = `${Math.round(scale * 100)}%`;
            
            // Update button states
            if (prevBtn) prevBtn.disabled = pageNum <= 1;
            if (nextBtn) nextBtn.disabled = pageNum >= pdfDoc.numPages;

            // Update page number in overlay mode
            if (currentMode === 'overlay') {
                if (pdfNumber === 1) {
                    document.getElementById("doc1Page").value = pageNum;
                } else {
                    document.getElementById("doc2Page").value = pageNum;
                }
            }
        } catch (error) {
            console.error("Error rendering page:", error);
            showAlert("Failed to render PDF page.", "danger");
        }
    }

    function changePage(pdfNumber, delta) {
        const pdfDoc = pdfNumber === 1 ? pdfDoc1 : pdfDoc2;
        if (!pdfDoc) return;

        let currentPage = pdfNumber === 1 ? currentPage1 : currentPage2;
        const newPage = currentPage + delta;

        if (newPage < 1 || newPage > pdfDoc.numPages) return;

        if (pdfNumber === 1) {
            currentPage1 = newPage;
        } else {
            currentPage2 = newPage;
        }

        renderPage(pdfNumber, newPage);
    }

    function changeZoom(pdfNumber, delta) {
        const scale = pdfNumber === 1 ? scale1 : scale2;
        const newScale = Math.max(0.5, Math.min(3.0, scale + delta));

        if (pdfNumber === 1) {
            scale1 = newScale;
            renderPage(1, currentPage1);
        } else {
            scale2 = newScale;
            renderPage(2, currentPage2);
        }
    }

    function removePdf(pdfNumber) {
        if (pdfNumber === 1) {
            pdfDoc1 = null;
            pdfFile1 = null;
            currentPage1 = 1;
            scale1 = 1.0;
            uploadBox1.style.display = "flex";
            previewWrapper1.style.display = "none";
            pdfInput1.value = "";
            document.getElementById("doc1Name").textContent = "No file selected.";
            document.getElementById("doc1Page").disabled = true;
        } else {
            pdfDoc2 = null;
            pdfFile2 = null;
            currentPage2 = 1;
            scale2 = 1.0;
            uploadBox2.style.display = "flex";
            previewWrapper2.style.display = "none";
            pdfInput2.value = "";
            document.getElementById("doc2Name").textContent = "No file selected.";
            document.getElementById("doc2Page").disabled = true;
        }

        // Clear change report
        document.getElementById("changeReportList").innerHTML = "";
        document.getElementById("reportTitle").textContent = "Change Report (0)";
    }

    function switchMode(mode) {
        currentMode = mode;
        
        if (mode === 'semantic') {
            semanticBtn.classList.add("active");
            overlayBtn.classList.remove("active");
            semanticModeContent.style.display = "block";
            overlayModeContent.style.display = "none";
            
            // Perform comparison if both PDFs are loaded
            if (pdfDoc1 && pdfDoc2) {
                performSemanticComparison();
            }
        } else {
            overlayBtn.classList.add("active");
            semanticBtn.classList.remove("active");
            semanticModeContent.style.display = "none";
            overlayModeContent.style.display = "block";
            
            updateDocumentSelectors();
        }
    }

    function updateDocumentSelectors() {
        if (pdfFile1) {
            document.getElementById("doc1Name").textContent = pdfFile1.name;
            document.getElementById("doc1Page").disabled = false;
            document.getElementById("doc1Page").max = pdfDoc1 ? pdfDoc1.numPages : 1;
        }
        
        if (pdfFile2) {
            document.getElementById("doc2Name").textContent = pdfFile2.name;
            document.getElementById("doc2Page").disabled = false;
            document.getElementById("doc2Page").max = pdfDoc2 ? pdfDoc2.numPages : 1;
        }
    }

    async function performSemanticComparison() {
        if (!pdfDoc1 || !pdfDoc2) return;

        try {
            const changes = [];
            const maxPages = Math.max(pdfDoc1.numPages, pdfDoc2.numPages);

            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                const page1 = pageNum <= pdfDoc1.numPages ? await pdfDoc1.getPage(pageNum) : null;
                const page2 = pageNum <= pdfDoc2.numPages ? await pdfDoc2.getPage(pageNum) : null;

                if (page1) {
                    const text1 = await page1.getTextContent();
                    const text1Str = text1.items.map(item => item.str).join(' ');
                    
                    if (page2) {
                        const text2 = await page2.getTextContent();
                        const text2Str = text2.items.map(item => item.str).join(' ');

                        if (text1Str !== text2Str) {
                            changes.push({
                                page: pageNum,
                                old: text1Str.substring(0, 100) + (text1Str.length > 100 ? '...' : ''),
                                new: text2Str.substring(0, 100) + (text2Str.length > 100 ? '...' : '')
                            });
                        }
                    } else {
                        changes.push({
                            page: pageNum,
                            old: text1Str.substring(0, 100) + (text1Str.length > 100 ? '...' : ''),
                            new: '[Page removed]'
                        });
                    }
                } else if (page2) {
                    const text2 = await page2.getTextContent();
                    const text2Str = text2.items.map(item => item.str).join(' ');
                    changes.push({
                        page: pageNum,
                        old: '[Page added]',
                        new: text2Str.substring(0, 100) + (text2Str.length > 100 ? '...' : '')
                    });
                }
            }

            displayChangeReport(changes);
        } catch (error) {
            console.error("Error performing semantic comparison:", error);
            showAlert("Failed to compare PDFs. Please try again.", "danger");
        }
    }

    function displayChangeReport(changes) {
        const reportList = document.getElementById("changeReportList");
        const reportTitle = document.getElementById("reportTitle");
        
        reportTitle.textContent = `Change Report (${changes.length})`;
        reportList.innerHTML = "";

        if (changes.length === 0) {
            const noChanges = document.createElement("div");
            noChanges.className = "report-item";
            noChanges.textContent = "No changes detected.";
            reportList.appendChild(noChanges);
            return;
        }

        changes.forEach((change, index) => {
            const item = document.createElement("div");
            item.className = "report-item";
            item.innerHTML = `
                <strong>Page ${change.page}</strong><br>
                <small><strong>Old:</strong> ${change.old}</small><br>
                <small><strong>New:</strong> ${change.new}</small>
            `;
            item.style.cursor = "pointer";
            item.addEventListener("click", () => {
                // Navigate to the page in both viewers
                if (change.page <= (pdfDoc1 ? pdfDoc1.numPages : 0)) {
                    currentPage1 = change.page;
                    renderPage(1, change.page);
                }
                if (change.page <= (pdfDoc2 ? pdfDoc2.numPages : 0)) {
                    currentPage2 = change.page;
                    renderPage(2, change.page);
                }
            });
            reportList.appendChild(item);
        });
    }

    async function comparePdfs() {
        if (!pdfFile1 || !pdfFile2) {
            showAlert("Please add a PDF file to both sections to compare.", "danger");
            return;
        }

        compareBtn.disabled = true;
        compareBtn.innerHTML = 'Please wait... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf1", pdfFile1);
        formData.append("pdf2", pdfFile2);
        formData.append("mode", currentMode);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL;
            const response = await fetch(`${SERVER_NAME}/api/compare-pdfs`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to compare PDFs.");
            }

            const blob = await response.blob();
            const fileName = `comparison_result_${Date.now()}.pdf`;
            downloadFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during comparison: " + error.message, "danger");
            console.error("Comparison error:", error);
        } finally {
            compareBtn.disabled = false;
            compareBtn.textContent = "Download Report";
        }
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
        showAlert("PDFs compared successfully! Downloading result.", "success");
    }

    function showAlert(message, type) {
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

    // Document selector page inputs
    document.getElementById("doc1Page").addEventListener("change", (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= (pdfDoc1 ? pdfDoc1.numPages : 1)) {
            currentPage1 = page;
            renderPage(1, page);
        }
    });

    document.getElementById("doc2Page").addEventListener("change", (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= (pdfDoc2 ? pdfDoc2.numPages : 1)) {
            currentPage2 = page;
            renderPage(2, page);
        }
    });

    // Document upload buttons (link to file inputs)
    document.getElementById("uploadDoc1").addEventListener("click", () => pdfInput1.click());
    document.getElementById("uploadDoc2").addEventListener("click", () => pdfInput2.click());
});
