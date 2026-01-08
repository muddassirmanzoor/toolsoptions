document.addEventListener("DOMContentLoaded", () => {
    const pdfInput1 = document.getElementById("pdfInput1");
    const fileList1 = document.getElementById("fileList1");
    const pdfInput2 = document.getElementById("pdfInput2");
    const fileList2 = document.getElementById("fileList2");
    const compareBtn = document.getElementById("compareBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");

    let pdfFile1 = null;
    let pdfFile2 = null;

    pdfInput1.addEventListener("change", handleFileSelection1);
    pdfInput2.addEventListener("change", handleFileSelection2);

    function handleFileSelection1(event) {
        const file = event.target.files[0];
        if (pdfFile1) {
            showAlert("Only one file can be selected in this section. Please remove the current file to select another.", 'warning');
            return;
        }
        if (file && file.type === "application/pdf") {
            pdfFile1 = file;
            updateFileList(fileList1, file, removeFile1);
        } else {
            showAlert("Only PDF files are allowed.", 'danger');
        }
    }

    function handleFileSelection2(event) {
        const file = event.target.files[0];
        if (pdfFile2) {
            showAlert("Only one file can be selected in this section. Please remove the current file to select another.", 'warning');
            return;
        }
        if (file && file.type === "application/pdf") {
            pdfFile2 = file;
            updateFileList(fileList2, file, removeFile2);
        } else {
            showAlert("Only PDF files are allowed.", 'danger');
        }
    }

    function updateFileList(fileList, file, removeFileFunc) {
        fileList.innerHTML = "";
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
        listItem.textContent = file.name;
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.classList.add("btn", "btn-danger", "btn-sm");
        removeBtn.addEventListener("click", removeFileFunc);
        listItem.appendChild(removeBtn);
        fileList.appendChild(listItem);
    }

    function removeFile1() {
        pdfFile1 = null;
        fileList1.innerHTML = "";
    }

    function removeFile2() {
        pdfFile2 = null;
        fileList2.innerHTML = "";
    }

    compareBtn.addEventListener("click", comparePdfs);

    async function comparePdfs() {
        if (!pdfFile1 || !pdfFile2) {
            showAlert("Please add a PDF file to both sections to compare.", 'danger');
            return;
        }

        // Disable the compare button and show "Please Wait..." with spinner
        compareBtn.disabled = true;
        compareBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf1", pdfFile1);
        formData.append("pdf2", pdfFile2);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/compare-pdfs`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to compare PDFs.");
            }

            const blob = await response.blob();
            const fileName = `comparison_result_${Date.now()}.pdf`;
            downloadFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during comparison: " + error.message, 'danger');
            console.error("Comparison error:", error);
        } finally {
            // Re-enable the compare button and revert to original text
            compareBtn.disabled = false;
            compareBtn.innerHTML = 'Compare PDFs';
        }
    }

    function downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDFs compared successfully! Downloading result.", 'success');
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
