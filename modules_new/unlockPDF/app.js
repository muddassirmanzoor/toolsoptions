// Global function for toggleSelection (called from HTML onclick)
function toggleSelection(card) {
    card.classList.toggle('selected');
}

document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const unlockBtn = document.getElementById("unlockBtn");
    const pdfPassword = document.getElementById("pdfPassword");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const addBtn = document.getElementById("addBtn");

    let pdfFile = null;
    let alertTimeoutId = null; // To keep track of the alert timeout
    let processingAlert = null; // To keep track of the alert element
    let updateAlertTimeoutId = null; // To keep track of the update alert timeout

    pdfInput.addEventListener("change", handleFileSelection);

    function handleFileSelection(event) {
        const file = event.target.files[0];
        if (pdfFile) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        if (file && file.type === "application/pdf") {
            pdfFile = file;
            updateFileList();
        } else {
            showAlert("Only PDF files are allowed.", 'danger');
        }
    }

    function updateFileList() {
        // Remove existing dynamic items
        const existingItems = fileList.querySelectorAll('.list-item');
        existingItems.forEach(item => item.remove());
        
        if (pdfFile) {
            const divItem = document.createElement("div");
            divItem.className = 'col-6 col-sm-6 col-md-6 col-lg-6 mb-4 list-item';
            const divScnd = document.createElement("div");
            divScnd.className = 'pdf-card';
            divScnd.onclick = () => toggleSelection(divScnd);
            
            const checkmark = document.createElement("span");
            checkmark.className = 'checkmark';
            checkmark.innerHTML = '✔';
            
            const imgItem = document.createElement("img");
            imgItem.src = '/assests/beautiful-young-woman-with-dog.png';
            imgItem.alt = pdfFile.name;
            imgItem.onerror = function() {
                this.onerror = null;
                this.src = '/assests/pdf 2.png';
            };
            
            const nameDiv = document.createElement("div");
            nameDiv.classList.add("pdf-name");
            nameDiv.textContent = pdfFile.name;

            divScnd.appendChild(checkmark);
            divScnd.appendChild(imgItem);
            divScnd.appendChild(nameDiv);
            divItem.appendChild(divScnd);
            fileList.appendChild(divItem);
        }
    }
    
    addBtn.addEventListener("click", function(){pdfInput.click()});

    function removeFile() {
        pdfFile = null;
        pdfPassword.value = '';
        updateFileList();
    }

    unlockBtn.addEventListener("click", unlockPdf);

    async function unlockPdf() {
        if (processingAlert) {
            const bsAlert = new bootstrap.Alert(processingAlert);
            bsAlert.close();
            processingAlert = null;
        }

        if (!pdfFile) {
            showAlert("Please add a PDF file to unlock.", 'danger');
            return;
        }

        const password = pdfPassword.value.trim();

        // Disable the unlock button and show "Please Wait..." with spinner
        unlockBtn.disabled = true;
        unlockBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        // Start the alert timeout to display the initial processing alert after 5 seconds
        alertTimeoutId = setTimeout(() => {
            if (!processingAlert) {
                processingAlert = showAlert("Do not close your browser. Wait until your files are uploaded and processed! This might take a few minutes. :)", 'info', false);
            }
        }, 5000); // 5 seconds delay

        // Update the alert message after 1 minute
        updateAlertTimeoutId = setTimeout(() => {
            if (processingAlert) {
                if (processingAlert) {
                    const bsAlert = new bootstrap.Alert(processingAlert);
                    bsAlert.close();
                }
                processingAlert = showAlert("<strong>Please do not close your browser.</strong> We are currently processing your request with our decryption method, but it may take a little longer. Your patience is appreciated, and it might take a few more minutes. Thank you! :)", 'warning', false);
            }
        }, 60000); // 1 minute delay

        const formData = new FormData();
        formData.append("pdf", pdfFile);
        if (password) {
            formData.append("password", password);
        }

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/unprotect-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to unlock PDF. <strong>Some files require password, please provide a valid password</strong>");
            }

            const blob = await response.blob();
            const fileName = generatePdfFileName(pdfFile.name);
            downloadPdfFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during unlocking: " + error.message, 'danger', false);
            console.error("Unlock error:", error);
        } finally {
            // Re-enable the unlock button and revert to original text
            unlockBtn.disabled = false;
            unlockBtn.innerHTML = 'Unlock PDF';

            // Clear the alert timeouts and remove the processing alert if it exists
            if (alertTimeoutId) {
                clearTimeout(alertTimeoutId);
                alertTimeoutId = null;
            }
            if (updateAlertTimeoutId) {
                clearTimeout(updateAlertTimeoutId);
                updateAlertTimeoutId = null;
            }
            if (processingAlert) {
                const bsAlert = new bootstrap.Alert(processingAlert);
                bsAlert.close();
                processingAlert = null;
            }
        }
    }

    function generatePdfFileName(originalFileName) {
        const baseName = originalFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_unlocked.pdf`;
    }

    function downloadPdfFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF unlocked successfully!", 'success');
    }

    function showAlert(message, type, autoClose = true) {
        // Create alert container if it doesn't exist
        if (!alertPlaceholder) {
            const container = document.querySelector('.col-md-6');
            if (container) {
                const newAlertPlaceholder = document.createElement('div');
                newAlertPlaceholder.id = 'alertPlaceholder';
                container.insertBefore(newAlertPlaceholder, container.querySelector('h3').nextSibling);
            }
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = 
            `${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        if (alertPlaceholder) {
            alertPlaceholder.innerHTML = ''; // Clear any existing alerts
            alertPlaceholder.appendChild(alertDiv);
        }

        if (autoClose) {
            // Automatically remove the alert after a timeout
            setTimeout(() => {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }, 7000);
        }

        return alertDiv; // Return the alert element so it can be manually updated or removed later
    }
});
