document.addEventListener("DOMContentLoaded", () => {
    const pptInput = document.getElementById("pptInput");
    const fileList = document.getElementById("fileList");
    const convertBtn = document.getElementById("convertBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const addBtn = document.getElementById("addBtn");

    let pptFiles = [];

    pptInput.addEventListener("change", handleFileSelection);

    if (addBtn) {
        addBtn.addEventListener("click", function () {
            pptInput.click();
        });
    }

    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        if (pptFiles.length > 0) {
            showAlert("Only one file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            if (extension === 'ppt' || extension === 'pptx') {
                pptFiles.push(file);
                updateFileList();
            } else {
                showAlert("Only PPT or PPTX files are allowed.", 'danger');
            }
        });
    }

    function updateFileList() {
        fileList.innerHTML = "";
        pptFiles.forEach((file, index) => {
            const divItem = document.createElement("div");
            divItem.className = 'file-item';
            const divScnd = document.createElement("div");
            divScnd.className = 'file-icon';
            const img = document.createElement('img');
            img.src = "/assests/Group 147.png";
            
            const checkIcon = document.createElement("span");
            checkIcon.className = 'check-icon';
            const checkImg = document.createElement('img');
            checkImg.src = "../compressPDF/assets/checkmark-filled.svg";
            checkImg.alt = "Check";
            checkIcon.appendChild(checkImg);
            divScnd.appendChild(checkIcon);
            divScnd.classList.add('selected');
            
            // Add click handler to toggle selection
            divScnd.addEventListener('click', function() {
                divScnd.classList.toggle('selected');
            });

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
        pptFiles.splice(index, 1);
        updateFileList();
    }

    convertBtn.addEventListener("click", convertToPDF);

    async function convertToPDF() {
        if (pptFiles.length === 0) {
            showAlert("Please add a PPT or PPTX file to convert.", 'danger');
            return;
        }

        // Disable the convert button and show "Please Wait..." with spinner
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("ppt", pptFiles[0]);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/convert-ppt-to-pdf`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to convert PPT/PPTX to PDF.");
            }

            const blob = await response.blob();
            const fileName = generatePdfFileName(pptFiles[0].name);
            downloadPdfFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during conversion: " + error.message, 'danger');
            console.error("Conversion error:", error);
        } finally {
            // Re-enable the convert button and revert to original text
            convertBtn.disabled = false;
            convertBtn.innerHTML = 'Convert to PDF';
        }
    }

    function generatePdfFileName(pptFileName) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const baseName = pptFileName.replace(/\.(ppt|pptx)$/i, ""); // Remove the .ppt or .pptx extension
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
        showAlert("PPT/PPTX converted to PDF successfully!", 'success');
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

    // Function to handle file icon selection
    function selectFile(element) {
        element.classList.toggle('selected');
    }

    // Make selectFile available globally
    window.selectFile = selectFile;
});

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

    // Function to handle file icon selection
    function selectFile(element) {
        element.classList.toggle('selected');
    }

    // Make selectFile available globally
    window.selectFile = selectFile;
});
