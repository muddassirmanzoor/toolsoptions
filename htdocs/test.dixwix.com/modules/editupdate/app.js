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
    const zoomInBtn = document.getElementById("zoom-in-btn");
    const zoomOutBtn = document.getElementById("zoom-out-btn");

    let pdfDoc;
    let currentPageNumber = 1;
    let canvases = {};
    let objects = {};
    let scale = 1; // Initial scale factor

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

    zoomInBtn.addEventListener("click", () => changeZoom(1.1));
    zoomOutBtn.addEventListener("click", () => changeZoom(0.9));
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
                }).catch(error => {
                    console.error("Error loading PDF:", error);
                    showAlert("An error occurred while loading the PDF. Check console for details.", "danger");
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
        // Ensure that the canvas for the current page is created and set up
        if (!canvases[pageNumber]) {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            canvas.className = "pdf-page-canvas";
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            canvasContainer.innerHTML = ""; // Clear previous canvases
            canvasContainer.appendChild(canvas);

            canvases[pageNumber] = { canvas, context };

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
        }

        // Render objects on the current page
        renderObjects(pageNumber);
    }


    function renderObjects(pageNumber) {
        if (!objects[pageNumber]) return; // No objects to render

        const { canvas, context } = canvases[pageNumber];
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
            obj.y = canvasRect.bottom - elementRect.bottom;
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
        }
    }

    function handleImageUpload() {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imgElement = document.createElement("img");
                imgElement.src = e.target.result;
                imgElement.style.position = "absolute";
                imgElement.style.left = "50px";
                imgElement.style.top = "50px";
                imgElement.className = "draggable image-element";

                imgElement.onload = () => {
                    makeDraggable(imgElement, currentPageNumber);
                    canvases[currentPageNumber].canvas.parentElement.appendChild(imgElement);

                    if (!objects[currentPageNumber]) {
                        objects[currentPageNumber] = [];
                    }

                    objects[currentPageNumber].push({
                        id: Date.now(),
                        type: 'image',
                        src: e.target.result,
                        x: 50,
                        y: 50,
                        width: imgElement.width,
                        height: imgElement.height
                    });

                    imageUploadModal.hide();
                };
            };
            reader.readAsDataURL(file);
        }
    }

    function addShape(shapeType) {
        const shapeElement = document.createElement("div");
        shapeElement.className = `draggable ${shapeType}-element`;
        shapeElement.style.position = "absolute";
        shapeElement.style.left = "50px";
        shapeElement.style.top = "50px";
        shapeElement.style.border = "2px solid black";
        shapeElement.style.backgroundColor = "transparent";

        switch (shapeType) {
            case 'rectangle':
                shapeElement.style.width = "100px";
                shapeElement.style.height = "50px";
                break;
            case 'circle':
                shapeElement.style.width = "100px";
                shapeElement.style.height = "100px";
                shapeElement.style.borderRadius = "50%";
                break;
            case 'line':
                shapeElement.style.width = "100px";
                shapeElement.style.height = "2px";
                shapeElement.style.backgroundColor = "black";
                break;
        }

        makeDraggable(shapeElement, currentPageNumber);
        canvases[currentPageNumber].canvas.parentElement.appendChild(shapeElement);

        if (!objects[currentPageNumber]) {
            objects[currentPageNumber] = [];
        }

        objects[currentPageNumber].push({
            id: Date.now(),
            type: shapeType,
            x: 50,
            y: 50,
            width: parseInt(window.getComputedStyle(shapeElement).width),
            height: parseInt(window.getComputedStyle(shapeElement).height),
            borderColor: "black",
            fillColor: "transparent"
        });
    }

    async function savePDF() {
    try {
        const pdfLibDoc = await PDFLib.PDFDocument.create();

        for (const pageNum in canvases) {
            const canvas = canvases[pageNum].canvas;
            const page = pdfLibDoc.addPage([canvas.width, canvas.height]);

            // Add the canvas image to the PDF page
            const canvasDataUrl = canvas.toDataURL("image/png").split(",")[1];
            const existingPageImage = await pdfLibDoc.embedPng(canvasDataUrl);
            page.drawImage(existingPageImage, {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height
            });

            // Add all resizable elements
            const pageObjects = objects[pageNum] || [];
            for (const obj of pageObjects) {
                switch (obj.type) {
                    case 'text':
                        page.drawText(obj.content, {
                            x: obj.x,
                            y: canvas.height - obj.y - obj.fontSize, // Corrected y-axis calculation
                            size: obj.fontSize,
                            color: PDFLib.rgb(...hexToRgb(obj.color))
                        });
                        break;
                    case 'image':
                        const img = await pdfLibDoc.embedPng(obj.src);
                        page.drawImage(img, {
                            x: obj.x,
                            y: canvas.height - obj.y - obj.height, // Corrected y-axis calculation
                            width: obj.width,
                            height: obj.height
                        });
                        break;
                    case 'rectangle':
                        page.drawRectangle({
                            x: obj.x,
                            y: canvas.height - obj.y - obj.height, // Corrected y-axis calculation
                            width: obj.width,
                            height: obj.height,
                            borderColor: PDFLib.rgb(...hexToRgb(obj.borderColor)),
                            color: obj.fillColor === 'transparent' ? undefined : PDFLib.rgb(...hexToRgb(obj.fillColor)),
                            borderWidth: obj.borderWidth || 1 // Added border width
                        });
                        break;
                    case 'circle':
                        page.drawEllipse({
                            x: obj.x + obj.width / 2,
                            y: canvas.height - obj.y - obj.height / 2, // Corrected y-axis calculation
                            xScale: obj.width / 2,
                            yScale: obj.height / 2,
                            borderColor: PDFLib.rgb(...hexToRgb(obj.borderColor)),
                            color: obj.fillColor === 'transparent' ? undefined : PDFLib.rgb(...hexToRgb(obj.fillColor)),
                            borderWidth: obj.borderWidth || 1 // Added border width
                        });
                        break;
                    case 'line':
                        page.drawLine({
                            start: { x: obj.x, y: canvas.height - obj.y }, // Corrected y-axis calculation
                            end: { x: obj.x + obj.width, y: canvas.height - obj.y }, // Corrected y-axis calculation
                            color: PDFLib.rgb(...hexToRgb(obj.borderColor)),
                            thickness: obj.height
                        });
                        break;
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

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error saving PDF:", error);
        showAlert("An error occurred while saving the PDF. Check console for details.", "danger");
    }
}

function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return [r / 255, g / 255, b / 255];
}

function showAlert(message, type) {
    alertPlaceholder.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

function changeZoom(factor) {
    scale *= factor; // Update scale factor
    renderPDFPage(currentPageNumber); // Re-render current page with new scale
}

async function renderPDFPage(pageNumber) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale }); // Use the updated scale

    // Clear existing canvas if it exists
    if (canvases[pageNumber]) {
        canvases[pageNumber].canvas.remove();
        delete canvases[pageNumber];
    }

    const canvas = document.createElement("canvas");
    canvas.className = "pdf-page-canvas";
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");

    canvasContainer.innerHTML = ""; // Clear previous canvases
    canvasContainer.appendChild(canvas);

    canvases[pageNumber] = { canvas, context };

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    // Render objects (shapes, text, images, etc.) on the current page
    renderObjects(pageNumber);
}

});
