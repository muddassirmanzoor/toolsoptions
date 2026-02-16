document.addEventListener("DOMContentLoaded", () => {
    const imageInput = document.getElementById("imageInput");
    const fileList = document.getElementById("fileList");
    const generateIconsBtn = document.getElementById("generateIconsBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");

    let imageFiles = [];

    imageInput.addEventListener("change", handleFileSelection);

    const allowedFormats = ["image/png", "image/jpeg", "image/jpg", "image/x-icon", "image/gif", "image/webp"];


    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        if (imageFiles.length > 0) {
            fileList.innerHTML = "";
            showAlert("Only one image file can be selected at a time. Please remove the current file to select another.", 'warning');
            return;
        }
        files.forEach(file => {
            if (allowedFormats.includes(file.type)) {
                imageFiles.push(file);
                displayImageThumbnail(file);
            } else {
                fileList.innerHTML = "";
                showAlert("Only PNG, JPEG, ICO, GIF, or WEBP image files are allowed.", 'danger');
            }
        });
    }


    function displayImageThumbnail(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Clear the fileList element before adding the new thumbnail
            fileList.innerHTML = "";

            const thumbnailContainer = document.createElement("div");
            thumbnailContainer.classList.add("thumbnail-container", "position-relative");

            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("img-thumbnail", "thumbnail-image");

            const removeBtn = document.createElement("button");
            removeBtn.classList.add("btn", "btn-danger", "btn-sm", "remove-btn", "position-absolute");
            removeBtn.innerHTML = "&times;";
            removeBtn.addEventListener("click", () => removeFile());

            thumbnailContainer.appendChild(img);
            thumbnailContainer.appendChild(removeBtn);
            fileList.appendChild(thumbnailContainer);
        };
        reader.readAsDataURL(file);
    }

    function removeFile() {
        imageFiles = [];
        fileList.innerHTML = "";
    }

    generateIconsBtn.addEventListener("click", generateIcons);

    async function generateIcons() {
        if (imageFiles.length === 0) {
            showAlert("Please add an image file to generate icons.", 'danger');
            return;
        }

        // Get the selected radio button value
        const iconOption = document.querySelector('input[name="iconOptions"]:checked').value;

        // Disable the generate button and show "Please Wait..." with spinner
        generateIconsBtn.disabled = true;
        generateIconsBtn.innerHTML = 'Please Wait... <span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("image", imageFiles[0]);
        formData.append("option", iconOption); // Append the selected option

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/generate-icons`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to generate icons.");
            }

            const blob = await response.blob();
            const originalFileName = imageFiles[0].name.split('.').slice(0, -1).join('.'); // Remove extension
            const zipFileName = `${originalFileName}-icons.zip`; // Append '-icons' to the file name
            downloadIconsZip(blob, zipFileName);
        } catch (error) {
            showAlert("An error occurred during icon generation: " + error.message, 'danger');
            console.error("Icon generation error:", error);
        } finally {
            // Re-enable the generate button and revert to original text
            generateIconsBtn.disabled = false;
            generateIconsBtn.innerHTML = 'Generate Icons';
        }
    }

    function downloadIconsZip(zipBlob, fileName) {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showAlert("Icons generated successfully!", 'success');
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
