document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const fileList = document.getElementById("fileList");
    const addPageNumberBtn = document.getElementById("addPageNumberBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const transparency = document.getElementById("transparency");
    const pageSize = document.getElementById("pageSize");
    let pdfFiles = [];
    let selectedPosition = null;

    pdfInput.addEventListener("change", handleFileSelection);
    addPageNumberBtn.addEventListener("click", addPageNumber);

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

    function addPageNumber() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to add page numbers.", 'danger');
            return;
        }

        if (!selectedPosition) {
            showAlert("Please select a position for the page number.", 'danger');
            return;
        }

        addPageNumberBtn.disabled = true;
        addPageNumberBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);
        formData.append("position", selectedPosition);
        formData.append("transparency", transparency.value);
        formData.append("pageSize", pageSize.value);

        const SERVER_NAME = window.env.PUBLIC_SERVER_URL;

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
            addPageNumberBtn.innerHTML = 'Add Page Number';
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

    const positionBoxes = document.querySelectorAll(".position-box");
    positionBoxes.forEach(box => {
        box.addEventListener("click", function() {
            positionBoxes.forEach(box => box.classList.remove("active"));
            this.classList.add("active");
            selectedPosition = this.getAttribute("data-position");
        });
    });
});
