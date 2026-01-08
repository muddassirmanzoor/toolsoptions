document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("file-upload");
    const fileList = document.getElementById("fileList");
    const protectBtn = document.getElementById("protectBtn");
    const passwordInput = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const addBtn = document.getElementById("addBtn");

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
        // Remove only dynamically added file items (not the initial ones)
        const existingDynamicItems = fileList.querySelectorAll('.file-item[data-dynamic="true"]');
        existingDynamicItems.forEach(item => item.remove());
        
        pdfFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'file-item';
            divItem.setAttribute('data-dynamic', 'true');
            divItem.onclick = () => selectFile(divItem);
            
            const divScnd = document.createElement("div");
            divScnd.className = 'file-icon';
            const imgItem = document.createElement("img");
            imgItem.src = '/assests/beautiful-young-woman-with-dog.png';
            imgItem.alt = file.name;
            imgItem.style.display = 'block';
            
            const checkIcon = document.createElement("span");
            checkIcon.className = 'check-icon';
            checkIcon.innerHTML = '&#10004;';
            
            const namePar = document.createElement("p");
            namePar.classList.add("file-name");
            namePar.textContent = file.name;
            
            const delDiv = document.createElement("div");
            delDiv.classList.add("delete-icon");
            delDiv.onclick = (e) => {
                e.stopPropagation();
                removeFile(index);
            };
            delDiv.innerHTML = '×';
            delDiv.style.fontSize = '24px';
            delDiv.style.fontWeight = 'bold';
            delDiv.style.color = 'white';
            delDiv.style.lineHeight = '1';

            divScnd.appendChild(imgItem);
            divScnd.appendChild(checkIcon);
            divItem.appendChild(divScnd);
            divItem.appendChild(namePar);
            divItem.appendChild(delDiv);
            fileList.appendChild(divItem);
        });
    }
    
    function selectFile(element) {
        // Remove 'selected' class from all file-items
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => item.classList.remove('selected'));

        // Add 'selected' class to the clicked element
        element.classList.add('selected');
    }
    
    // Make selectFile available globally for onclick handlers
    window.selectFile = selectFile;
    
    addBtn.addEventListener("click", function(){
        if (pdfFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        pdfInput.click();
    });

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }

    protectBtn.addEventListener("click", protectPDF);

    async function protectPDF() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to protect.", 'danger');
            return;
        }

        const password = passwordInput.value.trim();
        if (!password) {
            showAlert("Please enter a password to protect the PDF.", 'danger');
            return;
        }
        const conPassword = confirmPassword.value.trim();
        if (conPassword !== password) {
            showAlert("Password and confirm password should be the same", 'danger');
            return;
        }

        // Disable the protect button and show "Please Wait..." with spinner
        protectBtn.disabled = true;
        protectBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
        formData.append("password", password);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/protect-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to protect PDF.");
            }

            const blob = await response.blob();
            const fileName = generateProtectedFileName(pdfFiles[0].name);
            downloadProtectedFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during protection: " + error.message, 'danger');
            console.error("Protection error:", error);
        } finally {
            // Re-enable the protect button and revert to original text
            protectBtn.disabled = false;
            protectBtn.innerHTML = 'Protect PDF';
        }
    }

    function generateProtectedFileName(pdfFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pdfFileName.replace(/\.pdf$/i, ""); // Remove the .pdf extension
        return `${baseName}_protected_${randomNumber}.pdf`;
    }

    function downloadProtectedFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("PDF protected successfully!", 'success');
    }

    function showAlert(message, type) {
        // Create alert container if it doesn't exist
        let alertPlaceholder = document.getElementById("alertPlaceholder");
        if (!alertPlaceholder) {
            alertPlaceholder = document.createElement('div');
            alertPlaceholder.id = 'alertPlaceholder';
            alertPlaceholder.className = 'alert-container mb-4';
            // Insert before the container
            const container = document.querySelector('.container.my-5');
            if (container) {
                container.insertBefore(alertPlaceholder, container.firstChild);
            }
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        alertPlaceholder.innerHTML = ''; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        // Automatically remove the alert after a timeout
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 7000);
    }
});

