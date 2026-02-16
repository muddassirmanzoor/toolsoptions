document.addEventListener("DOMContentLoaded", () => {
    const pdfInput1 = document.getElementById("pdfInput1");
    const fileList1 = document.getElementById("fileList1");
    const pdfInput2 = document.getElementById("pdfInput2");
    const fileList2 = document.getElementById("fileList2");
    const compareBtn = document.getElementById("compareBtn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");

    // Store initial states for reset
    const defaultFileList1HTML = fileList1.innerHTML;
    const defaultFileList2HTML = fileList2.innerHTML;
    const compareBtnInitialText = compareBtn.textContent.trim() || "Download Report";

    let pdfFile1 = null;
    let pdfFile2 = null;

    // Make upload boxes clickable (in addition to labels)
    const uploadBox1 = pdfInput1.closest(".pdf-upload-box");
    const uploadBox2 = pdfInput2.closest(".pdf-upload-box");

    if (uploadBox1) {
        uploadBox1.addEventListener("click", (e) => {
            if (e.target.closest(".delete-icon")) return; // avoid triggering when clicking delete
            pdfInput1.click();
        });
    }

    if (uploadBox2) {
        uploadBox2.addEventListener("click", (e) => {
            if (e.target.closest(".delete-icon")) return;
            pdfInput2.click();
        });
    }

    pdfInput1.addEventListener("change", handleFileSelection1);
    pdfInput2.addEventListener("change", handleFileSelection2);

    function handleFileSelection1(event) {
        const file = event.target.files[0];
        if (pdfFile1) {
            showAlert(
                "Only one file can be selected in this section. Please remove the current file to select another.",
                "warning"
            );
            // Reset the input so the same file can be chosen again if needed
            pdfInput1.value = "";
            return;
        }
        if (file && file.type === "application/pdf") {
            pdfFile1 = file;
            updateFileList(fileList1, file, removeFile1);
        } else if (file) {
            showAlert("Only PDF files are allowed.", "danger");
            pdfInput1.value = "";
        }
    }

    function handleFileSelection2(event) {
        const file = event.target.files[0];
        if (pdfFile2) {
            showAlert(
                "Only one file can be selected in this section. Please remove the current file to select another.",
                "warning"
            );
            pdfInput2.value = "";
            return;
        }
        if (file && file.type === "application/pdf") {
            pdfFile2 = file;
            updateFileList(fileList2, file, removeFile2);
        } else if (file) {
            showAlert("Only PDF files are allowed.", "danger");
            pdfInput2.value = "";
        }
    }

    /**
     * Update the visual thumbnail area in the new design.
     * This replaces the default "upload" state with a PDF card and a delete icon.
     */
    function updateFileList(fileList, file, removeFileFunc) {
        fileList.innerHTML = "";

        const thumbnail = document.createElement("div");
        thumbnail.classList.add("pdf-thumbnail");

        const icon = document.createElement("i");
        icon.classList.add("fa-regular", "fa-file-pdf", "pdf-icon-large");

        const name = document.createElement("span");
        name.classList.add("pdf-file-name");
        name.textContent = file.name;

        const deleteIcon = document.createElement("div");
        deleteIcon.classList.add("delete-icon");
        const delImg = document.createElement("img");
        delImg.src = '/assests/Group 85.png';
        delImg.alt = 'Delete Icon';
        deleteIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFileFunc();
        });
        deleteIcon.appendChild(delImg);

        thumbnail.appendChild(icon);
        thumbnail.appendChild(name);
        thumbnail.appendChild(deleteIcon);

        fileList.appendChild(thumbnail);
    }

    function removeFile1() {
        pdfFile1 = null;
        fileList1.innerHTML = defaultFileList1HTML;
        pdfInput1.value = "";
    }

    function removeFile2() {
        pdfFile2 = null;
        fileList2.innerHTML = defaultFileList2HTML;
        pdfInput2.value = "";
    }

    compareBtn.addEventListener("click", comparePdfs);

    async function comparePdfs() {
        if (!pdfFile1 || !pdfFile2) {
            showAlert("Please add a PDF file to both sections to compare.", "danger");
            return;
        }

        // Disable the compare button and show "Please Wait..." with spinner
        compareBtn.disabled = true;
        compareBtn.innerHTML =
            'Please wait... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        const formData = new FormData();
        formData.append("pdf1", pdfFile1);
        formData.append("pdf2", pdfFile2);

        try {
            const SERVER_NAME = window.env.PUBLIC_SERVER_URL; // Access the server name from config.js
            const response = await fetch(`${SERVER_NAME}/api/compare-pdfs`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to compare PDFs.");
            }

            const blob = await response.blob();
            const fileName = `comparison_result_${Date.now()}.pdf`;
            downloadFile(blob, fileName);
        } catch (error) {
            showAlert("An error occurred during comparison: " + error.message, "danger");
            console.error("Comparison error:", error);
        } finally {
            // Re-enable the compare button and revert to original text
            compareBtn.disabled = false;
            compareBtn.textContent = compareBtnInitialText;
        }
    }

    function downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert("PDFs compared successfully! Downloading result.", "success");
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", `alert-${type}`, "alert-dismissible", "fade", "show");
        alertDiv.setAttribute("role", "alert");

        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="btn-close" aria-label="Close"></button>
        `;

        alertPlaceholder.innerHTML = ""; // Clear any existing alerts
        alertPlaceholder.appendChild(alertDiv);

        const closeBtn = alertDiv.querySelector(".btn-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                alertDiv.remove();
            });
        }

        // Automatically remove the alert after a timeout
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 7000);
    }
});
