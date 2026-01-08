document.addEventListener("DOMContentLoaded", () => {
    const pdfInputSplit = document.getElementById("pdfInputSplit");
    const fileListSplit = document.getElementById("fileListSplit");
    const splitBtn = document.getElementById("splitBtn");
    const extractAllPagesBtn = document.getElementById("extractAllPagesBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const startRange = document.getElementById("startRange");
    const endRange = document.getElementById("endRange");
    const fixedRange = document.getElementById("fixedRange");

    let pdfFiles = [];

    // Ensure only one mode is active at a time
    startRange.addEventListener("input", () => {
        fixedRange.disabled = true;
    });

    endRange.addEventListener("input", () => {
        fixedRange.disabled = true;
    });

    fixedRange.addEventListener("input", () => {
        startRange.disabled = true;
        endRange.disabled = true;
    });

    startRange.addEventListener("blur", () => {
        if (!startRange.value && !endRange.value) {
            fixedRange.disabled = false;
        }
    });

    endRange.addEventListener("blur", () => {
        if (!endRange.value && !startRange.value) {
            fixedRange.disabled = false;
        }
    });

    fixedRange.addEventListener("blur", () => {
        if (!fixedRange.value) {
            startRange.disabled = false;
            endRange.disabled = false;
        }
    });

    pdfInputSplit.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (file.type === "application/pdf") {
                if (pdfFiles.some(f => f.name === file.name)) {
                    showAlert(`File "${file.name}" is already added.`, 'warning');
                } else {
                    pdfFiles.push(file);
                    updateFileList();
                }
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
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
        updateFileList();
    }

    splitBtn.addEventListener("click", () => {
        const start = parseInt(startRange.value, 10);
        const end = parseInt(endRange.value, 10);
        const fixed = parseInt(fixedRange.value, 10);

        if (start && end) {
            splitByRange(start, end);
        } else if (fixed) {
            splitByFixedRange(fixed);
        } else {
            showAlert("Please specify a valid range or fixed range.", 'danger');
        }
    });

    async function splitByRange(start, end) {
        for (const file of pdfFiles) {
            const { PDFDocument } = PDFLib;
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);

            if (end > pdfDoc.getPageCount()) {
                showAlert("End page exceeds total number of pages.", 'danger');
                return;
            }

            for (let i = start - 1; i < end; i++) {
                const newPdfDoc = await PDFDocument.create();
                const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
                newPdfDoc.addPage(page);

                const newPdfBytes = await newPdfDoc.save();
                downloadPDF(newPdfBytes, `split_${file.name}_page_${i + 1}.pdf`);
            }
        }
    }

    async function splitByFixedRange(range) {
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
                downloadPDF(newPdfBytes, `split_${file.name}_range_${i + 1}-${Math.min(i + range, totalPages)}.pdf`);
            }
        }
    }

    async function extractAllPages() {
        for (const file of pdfFiles) {
            const { PDFDocument } = PDFLib;
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);

            for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                const newPdfDoc = await PDFDocument.create();
                const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
                newPdfDoc.addPage(page);

                const newPdfBytes = await newPdfDoc.save();
                downloadPDF(newPdfBytes, `extracted_${file.name}_page_${i + 1}.pdf`);
            }
        }
    }

    async function extractSelectedPages(pages) {
        for (const file of pdfFiles) {
            const { PDFDocument } = PDFLib;
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);

            for (const pageRange of pages) {
                const [start, end] = pageRange.split('-').map(Number);
                if (end === undefined) {
                    const newPdfDoc = await PDFDocument.create();
                    const [page] = await newPdfDoc.copyPages(pdfDoc, [start - 1]);
                    newPdfDoc.addPage(page);

                    const newPdfBytes = await newPdfDoc.save();
                    downloadPDF(newPdfBytes, `extracted_${file.name}_page_${start}.pdf`);
                } else {
                    const newPdfDoc = await PDFDocument.create();
                    const pagesToExtract = Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx);
                    const pagesList = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
                    pagesList.forEach(page => newPdfDoc.addPage(page));

                    const newPdfBytes = await newPdfDoc.save();
                    downloadPDF(newPdfBytes, `extracted_${file.name}_pages_${start}-${end}.pdf`);
                }
            }
        }
    }

    extractAllPagesBtn.addEventListener("click", () => {
        extractAllPages();
    });

    document.getElementById("selectPages").addEventListener("change", (event) => {
        const pagesInput = event.target.value;
        const pageRanges = pagesInput.split(',').map(range => range.trim());
        extractSelectedPages(pageRanges);
    });

    function downloadPDF(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
        alert.className = `alert alert-${type}`;
        alert.role = "alert";
        alert.textContent = message;
        alertPlaceholder.appendChild(alert);
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
});
