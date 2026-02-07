document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const imageInput = document.getElementById("imageInput");
    const fileList = document.getElementById("fileList");
    const addWatermarkBtn = document.getElementById("addWatermarkBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const watermarkText = document.getElementById("watermarkText");
    const transparency = document.getElementById("transparency");
    // const imageTransparency = document.getElementById("imageTransparency");
    const size = document.getElementById("size");  
    // const imageSize = document.getElementById("imageSize");  
    const imagePreview = document.getElementById("imagePreview");
    const watermarkTab = document.getElementById("watermarkTab");

    let pdfFiles = [];
    let selectedPosition = null;
    let selectedImagePosition = null;
    let imageFile = null;

    pdfInput.addEventListener("change", handleFileSelection);
    imageInput.addEventListener("change", handleImageSelection);
    addWatermarkBtn.addEventListener("click", addWatermark);
    watermarkTab.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", changeTab);
    });

    function changeTab(event){
        const tabId = event.target.getAttribute("aria-controls");
        const tabs = document.querySelectorAll(".tab-pane");
        tabs.forEach(tab => {
            tab.classList.remove("active");
        });
        document.getElementById(tabId).classList.add("active");
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

    function handleImageSelection(event) {
        const files = Array.from(event.target.files);
        const file = files[0];

        if (file && file.type.startsWith("image/")) {
            imageFile = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Selected Image" style="width: 100%; max-width: 300px; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        } else {
            showAlert("Only image files are allowed.", 'danger');
        }
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

    function addWatermark() {
        if (pdfFiles.length === 0) {
            showAlert("Please add a PDF file to add a watermark.", 'danger');
            return;
        }

        const activeTab = document.querySelector("#watermarkTab .nav-link.active").id;

        // Ensure the correct position is selected based on the active tab
        if (activeTab === "text-tab" && !selectedPosition) {
            showAlert("Please select a position for the text watermark.", 'danger');
            return;
        } else if (activeTab === "image-tab" && !selectedImagePosition) {
            showAlert("Please select a position for the image watermark.", 'danger');
            return;
        }

        // Disable the button and show "Please Wait..." with spinner
        addWatermarkBtn.disabled = true;
        addWatermarkBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf", pdfFiles[0]);

        if (activeTab === "text-tab") {
            // Append text tab related data
            if (!watermarkText.value.trim()) {
                addWatermarkBtn.disabled = false;
                addWatermarkBtn.innerHTML = 'Add Watermark';
                showAlert("Please input text to use as a watermark.", 'danger');
                return;
            }
            formData.append("text", watermarkText.value);
            formData.append("position", selectedPosition);
            formData.append("transparency", transparency.value);
            formData.append("textSize", size.value);  // Added
        } else if (activeTab === "image-tab") {
            // Append image tab related data
            if (!imageFile) {
                showAlert("Please select an image file to use as a watermark.", 'danger');
                addWatermarkBtn.disabled = false;
                addWatermarkBtn.innerHTML = 'Add Watermark';
                return;
            }
            formData.append("image", imageFile);
            formData.append("position", selectedPosition);
            formData.append("transparency", transparency.value);
            formData.append("imageSize", size.value);  // Added
        }

        const SERVER_NAME = window.env.PUBLIC_SERVER_URL;

        fetch(`${SERVER_NAME}/api/add-watermark`, {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to add watermark.");
            }
            return response.blob();
        })
        .then(blob => {
            const fileName = generateWatermarkedFileName(pdfFiles[0].name);
            downloadWatermarkedFile(blob, fileName);
        })
        .catch(error => {
            showAlert("An error occurred during watermarking: " + error.message, 'danger');
        })
        .finally(() => {
            addWatermarkBtn.disabled = false;
            addWatermarkBtn.innerHTML = 'Add Watermark';
        });
    }

    function generateWatermarkedFileName(pdfFileName) {
        const baseName = pdfFileName.replace(/\.pdf$/i, "");
        const randomNumber = Math.floor(Math.random() * 9000) + 1000; // Generate a random number between 1000 and 9999
        return `${baseName}_watermarked_${randomNumber}.pdf`;
    }    

    function downloadWatermarkedFile(pdfBlob, fileName) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Watermark added successfully!", 'success');
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

    const imagePositionBoxes = document.querySelectorAll("#imagePosition .position-box");
    imagePositionBoxes.forEach(box => {
        box.addEventListener("click", function() {
            imagePositionBoxes.forEach(box => box.classList.remove("active"));
            this.classList.add("active");
            selectedImagePosition = this.getAttribute("data-position");
        });
    });
});
