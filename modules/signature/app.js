document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModal = document.getElementById("closeModal");
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    openModalBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        adjustCanvasSizes(); // Set canvas size when opening the modal
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            button.classList.add("active");
            document.getElementById(button.dataset.tab).classList.add("active");

            adjustCanvasSizes(); // Set canvas size when switching tabs
        });
    });

    function adjustCanvasSizes() {
        const canvases = document.querySelectorAll("canvas");
        canvases.forEach(canvas => {
            const fixedWidth = 700; // Fixed width for all canvases
            const fixedHeight = (fixedWidth * 1) / 4; // Maintain aspect ratio (4:3)

            canvas.width = fixedWidth;
            canvas.height = fixedHeight;
        });
    }

    // Type Tab
    const nameInput = document.getElementById("nameInput");
    const generateBtn = document.getElementById("generateBtn");
    const signatureCanvas = document.getElementById("signatureCanvas");
    const saveSignatureBtn = document.getElementById("saveSignatureBtn");
    const signatureCtx = signatureCanvas.getContext("2d");

    generateBtn.addEventListener("click", () => {
        const name = nameInput.value;
        const randomSignatures = generateSignatureOptions(name);
        displaySignatureOptions(randomSignatures);
    });

    saveSignatureBtn.addEventListener("click", () => {
        saveCanvasAsImage(signatureCanvas, 'signature');
    });

    function generateSignatureOptions(name) {
        const fonts = ["Arial", "Courier", "Georgia", "Verdana", "Times New Roman", "Impact", "Comic Sans MS", "Trebuchet MS", "Lucida Sans", "Garamond", "Palatino", "Bookman", "Candara", "Optima", "Rockwell"];
        const signatures = fonts.map(font => ({
            font,
            text: name
        }));
        return signatures;
    }

    function displaySignatureOptions(signatures) {
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('signature-options');

        signatures.forEach(signature => {
            const option = document.createElement('div');
            option.textContent = signature.text;
            option.style.fontFamily = signature.font;
            option.classList.add('signature-option');
            option.addEventListener('click', () => drawSignature(signature));
            optionsContainer.appendChild(option);
        });

        const previousOptions = document.querySelector('.signature-options');
        if (previousOptions) {
            previousOptions.remove(); // Remove previous options if they exist
        }

        signatureCanvas.parentNode.insertBefore(optionsContainer, signatureCanvas);
    }

    function drawSignature(signature) {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureCtx.font = `30px ${signature.font}`;
        signatureCtx.textAlign = "center";
        signatureCtx.textBaseline = "middle";
        signatureCtx.fillText(signature.text, signatureCanvas.width / 2, signatureCanvas.height / 2);
    }

    // Draw Tab
    const drawCanvas = document.getElementById("drawCanvas");
    const undoBtn = document.getElementById("undoBtn");
    const undoBtnUpload = document.getElementById("undoBtnUpload");
    
    const saveDrawBtn = document.getElementById("saveDrawBtn");
    const drawCtx = drawCanvas.getContext("2d");
    let drawHistory = [];
    let isDrawing = false;

    drawCanvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        drawCtx.beginPath();
        drawCtx.moveTo(event.offsetX, event.offsetY);
        drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
    });

    drawCanvas.addEventListener("mousemove", (event) => {
        if (isDrawing) {
            drawCtx.lineTo(event.offsetX, event.offsetY);
            drawCtx.stroke();
        }
    });

    drawCanvas.addEventListener("mouseup", () => {
        isDrawing = false;
        drawCtx.closePath();
    });

    drawCanvas.addEventListener("mouseleave", () => {
        if (isDrawing) {
            isDrawing = false;
            drawCtx.closePath();
        }
    });

    undoBtn.addEventListener("click", undoLastDraw);
    undoBtnUpload.addEventListener("click", undoLastDraw);
    
    saveDrawBtn.addEventListener("click", () => {
        saveCanvasAsImage(drawCanvas, 'drawing');
    });

    // Upload Tab
    const imageUpload = document.getElementById("imageUpload");
    const uploadCanvas = document.getElementById("uploadCanvas");
    const saveUploadBtn = document.getElementById("saveUploadBtn");
    const uploadCtx = uploadCanvas.getContext("2d");
    let uploadHistory = [];

    imageUpload.addEventListener("change", handleImageUpload);

    uploadCanvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        uploadCtx.beginPath();
        uploadCtx.moveTo(event.offsetX, event.offsetY);
        uploadHistory.push(uploadCtx.getImageData(0, 0, uploadCanvas.width, uploadCanvas.height));
    });

    uploadCanvas.addEventListener("mousemove", (event) => {
        if (isDrawing) {
            uploadCtx.lineTo(event.offsetX, event.offsetY);
            uploadCtx.stroke();
        }
    });

    uploadCanvas.addEventListener("mouseup", () => {
        isDrawing = false;
        uploadCtx.closePath();
    });

    uploadCanvas.addEventListener("mouseleave", () => {
        if (isDrawing) {
            isDrawing = false;
            uploadCtx.closePath();
        }
    });

    saveUploadBtn.addEventListener("click", () => {
        saveCanvasAsImage(uploadCanvas, 'uploaded');
    });

    undoBtn.addEventListener("click", () => {
        if (uploadHistory.length > 0) {
            uploadCtx.putImageData(uploadHistory.pop(), 0, 0);
        }
    });

    undoBtnUpload.addEventListener("click", () => {
        if (uploadHistory.length > 0) {
            uploadCtx.putImageData(uploadHistory.pop(), 0, 0);
        }
    });

    // History Tab
    const historyContainer = document.getElementById("historyContainer");

    // Helper Functions
    function saveCanvasAsImage(canvas, filename) {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${filename}.png`;
        document.body.appendChild(link); // Append link to body
        link.click(); // Trigger download
        document.body.removeChild(link); // Remove link from body

        // Save to history
        const historyData = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        historyData.push(dataURL);
        localStorage.setItem("signatureHistory", JSON.stringify(historyData));
        updateHistory();
    }

    function undoLastDraw() {
        if (drawHistory.length > 0) {
            drawCtx.putImageData(drawHistory.pop(), 0, 0);
        }
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
                    uploadCtx.drawImage(img, 0, 0, uploadCanvas.width, uploadCanvas.height);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function updateHistory() {
        const savedHistory = JSON.parse(localStorage.getItem("signatureHistory")) || [];
        historyContainer.innerHTML = ''; // Clear current history
        savedHistory.forEach(dataURL => {
            const img = document.createElement("img");
            img.src = dataURL;
            img.classList.add('history-image');
            historyContainer.appendChild(img);
        });
    }

    // Load history on page load
    updateHistory();
});
