// Configure PDF.js worker - try immediately and also on load
(function configurePdfJsWorker() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('PDF.js worker configured');
    } else {
        // Try again when window loads
        window.addEventListener('load', function() {
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('PDF.js worker configured (on load)');
            } else {
                console.error('PDF.js library failed to load');
            }
        });
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    // Define showAlert function first so it can be used everywhere
    function showAlert(message, type) {
        const alertPlaceholder = document.getElementById("alertPlaceholder");
        if (!alertPlaceholder) {
            console.error("Alert placeholder not found");
            alert(message); // Fallback to browser alert
            return;
        }

        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", `alert-${type}`, "alert-dismissible", "fade", "show");
        alertDiv.setAttribute("role", "alert");

        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="btn-close" aria-label="Close"></button>
        `;

        alertPlaceholder.innerHTML = "";
        alertPlaceholder.appendChild(alertDiv);

        const closeBtn = alertDiv.querySelector(".btn-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                alertDiv.remove();
            });
        }

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 7000);
    }

    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library is not loaded. Please check the script tag.');
        showAlert('PDF.js library failed to load. Please refresh the page.', 'danger');
    }
    
    // PDF Elements
    const pdfInput = document.getElementById("pdfInput");
    const pdfCanvas = document.getElementById("pdfCanvas");
    const pageThumbnailsColumn = document.getElementById("pageThumbnailsColumn");
    const documentPreviewArea = document.getElementById("documentPreviewArea");
    const currentPageSpan = document.getElementById("currentPage");
    const totalPagesSpan = document.getElementById("totalPages");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const goToPageDropdown = document.getElementById("goToPageDropdown");
    const pageNumberInput = document.getElementById("pageNumberInput");
    const documentName = document.getElementById("documentName");
    const signPdfBtn = document.getElementById("signPdfBtn");

    // Upload UI Elements (Merge PDF style)
    const initialUploadState = document.getElementById("initialUploadState");
    const fileSelectionButtons = document.getElementById("fileSelectionButtons");
    const selectFilesBtn = document.getElementById("selectFilesBtn");
    const initialGoogleDriveBtn = document.getElementById("initialGoogleDriveBtn");
    const initialDropboxBtn = document.getElementById("initialDropboxBtn");
    const addBtn = document.getElementById("addBtn");
    const computerBtn = document.getElementById("computerBtn");
    const googleDriveBtn = document.getElementById("googleDriveBtn");
    const dropboxBtn = document.getElementById("dropboxBtn");
    const documentPreviewWrapper = document.querySelector('.document-preview-wrapper');

    // Signature Modal Elements
    const signatureModalElement = document.getElementById("signatureModal");
    let signatureModal = null;
    
    // Initialize Bootstrap modal properly
    function initializeModal() {
        if (signatureModalElement) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                // Dispose existing modal if any
                const existingModal = bootstrap.Modal.getInstance(signatureModalElement);
                if (existingModal) {
                    existingModal.dispose();
                }
                signatureModal = new bootstrap.Modal(signatureModalElement, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                console.log('Modal initialized');
            } else {
                console.warn('Bootstrap not loaded, will try again');
                setTimeout(initializeModal, 100);
            }
        }
    }
    
    // Try to initialize immediately
    initializeModal();
    
    // Also try on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModal);
    }
    
    window.addEventListener('load', initializeModal);
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const editSignatureBtn = document.getElementById("editSignatureBtn");
    const editInitialsBtn = document.getElementById("editInitialsBtn");
    const signatureField = document.getElementById("signatureField");
    const initialsField = document.getElementById("initialsField");
    const nameField = document.getElementById("nameField");
    const dateField = document.getElementById("dateField");
    const textField = document.getElementById("textField");
    const companyField = document.getElementById("companyField");
    const editCompanyStampBtn = document.getElementById("editCompanyStampBtn");

    // Signature Creation Elements
    const nameInput = document.getElementById("nameInput");
    const generateBtn = document.getElementById("generateBtn");
    const signatureCanvas = document.getElementById("signatureCanvas");
    const drawCanvas = document.getElementById("drawCanvas");
    const undoBtn = document.getElementById("undoBtn");
    const clearDrawBtn = document.getElementById("clearDrawBtn");
    const imageUpload = document.getElementById("imageUpload");
    const uploadCanvas = document.getElementById("uploadCanvas");
    const undoBtnUpload = document.getElementById("undoBtnUpload");
    const clearUploadBtn = document.getElementById("clearUploadBtn");
    const historyContainer = document.getElementById("historyContainer");
    const applySignatureBtn = document.getElementById("applySignatureBtn");

    // PDF State
    let pdfDoc = null;
    let pdfFile = null;
    let currentPage = 1;
    let scale = 1.0;
    let currentEditingField = null; // Track which field is being edited

    // Signature State
    let signatureData = {
        signature: null,
        initials: null,
        companyStamp: null
    };
    
    // Placed fields on PDF - stores all field types at specific positions
    // Structure: { pageNumber: [{ id, type, dataURL (for signatures), text (for text fields), x, y, width, height }] }
    let placedSignatures = {};
    // Store viewport used when each page was rendered (so Send uses exact same coordinate system)
    let lastRenderedViewports = {};
    
    // Field placement mode - which field type is selected for placement
    let placementMode = null; // 'signature', 'initials', 'name', 'date', 'text'
    let placementData = null; // dataURL for signatures, null for text fields
    
    // Drag state for signature fields
    let draggedSignatureType = null;
    let draggedSignatureData = null;

    // Send to Sign (Several people) state
    let signMode = 'only_me'; // 'only_me' | 'several_people'
    let receivers = [];
    let requestSettings = {
        receiver_order: false, expires_days: 15, reminders_days: 1,
        email_notifications: true, enable_reminders: true, digital_signature: false,
        language: 'en', customize_email: false, uuid: true, verification_code: false,
        email_branding: false, multiple_requests: false
    };
    let whoWillSignShown = false;
    
    // Canvas contexts - declare here so they're available everywhere
    let drawCtx = null;
    let drawHistory = [];
    let isDrawing = false;
    let uploadCtx = null;
    let uploadHistory = [];
    let signatureCtx = null;
    let activeCanvas = null;
    let activeCanvasCtx = null;

    // File input change handler
    if (pdfInput) {
        pdfInput.addEventListener("change", handleFileSelection);
    }

    // Initial state button listeners
    if (selectFilesBtn && pdfInput) {
        selectFilesBtn.addEventListener("click", () => pdfInput.click());
    }
    if (initialGoogleDriveBtn) {
        initialGoogleDriveBtn.addEventListener("click", () => {
            showAlert("Google Drive integration coming soon!", 'primary');
        });
    }
    if (initialDropboxBtn) {
        initialDropboxBtn.addEventListener("click", () => {
            showAlert("Dropbox integration coming soon!", 'primary');
        });
    }

    // File selection buttons (shown after file is selected)
    if (addBtn && pdfInput) {
        addBtn.addEventListener("click", () => pdfInput.click());
    }
    if (computerBtn && pdfInput) {
        computerBtn.addEventListener("click", () => pdfInput.click());
    }
    if (googleDriveBtn) {
        googleDriveBtn.addEventListener("click", () => {
            showAlert("Google Drive integration coming soon!", 'primary');
        });
    }
    if (dropboxBtn) {
        dropboxBtn.addEventListener("click", () => {
            showAlert("Dropbox integration coming soon!", 'primary');
        });
    }

    // Drag and drop for initial upload area
    if (initialUploadState) {
        initialUploadState.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.add('drag-over');
        });

        initialUploadState.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.remove('drag-over');
        });

        initialUploadState.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            initialUploadState.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                const pdfFile = files.find(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf'));
                if (pdfFile) {
                    handlePdfFile(pdfFile);
                } else {
                    showAlert("Please drop a valid PDF file.", "danger");
                }
            }
        });
    }

    function handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            handlePdfFile(file);
        }
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }

    // Helper function to handle PDF file
    async function handlePdfFile(file) {
        if (!file) {
            return;
        }

        // Check file type
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
            showAlert("Please select a valid PDF file.", "danger");
            return;
        }

        pdfFile = file;
        whoWillSignShown = false;
        if (documentName) {
            documentName.textContent = file.name;
        }

        // Update UI state - hide initial upload, show file selection buttons
        updateUIState(true);

        // Show loading state
        if (documentPreviewArea) {
            documentPreviewArea.style.display = "flex";
            documentPreviewArea.innerHTML = `
                <div class="upload-prompt" style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p style="margin-top: 10px;">Loading PDF...</p>
                </div>
            `;
        }

        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }

            const fileReader = new FileReader();
            fileReader.onload = async function(e) {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    
                    currentPage = 1;
                    if (totalPagesSpan) {
                        totalPagesSpan.textContent = pdfDoc.numPages;
                    }
                    updatePageNavigation();
                    await renderPageThumbnails();
                    await renderCurrentPage();
                    // Show "Who will sign?" modal once per file
                    showWhoWillSignModal();
                } catch (error) {
                    console.error("Error parsing PDF:", error);
                    showAlert("Failed to parse PDF. The file may be corrupted.", "danger");
                    resetUploadArea();
                }
            };
            fileReader.onerror = () => {
                showAlert("Failed to read file. Please try again.", "danger");
                resetUploadArea();
            };
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Error loading PDF:", error);
            showAlert("Failed to load PDF. Please try again.", "danger");
            resetUploadArea();
        }
    }

    // Helper function to update UI state
    function updateUIState(hasFile) {
        if (hasFile) {
            // Hide initial state, show file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'none';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'flex';
            if (documentPreviewWrapper) documentPreviewWrapper.classList.add('has-file');
            if (pageThumbnailsColumn) pageThumbnailsColumn.style.display = 'flex';
        } else {
            // Show initial state, hide file selection buttons
            if (initialUploadState) initialUploadState.style.display = 'flex';
            if (fileSelectionButtons) fileSelectionButtons.style.display = 'none';
            if (documentPreviewWrapper) documentPreviewWrapper.classList.remove('has-file');
            if (pageThumbnailsColumn) pageThumbnailsColumn.style.display = 'none';
            if (documentPreviewArea) documentPreviewArea.style.display = 'none';
        }
    }

    // Helper function to reset upload area
    function resetUploadArea() {
        pdfFile = null;
        pdfDoc = null;
        currentPage = 1;
        updateUIState(false);
        if (pdfInput) {
            pdfInput.value = "";
        }
        if (pdfCanvas) {
            pdfCanvas.style.display = "none";
        }
        if (pageThumbnailsColumn) {
            pageThumbnailsColumn.innerHTML = "";
        }
        if (documentName) {
            documentName.textContent = "No file selected";
        }
        if (totalPagesSpan) {
            totalPagesSpan.textContent = "1";
        }
        if (currentPageSpan) {
            currentPageSpan.textContent = "1";
        }
        updatePageNavigation();
        signMode = 'only_me';
        receivers = [];
        whoWillSignShown = false;
        const signPdfBtnEl = document.getElementById("signPdfBtn");
        const sendToSignBtnEl = document.getElementById("sendToSignBtn");
        if (signPdfBtnEl) signPdfBtnEl.style.display = '';
        if (sendToSignBtnEl) sendToSignBtnEl.style.display = 'none';
    }

    // Who will sign? modal and Create request modal
    function showWhoWillSignModal() {
        if (whoWillSignShown) return;
        whoWillSignShown = true;
        const docNameEl = document.getElementById("whoSignDocName");
        if (docNameEl && pdfFile) docNameEl.textContent = pdfFile.name || 'Document';
        const whoModalEl = document.getElementById("whoWillSignModal");
        if (whoModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const whoModal = new bootstrap.Modal(whoModalEl, { backdrop: true, keyboard: true });
            whoModal.show();
        }
    }
    const whoSignOnlyMeBtn = document.getElementById("whoSignOnlyMeBtn");
    const whoSignSeveralBtn = document.getElementById("whoSignSeveralBtn");
    const whoWillSignModalEl = document.getElementById("whoWillSignModal");
    const createRequestModalEl = document.getElementById("createRequestModal");
    const createRequestApplyBtn = document.getElementById("createRequestApplyBtn");
    const addReceiverBtn = document.getElementById("addReceiverBtn");
    const receiversContainer = document.getElementById("receiversContainer");
    const sendToSignBtn = document.getElementById("sendToSignBtn");
    if (whoSignOnlyMeBtn) {
        whoSignOnlyMeBtn.addEventListener("click", function() {
            signMode = 'only_me';
            if (whoWillSignModalEl && bootstrap.Modal) {
                const m = bootstrap.Modal.getInstance(whoWillSignModalEl);
                if (m) m.hide();
            }
            if (signPdfBtn) signPdfBtn.style.display = '';
            if (sendToSignBtn) sendToSignBtn.style.display = 'none';
        });
    }
    if (whoSignSeveralBtn) {
        whoSignSeveralBtn.addEventListener("click", function() {
            if (whoWillSignModalEl && bootstrap.Modal) {
                const m = bootstrap.Modal.getInstance(whoWillSignModalEl);
                if (m) m.hide();
            }
            if (createRequestModalEl && bootstrap.Modal) {
                const createModal = new bootstrap.Modal(createRequestModalEl, { backdrop: true, keyboard: true });
                createModal.show();
            }
        });
    }
    if (addReceiverBtn && receiversContainer) {
        addReceiverBtn.addEventListener("click", function() {
            const first = receiversContainer.querySelector(".receiver-row");
            if (!first) return;
            const clone = first.cloneNode(true);
            clone.querySelectorAll("input, select").forEach(function(inp) { inp.value = ""; });
            receiversContainer.appendChild(clone);
        });
    }
    if (receiversContainer) {
        receiversContainer.addEventListener("click", function(e) {
            if (e.target.closest(".remove-receiver")) {
                const row = e.target.closest(".receiver-row");
                if (row && receiversContainer.querySelectorAll(".receiver-row").length > 1) row.remove();
            }
        });
        receiversContainer.addEventListener("input", function(e) {
            if (e.target && e.target.classList && e.target.classList.contains("receiver-email")) e.target.classList.remove("is-invalid");
            if (e.target && (e.target.closest(".receiver-name") || e.target.closest(".receiver-email"))) updateCreateRequestApplyState();
        });
        receiversContainer.addEventListener("change", function(e) {
            if (e.target && e.target.classList && e.target.classList.contains("receiver-email")) e.target.classList.remove("is-invalid");
            if (e.target && (e.target.closest(".receiver-name") || e.target.closest(".receiver-email"))) updateCreateRequestApplyState();
        });
        receiversContainer.addEventListener("focusout", function(e) {
            var el = e.target;
            if (!el || !el.classList || !el.classList.contains("receiver-email")) return;
            var val = (el.value || "").trim();
            if (val && !isValidEmail(val)) el.classList.add("is-invalid");
            else el.classList.remove("is-invalid");
            updateCreateRequestApplyState();
        });
        receiversContainer.addEventListener("click", function(e) {
            if (e.target.closest(".remove-receiver")) {
                setTimeout(function() { updateCreateRequestApplyState(); }, 0);
            }
        }, true);
    }
    function isValidEmail(email) {
        if (!email || typeof email !== "string") return false;
        var trimmed = email.trim();
        if (!trimmed) return false;
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(trimmed);
    }
    function updateCreateRequestApplyState() {
        if (!createRequestApplyBtn || !receiversContainer) return;
        var rows = receiversContainer.querySelectorAll(".receiver-row");
        var hasValidReceiver = false;
        var hasInvalidEmail = false;
        rows.forEach(function(row) {
            var nameEl = row.querySelector(".receiver-name");
            var emailEl = row.querySelector(".receiver-email");
            var name = nameEl ? (nameEl.value || "").trim() : "";
            var email = emailEl ? (emailEl.value || "").trim() : "";
            if (email && !isValidEmail(email)) hasInvalidEmail = true;
            if (name && email && isValidEmail(email)) hasValidReceiver = true;
        });
        createRequestApplyBtn.disabled = !hasValidReceiver || hasInvalidEmail;
    }
    if (createRequestApplyBtn && createRequestModalEl) {
        createRequestApplyBtn.addEventListener("click", function() {
            const rows = receiversContainer.querySelectorAll(".receiver-row");
            receivers = [];
            var firstInvalidRow = null;
            rows.forEach(function(row) {
                var nameEl = row.querySelector(".receiver-name");
                var emailEl = row.querySelector(".receiver-email");
                var roleEl = row.querySelector(".receiver-role");
                var name = nameEl ? (nameEl.value || "").trim() : "";
                var email = emailEl ? (emailEl.value || "").trim() : "";
                var role = roleEl ? (roleEl.value || "signer") : "signer";
                if (name && email) {
                    if (!isValidEmail(email)) {
                        if (!firstInvalidRow) firstInvalidRow = { row: row, email: email };
                    } else {
                        receivers.push({ name: name, email: email, role: role });
                    }
                }
            });
            if (firstInvalidRow) {
                alert('Please enter a valid email address. "' + (firstInvalidRow.email || "").replace(/"/g, "'") + '" is not valid (e.g. use name@gmail.com with a dot before com).');
                if (firstInvalidRow.row) {
                    var emailInput = firstInvalidRow.row.querySelector(".receiver-email");
                    if (emailInput) { emailInput.focus(); emailInput.classList.add("is-invalid"); }
                }
                return;
            }
            if (receivers.length === 0) {
                alert("Please add at least one receiver with name and email.");
                return;
            }
            var expDaysEl = document.getElementById("settingExpiresDays");
            var changeExpiryEl = document.getElementById("settingChangeExpiry");
            var expDays = changeExpiryEl && changeExpiryEl.checked && expDaysEl
                ? (parseInt(expDaysEl.value || "15", 10) || 15) : 15;
            var enableReminders = document.getElementById("settingEnableReminders") ? document.getElementById("settingEnableReminders").checked : true;
            var remindersDaysEl = document.getElementById("settingRemindersDays");
            requestSettings = {
                receiver_order: document.getElementById("settingReceiverOrder") ? document.getElementById("settingReceiverOrder").checked : false,
                expires_days: expDays,
                reminders_days: enableReminders && remindersDaysEl ? (parseInt(remindersDaysEl.value || "1", 10) || 1) : 0,
                email_notifications: document.getElementById("settingEmailNotifications") ? document.getElementById("settingEmailNotifications").checked : true,
                enable_reminders: document.getElementById("settingEnableReminders") ? document.getElementById("settingEnableReminders").checked : true,
                digital_signature: document.getElementById("settingDigitalSignature") ? document.getElementById("settingDigitalSignature").checked : false,
                language: (document.getElementById("settingLanguage") || {}).value || 'en',
                customize_email: document.getElementById("settingCustomizeEmail") ? document.getElementById("settingCustomizeEmail").checked : false,
                uuid: document.getElementById("settingUuid") ? document.getElementById("settingUuid").checked : true,
                verification_code: document.getElementById("settingVerificationCode") ? document.getElementById("settingVerificationCode").checked : false,
                email_branding: document.getElementById("settingEmailBranding") ? document.getElementById("settingEmailBranding").checked : false,
                multiple_requests: document.getElementById("settingMultipleRequests") ? document.getElementById("settingMultipleRequests").checked : false
            };
            var modalInstance = createRequestModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal ? bootstrap.Modal.getInstance(createRequestModalEl) : null;
            if (modalInstance) {
                var focusTarget = document.querySelector("main.main-content") || document.body;
                if (focusTarget && !focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
                if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
                modalInstance.hide();
            }
            signMode = 'several_people';
            if (signPdfBtn) signPdfBtn.style.display = 'none';
            if (sendToSignBtn) {
                sendToSignBtn.style.display = '';
                sendToSignBtn.disabled = true;
                sendToSignBtn.style.opacity = '0.6';
                sendToSignBtn.style.cursor = 'not-allowed';
            }
            updateSendToSignButtonState();
            if (pdfDoc && document.querySelector('.pdf-canvas-container')) renderCurrentPage();
        });
    }
    // Expiry date labels
    const settingExpiresDaysEl = document.getElementById("settingExpiresDays");
    const expiryDaysLabelEl = document.getElementById("expiryDaysLabel");
    const expiresOnLabelEl = document.getElementById("expiresOnLabel");
    const settingChangeExpiryEl = document.getElementById("settingChangeExpiry");
    function updateExpiryLabels() {
        if (expiryDaysLabelEl && settingExpiresDaysEl) expiryDaysLabelEl.textContent = settingExpiresDaysEl.value || "15";
        if (expiresOnLabelEl && settingExpiresDaysEl) {
            const days = parseInt(settingExpiresDaysEl.value || "15", 10) || 15;
            const d = new Date();
            d.setDate(d.getDate() + days);
            expiresOnLabelEl.textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    }
    if (settingExpiresDaysEl) settingExpiresDaysEl.addEventListener("input", updateExpiryLabels);
    if (settingChangeExpiryEl) settingChangeExpiryEl.addEventListener("change", updateExpiryLabels);
    if (createRequestModalEl) {
        createRequestModalEl.addEventListener("show.bs.modal", function() {
            updateExpiryLabels();
            updateCreateRequestApplyState();
        });
    }
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function(el) {
            new bootstrap.Tooltip(el);
        });
    }
    if (sendToSignBtn) {
        sendToSignBtn.addEventListener("click", async function() {
            if (!pdfFile) {
                showAlert("Please upload a PDF file first.", "warning");
                return;
            }
            if (receivers.length === 0) {
                showAlert("Please add at least one receiver (Apply in Create signature request).", "warning");
                return;
            }
            var invalidReceiver = receivers.find(function(r) { return !(r && r.email && isValidEmail(r.email)); });
            if (invalidReceiver) {
                showAlert('Invalid email address: "' + (invalidReceiver.email || "").replace(/"/g, "'") + '". Use a valid format (e.g. name@gmail.com with a dot before com).', "warning");
                return;
            }
            if (!placedSignatures || Object.keys(placedSignatures).length === 0) {
                showAlert("Please place at least one signature field on the PDF.", "warning");
                return;
            }
            var apiBase = (typeof window !== 'undefined' && window.env && window.env.APP_URL) ? String(window.env.APP_URL).replace(/\/$/, '') : '';
            if (!apiBase && typeof window !== 'undefined' && window.location) {
                var loc = window.location;
                apiBase = loc.protocol + '//' + loc.hostname + (loc.port === '3000' ? ':8000' : (loc.port ? ':' + loc.port : ''));
            }
            const url = apiBase + '/api/signature-requests';
            const formData = new FormData();
            formData.append("document_name", pdfFile.name || "document.pdf");
            formData.append("file", pdfFile);
            formData.append("receivers", JSON.stringify(receivers));
            formData.append("settings", JSON.stringify(requestSettings));
            const fieldPositions = {};
            if (placedSignatures && typeof placedSignatures === 'object' && pdfDoc) {
                try {
                    for (const [pageNum, fields] of Object.entries(placedSignatures)) {
                        if (!Array.isArray(fields)) continue;
                        const page = await pdfDoc.getPage(Number(pageNum) - 1);
                        const viewport1 = page.getViewport({ scale: 1.0 });
                        const pageWidthPt = viewport1.width;
                        const pageHeightPt = viewport1.height;
                        // Use the exact viewport dimensions from when this page was rendered (when fields were placed)
                        // so PDF coordinates match the tools view; fallback to current container size if never rendered
                        var containerW, containerH;
                        var stored = lastRenderedViewports[Number(pageNum)];
                        if (stored && stored.scaledWidth > 0 && stored.scaledHeight > 0) {
                            containerW = stored.scaledWidth;
                            containerH = stored.scaledHeight;
                        } else {
                            var canvasContainerEl = documentPreviewArea && documentPreviewArea.querySelector('.pdf-canvas-container');
                            var usedWidth = canvasContainerEl ? (canvasContainerEl.clientWidth || canvasContainerEl.offsetWidth) : 0;
                            var usedHeight = canvasContainerEl ? (canvasContainerEl.clientHeight || canvasContainerEl.offsetHeight) : 0;
                            if (!usedWidth) usedWidth = documentPreviewArea ? (documentPreviewArea.clientWidth || documentPreviewArea.offsetWidth) - 16 : 800;
                            var maxWidth = Math.min(usedWidth, 1200);
                            var calculatedScale = Math.min(maxWidth / pageWidthPt, 2.0);
                            var scaledViewport = page.getViewport({ scale: calculatedScale });
                            containerW = usedWidth || scaledViewport.width;
                            containerH = (usedHeight && usedHeight > 0) ? usedHeight : scaledViewport.height;
                        }
                        const scaleX = pageWidthPt / containerW;
                        const scaleY = pageHeightPt / containerH;
                        fieldPositions[String(pageNum)] = fields.map(function(f) {
                            const w = f.width || 200;
                            const h = f.height || 60;
                            // Always compute PDF coords from current field.x, field.y (viewport pixels)
                            // so the last position set by user (including after drag) is what gets sent.
                            const pdfX = f.x * scaleX;
                            const pdfY = pageHeightPt - (f.y * scaleY) - (h * scaleY);
                            const pdfW = w * scaleX;
                            const pdfH = h * scaleY;
                            return {
                                type: f.type,
                                x: f.x,
                                y: f.y,
                                width: w,
                                height: h,
                                pdfX: Math.round(pdfX * 100) / 100,
                                pdfY: Math.round(pdfY * 100) / 100,
                                pdfWidth: Math.round(pdfW * 100) / 100,
                                pdfHeight: Math.round(pdfH * 100) / 100
                            };
                        });
                    }
                } catch (e) {
                    console.warn("Could not compute PDF coords for fields:", e);
                    for (const [pageNum, fields] of Object.entries(placedSignatures)) {
                        if (!Array.isArray(fields)) continue;
                        fieldPositions[String(pageNum)] = fields.map(function(f) {
                            return { type: f.type, x: f.x, y: f.y, width: f.width || 200, height: f.height || 60 };
                        });
                    }
                }
            }
            formData.append("field_positions", JSON.stringify(fieldPositions));
            sendToSignBtn.disabled = true;
            sendToSignBtn.innerHTML = 'Sending... <span class="spinner-border spinner-border-sm" role="status"></span>';
            try {
                const resp = await fetch(url, {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                    headers: { "X-Requested-With": "XMLHttpRequest" }
                });
                const data = await resp.json().catch(function() { return {}; });
                // 402 = Payment Required: user is logged in but has no active subscription → show Upgrade to Premium popup
                var paymentRequired = resp.status === 402 || (data && data.payment_required === true);
                if (resp.ok && data.redirect_url && !paymentRequired) {
                    window.location.href = data.redirect_url;
                    return;
                }
                if (resp.status === 401) {
                    var loginBase = (typeof window !== 'undefined' && window.env && window.env.APP_URL) ? String(window.env.APP_URL).replace(/\/$/, '') : '';
                    if (!loginBase && typeof window !== 'undefined' && window.location) {
                        var loc = window.location;
                        loginBase = loc.protocol + '//' + loc.hostname + (loc.port === '3000' ? ':8000' : (loc.port ? ':' + loc.port : ''));
                    }
                    window.location.href = (loginBase ? loginBase + '/login' : '/login');
                    return;
                }
                if (paymentRequired) {
                    // Ensure Upgrade to Premium popup is shown when payment not paid (402)
                    function showUpgradeModal() {
                        var upgradeModalEl = document.getElementById("upgradePremiumModalSignature");
                        var modalShown = false;
                        if (upgradeModalEl) {
                            document.body.classList.add("modal-open");
                            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                                try {
                                    var existingModal = bootstrap.Modal.getInstance(upgradeModalEl);
                                    var upgradeModal = existingModal || new bootstrap.Modal(upgradeModalEl, { backdrop: true, keyboard: true });
                                    upgradeModal.show();
                                    modalShown = true;
                                } catch (e) {
                                    console.warn("Bootstrap modal error:", e);
                                }
                            }
                            if (!modalShown) {
                                upgradeModalEl.classList.add("show");
                                upgradeModalEl.style.display = "block";
                                upgradeModalEl.style.position = "fixed";
                                upgradeModalEl.style.top = "0";
                                upgradeModalEl.style.left = "0";
                                upgradeModalEl.style.width = "100%";
                                upgradeModalEl.style.height = "100%";
                                upgradeModalEl.style.zIndex = "1050";
                                upgradeModalEl.style.background = "transparent";
                                upgradeModalEl.setAttribute("aria-hidden", "false");
                                var backdrop = document.getElementById("upgradeModalBackdropSignature");
                                if (!backdrop) {
                                    backdrop = document.createElement("div");
                                    backdrop.id = "upgradeModalBackdropSignature";
                                    backdrop.className = "modal-backdrop fade show";
                                    backdrop.style.cssText = "position:fixed;top:0;left:0;z-index:1040;width:100%;height:100%;background:rgba(0,0,0,0.5);";
                                    document.body.appendChild(backdrop);
                                }
                                backdrop.style.display = "block";
                                modalShown = true;
                            }
                        }
                        if (!modalShown) {
                            showAlert("Upgrade to Premium to send signature requests.", "warning");
                        }
                    }
                    requestAnimationFrame(function() { requestAnimationFrame(showUpgradeModal); });
                    return;
                }
                showAlert(data.message || "Failed to send. Please try again.", "danger");
            } catch (err) {
                console.error(err);
                showAlert("Network error. Please try again.", "danger");
            } finally {
                sendToSignBtn.disabled = false;
                sendToSignBtn.innerHTML = "Send to Sign";
            }
        });
    }

    // Upgrade to Premium modal (same behaviour as team/plans view)
    (function initUpgradePremiumModalSignature() {
        const modalEl = document.getElementById("upgradePremiumModalSignature");
        if (!modalEl) return;
        var pricingPlans = modalEl.querySelectorAll(".pricing-plan-modal");
        pricingPlans.forEach(function(plan) {
            plan.addEventListener("click", function() {
                pricingPlans.forEach(function(p) {
                    p.classList.remove("active");
                    p.style.borderColor = "#ddd";
                });
                this.classList.add("active");
                this.style.borderColor = "#ff702a";
            });
        });
        var paypalBtn = document.getElementById("paypalPaymentBtnSignature");
        if (paypalBtn) {
            paypalBtn.addEventListener("click", function() {
                var activePlan = modalEl.querySelector(".pricing-plan-modal.active");
                var selectedPlan = (activePlan && activePlan.dataset && activePlan.dataset.plan) ? activePlan.dataset.plan : "monthly";
                var base = (typeof window !== "undefined" && window.env && window.env.APP_URL) ? window.env.APP_URL.replace(/\/$/, "") : "";
                var plansUrl = base ? (base + "/plans") : "/plans";
                if (window.confirm("PayPal payment integration is available on the Plans page. Open Plans page to upgrade?")) {
                    window.location.href = plansUrl;
                }
            });
        }
        var allFeaturesLink = document.getElementById("upgradeModalAllFeaturesLink");
        if (allFeaturesLink) {
            allFeaturesLink.addEventListener("click", function(e) {
                e.preventDefault();
                var base = (typeof window !== "undefined" && window.env && window.env.APP_URL) ? window.env.APP_URL.replace(/\/$/, "") : "";
                var plansUrl = base ? (base + "/plans") : "/plans";
                window.location.href = plansUrl;
            });
        }
    })();

    // Page Navigation
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
                updatePageNavigation();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            if (pdfDoc && currentPage < pdfDoc.numPages) {
                currentPage++;
                renderCurrentPage();
                updatePageNavigation();
            }
        });
    }

    // Go to Page Dropdown
    if (goToPageDropdown && pageNumberInput) {
        goToPageDropdown.addEventListener("click", () => {
            if (pageNumberInput.style.display === "none" || !pageNumberInput.style.display) {
                pageNumberInput.style.display = "inline-block";
                pageNumberInput.value = currentPage;
                pageNumberInput.max = pdfDoc ? pdfDoc.numPages : 1;
                pageNumberInput.focus();
                goToPageDropdown.style.display = "none";
            }
        });

        pageNumberInput.addEventListener("blur", () => {
            const pageNum = parseInt(pageNumberInput.value);
            if (pageNum >= 1 && pageNum <= (pdfDoc ? pdfDoc.numPages : 1)) {
                currentPage = pageNum;
                renderCurrentPage();
                updatePageNavigation();
            }
            pageNumberInput.style.display = "none";
            goToPageDropdown.style.display = "flex";
        });

        pageNumberInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                pageNumberInput.blur();
            }
        });
    }

    async function renderCurrentPage() {
        if (!pdfDoc || !pdfCanvas || !documentPreviewArea) return;

        try {
            const page = await pdfDoc.getPage(currentPage);
            const container = documentPreviewArea;
            // Calculate container width with minimal padding
            const containerWidth = container ? (container.clientWidth || container.offsetWidth) - 16 : 800;
            const maxWidth = Math.min(containerWidth, 1200);
            
            // Get initial viewport
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Calculate scale to fit container width while maintaining aspect ratio
            const calculatedScale = Math.min(maxWidth / viewport.width, 2.0);
            const scaledViewport = page.getViewport({ scale: calculatedScale });
            
            // Set canvas dimensions (device pixel ratio for crisp rendering)
            const outputScale = window.devicePixelRatio || 1;
            pdfCanvas.width = Math.floor(scaledViewport.width * outputScale);
            pdfCanvas.height = Math.floor(scaledViewport.height * outputScale);
            
            // Set CSS display size - remove extra spacing
            pdfCanvas.style.width = scaledViewport.width + 'px';
            pdfCanvas.style.height = 'auto';
            pdfCanvas.style.display = "block";
            pdfCanvas.style.maxWidth = "100%";
            pdfCanvas.style.margin = "0 auto";
            pdfCanvas.style.padding = "0";

            const ctx = pdfCanvas.getContext("2d");
            ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
            ctx.scale(outputScale, outputScale);

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            await page.render(renderContext).promise;
            
            // Render placed signatures on this page (async)
            await renderPlacedSignatures(ctx, scaledViewport, outputScale);

            // Update preview area - minimize padding
            documentPreviewArea.innerHTML = '';
            documentPreviewArea.style.padding = "8px";
            documentPreviewArea.style.alignItems = "flex-start";
            documentPreviewArea.style.justifyContent = "center";
            
            // Store viewport for this page so Send uses exact same coordinate system
            lastRenderedViewports[currentPage] = {
                pageWidthPt: viewport.width,
                pageHeightPt: viewport.height,
                scaledWidth: scaledViewport.width,
                scaledHeight: scaledViewport.height
            };
            // Create container for PDF canvas and signature overlays
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'pdf-canvas-container';
            canvasContainer.style.position = 'relative';
            canvasContainer.style.display = 'inline-block';
            canvasContainer.style.width = scaledViewport.width + 'px';
            canvasContainer.style.height = scaledViewport.height + 'px';
            
            canvasContainer.appendChild(pdfCanvas);
            documentPreviewArea.appendChild(canvasContainer);
            documentPreviewArea.style.position = 'relative';
            documentPreviewArea.style.display = "flex";
            documentPreviewArea.scrollTop = 0;
            documentPreviewArea.scrollLeft = 0;

            if (signMode === 'several_people') {
                const overlayEl = document.createElement('div');
                overlayEl.id = 'signatureInstructionOverlay';
                overlayEl.className = 'signature-instruction-overlay';
                overlayEl.innerHTML = '<p class="mb-0">Drag and drop the signature fields onto the document. The signers will need to fill these fields.</p>';
                const totalFields = Object.values(placedSignatures || {}).reduce(function (s, arr) { return s + (Array.isArray(arr) ? arr.length : 0); }, 0);
                overlayEl.style.display = totalFields === 0 ? 'block' : 'none';
                documentPreviewArea.appendChild(overlayEl);
            }

            if (currentPageSpan) {
                currentPageSpan.textContent = currentPage;
            }
            updateActiveThumbnail();
            
            // Set up drop zone
            setupCanvasDropZone(canvasContainer, scaledViewport, outputScale);
            
            // Create overlay divs for placed signatures (for dragging)
            setTimeout(() => {
                makePlacedSignaturesDraggable(canvasContainer, scaledViewport, outputScale);
            }, 100);
        } catch (error) {
            console.error("Error rendering page:", error);
            showAlert("Failed to render PDF page: " + error.message, "danger");
            if (documentPreviewArea) {
                documentPreviewArea.style.display = "flex";
            }
            if (pdfCanvas) {
                pdfCanvas.style.display = "none";
            }
        }
    }

    async function renderPageThumbnails() {
        if (!pdfDoc || !pageThumbnailsColumn) return;

        pageThumbnailsColumn.innerHTML = "";

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const thumbnail = document.createElement("div");
            thumbnail.className = `page-thumbnail-small ${i === currentPage ? 'active' : ''}`;
            thumbnail.addEventListener("click", () => {
                currentPage = i;
                renderCurrentPage();
                updatePageNavigation();
            });

            const canvas = document.createElement("canvas");
            thumbnail.appendChild(canvas);

            try {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.2 });
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: canvas.getContext("2d"),
                    viewport: viewport
                };

                await page.render(renderContext).promise;
            } catch (error) {
                console.error(`Error rendering thumbnail for page ${i}:`, error);
            }

            pageThumbnailsColumn.appendChild(thumbnail);
        }
    }

    function updateActiveThumbnail() {
        if (!pageThumbnailsColumn) return;
        const thumbnails = pageThumbnailsColumn.querySelectorAll(".page-thumbnail-small");
        thumbnails.forEach((thumb, index) => {
            if (index + 1 === currentPage) {
                thumb.classList.add("active");
            } else {
                thumb.classList.remove("active");
            }
        });
    }

    function updatePageNavigation() {
        if (!pdfDoc) {
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            return;
        }

        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= pdfDoc.numPages;
    }
    
    // Render placed signatures on PDF canvas (for visual display only)
    // Actual signatures will be rendered as overlay divs for dragging
    async function renderPlacedSignatures(ctx, viewport, outputScale) {
        // Signatures are now rendered as overlay divs, not on canvas
        // This function is kept for compatibility but doesn't draw on canvas
        // The overlay rendering is handled by makePlacedSignaturesDraggable
        return;
    }
    
    // Setup drop zone on PDF canvas to place signatures
    let currentDropZoneSetup = null;
    
    function setupCanvasDropZone(canvasContainer, viewport, outputScale) {
        if (!canvasContainer) return;
        
        // Remove previous setup if exists
        if (currentDropZoneSetup && currentDropZoneSetup.container) {
            currentDropZoneSetup.container.removeEventListener('dragover', currentDropZoneSetup.dragOver);
            currentDropZoneSetup.container.removeEventListener('drop', currentDropZoneSetup.drop);
            currentDropZoneSetup.container.removeEventListener('dragleave', currentDropZoneSetup.dragLeave);
        }
        
        // Create handler functions
        const dragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedSignatureType && draggedSignatureData) {
                canvasContainer.style.border = '2px dashed var(--color-primary-purple)';
                canvasContainer.style.backgroundColor = 'rgba(90, 38, 239, 0.05)';
                canvasContainer.style.cursor = 'copy';
                if (documentPreviewArea) {
                    documentPreviewArea.scrollTop = 0;
                    documentPreviewArea.scrollLeft = 0;
                }
            }
        };
        
        const dragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove highlight if we're actually leaving the container
            if (!canvasContainer.contains(e.relatedTarget)) {
                canvasContainer.style.border = '';
                canvasContainer.style.backgroundColor = '';
                canvasContainer.style.cursor = '';
            }
        };
        
        const drop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            canvasContainer.style.border = '';
            canvasContainer.style.backgroundColor = '';
            canvasContainer.style.cursor = '';
            
            // Try to get data from drag transfer
            const dragData = e.dataTransfer.getData('application/json');
            if (dragData) {
                try {
                    const data = JSON.parse(dragData);
                    draggedSignatureType = data.type;
                    draggedSignatureData = data.dataURL;
                } catch (err) {
                    console.error("Error parsing drag data:", err);
                }
            }
            
            // Check global drag state (set in dragstart) or use fallback from dataTransfer
            if (!draggedSignatureType || !draggedSignatureData) {
                // Fallback: use stored signature data from fields
                const dragType = e.dataTransfer.getData('text/plain');
                if (dragType === 'signature' && signatureData.signature) {
                    draggedSignatureType = 'signature';
                    draggedSignatureData = signatureData.signature;
                    console.log("Using signature data from signatureData.signature");
                } else if (dragType === 'initials' && signatureData.initials) {
                    draggedSignatureType = 'initials';
                    draggedSignatureData = signatureData.initials;
                    console.log("Using initials data from signatureData.initials");
                } else {
                    console.error("No signature data available for drag. Type:", dragType);
                    showAlert("Please create a signature first, then drag it to the PDF.", "warning");
                    return;
                }
            }
            
            // Scroll to top so drop position matches signer view, then place (next frame so layout is updated)
            if (documentPreviewArea) {
                documentPreviewArea.scrollTop = 0;
                documentPreviewArea.scrollLeft = 0;
            }
            const dropX = e.clientX, dropY = e.clientY;
            const dropType = draggedSignatureType, dropData = draggedSignatureData;
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    placeFieldOnPdf(dropX, dropY, dropType, dropData, canvasContainer);
                });
            });

            // Reset drag state after a delay
            setTimeout(() => {
                draggedSignatureType = null;
                draggedSignatureData = null;
            }, 500);
        };
        
        // Click handler removed - fields are now auto-placed when clicked
        // Users can still drag and drop fields if needed
        
        // Add event listeners
        canvasContainer.addEventListener('dragover', dragOver);
        canvasContainer.addEventListener('drop', drop);
        canvasContainer.addEventListener('dragleave', dragLeave);
        
        // Store setup for cleanup
        currentDropZoneSetup = {
            container: canvasContainer,
            dragOver: dragOver,
            drop: drop,
            dragLeave: dragLeave
        };
    }
    
    // Place field on PDF (for signatures/initials with images). Computes PDF coords from actual container rect so guest shows correct position.
    async function placeFieldOnPdf(clientX, clientY, fieldType, dataURL, canvasContainer) {
        if (!pdfCanvas) {
            showAlert("Please load a PDF first.", "warning");
            return;
        }
        
        const containerRect = canvasContainer.getBoundingClientRect();
        let x = clientX - containerRect.left;
        let y = clientY - containerRect.top;
        x = Math.max(0, Math.min(x, containerRect.width - 1));
        y = Math.max(0, Math.min(y, containerRect.height - 1));
        
        // Default signature size (in viewport pixels)
        const sigWidth = 200;
        const sigHeight = 60;
        
        // Store placed field (coordinates in viewport space)
        if (!placedSignatures[currentPage]) {
            placedSignatures[currentPage] = [];
        }
        
        const fieldId = `${fieldType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const field = {
            id: fieldId,
            type: fieldType,
            dataURL: dataURL || null,
            placeholder: !dataURL || dataURL.length < 50,
            x: x,
            y: y,
            width: sigWidth,
            height: sigHeight
        };
        placedSignatures[currentPage].push(field);
        
        // Compute PDF coordinates using the same container rect we measured (so position matches tools view)
        try {
            const page = await pdfDoc.getPage(currentPage - 1);
            const vp = page.getViewport({ scale: 1.0 });
            const pageWidthPt = vp.width;
            const pageHeightPt = vp.height;
            const scaleX = pageWidthPt / containerRect.width;
            const scaleY = pageHeightPt / containerRect.height;
            field.pdfX = Math.round((x * scaleX) * 100) / 100;
            field.pdfY = Math.round((pageHeightPt - (y * scaleY) - (sigHeight * scaleY)) * 100) / 100;
            field.pdfWidth = Math.round((sigWidth * scaleX) * 100) / 100;
            field.pdfHeight = Math.round((sigHeight * scaleY) * 100) / 100;
        } catch (e) {
            console.warn("Could not compute PDF coords at placement:", e);
        }
        
        console.log(`${fieldType} placed at:`, x, y, "PDF:", field.pdfX, field.pdfY, "on page", currentPage);
        const fieldName = fieldType === 'signature' ? 'Signature' : fieldType === 'initials' ? 'Initials' : 'Company Stamp';
        showAlert(`${fieldName} placed on PDF!`, "success");
        
        // Re-render page to show field
        setTimeout(() => {
            renderCurrentPage();
            updateSendToSignButtonState();
        }, 100);
    }
    
    // Place text field on PDF (for Name, Date, Text fields). Computes PDF coords from container rect.
    async function placeTextFieldOnPdf(x, y, fieldType, canvasContainer) {
        if (!pdfCanvas) {
            showAlert("Please load a PDF first.", "warning");
            return;
        }
        const containerRect = canvasContainer.getBoundingClientRect();
        const fieldWidth = 200;
        const fieldHeight = 30;
        if (!placedSignatures[currentPage]) {
            placedSignatures[currentPage] = [];
        }
        let defaultText = '';
        if (fieldType === 'name') defaultText = 'Name';
        else if (fieldType === 'date') defaultText = new Date().toLocaleDateString();
        else if (fieldType === 'text') defaultText = 'Text';
        const fieldId = `${fieldType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const field = {
            id: fieldId,
            type: fieldType,
            text: defaultText,
            x: x,
            y: y,
            width: fieldWidth,
            height: fieldHeight
        };
        placedSignatures[currentPage].push(field);
        try {
            const page = await pdfDoc.getPage(currentPage - 1);
            const vp = page.getViewport({ scale: 1.0 });
            const scaleX = vp.width / containerRect.width;
            const scaleY = vp.height / containerRect.height;
            field.pdfX = Math.round((x * scaleX) * 100) / 100;
            field.pdfY = Math.round((vp.height - (y * scaleY) - (fieldHeight * scaleY)) * 100) / 100;
            field.pdfWidth = Math.round((fieldWidth * scaleX) * 100) / 100;
            field.pdfHeight = Math.round((fieldHeight * scaleY) * 100) / 100;
        } catch (e) {
            console.warn("Could not compute PDF coords for text field:", e);
        }
        console.log(`${fieldType} field placed at:`, x, y, "on page", currentPage);
        showAlert(`${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} field placed! Click to edit.`, "success");
        setTimeout(() => {
            renderCurrentPage();
            updateSendToSignButtonState();
        }, 100);
    }
    
    // Place a placeholder signature box (Several people: click to add)
    function placeSignaturePlaceholder() {
        if (!pdfCanvas || !pdfDoc) {
            showAlert("Please load a PDF first.", "warning");
            return;
        }
        const canvasContainer = document.querySelector('.pdf-canvas-container');
        if (!canvasContainer) {
            showAlert("PDF preview not available. Please wait for PDF to load.", "warning");
            return;
        }
        const containerRect = canvasContainer.getBoundingClientRect();
        const existingFields = placedSignatures[currentPage] ? placedSignatures[currentPage].length : 0;
        const offsetX = (existingFields % 3) * 220;
        const offsetY = Math.floor(existingFields / 3) * 80;
        const defaultX = Math.max(50, Math.min(containerRect.width - 250, containerRect.width / 2 - 100 + offsetX));
        const defaultY = Math.max(50, Math.min(containerRect.height - 80, containerRect.height / 2 - 15 + offsetY));
        const fakeEvent = { clientX: containerRect.left + defaultX, clientY: containerRect.top + defaultY };
        placeFieldOnPdf(fakeEvent.clientX, fakeEvent.clientY, 'signature', null, canvasContainer);
    }
    
    // Update Send to Sign button: disabled until at least one field placed; show/hide instruction overlay
    function updateSendToSignButtonState() {
        const totalFields = placedSignatures && typeof placedSignatures === 'object'
            ? Object.values(placedSignatures).reduce(function (sum, arr) { return sum + (Array.isArray(arr) ? arr.length : 0); }, 0)
            : 0;
        const sendEl = document.getElementById("sendToSignBtn");
        const overlayEl = document.getElementById("signatureInstructionOverlay");
        if (sendEl) {
            sendEl.disabled = totalFields === 0;
            sendEl.style.opacity = totalFields === 0 ? '0.6' : '1';
            sendEl.style.cursor = totalFields === 0 ? 'not-allowed' : 'pointer';
        }
        if (overlayEl && signMode === 'several_people') {
            overlayEl.style.display = totalFields === 0 ? 'block' : 'none';
            overlayEl.setAttribute('aria-hidden', totalFields === 0 ? 'false' : 'true');
        }
    }
    
    // Auto-place field at default position (center of visible area)
    function autoPlaceField(fieldType) {
        if (!pdfCanvas || !pdfDoc) {
            showAlert("Please load a PDF first.", "warning");
            return;
        }
        
        const canvasContainer = document.querySelector('.pdf-canvas-container');
        if (!canvasContainer) {
            showAlert("PDF preview not available. Please wait for PDF to load.", "warning");
            return;
        }
        
        // Get container dimensions
        const containerRect = canvasContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Calculate default position (center of visible area, slightly offset for multiple fields)
        // Offset based on number of existing fields to avoid overlap
        const existingFields = placedSignatures[currentPage] ? placedSignatures[currentPage].length : 0;
        const offsetX = (existingFields % 3) * 220; // Horizontal offset for multiple fields
        const offsetY = Math.floor(existingFields / 3) * 80; // Vertical offset for multiple fields
        
        const defaultX = Math.max(50, Math.min(containerWidth - 250, containerWidth / 2 - 100 + offsetX));
        const defaultY = Math.max(50, Math.min(containerHeight - 80, containerHeight / 2 - 15 + offsetY));
        
        // For signature/initials/companyStamp: need dataURL
        if (fieldType === 'signature' || fieldType === 'initials' || fieldType === 'companyStamp') {
            let dataURL = null;
            if (fieldType === 'signature') {
                dataURL = signatureData.signature;
            } else if (fieldType === 'initials') {
                dataURL = signatureData.initials;
            } else if (fieldType === 'companyStamp') {
                dataURL = signatureData.companyStamp;
            }
            
            if (!dataURL || dataURL.length < 100) {
                const fieldName = fieldType === 'signature' ? 'a signature' : fieldType === 'initials' ? 'initials' : 'a company stamp';
                showAlert(`Please create ${fieldName} first by clicking 'Edit'.`, "warning");
                return;
            }
            
            // Simulate click position for placeFieldOnPdf
            const fakeEvent = {
                clientX: containerRect.left + defaultX,
                clientY: containerRect.top + defaultY
            };
            placeFieldOnPdf(fakeEvent.clientX, fakeEvent.clientY, fieldType, dataURL, canvasContainer);
        } else {
            // For text fields: place editable input
            placeTextFieldOnPdf(defaultX, defaultY, fieldType, canvasContainer);
        }
    }
    
    // Placement mode functions removed - fields are now auto-placed
    // Keeping exitPlacementMode for cleanup if needed
    function exitPlacementMode() {
        placementMode = null;
        placementData = null;
        
        // Remove active class from all fields
        document.querySelectorAll('.field-item').forEach(item => {
            item.classList.remove('field-active');
        });
        
        // Reset cursor
        const canvasContainer = document.querySelector('.pdf-canvas-container');
        if (canvasContainer) {
            canvasContainer.style.cursor = '';
        } else if (pdfCanvas && pdfCanvas.parentElement) {
            pdfCanvas.parentElement.style.cursor = '';
        }
    }
    
    // Make signature field draggable
    function makeFieldDraggable(fieldId, fieldType, dataURL) {
        const fieldElement = document.getElementById(fieldId);
        if (!fieldElement) {
            console.error("Field element not found:", fieldId);
            return;
        }
        
        // Set draggable attribute
        fieldElement.draggable = true;
        fieldElement.classList.add('draggable-signature-field');
        
        // Remove existing dragstart listener if any (to avoid duplicates)
        const existingDragStart = fieldElement.getAttribute('data-drag-handler');
        if (existingDragStart === 'true') {
            return; // Already set up
        }
        
        // Mark as having drag handler
        fieldElement.setAttribute('data-drag-handler', 'true');
        
        // Add drag start handler
        fieldElement.addEventListener('dragstart', function(e) {
            // Get current signature data from signatureData (it may have been updated)
            const currentDataURL = fieldType === 'signature' ? signatureData.signature : signatureData.initials;
            
            if (!currentDataURL || currentDataURL.length < 100) {
                e.preventDefault();
                showAlert(`Please create ${fieldType === 'signature' ? 'a signature' : 'initials'} first by clicking 'Edit'.`, "warning");
                return;
            }
            
            // Use current data URL
            draggedSignatureType = fieldType;
            draggedSignatureData = currentDataURL;
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', fieldType);
            e.dataTransfer.setData('application/json', JSON.stringify({ type: fieldType, dataURL: currentDataURL }));
            
            // Visual feedback
            this.style.opacity = '0.5';
            this.style.cursor = 'grabbing';
            console.log("Drag started for", fieldType, "signature. Data URL length:", currentDataURL.length);
        });
        
        // Add drag end handler
        fieldElement.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
            this.style.cursor = 'grab';
        });
        
        // Add cursor style
        fieldElement.style.cursor = 'grab';
    }
    
    // Make placed signatures and fields draggable (for repositioning on PDF)
    function makePlacedSignaturesDraggable(canvasContainer, viewport, outputScale) {
        if (!canvasContainer || !placedSignatures[currentPage] || placedSignatures[currentPage].length === 0) {
            return;
        }
        
        // Remove existing overlays
        const existingOverlays = canvasContainer.querySelectorAll('.signature-overlay, .text-field-overlay');
        existingOverlays.forEach(overlay => overlay.remove());
        
        // Create overlay divs for each field
        placedSignatures[currentPage].forEach((field, index) => {
            // Handle signature/initials/companyStamp (image-based fields)
            if (field.type === 'signature' || field.type === 'initials' || field.type === 'companyStamp') {
                const isPlaceholder = field.placeholder || !field.dataURL || field.dataURL.length < 50;
                
                const overlay = document.createElement('div');
                overlay.className = isPlaceholder ? 'signature-overlay signature-overlay-placeholder' : 'signature-overlay';
                overlay.dataset.fieldId = field.id;
                overlay.dataset.fieldIndex = index;
                overlay.style.position = 'absolute';
                overlay.style.left = field.x + 'px';
                overlay.style.top = field.y + 'px';
                overlay.style.width = (field.width || 200) + 'px';
                overlay.style.height = (field.height || 60) + 'px';
                overlay.style.cursor = 'move';
                overlay.style.border = isPlaceholder ? '1px solid #f87171' : '2px dashed transparent';
                overlay.style.borderRadius = '4px';
                overlay.style.transition = 'border-color 0.2s ease';
                
                if (isPlaceholder) {
                    overlay.innerHTML = '<span class="sig-label"><i class="fa-solid fa-pen me-1"></i>Signature</span><hr class="my-1" style="border-color: rgba(0,0,0,0.2); width: 100%;"><span class="sig-uuid">SIGN ID (UUID)</span>';
                } else {
                    const img = document.createElement('img');
                    img.src = field.dataURL;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    img.style.pointerEvents = 'none';
                    overlay.appendChild(img);
                }
                
                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'signature-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete ' + field.type;
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '-8px';
                deleteBtn.style.right = '-8px';
                deleteBtn.style.width = '24px';
                deleteBtn.style.height = '24px';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.background = '#ff4444';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontSize = '18px';
                deleteBtn.style.lineHeight = '1';
                deleteBtn.style.display = 'none';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete this ${field.type}?`)) {
                        placedSignatures[currentPage].splice(index, 1);
                        renderCurrentPage();
                        updateSendToSignButtonState();
                    }
                });
                overlay.appendChild(deleteBtn);
                
                overlay.addEventListener('mouseenter', () => {
                    overlay.style.borderColor = 'var(--color-primary-purple)';
                    deleteBtn.style.display = 'block';
                });
                overlay.addEventListener('mouseleave', () => {
                    overlay.style.borderColor = isPlaceholder ? '#f87171' : 'transparent';
                    deleteBtn.style.display = 'none';
                });
                
                makeSignatureOverlayDraggable(overlay, field, viewport, outputScale);
                canvasContainer.appendChild(overlay);
            } 
            // Handle text fields (Name, Date, Text)
            else if (field.type === 'name' || field.type === 'date' || field.type === 'text') {
                const overlay = document.createElement('div');
                overlay.className = 'text-field-overlay';
                overlay.dataset.fieldId = field.id;
                overlay.dataset.fieldIndex = index;
                overlay.style.position = 'absolute';
                overlay.style.left = field.x + 'px';
                overlay.style.top = field.y + 'px';
                overlay.style.width = (field.width || 200) + 'px';
                overlay.style.height = (field.height || 30) + 'px';
                overlay.style.cursor = 'move';
                overlay.style.border = '2px dashed transparent';
                overlay.style.borderRadius = '4px';
                overlay.style.transition = 'border-color 0.2s ease';
                
                // Create editable input element
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'pdf-text-input';
                input.value = field.text || '';
                input.placeholder = field.type === 'name' ? 'Name' : field.type === 'date' ? 'Date' : 'Text';
                input.style.width = '100%';
                input.style.height = '100%';
                input.style.padding = '4px 8px';
                input.style.border = '1px solid #ddd';
                input.style.borderRadius = '4px';
                input.style.fontSize = '14px';
                input.style.fontFamily = 'Arial, sans-serif';
                input.style.background = 'white';
                
                // Update field text on input change
                input.addEventListener('input', (e) => {
                    field.text = e.target.value;
                });
                
                // Prevent input from triggering placement mode
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                
                overlay.appendChild(input);
                
                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'signature-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete ' + field.type;
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '-8px';
                deleteBtn.style.right = '-8px';
                deleteBtn.style.width = '24px';
                deleteBtn.style.height = '24px';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.background = '#ff4444';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontSize = '18px';
                deleteBtn.style.lineHeight = '1';
                deleteBtn.style.display = 'none';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete this ${field.type} field?`)) {
                        placedSignatures[currentPage].splice(index, 1);
                        renderCurrentPage();
                        updateSendToSignButtonState();
                    }
                });
                overlay.appendChild(deleteBtn);
                
                // Show delete button on hover
                overlay.addEventListener('mouseenter', () => {
                    overlay.style.borderColor = 'var(--color-primary-purple)';
                    deleteBtn.style.display = 'block';
                });
                overlay.addEventListener('mouseleave', () => {
                    overlay.style.borderColor = 'transparent';
                    deleteBtn.style.display = 'none';
                });
                
                // Make draggable (but allow input to be editable)
                makeTextFieldOverlayDraggable(overlay, input, field, viewport, outputScale);
                
                canvasContainer.appendChild(overlay);
            }
        });
    }
    
    // Make signature overlay draggable
    function makeSignatureOverlayDraggable(overlay, field, viewport, outputScale) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragHandle = null;
        
        // Create drag handle (invisible area for dragging, but show on hover)
        dragHandle = document.createElement('div');
        dragHandle.className = 'field-drag-handle';
        dragHandle.style.position = 'absolute';
        dragHandle.style.top = '0';
        dragHandle.style.left = '0';
        dragHandle.style.right = '0';
        dragHandle.style.bottom = '0';
        dragHandle.style.cursor = 'move';
        dragHandle.style.zIndex = '1';
        
        overlay.insertBefore(dragHandle, overlay.firstChild);
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = overlay.getBoundingClientRect();
            initialX = rect.left - overlay.parentElement.getBoundingClientRect().left;
            initialY = rect.top - overlay.parentElement.getBoundingClientRect().top;
            
            overlay.style.zIndex = '1000';
            overlay.style.opacity = '0.8';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Constrain to container bounds
            const maxX = containerRect.width - (field.width || 200);
            const maxY = containerRect.height - (field.height || 60);
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            overlay.style.left = newX + 'px';
            overlay.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            overlay.style.zIndex = '10';
            overlay.style.opacity = '1';
            
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            field.x = overlayRect.left - containerRect.left;
            field.y = overlayRect.top - containerRect.top;
            
            // Recompute PDF coords from actual container rect so guest shows correct position
            (async function() {
                try {
                    const page = await pdfDoc.getPage(currentPage - 1);
                    const vp = page.getViewport({ scale: 1.0 });
                    const w = field.width || 200;
                    const h = field.height || 60;
                    const scaleX = vp.width / containerRect.width;
                    const scaleY = vp.height / containerRect.height;
                    field.pdfX = Math.round((field.x * scaleX) * 100) / 100;
                    field.pdfY = Math.round((vp.height - (field.y * scaleY) - (h * scaleY)) * 100) / 100;
                    field.pdfWidth = Math.round((w * scaleX) * 100) / 100;
                    field.pdfHeight = Math.round((h * scaleY) * 100) / 100;
                } catch (e) { console.warn("Could not update PDF coords after drag:", e); }
            })();
            
            console.log(`${field.type} moved to:`, field.x, field.y);
        });
    }
    
    // Make text field overlay draggable (but allow input editing)
    function makeTextFieldOverlayDraggable(overlay, input, field, viewport, outputScale) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragHandle = null;
        
        // Create drag handle area (on the border/edge, not the input itself)
        dragHandle = document.createElement('div');
        dragHandle.className = 'text-field-drag-handle';
        dragHandle.style.position = 'absolute';
        dragHandle.style.top = '0';
        dragHandle.style.left = '0';
        dragHandle.style.width = '20px';
        dragHandle.style.height = '100%';
        dragHandle.style.cursor = 'move';
        dragHandle.style.zIndex = '2';
        dragHandle.style.backgroundColor = 'transparent';
        
        overlay.insertBefore(dragHandle, input);
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = overlay.getBoundingClientRect();
            initialX = rect.left - overlay.parentElement.getBoundingClientRect().left;
            initialY = rect.top - overlay.parentElement.getBoundingClientRect().top;
            
            overlay.style.zIndex = '1000';
            overlay.style.opacity = '0.8';
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Also allow dragging by clicking on the overlay border (not the input)
        overlay.addEventListener('mousedown', (e) => {
            // Only start dragging if clicking outside the input
            if (e.target === overlay || e.target === dragHandle || e.target === overlay.querySelector('.signature-delete-btn')) {
                if (e.target.classList.contains('signature-delete-btn')) return;
                
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = overlay.getBoundingClientRect();
                initialX = rect.left - overlay.parentElement.getBoundingClientRect().left;
                initialY = rect.top - overlay.parentElement.getBoundingClientRect().top;
                
                overlay.style.zIndex = '1000';
                overlay.style.opacity = '0.8';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Constrain to container bounds
            const maxX = containerRect.width - (field.width || 200);
            const maxY = containerRect.height - (field.height || 30);
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            overlay.style.left = newX + 'px';
            overlay.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            overlay.style.zIndex = '10';
            overlay.style.opacity = '1';
            
            const containerRect = overlay.parentElement.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            field.x = overlayRect.left - containerRect.left;
            field.y = overlayRect.top - containerRect.top;
            
            (async function() {
                try {
                    const page = await pdfDoc.getPage(currentPage - 1);
                    const vp = page.getViewport({ scale: 1.0 });
                    const w = field.width || 200;
                    const h = field.height || 30;
                    const scaleX = vp.width / containerRect.width;
                    const scaleY = vp.height / containerRect.height;
                    field.pdfX = Math.round((field.x * scaleX) * 100) / 100;
                    field.pdfY = Math.round((vp.height - (field.y * scaleY) - (h * scaleY)) * 100) / 100;
                    field.pdfWidth = Math.round((w * scaleX) * 100) / 100;
                    field.pdfHeight = Math.round((h * scaleY) * 100) / 100;
                } catch (e) { console.warn("Could not update PDF coords after text field drag:", e); }
            })();
            
            console.log(`${field.type} text field moved to:`, field.x, field.y);
        });
    }

    // Signature Modal Tab Switching
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                tabButtons.forEach(btn => btn.classList.remove("active"));
                tabContents.forEach(content => content.classList.remove("active"));

                button.classList.add("active");
                const tabId = button.dataset.tab;
                const tabContent = document.getElementById(tabId + "Tab");
                if (tabContent) {
                    tabContent.classList.add("active");
                    
                    // Reinitialize contexts when switching tabs
                    if (tabId === "draw") {
                        initializeDrawCanvas();
                        activeCanvas = drawCanvas;
                        activeCanvasCtx = drawCtx;
                    } else if (tabId === "upload") {
                        initializeUploadCanvas();
                        activeCanvas = uploadCanvas;
                        activeCanvasCtx = uploadCtx;
                    } else if (tabId === "type") {
                        initializeSignatureCanvas();
                        activeCanvas = signatureCanvas;
                        activeCanvasCtx = signatureCtx;
                    } else {
                        activeCanvas = null;
                        activeCanvasCtx = null;
                    }
                }

                // Adjust canvas sizes after tab switch
                setTimeout(() => {
                    adjustCanvasSizes();
                }, 50);
            });
        });
    }

    function adjustCanvasSizes() {
        const fixedWidth = 700;
        const fixedHeight = 200;
        
        // Adjust draw canvas
        if (drawCanvas) {
            drawCanvas.width = fixedWidth;
            drawCanvas.height = fixedHeight;
            drawCanvas.style.width = fixedWidth + 'px';
            drawCanvas.style.height = fixedHeight + 'px';
            
            // Reinitialize context after resize
            drawCtx = drawCanvas.getContext("2d", { willReadFrequently: true });
            if (drawCtx) {
                drawCtx.strokeStyle = "#000000";
                drawCtx.lineWidth = 2;
                drawCtx.lineCap = "round";
                drawCtx.lineJoin = "round";
                drawCtx.fillStyle = "#000000";
            }
        }
        
        // Adjust upload canvas
        if (uploadCanvas) {
            uploadCanvas.width = fixedWidth;
            uploadCanvas.height = fixedHeight;
            uploadCanvas.style.width = fixedWidth + 'px';
            uploadCanvas.style.height = fixedHeight + 'px';
            
            // Reinitialize context after resize
            uploadCtx = uploadCanvas.getContext("2d", { willReadFrequently: true });
            if (uploadCtx) {
                uploadCtx.strokeStyle = "#000000";
                uploadCtx.lineWidth = 2;
                uploadCtx.lineCap = "round";
                uploadCtx.lineJoin = "round";
                uploadCtx.fillStyle = "#000000";
            }
        }
        
        // Adjust signature canvas (for typed signatures)
        if (signatureCanvas) {
            signatureCanvas.width = fixedWidth;
            signatureCanvas.height = fixedHeight;
            signatureCanvas.style.width = fixedWidth + 'px';
            signatureCanvas.style.height = fixedHeight + 'px';
            
            // Reinitialize context after resize
            signatureCtx = signatureCanvas.getContext("2d", { willReadFrequently: true });
            if (signatureCtx) {
                signatureCtx.textAlign = "center";
                signatureCtx.textBaseline = "middle";
                signatureCtx.fillStyle = "#000000";
                signatureCtx.strokeStyle = "#000000";
            }
        }
        
        console.log("Canvas sizes adjusted - Draw:", !!drawCtx, "Upload:", !!uploadCtx, "Signature:", !!signatureCtx);
    }

    // Initialize canvas sizes when modal is shown
    if (signatureModalElement) {
        signatureModalElement.addEventListener('shown.bs.modal', () => {
            // Remove aria-hidden when modal is shown (Bootstrap sets it incorrectly sometimes)
            signatureModalElement.removeAttribute('aria-hidden');
            
            // Reinitialize all canvas contexts
            initializeDrawCanvas();
            initializeUploadCanvas();
            initializeSignatureCanvas();
            
            // Adjust canvas sizes
            adjustCanvasSizes();
            
            // Set active canvas based on active tab
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
                const tabId = activeTab.dataset.tab;
                if (tabId === "draw") {
                    activeCanvas = drawCanvas;
                    activeCanvasCtx = drawCtx;
                } else if (tabId === "upload") {
                    activeCanvas = uploadCanvas;
                    activeCanvasCtx = uploadCtx;
                } else if (tabId === "type") {
                    activeCanvas = signatureCanvas;
                    activeCanvasCtx = signatureCtx;
                }
            }
            
            // Clear any previous drawing when modal opens (optional - you might want to keep it)
            // Uncomment below if you want to clear on each open
            /*
            if (drawCanvas && drawCtx) {
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                drawHistory = [];
            }
            if (uploadCanvas && uploadCtx) {
                uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
                uploadHistory = [];
            }
            if (signatureCanvas && signatureCtx) {
                signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            }
            */
            
            console.log("Modal shown, currentEditingField:", currentEditingField);
        });
        
        signatureModalElement.addEventListener('hide.bs.modal', (e) => {
            // Before modal hides, remove focus from buttons to prevent aria-hidden warning
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'BUTTON' && signatureModalElement.contains(activeElement)) {
                activeElement.blur();
            }
        });
        
        signatureModalElement.addEventListener('hidden.bs.modal', () => {
            // Set aria-hidden when modal is fully hidden
            signatureModalElement.setAttribute('aria-hidden', 'true');
            // Clean up when modal is hidden
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            // Reset current editing field after modal is fully closed
            currentEditingField = null;
            console.log("Modal hidden, currentEditingField reset");
        });
    }

    // Simple Signature and Digital Signature Type Buttons
    const simpleSignatureBtn = document.getElementById("simpleSignatureBtn");
    const digitalSignatureBtn = document.getElementById("digitalSignatureBtn");
    let selectedSignatureType = "simple"; // Default to simple
    
    if (simpleSignatureBtn) {
        simpleSignatureBtn.addEventListener("click", () => {
            selectedSignatureType = "simple";
            simpleSignatureBtn.classList.add("active");
            if (digitalSignatureBtn) digitalSignatureBtn.classList.remove("active");
            console.log("Simple Signature selected");
        });
        // Set as active by default
        simpleSignatureBtn.classList.add("active");
    }
    
    if (digitalSignatureBtn) {
        digitalSignatureBtn.addEventListener("click", () => {
            selectedSignatureType = "digital";
            digitalSignatureBtn.classList.add("active");
            if (simpleSignatureBtn) simpleSignatureBtn.classList.remove("active");
            showAlert("Digital Signature is a premium feature. Using Simple Signature for now.", "primary");
            console.log("Digital Signature selected");
        });
    }

    // Edit Signature Buttons
    if (editSignatureBtn) {
        editSignatureBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentEditingField = "signature";
            
            // Ensure modal is initialized
            if (!signatureModal) {
                initializeModal();
            }
            
            if (signatureModal) {
                try {
                    // Set aria-hidden to false before showing
                    if (signatureModalElement) {
                        signatureModalElement.removeAttribute('aria-hidden');
                    }
                    signatureModal.show();
                    // Switch to draw tab by default
                    setTimeout(() => {
                        const drawTab = document.querySelector('.tab-button[data-tab="draw"]');
                        if (drawTab) {
                            drawTab.click();
                        }
                        adjustCanvasSizes();
                        // Focus first input or canvas to prevent aria-hidden warning
                        const firstInput = signatureModalElement.querySelector('input, canvas, button');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 300);
                } catch (error) {
                    console.error("Error showing modal:", error);
                    showAlert("Error opening signature editor. Please try again.", "danger");
                }
            } else {
                showAlert("Signature editor is not ready. Please refresh the page.", "warning");
            }
        });
    }

    if (editInitialsBtn) {
        editInitialsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentEditingField = "initials";
            
            // Ensure modal is initialized
            if (!signatureModal) {
                initializeModal();
            }
            
            if (signatureModal) {
                try {
                    // Set aria-hidden to false before showing
                    if (signatureModalElement) {
                        signatureModalElement.removeAttribute('aria-hidden');
                    }
                    signatureModal.show();
                    // Switch to draw tab by default
                    setTimeout(() => {
                        const drawTab = document.querySelector('.tab-button[data-tab="draw"]');
                        if (drawTab) {
                            drawTab.click();
                        }
                        adjustCanvasSizes();
                        // Focus first input or canvas to prevent aria-hidden warning
                        const firstInput = signatureModalElement.querySelector('input, canvas, button');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 300);
                } catch (error) {
                    console.error("Error showing modal:", error);
                    showAlert("Error opening initials editor. Please try again.", "danger");
                }
            } else {
                showAlert("Signature editor is not ready. Please refresh the page.", "warning");
            }
        });
    }
    
    // Add click handlers for all field types to auto-place on PDF
    // Signature field - Several people: each click adds a placeholder box; Only me: place or edit
    if (signatureField) {
        signatureField.addEventListener('click', (e) => {
            if (e.target.closest('.field-edit-btn') || e.target.closest('.drag-handle')) return;
            
            if (signMode === 'several_people') {
                placeSignaturePlaceholder();
                return;
            }
            
            if (signatureData.signature && signatureData.signature.length > 100) {
                autoPlaceField('signature');
            } else {
                if (editSignatureBtn) editSignatureBtn.click();
            }
        });
    }
    
    // Initials field - auto-place (if initials exists) or edit
    if (initialsField) {
        initialsField.addEventListener('click', (e) => {
            // Don't trigger if clicking edit button or drag handle
            if (e.target.closest('.field-edit-btn') || e.target.closest('.drag-handle')) return;
            
            if (signatureData.initials && signatureData.initials.length > 100) {
                // Auto-place initials on PDF
                autoPlaceField('initials');
            } else {
                // If no initials, open edit modal
                if (editInitialsBtn) {
                    editInitialsBtn.click();
                }
            }
        });
    }
    
    // Name field - auto-place
    if (nameField) {
        nameField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle
            if (e.target.closest('.drag-handle')) return;
            
            e.preventDefault();
            e.stopPropagation();
            // Auto-place name field on PDF
            autoPlaceField('name');
        });
    }
    
    // Date field - auto-place
    if (dateField) {
        dateField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle
            if (e.target.closest('.drag-handle')) return;
            
            e.preventDefault();
            e.stopPropagation();
            // Auto-place date field on PDF
            autoPlaceField('date');
        });
    }
    
    // Text field - auto-place
    if (textField) {
        textField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle
            if (e.target.closest('.drag-handle')) return;
            
            e.preventDefault();
            e.stopPropagation();
            // Auto-place text field on PDF
            autoPlaceField('text');
        });
    }
    
    // Company Stamp field - edit button opens modal
    if (editCompanyStampBtn) {
        editCompanyStampBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentEditingField = "companyStamp";
            
            // Ensure modal is initialized
            if (!signatureModal) {
                initializeModal();
            }
            
            if (signatureModal) {
                try {
                    // Set aria-hidden to false before showing
                    if (signatureModalElement) {
                        signatureModalElement.removeAttribute('aria-hidden');
                    }
                    signatureModal.show();
                    // Switch to Company Stamp tab
                    setTimeout(() => {
                        const companyStampTab = document.querySelector('.tab-button[data-tab="companyStamp"]');
                        if (companyStampTab) {
                            companyStampTab.click();
                        }
                        adjustCanvasSizes();
                        // Focus first input or canvas to prevent aria-hidden warning
                        const firstInput = signatureModalElement.querySelector('input, canvas, button');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 300);
                } catch (error) {
                    console.error("Error showing modal:", error);
                    showAlert("Error opening company stamp editor. Please try again.", "danger");
                }
            } else {
                showAlert("Signature editor is not ready. Please refresh the page.", "warning");
            }
        });
    }
    
    // Company Stamp field - auto-place (if stamp exists) or edit
    if (companyField) {
        companyField.addEventListener('click', (e) => {
            // Don't trigger if clicking drag handle or edit button
            if (e.target.closest('.drag-handle') || e.target.closest('.field-edit-btn')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Check if company stamp image exists
            if (signatureData.companyStamp && signatureData.companyStamp.length > 100) {
                // Auto-place company stamp on PDF
                autoPlaceField('companyStamp');
            } else {
                // If no company stamp, open edit modal
                if (editCompanyStampBtn) {
                    editCompanyStampBtn.click();
                }
            }
        });
    }
    
    // Close modal when clicking close button or backdrop
    if (signatureModalElement) {
        // Wait for DOM to be ready
        setTimeout(() => {
            const closeButtons = signatureModalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close, .btn-secondary');
            closeButtons.forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                });
            });
        }, 100);
        
        // Handle backdrop click - but prevent closing when clicking inside modal content
        signatureModalElement.addEventListener("click", (e) => {
            if (e.target === signatureModalElement) {
                if (signatureModal) {
                    signatureModal.hide();
                } else {
                    closeModal();
                }
            }
        });
        
        // Prevent closing when clicking inside modal content
        const modalContent = signatureModalElement.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }
    }

    // Helper function to close modal properly
    function closeModal() {
        console.log("Closing modal...");
        if (signatureModal) {
            try {
                // Remove aria-hidden before closing to prevent accessibility warnings
                if (signatureModalElement) {
                    signatureModalElement.removeAttribute('aria-hidden');
                }
                signatureModal.hide();
                
                // Wait for Bootstrap animation to complete, then clean up
                setTimeout(() => {
                    if (signatureModalElement) {
                        signatureModalElement.setAttribute('aria-hidden', 'true');
                        signatureModalElement.style.display = "none";
                        signatureModalElement.classList.remove("show");
                    }
                    document.body.classList.remove("modal-open");
                    document.body.style.overflow = "";
                    document.body.style.paddingRight = "";
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    console.log("Modal closed successfully");
                }, 300);
            } catch (error) {
                console.error("Error closing modal:", error);
                // Fallback manual close
                if (signatureModalElement) {
                    signatureModalElement.style.display = "none";
                    signatureModalElement.classList.remove("show");
                    signatureModalElement.setAttribute('aria-hidden', 'true');
                }
                document.body.classList.remove("modal-open");
                document.body.style.overflow = "";
                document.body.style.paddingRight = "";
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        } else if (signatureModalElement) {
            signatureModalElement.style.display = "none";
            signatureModalElement.classList.remove("show");
            signatureModalElement.setAttribute('aria-hidden', 'true');
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            console.log("Modal closed (fallback)");
        }
    }
    
    // Type Tab - Generate Signatures - Initialize context properly
    function initializeSignatureCanvas() {
        if (signatureCanvas) {
            signatureCtx = signatureCanvas.getContext("2d", { willReadFrequently: true });
            if (signatureCtx) {
                signatureCtx.textAlign = "center";
                signatureCtx.textBaseline = "middle";
                signatureCtx.fillStyle = "#000000";
            }
        }
    }
    
    // Initialize signature canvas
    if (signatureCanvas) {
        initializeSignatureCanvas();
    }

    if (generateBtn && nameInput) {
        generateBtn.addEventListener("click", () => {
            const name = nameInput.value;
            if (!name) {
                showAlert("Please enter a name.", "warning");
                return;
            }
            const randomSignatures = generateSignatureOptions(name);
            displaySignatureOptions(randomSignatures);
        });
    }

    // Helper function to check if canvas has content
    function canvasHasContent(canvas, ctx) {
        if (!canvas || !ctx) {
            console.log("Canvas or context is null - canvas:", !!canvas, "ctx:", !!ctx);
            return false;
        }
        try {
            // Quick check: Try to get data URL first (fastest method)
            const dataURL = canvas.toDataURL('image/png');
            // A blank white canvas PNG data URL is typically around 20-50 characters
            // A canvas with actual content (even typed text) will be much longer (500+)
            if (dataURL && dataURL.length > 500) {
                console.log("Canvas has content (dataURL length check):", dataURL.length);
                return true;
            }
            
            // If dataURL is short, do pixel-level check as backup
            const sampleWidth = Math.min(canvas.width, 300);
            const sampleHeight = Math.min(canvas.height, 100);
            const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
            const data = imageData.data;
            
            // Check pixels for non-white content (for typed signatures with white background)
            let nonWhitePixels = 0;
            let nonTransparentPixels = 0;
            
            // Sample every 4th pixel for performance
            for (let i = 0; i < data.length; i += 16) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const alpha = data[i + 3];
                
                if (alpha > 10) { // Not fully transparent
                    nonTransparentPixels++;
                    // Check if pixel is not white (allowing some tolerance)
                    if (!(r > 235 && g > 235 && b > 235)) {
                        nonWhitePixels++;
                    }
                }
            }
            
            // Canvas has content if we found enough non-white pixels
            // Lower threshold for typed signatures which have white backgrounds
            const hasContent = nonWhitePixels > 3 || (nonTransparentPixels > 100 && nonWhitePixels > 1);
            console.log("Canvas content check - non-transparent:", nonTransparentPixels, "non-white:", nonWhitePixels, "hasContent:", hasContent);
            return hasContent;
        } catch (error) {
            console.error("Error checking canvas content:", error);
            // Final fallback: check data URL length
            try {
                const dataURL = canvas.toDataURL('image/png');
                return dataURL && dataURL.length > 500;
            } catch (e) {
                console.error("Error in fallback check:", e);
                return false;
            }
        }
    }
    
    // Get signature from active tab
    function getSignatureFromActiveTab() {
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) {
            console.log("No active tab found");
            return null;
        }
        
        const tabId = activeTab.dataset.tab;
        console.log("Getting signature from tab:", tabId);
        
        let canvas = null;
        let ctx = null;
        
        if (tabId === "draw") {
            canvas = drawCanvas;
            if (!drawCtx && canvas) {
                initializeDrawCanvas();
            }
            ctx = drawCtx;
        } else if (tabId === "upload") {
            canvas = uploadCanvas;
            if (!uploadCtx && canvas) {
                initializeUploadCanvas();
            }
            ctx = uploadCtx;
        } else if (tabId === "companyStamp") {
            canvas = companyStampCanvas;
            if (canvas && !canvas.getContext) {
                // Initialize canvas if needed
                canvas.width = 700;
                canvas.height = 200;
                canvas.style.width = '700px';
                canvas.style.height = '200px';
            }
            ctx = canvas ? canvas.getContext("2d", { willReadFrequently: true }) : null;
        } else if (tabId === "type") {
            canvas = signatureCanvas;
            if (!signatureCtx && canvas) {
                initializeSignatureCanvas();
            }
            ctx = signatureCtx;
        } else if (tabId === "history") {
            // History is handled separately
            console.log("History tab selected - user should click on a signature");
            return null;
        }
        
        if (!canvas) {
            console.log("Canvas not found for tab:", tabId);
            return null;
        }
        
        if (!ctx) {
            console.log("Context not found for canvas:", tabId);
            return null;
        }
        
        // Check if canvas has content
        const hasContent = canvasHasContent(canvas, ctx);
        if (!hasContent) {
            console.log("Canvas has no content for tab:", tabId);
            return null;
        }
        
        try {
            const dataURL = canvas.toDataURL('image/png');
            console.log("Successfully got signature data URL, length:", dataURL.length);
            return dataURL;
        } catch (error) {
            console.error("Error getting signature data:", error);
            return null;
        }
    }

    function generateSignatureOptions(name) {
        const fonts = ["Arial", "Courier", "Georgia", "Verdana", "Times New Roman", "Impact", "Comic Sans MS", "Trebuchet MS", "Lucida Sans", "Garamond", "Palatino", "Bookman", "Candara", "Optima", "Rockwell"];
        return fonts.map(font => ({ font, text: name }));
    }

    function displaySignatureOptions(signatures) {
        const previewsContainer = document.getElementById("signaturePreviews");
        if (!previewsContainer) return;
        previewsContainer.innerHTML = "";

        signatures.forEach(signature => {
            const option = document.createElement('div');
            option.textContent = signature.text;
            option.style.fontFamily = signature.font;
            option.classList.add('signature-option');
            option.addEventListener('click', () => drawSignature(signature));
            previewsContainer.appendChild(option);
        });
    }

    function drawSignature(signature) {
        if (!signatureCanvas) {
            console.error("Signature canvas not found");
            return;
        }
        if (!signatureCtx) {
            initializeSignatureCanvas();
        }
        if (!signatureCtx) {
            console.error("Signature context could not be initialized");
            return;
        }
        
        // Ensure canvas has proper size before drawing
        if (signatureCanvas.width === 0 || signatureCanvas.height === 0) {
            adjustCanvasSizes();
        }
        
        // Clear and draw signature
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureCtx.fillStyle = "#000000";
        signatureCtx.strokeStyle = "#000000";
        signatureCtx.font = `bold 48px "${signature.font}", Arial, sans-serif`;
        signatureCtx.textAlign = "center";
        signatureCtx.textBaseline = "middle";
        
        // Draw the text with black color
        signatureCtx.fillText(signature.text, signatureCanvas.width / 2, signatureCanvas.height / 2);
        
        console.log("Signature drawn on canvas:", signature.text, "font:", signature.font);
        console.log("Canvas dimensions:", signatureCanvas.width, "x", signatureCanvas.height);
    }

    // Draw Tab - Initialize context properly
    function initializeDrawCanvas() {
        if (drawCanvas) {
            drawCtx = drawCanvas.getContext("2d", { willReadFrequently: true });
            if (drawCtx) {
                drawCtx.strokeStyle = "#000000";
                drawCtx.lineWidth = 2;
                drawCtx.lineCap = "round";
                drawCtx.lineJoin = "round";
            }
        }
    }
    
    // Initialize draw canvas
    if (drawCanvas) {
        initializeDrawCanvas();
    }

    // Drawing event handlers for draw canvas
    if (drawCanvas) {
        // Initialize canvas if not already initialized
        if (!drawCtx) {
            initializeDrawCanvas();
        }
        
        drawCanvas.addEventListener("mousedown", (event) => {
            if (!drawCtx) {
                initializeDrawCanvas();
            }
            if (drawCtx) {
                isDrawing = true;
                const rect = drawCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                drawCtx.beginPath();
                drawCtx.moveTo(x, y);
                // Save current state for undo
                drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
            }
        });

        drawCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing && drawCtx) {
                const rect = drawCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                drawCtx.lineTo(x, y);
                drawCtx.stroke();
            }
        });

        drawCanvas.addEventListener("mouseup", () => {
            isDrawing = false;
            if (drawCtx) {
                drawCtx.closePath();
            }
        });

        drawCanvas.addEventListener("mouseleave", () => {
            if (isDrawing && drawCtx) {
                isDrawing = false;
                drawCtx.closePath();
            }
        });
        
        // Touch events for mobile support
        drawCanvas.addEventListener("touchstart", (event) => {
            event.preventDefault();
            if (!drawCtx) {
                initializeDrawCanvas();
            }
            if (drawCtx) {
                isDrawing = true;
                const touch = event.touches[0];
                const rect = drawCanvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                drawCtx.beginPath();
                drawCtx.moveTo(x, y);
                drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
            }
        });
        
        drawCanvas.addEventListener("touchmove", (event) => {
            event.preventDefault();
            if (isDrawing && drawCtx) {
                const touch = event.touches[0];
                const rect = drawCanvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                drawCtx.lineTo(x, y);
                drawCtx.stroke();
            }
        });
        
        drawCanvas.addEventListener("touchend", (event) => {
            event.preventDefault();
            isDrawing = false;
            if (drawCtx) {
                drawCtx.closePath();
            }
        });
    }

    if (undoBtn) {
        undoBtn.addEventListener("click", () => {
            if (!drawCtx) {
                initializeDrawCanvas();
            }
            if (drawCtx && drawHistory.length > 0) {
                drawCtx.putImageData(drawHistory.pop(), 0, 0);
            } else {
                showAlert("Nothing to undo.", "info");
            }
        });
    }

    // Clear buttons for draw and upload canvases
    if (clearDrawBtn && drawCanvas && drawCtx) {
        clearDrawBtn.addEventListener("click", () => {
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            drawHistory = [];
        });
    }
    
    if (clearUploadBtn && uploadCanvas && uploadCtx) {
        clearUploadBtn.addEventListener("click", () => {
            uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
            uploadHistory = [];
            if (imageUpload) {
                imageUpload.value = "";
            }
        });
    }

    // Upload Tab - Initialize context properly
    function initializeUploadCanvas() {
        if (uploadCanvas) {
            uploadCtx = uploadCanvas.getContext("2d", { willReadFrequently: true });
            if (uploadCtx) {
                uploadCtx.strokeStyle = "#000000";
                uploadCtx.lineWidth = 2;
                uploadCtx.lineCap = "round";
                uploadCtx.lineJoin = "round";
            }
        }
    }
    
    // Initialize upload canvas
    if (uploadCanvas) {
        initializeUploadCanvas();
    }

    if (imageUpload) {
        imageUpload.addEventListener("change", handleImageUpload);
    }

    // Drawing event handlers for upload canvas (for editing uploaded images)
    if (uploadCanvas) {
        // Initialize canvas if not already initialized
        if (!uploadCtx) {
            initializeUploadCanvas();
        }
        
        uploadCanvas.addEventListener("mousedown", (event) => {
            if (!uploadCtx) {
                initializeUploadCanvas();
            }
            if (uploadCtx) {
                isDrawing = true;
                const rect = uploadCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                uploadCtx.beginPath();
                uploadCtx.moveTo(x, y);
                uploadHistory.push(uploadCtx.getImageData(0, 0, uploadCanvas.width, uploadCanvas.height));
            }
        });

        uploadCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing && uploadCtx) {
                const rect = uploadCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                uploadCtx.lineTo(x, y);
                uploadCtx.stroke();
            }
        });

        uploadCanvas.addEventListener("mouseup", () => {
            isDrawing = false;
            if (uploadCtx) {
                uploadCtx.closePath();
            }
        });

        uploadCanvas.addEventListener("mouseleave", () => {
            if (isDrawing && uploadCtx) {
                isDrawing = false;
                uploadCtx.closePath();
            }
        });
    }

    if (undoBtnUpload) {
        undoBtnUpload.addEventListener("click", () => {
            if (!uploadCtx) {
                initializeUploadCanvas();
            }
            if (uploadCtx && uploadHistory.length > 0) {
                uploadCtx.putImageData(uploadHistory.pop(), 0, 0);
            } else {
                showAlert("Nothing to undo.", "info");
            }
        });
    }

    // Apply button - main button to apply signature from any tab
    if (applySignatureBtn) {
        applySignatureBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const activeTab = document.querySelector('.tab-button.active');
            if (!activeTab) {
                showAlert("Please select a tab to create a signature.", "warning");
                return;
            }
            
            const tabId = activeTab.dataset.tab;
            let dataURL = null;
            
            // Handle history tab separately
            if (tabId === "history") {
                showAlert("Please click on a signature from history to apply it.", "info");
                return;
            }
            
            // Get signature from active canvas
            dataURL = getSignatureFromActiveTab();
            
            if (!dataURL) {
                if (tabId === "type") {
                    showAlert("Please generate and select a signature style first.", "warning");
                } else if (tabId === "draw") {
                    showAlert("Please draw a signature first.", "warning");
                } else if (tabId === "upload") {
                    showAlert("Please upload an image first.", "warning");
                } else if (tabId === "companyStamp") {
                    showAlert("Please upload a company stamp image first.", "warning");
                }
                return;
            }
            
            // Validate data URL format
            if (!dataURL || typeof dataURL !== 'string') {
                console.error("Invalid signature data - not a string. Type:", typeof dataURL);
                showAlert("Signature data is invalid. Please try again.", "danger");
                return;
            }
            
            if (!dataURL.startsWith('data:image')) {
                console.error("Invalid signature data URL format. Starts with:", dataURL.substring(0, 20));
                showAlert("Invalid signature format. Please create a signature again.", "danger");
                return;
            }
            
            // Check length - blank white canvas PNG is ~20-50 chars
            // Typed signatures with text should be 300+ chars, drawn/uploaded 500+
            if (dataURL.length < 150) {
                console.error("Signature data URL too short - likely empty canvas. Length:", dataURL.length);
                showAlert("Signature appears to be empty. Please create a signature first.", "warning");
                return;
            }
            
            console.log("Applying signature from tab:", tabId);
            console.log("Data URL length:", dataURL.length);
            console.log("Data URL preview:", dataURL.substring(0, 50) + "...");
            console.log("Current editing field:", currentEditingField);
            
            if (!currentEditingField) {
                showAlert("No field selected. Please click 'Edit' on Signature or Initials field first.", "warning");
                return;
            }
            
            // Apply signature to field - this will validate and apply
            const success = applySignatureToField(dataURL);
            
            if (success) {
                // Save to history
                saveToHistory(dataURL);
                
                // Close modal after a short delay to allow UI update
                setTimeout(() => {
                    closeModal();
                }, 300);
            } else {
                console.error("Failed to apply signature");
                // Don't close modal if application failed - let user try again
            }
        });
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|svg)$/i)) {
            showAlert("Please upload a valid image file (PNG, JPG, or SVG).", "danger");
            return;
        }
        
        if (uploadCanvas) {
            // Initialize context if needed
            if (!uploadCtx) {
                initializeUploadCanvas();
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate dimensions to fit canvas while maintaining aspect ratio
                    const canvasWidth = uploadCanvas.width;
                    const canvasHeight = uploadCanvas.height;
                    const imgAspect = img.width / img.height;
                    const canvasAspect = canvasWidth / canvasHeight;
                    
                    let drawWidth, drawHeight, x, y;
                    
                    if (imgAspect > canvasAspect) {
                        // Image is wider
                        drawWidth = canvasWidth;
                        drawHeight = canvasWidth / imgAspect;
                        x = 0;
                        y = (canvasHeight - drawHeight) / 2;
                    } else {
                        // Image is taller
                        drawHeight = canvasHeight;
                        drawWidth = canvasHeight * imgAspect;
                        x = (canvasWidth - drawWidth) / 2;
                        y = 0;
                    }
                    
                    if (uploadCtx) {
                        uploadCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                        uploadCtx.drawImage(img, x, y, drawWidth, drawHeight);
                        uploadHistory = [];
                        showAlert("Image uploaded successfully. You can draw on it if needed.", "success");
                    }
                };
                img.onerror = () => {
                    showAlert("Failed to load image. Please try another file.", "danger");
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                showAlert("Failed to read file. Please try again.", "danger");
            };
            reader.readAsDataURL(file);
        }
    }

    // Company Stamp Upload Functionality
    if (uploadCompanyStampBtn && companyStampUpload) {
        uploadCompanyStampBtn.addEventListener('click', () => {
            companyStampUpload.click();
        });
        
        companyStampUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
            if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|svg)$/i)) {
                showAlert("Please upload a valid image file (PNG, JPG, or SVG).", "danger");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    if (companyStampCanvas) {
                        // Initialize canvas if needed
                        if (!companyStampCanvas.width) {
                            companyStampCanvas.width = 700;
                            companyStampCanvas.height = 200;
                            companyStampCanvas.style.width = '700px';
                            companyStampCanvas.style.height = '200px';
                        }
                        
                        const ctx = companyStampCanvas.getContext("2d", { willReadFrequently: true });
                        if (ctx) {
                            ctx.clearRect(0, 0, companyStampCanvas.width, companyStampCanvas.height);
                            
                            // Calculate dimensions to fit canvas while maintaining aspect ratio
                            const canvasWidth = companyStampCanvas.width;
                            const canvasHeight = companyStampCanvas.height;
                            const imgAspect = img.width / img.height;
                            const canvasAspect = canvasWidth / canvasHeight;
                            
                            let drawWidth, drawHeight, x, y;
                            
                            if (imgAspect > canvasAspect) {
                                // Image is wider
                                drawWidth = canvasWidth;
                                drawHeight = canvasWidth / imgAspect;
                                x = 0;
                                y = (canvasHeight - drawHeight) / 2;
                            } else {
                                // Image is taller
                                drawHeight = canvasHeight;
                                drawWidth = canvasHeight * imgAspect;
                                x = (canvasWidth - drawWidth) / 2;
                                y = 0;
                            }
                            
                            ctx.drawImage(img, x, y, drawWidth, drawHeight);
                            companyStampCanvas.style.display = 'block';
                            
                            // Store the data URL
                            signatureData.companyStamp = companyStampCanvas.toDataURL('image/png');
                            showAlert("Company stamp uploaded successfully!", "success");
                        }
                    }
                };
                img.onerror = () => {
                    showAlert("Error loading company stamp image.", "danger");
                };
                img.src = event.target.result;
            };
            reader.onerror = () => {
                showAlert("Error reading company stamp file.", "danger");
            };
            reader.readAsDataURL(file);
        });
        
        // Drag and drop for company stamp upload area
        const companyStampUploadArea = document.querySelector('.company-stamp-upload-area');
        if (companyStampUploadArea) {
            companyStampUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                companyStampUploadArea.style.backgroundColor = '#f8f9fa';
            });
            
            companyStampUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                companyStampUploadArea.style.backgroundColor = '#fff';
            });
            
            companyStampUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                companyStampUploadArea.style.backgroundColor = '#fff';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    companyStampUpload.files = files;
                    companyStampUpload.dispatchEvent(new Event('change'));
                }
            });
        }
    }
    
    // History Tab
    function updateHistory() {
        const savedHistory = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        if (savedHistory.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "text-muted text-center";
            emptyMsg.style.width = "100%";
            emptyMsg.textContent = "No saved signatures yet. Create a signature to see it here.";
            historyContainer.appendChild(emptyMsg);
        } else {
            savedHistory.forEach((dataURL, index) => {
                const img = document.createElement("img");
                img.src = dataURL;
                img.classList.add('history-image');
                img.alt = `Saved signature ${index + 1}`;
                img.title = "Click to use this signature";
                img.addEventListener("click", () => {
                    if (!currentEditingField) {
                        showAlert("Please click 'Edit' on Signature or Initials field first.", "warning");
                        return;
                    }
                    console.log("Applying signature from history");
                    const success = applySignatureToField(dataURL);
                    if (success) {
                        setTimeout(() => {
                            closeModal();
                        }, 300);
                    }
                });
                historyContainer.appendChild(img);
            });
        }
    }

    function saveToHistory(dataURL) {
        const historyData = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        historyData.push(dataURL);
        localStorage.setItem("signatureHistory", JSON.stringify(historyData));
        updateHistory();
    }

    // Apply signature to the current editing field
    function applySignatureToField(dataURL) {
        console.log("applySignatureToField called - currentEditingField:", currentEditingField);
        console.log("Data URL length:", dataURL ? dataURL.length : 0);
        
        // Validate data URL
        if (!dataURL) {
            console.error("Data URL is null or undefined");
            showAlert("Signature data is invalid. Please try again.", "danger");
            return false;
        }
        
        if (typeof dataURL !== 'string') {
            console.error("Data URL is not a string. Type:", typeof dataURL);
            showAlert("Invalid signature data type. Please try again.", "danger");
            return false;
        }
        
        if (!dataURL.startsWith('data:image')) {
            console.error("Invalid data URL format. Starts with:", dataURL.substring(0, 30));
            showAlert("Invalid signature format. Please create a signature again.", "danger");
            return false;
        }
        
        // Check length - blank white canvas PNG is ~20-50 chars
        // Real signatures (typed, drawn, or uploaded) should be much longer
        if (dataURL.length < 150) {
            console.error("Signature data URL too short. Length:", dataURL.length);
            showAlert("Signature appears to be empty. Please create a signature first.", "warning");
            return false;
        }
        
        if (!currentEditingField) {
            console.error("No current editing field set");
            showAlert("No field selected. Please click 'Edit' on Signature, Initials, or Company Stamp field first.", "warning");
            return false;
        }
        
        if (currentEditingField === "signature") {
            signatureData.signature = dataURL;
            if (signatureField) {
                const fieldText = signatureField.querySelector('.field-text');
                if (fieldText) {
                    fieldText.textContent = "Signature ✓";
                    fieldText.style.color = "#28a745";
                    fieldText.style.fontWeight = "600";
                }
                console.log("✓ Signature applied to signature field");
                
                // Store for drag and drop (update global state)
                draggedSignatureType = "signature";
                draggedSignatureData = dataURL;
                
                // Make signature field draggable immediately
                setTimeout(() => {
                    makeFieldDraggable("signatureField", "signature", dataURL);
                }, 100);
            } else {
                console.error("✗ Signature field element not found");
                return false;
            }
        } else if (currentEditingField === "initials") {
            signatureData.initials = dataURL;
            if (initialsField) {
                const fieldText = initialsField.querySelector('.field-text');
                if (fieldText) {
                    fieldText.textContent = "Initials ✓";
                    fieldText.style.color = "#28a745";
                    fieldText.style.fontWeight = "600";
                }
                console.log("✓ Signature applied to initials field");
                
                // Store for drag and drop (update global state)
                draggedSignatureType = "initials";
                draggedSignatureData = dataURL;
                
                // Make initials field draggable immediately
                setTimeout(() => {
                    makeFieldDraggable("initialsField", "initials", dataURL);
                }, 100);
            } else {
                console.error("✗ Initials field element not found");
                return false;
            }
        } else if (currentEditingField === "companyStamp") {
            signatureData.companyStamp = dataURL;
            if (companyField) {
                const fieldText = companyField.querySelector('.field-text');
                if (fieldText) {
                    fieldText.textContent = "Company Stamp ✓";
                    fieldText.style.color = "#28a745";
                    fieldText.style.fontWeight = "600";
                }
                console.log("✓ Company stamp applied");
                
                // Store for drag and drop (update global state)
                draggedSignatureType = "companyStamp";
                draggedSignatureData = dataURL;
                
                // Make company stamp field draggable immediately
                setTimeout(() => {
                    makeFieldDraggable("companyField", "companyStamp", dataURL);
                }, 100);
            } else {
                console.error("✗ Company stamp field element not found");
                return false;
            }
        } else {
            console.warn("Unknown editing field:", currentEditingField);
            return false;
        }
        
        // Don't reset currentEditingField immediately - let it be reset after modal closes
        // This allows the user to change their mind and select a different signature
        console.log("Signature successfully applied!");
        return true;
    }

    // Load history on page load
    updateHistory();

    // Sign PDF Button - Use pdf-lib to embed signatures client-side
    if (signPdfBtn) {
        signPdfBtn.addEventListener("click", async () => {
            if (!pdfFile) {
                showAlert("Please upload a PDF file first.", "warning");
                return;
            }

            if (!placedSignatures || Object.keys(placedSignatures).length === 0) {
                showAlert("Please place at least one signature on the PDF by dragging it to the document.", "warning");
                return;
            }

            // Check if pdf-lib is available
            if (typeof PDFLib === 'undefined') {
                showAlert("PDF library not loaded. Please refresh the page.", "danger");
                return;
            }

            signPdfBtn.disabled = true;
            signPdfBtn.innerHTML = 'Signing PDF... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            try {
                // Check if PDF is already loaded
                if (!pdfDoc) {
                    showAlert("PDF is not loaded. Please upload a PDF file first.", "warning");
                    return;
                }
                
                // Read the original PDF file for pdf-lib
                const arrayBuffer = await pdfFile.arrayBuffer();
                
                // Load the PDF document using pdf-lib
                const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                
                // Use existing pdfDoc (PDF.js) that was already loaded - DON'T reload it
                // pdfDoc is already available from when user uploaded the file
                
                // Embed Helvetica font once for all text fields (if there are any text fields)
                let hasTextFields = false;
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    if (placedSignatures[pageNum]) {
                        hasTextFields = placedSignatures[pageNum].some(f => f.type === 'name' || f.type === 'date' || f.type === 'text');
                        if (hasTextFields) break;
                    }
                }
                
                let helveticaFont = null;
                if (hasTextFields) {
                    helveticaFont = await pdfLibDoc.embedFont(PDFLib.StandardFonts.Helvetica);
                }
                
                // Process each page with placed signatures
                const pages = pdfLibDoc.getPages();
                const totalPages = pdfDoc.numPages;
                
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    if (!placedSignatures[pageNum] || placedSignatures[pageNum].length === 0) {
                        continue;
                    }
                    
                    const pdfLibPage = pages[pageNum - 1]; // pdf-lib uses 0-based indexing
                    const { width: pageWidth, height: pageHeight } = pdfLibPage.getSize();
                    
                    // Get PDF.js page using the existing pdfDoc (0-based index)
                    let scaledViewport;
                    try {
                        const pdfJsPage = await pdfDoc.getPage(pageNum - 1);
                        
                        // Calculate the scale that was used for rendering (same as in renderCurrentPage)
                        const containerWidth = documentPreviewArea ? (documentPreviewArea.clientWidth || documentPreviewArea.offsetWidth) - 16 : 800;
                        const maxWidth = Math.min(containerWidth, 1200);
                        const viewport = pdfJsPage.getViewport({ scale: 1.0 });
                        const calculatedScale = Math.min(maxWidth / viewport.width, 2.0);
                        scaledViewport = pdfJsPage.getViewport({ scale: calculatedScale });
                        
                        console.log(`Page ${pageNum}: PDF size (${pageWidth.toFixed(2)} x ${pageHeight.toFixed(2)}), Viewport (${scaledViewport.width.toFixed(2)} x ${scaledViewport.height.toFixed(2)})`);
                    } catch (pdfJsError) {
                        console.error(`Error getting PDF.js page ${pageNum}:`, pdfJsError);
                        // Fallback: use page dimensions directly
                        scaledViewport = { width: pageWidth, height: pageHeight };
                        console.log(`Using fallback viewport for page ${pageNum}: (${pageWidth} x ${pageHeight})`);
                    }
                    
                    // Calculate scale factors (rendered viewport pixels to PDF points)
                    // The signature positions are stored in viewport pixel coordinates
                    const scaleX = pageWidth / scaledViewport.width;
                    const scaleY = pageHeight / scaledViewport.height;
                    
                    console.log(`Page ${pageNum} scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
                    
                    // Embed each field on this page (signatures/images and text fields)
                    for (const field of placedSignatures[pageNum]) {
                        try {
                            // Handle signature/initials/companyStamp (image-based fields)
                            if (field.type === 'signature' || field.type === 'initials' || field.type === 'companyStamp') {
                                if (!field.dataURL || field.dataURL.length < 100) {
                                    console.warn(`Skipping invalid ${field.type} on page ${pageNum}`);
                                    continue;
                                }
                                
                                // Convert data URL to PNG bytes
                                const base64Data = field.dataURL.split(',')[1];
                                if (!base64Data) {
                                    console.error(`Invalid data URL format for ${field.type} on page ${pageNum}`);
                                    continue;
                                }
                                
                                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                                
                                // Embed the PNG image
                                const signatureImage = await pdfLibDoc.embedPng(imageBytes);
                                
                                // Calculate position in PDF coordinates
                                const sigWidth = field.width || 200;
                                const sigHeight = field.height || 60;
                                
                                // Convert viewport coordinates to PDF coordinates
                                const pdfX = field.x * scaleX;
                                // Y coordinate needs to be flipped: PDF y = pageHeight - (viewportY + sigHeight) * scaleY
                                const pdfY = pageHeight - (field.y * scaleY) - (sigHeight * scaleY);
                                const pdfWidth = sigWidth * scaleX;
                                const pdfHeight = sigHeight * scaleY;
                                
                                console.log(`Drawing ${field.type} on page ${pageNum}:`);
                                console.log(`  Viewport position: (${field.x.toFixed(2)}, ${field.y.toFixed(2)}) size: (${sigWidth}, ${sigHeight})`);
                                console.log(`  PDF position: (${pdfX.toFixed(2)}, ${pdfY.toFixed(2)}) size: (${pdfWidth.toFixed(2)}, ${pdfHeight.toFixed(2)})`);
                                
                                // Draw signature on PDF page
                                pdfLibPage.drawImage(signatureImage, {
                                    x: pdfX,
                                    y: pdfY,
                                    width: pdfWidth,
                                    height: pdfHeight,
                                });
                            }
                            // Handle text fields (Name, Date, Text)
                            else if (field.type === 'name' || field.type === 'date' || field.type === 'text') {
                                if (!helveticaFont) {
                                    console.error(`Helvetica font not embedded, cannot draw text for ${field.type} on page ${pageNum}`);
                                    continue;
                                }
                                
                                const fieldWidth = field.width || 200;
                                const fieldHeight = field.height || 30;
                                let text = field.text || '';
                                
                                // Set default text if empty
                                if (!text || text.trim() === '') {
                                    if (field.type === 'name') {
                                        text = 'Name';
                                    } else if (field.type === 'date') {
                                        text = new Date().toLocaleDateString();
                                    } else {
                                        text = 'Text';
                                    }
                                }
                                
                                // Calculate position in PDF coordinates
                                const pdfX = field.x * scaleX;
                                const pdfY = pageHeight - (field.y * scaleY) - (fieldHeight * scaleY);
                                const fontSize = Math.max(10, Math.min(16, fieldHeight * scaleY * 0.6)); // Reasonable font size (10-16pt)
                                
                                console.log(`Drawing ${field.type} text on page ${pageNum}:`);
                                console.log(`  Viewport position: (${field.x.toFixed(2)}, ${field.y.toFixed(2)})`);
                                console.log(`  PDF position: (${pdfX.toFixed(2)}, ${pdfY.toFixed(2)}) text: "${text}" fontSize: ${fontSize.toFixed(2)}`);
                                
                                // Draw text on PDF page (no border - just text)
                                pdfLibPage.drawText(text, {
                                    x: pdfX + 4, // Small padding from left
                                    y: pdfY + fontSize + 2, // Position text in middle of field (accounting for font baseline)
                                    size: fontSize,
                                    color: PDFLib.rgb(0, 0, 0),
                                    font: helveticaFont,
                                });
                                
                                // No border drawn - text fields should appear without borders in final PDF
                                // Border is only for visual reference during editing
                            }
                            
                        } catch (fieldError) {
                            console.error(`Error embedding ${field.type} on page ${pageNum}:`, fieldError);
                            console.error("Error details:", fieldError.message);
                        }
                    }
                }
                
                // Save the PDF
                const pdfBytes = await pdfLibDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const fileName = `signed_${pdfFile.name.replace('.pdf', '')}_${Date.now()}.pdf`;
                
                // Download the signed PDF
                downloadFile(blob, fileName);
                
            } catch (error) {
                showAlert("An error occurred while signing the PDF: " + error.message, "danger");
                console.error("Sign PDF error:", error);
                console.error("Error stack:", error.stack);
            } finally {
                if (signPdfBtn) {
                    signPdfBtn.disabled = false;
                    signPdfBtn.textContent = "Sign PDF";
                }
            }
        });
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
        showAlert("PDF signed successfully! Download starting...", "success");
    }

    // Initialize
    updatePageNavigation();
    updateUIState(false);

    // Verify critical elements exist
    if (!pdfInput) {
        console.error('PDF input element not found!');
        showAlert('PDF upload functionality not available. Please refresh the page.', 'danger');
    } else {
        console.log('PDF input element found');
    }
    if (!selectFilesBtn) {
        console.warn('Select files button not found!');
    } else {
        console.log('Select files button found');
    }
    if (!editSignatureBtn) {
        console.warn('Edit signature button not found!');
    }
    if (!signPdfBtn) {
        console.error('Sign PDF button not found!');
    }

    // Check PDF.js availability
    if (typeof pdfjsLib === 'undefined') {
        console.warn('PDF.js library not yet loaded - will check again when needed');
    } else {
        console.log('PDF.js library available');
    }

    console.log('Signature module initialized successfully');
});
