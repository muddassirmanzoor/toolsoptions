document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const redactTextBtn = document.getElementById("redactTextBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const wordsTextarea = document.getElementById("words");
    let pdfFiles = [];

    pdfInput.addEventListener("change", handleFileSelection);
    redactTextBtn.addEventListener("click", redactText);

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

    function redactText() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to redact text from.", 'danger');
            return;
        }
    
        const words = wordsTextarea.value.trim().split('\n').filter(Boolean).join(','); // Join words with comma
        if (words.length === 0) {
            showAlert("Please enter words or sentences to redact.", 'danger');
            return;
        }
    
        redactTextBtn.disabled = true;
        redactTextBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
        formData.append("textToRedact", words); // Send comma-separated string
    
        const SERVER_NAME = window.env.PUBLIC_SERVER_URL;
    
        fetch(`${SERVER_NAME}/api/redact-pdf`, {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to redact text.");
            }
            return response.blob();
        })
        .then(blob => {
            const fileName = generateRedactedFileName(pdfFiles[0].name);
            downloadRedactedFile(blob, fileName);
        })
        .catch(error => {
            showAlert("An error occurred during redaction: " + error.message, 'danger');
        })
        .finally(() => {
            redactTextBtn.disabled = false;
            redactTextBtn.innerHTML = 'Redact Text';
        });
    }    

    function generateRedactedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, "");
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        return `${baseName}_redacted_${randomNumber}.pdf`;
    }

    function downloadRedactedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Text redacted successfully!", 'success');
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>`;
        alertPlaceholder.innerHTML = '';
        alertPlaceholder.appendChild(alertDiv);

        setTimeout(() => {
            $(alertDiv).alert('close');
        }, 5000);
    }
});
