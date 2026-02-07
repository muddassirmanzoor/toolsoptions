document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfFile");
    const fileList = document.getElementById("fileList");
    const compressBtn = document.getElementById("compressBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");

    let pdfFiles = [];

    pdfInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        if (pdfFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            if (file.type === "application/pdf") {
                pdfFiles.push(file);
                updateFileList();
            } else {
                showAlert("Only PDF files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        fileList.innerHTML = "";
        pdfFiles.forEach((file, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            listItem.textContent = file.name;
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.classList.add("btn", "btn-danger", "btn-sm");
            removeBtn.addEventListener("click", () => removeFile(index));
            listItem.appendChild(removeBtn);
            fileList.appendChild(listItem);
        });
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }

    compressBtn.addEventListener("click", compressPDF);

    async function compressPDF() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to compress.", 'danger');
            return;
        }

        // Disable the compress button and show "Please Wait..." with spinner
        compressBtn.disabled = true;
        compressBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdfFile", pdfFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/compress-pdf`, {
                method: "POST",
                body: formData
            });
            console.log(response);
            if (!response.ok) {
                throw new Error(response);
            }

            const blob = await response.blob();
            const fileName = generateCompressedFileName(pdfFiles[0].name);
            downloadCompressedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during compression: " + error.message, 'danger');
            console.error("Compression error:", error);
        } finally {
            // Re-enable the compress button and revert to original text
            compressBtn.disabled = false;
            compressBtn.innerHTML = 'Compress PDF';
        }
    }

    function generateCompressedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_compressed.pdf`;
    }

    function downloadCompressedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF compressed successfully!", 'success');
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
