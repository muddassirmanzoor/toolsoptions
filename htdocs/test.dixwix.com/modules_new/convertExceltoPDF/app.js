document.addEventListener("DOMContentLoaded", () => {
    const excelInput = document.getElementById("excelInput");
    const fileList = document.getElementById("fileList");
    const convertBtn = document.getElementById("convertBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const addBtn = document.getElementById("addBtn");
    const excelInfoAlert = document.getElementById("excelInfoAlert");
    const excelFileItems = document.getElementById("excelFileItems");

    let excelFiles = [];

    if (excelInput) {
        excelInput.addEventListener("change", handleFileSelection);
    }

    if (addBtn && excelInput) {
        addBtn.addEventListener("click", () => excelInput.click());
    }

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        if (excelFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
                excelFiles.push(file);
                updateFileList();
            } else {
                showAlert("Only Excel files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        if (!fileList) return;
        fileList.innerHTML = "";

        if (excelFiles.length === 0) {
            // No files selected: keep info alert visible and clear right-side items
            if (excelInfoAlert) excelInfoAlert.style.display = "block";
            if (excelFileItems) excelFileItems.innerHTML = "";
            return;
        }

        // One file selected: hide info alert and show a single preview tile
        if (excelInfoAlert) excelInfoAlert.style.display = "none";

        excelFiles.forEach(() => {
            const divItem = document.createElement("div");
            divItem.className = "file-item";

            const divScnd = document.createElement("div");
            divScnd.className = "file-icon";

            const img = document.createElement("img");
            img.src = "/assests/Vector.png";

            divScnd.appendChild(img);
            divItem.appendChild(divScnd);
            fileList.appendChild(divItem);
        });

        // Update right-side file items box to show the resulting PDF name
        if (excelFileItems) {
            excelFileItems.innerHTML = "";
            const file = excelFiles[0];
            const item = document.createElement("div");
            item.className = "file-list-item file-item-orange";

            const nameSpan = document.createElement("span");
            nameSpan.className = "file-name";
            nameSpan.textContent = generatePdfFileName(file.name);

            const dragSpan = document.createElement("span");
            dragSpan.className = "drag-handle";
            dragSpan.textContent = "⋮⋮";

            item.appendChild(nameSpan);
            item.appendChild(dragSpan);
            excelFileItems.appendChild(item);
        }
    }

    function removeFile(index) {
        excelFiles.splice(index, 1);
        updateFileList();
    }

    if (convertBtn) {
        convertBtn.addEventListener("click", convertToPdf);
    }

    async function convertToPdf() {
        if (excelFiles.length === 0) {
            showAlert("Please add an Excel file to convert.", 'danger');
            return;
        }

        // Disable the convert button and show "Please Wait..." with spinner
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("excel", excelFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-excel-to-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert Excel to PDF.");
            }

            const blob = await response.blob();
            const fileName = generatePdfFileName(excelFiles[0].name);
            downloadPdfFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert To PDF';
        }
    }

    function generatePdfFileName(excelFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = excelFileName.replace(/\.xlsx$|\.xls$/i, ""); // Remove .xlsx or .xls extension
        return `${baseName}_${randomNumber}.pdf`;
    }

    function downloadPdfFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Excel converted to PDF successfully!", 'success');
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = 
            `${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>`;
        alertPlaceholder.innerHTML = ''; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout (optional)
        setTimeout(() => {
            $(alertDiv).alert('close');
        }, 7000); // Remove alert after 5 seconds
    }
});
