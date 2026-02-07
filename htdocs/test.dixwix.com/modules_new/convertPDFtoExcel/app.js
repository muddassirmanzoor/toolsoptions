document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const convertBtn = document.getElementById("convertBtn");
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

    convertBtn.addEventListener("click", convertToExcel);

    function generateExcelFileName(pdfFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove .pdf extension
        return `${baseName}_${randomNumber}.xlsx`;
    }

    async function convertToExcel() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to convert.", 'danger');
            return;
        }
    
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
    
        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-pdf-to-excel`, {
                method: "POST",
                body: formData
            });
    
            if (!response.ok) {
                throw new Error("Failed to convert PDF to Excel.");
            }
    
            const blob = await response.blob();
            const fileName = generateExcelFileName(pdfFiles[0].name);
            downloadExcelFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert to Excel';
        }
    }
    
    function downloadExcelFile(excelBlob, fileName) {
        const url = URL.createObjectURL(excelBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up URL object
        showAlert("PDF converted to Excel successfully!", 'success');
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
