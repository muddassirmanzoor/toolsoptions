document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const uploadDefault = document.getElementById("uploadDefault");
    const addPageNumberBtn = document.getElementById("addPageNumberBtn");
    const addBtn = document.getElementById("addBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const transparency = document.getElementById("transparency");
    const pageSize = document.getElementById("pageSize");
    let pdfFiles = [];
    let selectedPosition = "middle-center"; // default matches UI

    if (pdfInput) {
        pdfInput.addEventListener("change", handleFileSelection);
    }
    if (addBtn && pdfInput) {
        addBtn.addEventListener("click", () => pdfInput.click());
    }
    if (addPageNumberBtn) {
        addPageNumberBtn.addEventListener("click", addPageNumber);
    }

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
        if (!fileList) return;

        fileList.innerHTML = "";

        if (pdfFiles.length === 0) {
            // Show default grid state again
            if (uploadDefault) {
                fileList.appendChild(uploadDefault);
                uploadDefault.style.display = "block";
            }
            return;
        }

        if (uploadDefault) {
            uploadDefault.style.display = "none";
        }

        pdfFiles.forEach((file, index) => {
            const thumb = document.createElement("div");
            thumb.className = "pdf-thumbnail";

            const img = document.createElement("img");
            // Use the same generic PDF icon used in the grid
            img.src = "../compressPDF/assets/pdf-icon.svg";
            img.alt = file.name;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-icon";
            deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            deleteBtn.addEventListener("click", () => removeFile(index));

            thumb.appendChild(img);
            thumb.appendChild(deleteBtn);
            fileList.appendChild(thumb);
        });
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
    }

    function addPageNumber() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to add page numbers.", 'danger');
            return;
        }

        if (!selectedPosition) {
            showAlert("Please select a position for the page number.", 'danger');
            return;
        }

        if (!addPageNumberBtn) return;

        addPageNumberBtn.disabled = true;
        addPageNumberBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
        formData.append("position", selectedPosition);
        formData.append("transparency", transparency.value);
        formData.append("pageSize", pageSize.value);

        const SERVER_NAME = window.env && window.env.PUBLIC_SERVER_URL ? window.env.PUBLIC_SERVER_URL : "";

        fetch(`${SERVER_NAME}/api/add-page-number`, {
            method: "POST",
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to add page number.");
                }
                return response.blob();
            })
            .then(blob => {
                const fileName = generatePageNumberedFileName(pdfFiles[0].name);
                downloadPageNumberedFile(blob, fileName);
            })
            .catch(error => {
                showAlert("An error occurred during page numbering: " + error.message, 'danger');
            })
            .finally(() => {
                addPageNumberBtn.disabled = false;
                addPageNumberBtn.innerHTML = 'Add Page Numbers';
            });
    }

    function generatePageNumberedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, "");
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        return `${baseName}_page_numbered_${randomNumber}.pdf`;
    }

    function downloadPageNumberedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Page number added successfully!", 'success');
    }

    function showAlert(message, type) {
        if (!alertPlaceholder) return;

        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", `alert-${type}`, "alert-dismissible", "fade", "show");
        alertDiv.setAttribute("role", "alert");
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertPlaceholder.innerHTML = "";
        alertPlaceholder.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.classList.remove("show");
            alertDiv.addEventListener("transitionend", () => alertDiv.remove(), { once: true });
        }, 5000);
    }

    const positionBoxes = document.querySelectorAll(".position-box");
    positionBoxes.forEach(box => {
        box.addEventListener("click", function () {
            positionBoxes.forEach(box => box.classList.remove("active"));
            this.classList.add("active");
            selectedPosition = this.getAttribute("data-position");
        });
    });
});
