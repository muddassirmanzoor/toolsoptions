document.addEventListener("DOMContentLoaded", () => {
    const pdfInput = document.getElementById("pdfInput");
    const canvasContainer = document.getElementById("canvas-container");
    const addTextBtn = document.getElementById("add-text-btn");
    const addImageBtn = document.getElementById("add-image-btn");
    const addRectBtn = document.getElementById("add-rect-btn");
    const addCircleBtn = document.getElementById("add-circle-btn");
    const addLineBtn = document.getElementById("add-line-btn");
    const savePdfBtn = document.getElementById("save-pdf-btn");
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const textFormattingModal = new bootstrap.Modal(document.getElementById("textFormattingModal"));
    const imageUploadModal = new bootstrap.Modal(document.getElementById("imageUploadModal"));
    const imageInput = document.getElementById("image-input");
    const addImageConfirmBtn = document.getElementById("add-image-confirm-btn");
    const addTextConfirmBtn = document.getElementById("add-text-confirm-btn");
    const pageSelect = document.getElementById("page-select");

    let pdfDoc;
    let currentPageNumber = 1;
    let canvases = {};
    let objects = {};

    pdfInput.addEventListener("change", handleFileSelection);
    addTextBtn.addEventListener("click", () => textFormattingModal.show());
    addImageBtn.addEventListener("click", () => imageUploadModal.show());
    addImageConfirmBtn.addEventListener("click", handleImageUpload);
    addTextConfirmBtn.addEventListener("click", handleTextAddition);
    addRectBtn.addEventListener("click", () => addShape('rectangle'));
    addCircleBtn.addEventListener("click", () => addShape('circle'));
    addLineBtn.addEventListener("click", () => addShape('line'));
    savePdfBtn.addEventListener("click", savePDF);

    pageSelect.addEventListener("change", (e) => {
        currentPageNumber = parseInt(e.target.value);
        renderPDFPage(currentPageNumber);
    });

    function handleFileSelection(event) {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                const typedArray = new Uint8Array(this.result);
                pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                    pdfDoc = pdf;
                    updatePageSelect();
                    renderPDFPage(1);
                });
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            showAlert("Please upload a valid PDF file.", "danger");
        }
    }

    function updatePageSelect() {
        pageSelect.innerHTML = "";
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Page ${i}`;
            pageSelect.appendChild(option);
        }
    }

    async function renderPDFPage(pageNumber) {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        
        if (!canvases[pageNumber]) {
            const canvas = document.createElement("canvas");
            canvas.className = "pdf-page-canvas";
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            canvasContainer.innerHTML = ""; // Clear previous canvases
            canvasContainer.appendChild(canvas);
            
            canvases[pageNumber] = { canvas, context };
        }

        const { canvas, context } = canvases[pageNumber];
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;

        renderObjects(pageNumber); // Render objects after page is rendered
    }

    function renderObjects(pageNumber) {
        if (!objects[pageNumber]) return; // No objects to render
        
        const canvas = canvases[pageNumber].canvas;
        const context = canvas.getContext("2d");
        
        // Clear previous drawings to avoid overlapping
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const obj of objects[pageNumber]) {
            switch (obj.type) {
                case 'text':
                    context.font = `${obj.fontSize}px Arial`;
                    context.fillStyle = obj.color;
                    context.fillText(obj.content, obj.x, canvas.height - obj.y);
                    break;
                case 'image':
                    const img = new Image();
                    img.src = obj.src;
                    img.onload = () => {
                        context.drawImage(img, obj.x, canvas.height - obj.y - obj.height, obj.width, obj.height);
                    };
                    break;
                case 'rectangle':
                    context.strokeStyle = obj.borderColor;
                    context.fillStyle = obj.fillColor;
                    context.lineWidth = 2;
                    context.strokeRect(obj.x, canvas.height - obj.y - obj.height, obj.width, obj.height);
                    context.fillRect(obj.x, canvas.height - obj.y - obj.height, obj.width, obj.height);
                    break;
                case 'circle':
                    context.strokeStyle = obj.borderColor;
                    context.fillStyle = obj.fillColor;
                    context.lineWidth = 2;
                    context.beginPath();
                    context.arc(obj.x + obj.width / 2, canvas.height - obj.y - obj.height / 2, obj.width / 2, 0, Math.PI * 2);
                    context.stroke();
                    context.fill();
                    break;
                case 'line':
                    context.strokeStyle = obj.borderColor;
                    context.lineWidth = obj.height;
                    context.beginPath();
                    context.moveTo(obj.x, canvas.height - obj.y);
                    context.lineTo(obj.x + obj.width, canvas.height - obj.y);
                    context.stroke();
                    break;
            }
        }
    }

    function makeDraggable(element, pageNumber) {
        let offsetX, offsetY;

        function onMouseMove(event) {
            const canvasRect = canvases[pageNumber].canvas.getBoundingClientRect();
            const x = event.clientX - canvasRect.left - offsetX;
            const y = event.clientY - canvasRect.top - offsetY;

            element.style.left = `${x}px`;
            element.style.top = `${y}px`;

            updateObjectPosition(element, pageNumber);
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        element.addEventListener("mousedown", (event) => {
            const elementRect = element.getBoundingClientRect();
            offsetX = event.clientX - elementRect.left;
            offsetY = event.clientY - elementRect.top;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    function updateObjectPosition(element, pageNumber) {
        const obj = objects[pageNumber].find(o => o.id === element.id);
        if (obj) {
            const canvasRect = canvases[pageNumber].canvas.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            obj.x = elementRect.left - canvasRect.left;
            obj.y = elementRect.top - canvasRect.top;
        }
    }

    function handleTextAddition() {
        const textContent = document.getElementById("text-content").value;
        const fontSize = document.getElementById("font-size").value;
        const fontColor = document.getElementById("font-color").value;

        if (textContent) {
            const textElement = document.createElement("div");
            textElement.className = "draggable text-element";
            textElement.style.fontSize = `${fontSize}px`;
            textElement.style.color = fontColor;
            textElement.innerText = textContent;
            textElement.style.left = "50px";
            textElement.style.top = "50px";
            textElement.style.position = "absolute";

            makeDraggable(textElement, currentPageNumber);
            canvases[currentPageNumber].canvas.parentElement.appendChild(textElement);

            if (!objects[currentPageNumber]) {
                objects[currentPageNumber] = [];
            }

            objects[currentPageNumber].push({
                id: Date.now(),
                type: 'text',
                content: textContent,
                x: 50,
                y: 50,
                fontSize: fontSize,
                color: fontColor
            });

            textElement.addEventListener('dblclick', () => {
                document.getElementById("text-content").value = textElement.innerText;
                document.getElementById("font-size").value = parseInt(window.getComputedStyle(textElement).fontSize);
                document.getElementById("font-color").value = window.getComputedStyle(textElement).color;
                textFormattingModal.show();
            });

            textFormattingModal.hide();
        } else {
            showAlert("Text content cannot be empty.", "danger");
        }
    }

    function handleImageUpload() {
        const file = imageInput.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const imageElement = document.createElement("img");
                    imageElement.className = "draggable image-element";
                    imageElement.src = img.src;
                    imageElement.style.width = "100px";
                    imageElement.style.height = "100px";
                    imageElement.style.left = "50px";
                    imageElement.style.top = "50px";
                    imageElement.style.position = "absolute";

                    makeDraggable(imageElement, currentPageNumber);
                    canvases[currentPageNumber].canvas.parentElement.appendChild(imageElement);

                    if (!objects[currentPageNumber]) {
                        objects[currentPageNumber] = [];
                    }

                    objects[currentPageNumber].push({
                        id: Date.now(),
                        type: 'image',
                        src: img.src,
                        x: 50,
                        y: 50,
                        width: 100,
                        height: 100
                    });

                    imageUploadModal.hide();
                };
            };
            reader.readAsDataURL(file);
        } else {
            showAlert("Please upload a valid image file.", "danger");
        }
    }

    function addShape(type) {
        const shape = document.createElement("div");
        shape.className = `draggable ${type}-shape`;
        shape.style.position = "absolute";
        shape.style.left = "50px";
        shape.style.top = "50px";

        switch (type) {
            case 'rectangle':
                shape.style.width = "100px";
                shape.style.height = "50px";
                shape.style.backgroundColor = "transparent";
                shape.style.border = "2px solid black";
                break;
            case 'circle':
                shape.style.width = "100px";
                shape.style.height = "100px";
                shape.style.backgroundColor = "transparent";
                shape.style.border = "2px solid black";
                shape.style.borderRadius = "50%";
                break;
            case 'line':
                shape.style.width = "100px";
                shape.style.height = "2px";
                shape.style.backgroundColor = "black";
                break;
        }

        makeDraggable(shape, currentPageNumber);
        canvases[currentPageNumber].canvas.parentElement.appendChild(shape);

        if (!objects[currentPageNumber]) {
            objects[currentPageNumber] = [];
        }

        objects[currentPageNumber].push({
            id: Date.now(),
            type: type,
            x: 50,
            y: 50,
            width: type === 'line' ? 100 : 100,
            height: type === 'line' ? 2 : 50,
            borderColor: "black",
            fillColor: "transparent"
        });
    }

    async function savePDF() {
        const pdfLibDoc = await PDFLib.PDFDocument.create();

        for (const pageNum in canvases) {
            const page = pdfLibDoc.addPage([canvases[pageNum].canvas.width, canvases[pageNum].canvas.height]);
            const canvasDataUrl = canvases[pageNum].canvas.toDataURL("image/png").split(",")[1];
            const existingPageImage = await pdfLibDoc.embedPng(canvasDataUrl);
            page.drawImage(existingPageImage, {
                x: 0,
                y: 0,
                width: canvases[pageNum].canvas.width,
                height: canvases[pageNum].canvas.height
            });

            for (const obj of objects[pageNum] || []) {
                if (obj.type === 'text') {
                    const fontSize = parseFloat(obj.fontSize);
                    const [r, g, b] = hexToRgb(obj.color);
                    page.drawText(obj.content, {
                        x: obj.x,
                        y: canvases[pageNum].canvas.height - obj.y - fontSize,
                        size: fontSize,
                        color: PDFLib.rgb(r, g, b)
                    });
                } else if (obj.type === 'image') {
                    const imageBytes = await fetch(obj.src).then(res => res.arrayBuffer());
                    const embeddedImage = await pdfLibDoc.embedPng(imageBytes);
                    page.drawImage(embeddedImage, {
                        x: obj.x,
                        y: canvases[pageNum].canvas.height - obj.y - obj.height,
                        width: obj.width,
                        height: obj.height
                    });
                } else if (obj.type === 'rectangle') {
                    const [borderR, borderG, borderB] = hexToRgb(obj.borderColor);
                    const [fillR, fillG, fillB] = hexToRgb(obj.fillColor);
                    page.drawRectangle({
                        x: obj.x,
                        y: canvases[pageNum].canvas.height - obj.y - obj.height,
                        width: obj.width,
                        height: obj.height,
                        borderColor: PDFLib.rgb(borderR, borderG, borderB),
                        color: obj.fillColor === "transparent" ? undefined : PDFLib.rgb(fillR, fillG, fillB)
                    });
                } else if (obj.type === 'circle') {
                    const [borderR, borderG, borderB] = hexToRgb(obj.borderColor);
                    const [fillR, fillG, fillB] = hexToRgb(obj.fillColor);
                    page.drawEllipse({
                        x: obj.x + obj.width / 2,
                        y: canvases[pageNum].canvas.height - obj.y - obj.height / 2,
                        xScale: obj.width / 2,
                        yScale: obj.height / 2,
                        borderColor: PDFLib.rgb(borderR, borderG, borderB),
                        color: obj.fillColor === "transparent" ? undefined : PDFLib.rgb(fillR, fillG, fillB)
                    });
                } else if (obj.type === 'line') {
                    const [r, g, b] = hexToRgb(obj.borderColor);
                    page.drawLine({
                        start: { x: obj.x, y: canvases[pageNum].canvas.height - obj.y },
                        end: { x: obj.x + obj.width, y: canvases[pageNum].canvas.height - obj.y },
                        thickness: obj.height,
                        color: PDFLib.rgb(r, g, b)
                    });
                }
            }
        }

        const pdfBytes = await pdfLibDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "edited.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r / 255, g / 255, b / 255];
    }

    function showAlert(message, type) {
        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = "alert";
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertPlaceholder.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
});
