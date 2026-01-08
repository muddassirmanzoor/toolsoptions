document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const repairBtn = document.getElementById("repairBtn");
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
            const divItem = document.createElement("div");
            divItem.className = 'file-item';
            const divScnd = document.createElement("div");
            divScnd.className = 'file-icon';
            const img = document.createElement('img');
            img.src = "/assests/pdf 2.png";

            divScnd.appendChild(img);
            divItem.appendChild(divScnd);
            fileList.appendChild(divItem);
            // const listItem = document.createElement("li");
            // listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            // listItem.textContent = file.name;
            // const removeBtn = document.createElement("button");
            // removeBtn.textContent = "Remove";
            // removeBtn.classList.add("btn", "btn-danger", "btn-sm");
            // removeBtn.addEventListener("click", () => removeFile(index));
            // listItem.appendChild(removeBtn);
            // fileList.appendChild(listItem);
        });
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }

    repairBtn.addEventListener("click", repairPDF);

    async function repairPDF() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to repair.", 'danger');
            return;
        }

        showAlert("We will try to repair your PDFs.", 'info');

        // Disable the repair button and show "Please Wait..." with spinner
        repairBtn.disabled = true;
        repairBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/repair-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to repair PDF. Also We can't process damaged or corrupted files");
            }

            const blob = await response.blob();
            const fileName = generateRepairedFileName(pdfFiles[0].name);
            downloadRepairedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during repair: " + error.message, 'danger');
            console.error("Repair error:", error);
        } finally {
            // Re-enable the repair button and revert to original text
            repairBtn.disabled = false;
            repairBtn.innerHTML = 'Repair PDF';
        }
    }

    function generateRepairedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_repaired.pdf`;
    }

    function downloadRepairedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF repaired successfully!", 'success');
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
