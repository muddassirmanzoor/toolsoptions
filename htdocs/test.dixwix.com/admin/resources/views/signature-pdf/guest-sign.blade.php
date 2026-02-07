<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign document - I Love PDF</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; min-height: 100vh; }
        .guest-header { background: #fff; border-bottom: 1px solid #eee; padding: 12px 24px; }
        .guest-header .logo { font-size: 20px; font-weight: bold; color: #F56129; }
        .guest-main { max-width: 900px; margin: 0 auto; padding: 24px; }
        .pdf-viewer-wrap { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 24px; }
        #pdfCanvas { max-width: 100%; height: auto; display: block; }
        .sign-options { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px; }
        .sign-options h5 { margin-bottom: 16px; font-weight: 600; }
        #signatureCanvas { border: 2px solid #ddd; border-radius: 8px; cursor: crosshair; background: #fff; touch-action: none; }
        .btn-sign-submit { background: #F56129; color: #fff; border: none; padding: 12px 32px; font-weight: 600; border-radius: 8px; }
        .btn-sign-submit:hover { background: #e04a1f; color: #fff; }
        .terms-link { color: #F56129; text-decoration: underline; }
        #termsModal.terms-modal-hidden { display: none !important; }
        .text-signature-error { color: #dc3545; }
        .btn-continue-guest { background: #F56129; border-color: #F56129; color: #fff; font-weight: 600; }
        .btn-continue-guest:hover { background: #e04a1f; border-color: #e04a1f; color: #fff; }
        .form-label .text-danger { color: #F56129; }
        /* Set your signature details modal (like tools / iLovePDF reference) */
        #setSignatureModal .modal-title { color: #F56129; font-weight: 700; }
        #setSignatureModal .nav-link { color: #666; }
        #setSignatureModal .nav-link.active { color: #F56129; font-weight: 600; border-bottom: 2px solid #F56129; border-radius: 0; }
        .signature-option-guest { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; margin-bottom: 8px; text-align: center; font-size: 1.1rem; background: #fff; }
        .signature-option-guest:hover, .signature-option-guest.selected { border-color: #F56129; background: #fff8f5; }
        .btn-apply-guest { background: #F56129; color: #fff; border: none; font-weight: 600; }
        .btn-apply-guest:hover { background: #e04a1f; color: #fff; }
        /* Signing layout: document + sign options (like reference) */
        .signing-layout { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
        .signing-doc-wrap { flex: 1; min-width: 280px; }
        .signing-options-wrap { width: 320px; flex-shrink: 0; }
        .pdf-canvas-wrap { position: relative; display: inline-block; max-width: 100%; overflow: hidden; }
        .pdf-canvas-wrap canvas { display: block; max-width: 100%; height: auto; vertical-align: top; }
        .signature-field-overlay { position: absolute; border: 2px dashed #F56129; background: rgba(255,112,42,0.06); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .signature-field-overlay:hover { background: rgba(255,112,42,0.12); }
        .signature-field-overlay .field-label { font-size: 12px; color: #F56129; font-weight: 600; margin-bottom: 2px; }
        .signature-field-overlay .field-hint { font-size: 11px; color: #888; }
        .signature-field-overlay.filled { border-style: solid; background: transparent; cursor: default; }
        .signature-field-overlay.filled img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .start-btn-overlay { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; background: #F56129; color: #fff; border: none; padding: 14px 32px; font-weight: 700; font-size: 18px; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(245,97,41,0.4); }
        .start-btn-overlay:hover { background: #e04a1f; color: #fff; }
        .start-btn-overlay.hidden { display: none !important; }
        .signature-preview-box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fafafa; min-height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .signature-preview-box img { max-width: 100%; max-height: 48px; object-fit: contain; }
        .btn-sign-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .signing-overlay { position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(248,247,250,0.95); z-index: 9999; display: none; align-items: center; justify-content: center; flex-direction: column; }
        .signing-overlay.show { display: flex; }
        .signing-overlay .spinner { width: 48px; height: 48px; border: 4px solid #eee; border-top-color: #F56129; border-radius: 50%; animation: signing-spin 0.8s linear infinite; }
        .signing-overlay .text { margin-top: 16px; font-size: 18px; font-weight: 600; color: #333; }
        @keyframes signing-spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <header class="guest-header">
        <span class="logo">I Love PDF Signature</span>
    </header>

    <main class="guest-main">
        <!-- Terms & Conditions Modal -->
        <div class="modal show d-block" id="termsModal" tabindex="-1" aria-modal="true" role="dialog" style="background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Your signature is required</h5>
                    </div>
                    <div class="modal-body">
                        <p class="mb-2">To continue to sign as a guest you must first read and accept our <a href="#" class="terms-link" id="termsLink">Terms &amp; Conditions</a>.</p>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="acceptTermsCheck">
                            <label class="form-check-label" for="acceptTermsCheck">I accept the Terms &amp; Conditions.</label>
                        </div>
                        <p class="text-signature-error small mb-0 d-none" id="termsError">Please accept Terms and Conditions</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <a href="{{ url('/login') }}" class="btn btn-link text-decoration-none p-0 me-3" style="color: #F56129;">Log in</a>
                        <button type="button" class="btn btn-continue-guest" id="continueBtn">Continue</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Set your signature details modal (like reference: full name pre-filled from send-and-sign receiver) -->
        <div class="modal" id="setSignatureModal" tabindex="-1" aria-labelledby="setSignatureModalLabel" aria-hidden="true" style="display: none;">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title" id="setSignatureModalLabel">Set your signature details</h5>
                        <a href="{{ url('/login') }}" class="btn btn-outline-danger btn-sm">Login</a>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Full name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="guestFullName" placeholder="Your full name" required maxlength="255" value="{{ old('name', $receiver->name ?? '') }}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Initials</label>
                            <input type="text" class="form-control" id="guestInitials" placeholder="e.g. JD" maxlength="10" value="@php
$name = $receiver->name ?? '';
$parts = array_slice(array_filter(explode(' ', $name)), 0, 2);
echo $name !== '' ? implode('', array_map(function($p) { return mb_substr(trim($p), 0, 1); }, $parts)) : '';
@endphp">
                        </div>
                        <ul class="nav nav-tabs mb-3" role="tablist">
                            <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#guestTabSignature" type="button">Signature</button></li>
                            <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#guestTabDraw" type="button">Draw</button></li>
                        </ul>
                        <div class="tab-content">
                            <div class="tab-pane fade show active" id="guestTabSignature">
                                <p class="small text-muted mb-2">Choose a signature style</p>
                                <div id="guestSignaturePreviews" class="mb-3"></div>
                                <canvas id="guestStyleCanvas" width="400" height="100" style="border: 1px solid #ddd; background: #fff; display: block; max-width: 100%; margin-top: 10px;"></canvas>
                            </div>
                            <div class="tab-pane fade" id="guestTabDraw">
                                <p class="small text-muted mb-2">Draw your signature here</p>
                                <canvas id="guestDrawCanvas" width="400" height="120" style="border: 2px solid #ddd; border-radius: 8px; cursor: crosshair; background: #fff; display: block; max-width: 100%;"></canvas>
                                <button type="button" class="btn btn-outline-secondary btn-sm mt-2" id="guestClearDrawBtn">Clear</button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-apply-guest" id="guestApplySignatureBtn">Apply</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Signing document... overlay (shown when Sign is clicked) -->
        <div class="signing-overlay" id="signingOverlay">
            <div class="spinner"></div>
            <div class="text">Signing document...</div>
        </div>

        <!-- Signing UI (hidden until signature details applied) - like reference: doc + sign options -->
        <div id="signingUI" style="display: none;">
            <div class="signing-layout">
                <div class="signing-doc-wrap">
                    <div class="pdf-viewer-wrap">
                        <div class="p-2 border-bottom bg-light d-flex align-items-center gap-2">
                            <span class="small text-muted">{{ $signatureRequest->document_name }}</span>
                            <span class="small text-muted ms-2">Page 1 of 1</span>
                        </div>
                        <div class="p-2">
                            <div class="pdf-canvas-wrap" id="pdfCanvasWrap">
                                <canvas id="pdfCanvas"></canvas>
                                <div id="signatureFieldOverlays"></div>
                                <button type="button" class="start-btn-overlay" id="startSignBtn">Start</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="signing-options-wrap">
                    <div class="sign-options">
                        <h5>Sign options</h5>
                        <div class="mb-3">
                            <label class="form-label small text-muted mb-1">Settings</label>
                            <div class="signature-preview-box" id="signaturePreviewBox">
                                <span class="small text-muted" id="signaturePreviewPlaceholder">Your signature</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted mb-1">Validation options</label>
                            <button type="button" class="btn btn-outline-secondary btn-sm w-100" id="declineDocBtn" disabled><i class="fas fa-arrow-left me-1"></i> Decline document</button>
                        </div>
                        <p class="small text-muted mb-2" id="fieldsToFillText">1 field to fill in</p>
                        <input type="hidden" id="signerName" value="">
                        <button type="button" class="btn btn-sign-submit w-100" id="signSubmitBtn" disabled>
                            <i class="fas fa-pen me-1"></i> Sign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        (function() {
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }

            const token = @json($token);
            const documentUrl = @json($documentUrl);
            const signUrl = @json($signUrl);
            const fieldPositions = @json($signatureRequest->settings['field_positions'] ?? []);

            const termsModal = document.getElementById('termsModal');
            const acceptCheck = document.getElementById('acceptTermsCheck');
            const continueBtn = document.getElementById('continueBtn');
            const setSignatureModal = document.getElementById('setSignatureModal');
            const signingUI = document.getElementById('signingUI');
            const pdfCanvas = document.getElementById('pdfCanvas');
            const pdfCanvasWrap = document.getElementById('pdfCanvasWrap');
            const signatureFieldOverlays = document.getElementById('signatureFieldOverlays');
            const startSignBtn = document.getElementById('startSignBtn');
            const signerNameInput = document.getElementById('signerName');
            const signSubmitBtn = document.getElementById('signSubmitBtn');
            const signaturePreviewBox = document.getElementById('signaturePreviewBox');
            const signaturePreviewPlaceholder = document.getElementById('signaturePreviewPlaceholder');
            const guestFullName = document.getElementById('guestFullName');
            const guestInitials = document.getElementById('guestInitials');
            const guestSignaturePreviews = document.getElementById('guestSignaturePreviews');
            const guestStyleCanvas = document.getElementById('guestStyleCanvas');
            const guestDrawCanvas = document.getElementById('guestDrawCanvas');
            const guestClearDrawBtn = document.getElementById('guestClearDrawBtn');
            const guestApplySignatureBtn = document.getElementById('guestApplySignatureBtn');

            let chosenSignatureDataUrl = null;
            let viewportWidth = 0, viewportHeight = 0;
            let pageWidthPdf = 0, pageHeightPdf = 0;
            let signaturePlaced = false;
            let startClicked = false;

            function generateSignatureOptions(name) {
                var fonts = ['Arial', 'Georgia', 'Verdana', 'Times New Roman', 'Comic Sans MS', 'Trebuchet MS', 'Garamond', 'Palatino', 'Candara', 'Rockwell'];
                return fonts.map(function(font) { return { font: font, text: name }; });
            }

            function drawGuestStyleSignature(signature) {
                if (!guestStyleCanvas) return;
                var ctx = guestStyleCanvas.getContext('2d');
                ctx.clearRect(0, 0, guestStyleCanvas.width, guestStyleCanvas.height);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 40px "' + signature.font + '", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(signature.text, guestStyleCanvas.width / 2, guestStyleCanvas.height / 2);
            }

            function onGuestNameChange() {
                var name = (guestFullName && guestFullName.value) ? guestFullName.value.trim() : '';
                if (!guestSignaturePreviews) return;
                guestSignaturePreviews.innerHTML = '';
                var options = generateSignatureOptions(name || 'Your name');
                options.forEach(function(sig, i) {
                    var div = document.createElement('div');
                    div.className = 'signature-option-guest' + (i === 0 ? ' selected' : '');
                    div.textContent = sig.text;
                    div.style.fontFamily = '"' + sig.font + '", Arial, sans-serif';
                    div.addEventListener('click', function() {
                        guestSignaturePreviews.querySelectorAll('.signature-option-guest').forEach(function(el) { el.classList.remove('selected'); });
                        div.classList.add('selected');
                        drawGuestStyleSignature(sig);
                    });
                    guestSignaturePreviews.appendChild(div);
                });
                if (options.length > 0) drawGuestStyleSignature(options[0]);
            }

            function showSetSignatureModal() {
                if (setSignatureModal) {
                    setSignatureModal.style.display = 'block';
                    setSignatureModal.classList.add('show');
                    document.body.classList.add('modal-open');
                    var backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    backdrop.id = 'setSignatureBackdrop';
                    document.body.appendChild(backdrop);
                }
                var name = (guestFullName && guestFullName.value) ? guestFullName.value.trim() : '';
                if (guestSignaturePreviews) {
                    guestSignaturePreviews.innerHTML = '';
                    var options = generateSignatureOptions(name || 'Your name');
                    options.forEach(function(sig, i) {
                        var div = document.createElement('div');
                        div.className = 'signature-option-guest' + (i === 0 ? ' selected' : '');
                        div.textContent = sig.text;
                        div.style.fontFamily = '"' + sig.font + '", Arial, sans-serif';
                        div.addEventListener('click', function() {
                            guestSignaturePreviews.querySelectorAll('.signature-option-guest').forEach(function(el) { el.classList.remove('selected'); });
                            div.classList.add('selected');
                            drawGuestStyleSignature(sig);
                        });
                        guestSignaturePreviews.appendChild(div);
                    });
                    if (options.length > 0) drawGuestStyleSignature(options[0]);
                }
                if (guestFullName) {
                    guestFullName.removeEventListener('input', onGuestNameChange);
                    guestFullName.addEventListener('input', onGuestNameChange);
                }
                if (guestStyleCanvas) {
                    var styleCtx = guestStyleCanvas.getContext('2d');
                    if (styleCtx) styleCtx.clearRect(0, 0, guestStyleCanvas.width, guestStyleCanvas.height);
                }
                if (guestDrawCanvas) {
                    var drawCtx = guestDrawCanvas.getContext('2d');
                    if (drawCtx) drawCtx.clearRect(0, 0, guestDrawCanvas.width, guestDrawCanvas.height);
                }
            }

            function hideSetSignatureModal() {
                if (setSignatureModal) {
                    setSignatureModal.style.display = 'none';
                    setSignatureModal.classList.remove('show');
                }
                document.body.classList.remove('modal-open');
                var b = document.getElementById('setSignatureBackdrop');
                if (b) b.remove();
            }

            if (guestDrawCanvas) {
                var guestDrawCtx = guestDrawCanvas.getContext('2d');
                if (guestDrawCtx) {
                    guestDrawCtx.strokeStyle = '#000';
                    guestDrawCtx.lineWidth = 2;
                    guestDrawCtx.lineCap = 'round';
                    guestDrawCtx.lineJoin = 'round';
                    var guestDrawing = false;
                    function guestDrawMove(clientX, clientY) {
                        if (!guestDrawCtx) return;
                        var rect = guestDrawCanvas.getBoundingClientRect();
                        var scaleX = guestDrawCanvas.width / rect.width, scaleY = guestDrawCanvas.height / rect.height;
                        var x = (clientX - rect.left) * scaleX, y = (clientY - rect.top) * scaleY;
                        if (guestDrawing) {
                            guestDrawCtx.lineTo(x, y);
                            guestDrawCtx.stroke();
                        }
                        guestDrawCtx.beginPath();
                        guestDrawCtx.moveTo(x, y);
                    }
                    guestDrawCanvas.addEventListener('mousedown', function(e) { guestDrawing = true; guestDrawMove(e.clientX, e.clientY); });
                    guestDrawCanvas.addEventListener('mouseup', function() { guestDrawing = false; });
                    guestDrawCanvas.addEventListener('mouseleave', function() { guestDrawing = false; });
                    guestDrawCanvas.addEventListener('mousemove', function(e) { guestDrawMove(e.clientX, e.clientY); });
                    guestDrawCanvas.addEventListener('touchstart', function(e) { e.preventDefault(); guestDrawing = true; var t = e.touches[0]; guestDrawCtx.beginPath(); guestDrawMove(t.clientX, t.clientY); });
                    guestDrawCanvas.addEventListener('touchend', function(e) { e.preventDefault(); guestDrawing = false; });
                    guestDrawCanvas.addEventListener('touchmove', function(e) { e.preventDefault(); var t = e.touches[0]; guestDrawMove(t.clientX, t.clientY); });
                }
                if (guestClearDrawBtn) guestClearDrawBtn.addEventListener('click', function() {
                    if (guestDrawCtx) guestDrawCtx.clearRect(0, 0, guestDrawCanvas.width, guestDrawCanvas.height);
                });
            }

            if (guestApplySignatureBtn) guestApplySignatureBtn.addEventListener('click', function() {
                var fullName = (guestFullName && guestFullName.value) ? guestFullName.value.trim() : '';
                if (!fullName) {
                    alert('Please enter your full name.');
                    return;
                }
                var activeTab = setSignatureModal && setSignatureModal.querySelector('.nav-link.active');
                var isDrawTab = activeTab && activeTab.getAttribute('data-bs-target') === '#guestTabDraw';
                var dataUrl = null;
                if (isDrawTab && guestDrawCanvas) {
                    dataUrl = guestDrawCanvas.toDataURL('image/png');
                    var dctx = guestDrawCanvas.getContext('2d');
                    if (dctx) {
                        var id = dctx.getImageData(0, 0, guestDrawCanvas.width, guestDrawCanvas.height);
                        var hasStroke = false;
                        for (var i = 0; i < id.data.length; i += 4) { if (id.data[i] !== 255 || id.data[i+1] !== 255 || id.data[i+2] !== 255) { hasStroke = true; break; } }
                        if (!hasStroke) {
                            alert('Please draw your signature in the Draw tab, or choose a style in the Signature tab.');
                            return;
                        }
                    }
                } else if (guestStyleCanvas) {
                    dataUrl = guestStyleCanvas.toDataURL('image/png');
                }
                if (!dataUrl || dataUrl.length < 100) {
                    alert('Please choose a signature style or draw your signature.');
                    return;
                }
                chosenSignatureDataUrl = dataUrl;
                if (signerNameInput) signerNameInput.value = fullName;
                hideSetSignatureModal();
                if (signingUI) signingUI.style.display = 'block';
                loadPdfAndSetup();
            });

            const termsError = document.getElementById('termsError');
            acceptCheck.addEventListener('change', function() {
                continueBtn.disabled = !this.checked;
                if (termsError) termsError.classList.add('d-none');
            });

            continueBtn.addEventListener('click', function() {
                if (!acceptCheck.checked) {
                    if (termsError) termsError.classList.remove('d-none');
                    return;
                }
                if (termsError) termsError.classList.add('d-none');
                if (termsModal) termsModal.classList.add('terms-modal-hidden');
                showSetSignatureModal();
            });

            let pdfDoc = null;
            let pdfBytes = null;
            let pdfBytesForSign = null;

            if (startSignBtn) startSignBtn.addEventListener('click', function() {
                startClicked = true;
                startSignBtn.classList.add('hidden');
            });

            async function loadPdfAndSetup() {
                try {
                    const resp = await fetch(documentUrl, { credentials: 'same-origin' });
                    if (!resp.ok) throw new Error('Failed to load document');
                    const blob = await resp.blob();
                    pdfBytes = await blob.arrayBuffer();
                    pdfBytesForSign = pdfBytes.slice(0);
                    const data = await pdfjsLib.getDocument(pdfBytes).promise;
                    pdfDoc = data;
                    const page = await pdfDoc.getPage(1);
                    // PDF page size in points (scale 1.0) - used for overlay positioning so it matches tools
                    const pageViewport1 = page.getViewport({ scale: 1.0 });
                    pageWidthPdf = pageViewport1.width;
                    pageHeightPdf = pageViewport1.height;
                    // Scale to fit container so view is not huge (match tools behaviour)
                    var containerEl = pdfCanvasWrap && pdfCanvasWrap.parentElement ? pdfCanvasWrap.parentElement : null;
                    var containerWidth = containerEl ? (containerEl.clientWidth || containerEl.offsetWidth) - 32 : 800;
                    if (containerWidth < 280) containerWidth = 280;
                    var scale = Math.min(containerWidth / pageWidthPdf, 2.5);
                    if (scale < 0.5) scale = 0.5;
                    const viewport = page.getViewport({ scale: scale });
                    viewportWidth = viewport.width;
                    viewportHeight = viewport.height;
                    pdfCanvas.width = viewport.width;
                    pdfCanvas.height = viewport.height;
                    const ctx = pdfCanvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                } catch (e) {
                    console.error(e);
                    alert('Could not load the document.');
                    return;
                }

                if (pdfCanvasWrap) {
                    pdfCanvasWrap.style.width = viewportWidth + 'px';
                    pdfCanvasWrap.style.maxWidth = '100%';
                    pdfCanvasWrap.style.height = 'auto';
                    pdfCanvasWrap.style.aspectRatio = viewportWidth + ' / ' + viewportHeight;
                }

                signatureFieldOverlays.innerHTML = '';
                signatureFieldOverlays.style.position = 'absolute';
                signatureFieldOverlays.style.left = '0';
                signatureFieldOverlays.style.top = '0';
                signatureFieldOverlays.style.width = '100%';
                signatureFieldOverlays.style.height = '100%';
                signatureFieldOverlays.style.pointerEvents = 'none';
                var fields = (fieldPositions && fieldPositions['1']) ? fieldPositions['1'] : [];
                if (fields.length === 0) {
                    fields = [{ type: 'signature', pdfX: pageWidthPdf * 0.5 - 90, pdfY: pageHeightPdf - 120 - 54, pdfWidth: 180, pdfHeight: 54 }];
                }
                window.guestFieldPositions = { '1': fields };
                fields.forEach(function(f, idx) {
                    var leftPct, topPct, wPct, hPct;
                    if (f.pdfX != null && f.pdfY != null && f.pdfWidth != null && f.pdfHeight != null && pageWidthPdf > 0 && pageHeightPdf > 0) {
                        var pfX = parseFloat(f.pdfX), pfY = parseFloat(f.pdfY), pfW = parseFloat(f.pdfWidth), pfH = parseFloat(f.pdfHeight);
                        // PDF coords: (pdfX, pdfY) is bottom-left. Top of rect = pdfY+pfH. Use % so overlay scales with wrapper.
                        leftPct = (pfX / pageWidthPdf) * 100;
                        topPct = ((pageHeightPdf - pfY - pfH) / pageHeightPdf) * 100;
                        wPct = (pfW / pageWidthPdf) * 100;
                        hPct = (pfH / pageHeightPdf) * 100;
                    } else {
                        // Fallback for old requests: f.x/f.y are in tools pixels, not comparable; use bottom-center
                        var defW = 180, defH = 54;
                        leftPct = ((pageWidthPdf / 2 - defW / 2) / pageWidthPdf) * 100;
                        topPct = ((pageHeightPdf - 120 - defH) / pageHeightPdf) * 100;
                        wPct = (defW / pageWidthPdf) * 100;
                        hPct = (defH / pageHeightPdf) * 100;
                    }
                    var div = document.createElement('div');
                    div.className = 'signature-field-overlay';
                    div.setAttribute('data-field-index', idx);
                    div.style.left = leftPct + '%';
                    div.style.top = topPct + '%';
                    div.style.width = wPct + '%';
                    div.style.height = hPct + '%';
                    div.style.pointerEvents = 'auto';
                    div.innerHTML = '<span class="field-label">Signature</span><span class="field-hint">Click to sign</span>';
                    div.addEventListener('click', function() {
                        if (!startClicked) return;
                        if (div.classList.contains('filled')) return;
                        if (!chosenSignatureDataUrl) return;
                        div.classList.add('filled');
                        div.innerHTML = '';
                        var img = document.createElement('img');
                        img.src = chosenSignatureDataUrl;
                        img.alt = 'Signature';
                        div.appendChild(img);
                        signaturePlaced = true;
                        signSubmitBtn.disabled = false;
                    });
                    signatureFieldOverlays.appendChild(div);
                });

                if (startSignBtn) startSignBtn.classList.remove('hidden');
                startClicked = false;
                signaturePlaced = false;
                signSubmitBtn.disabled = true;

                if (chosenSignatureDataUrl && signaturePreviewBox && signaturePreviewPlaceholder) {
                    signaturePreviewPlaceholder.style.display = 'none';
                    var prevImg = signaturePreviewBox.querySelector('img');
                    if (prevImg) prevImg.remove();
                    var img = document.createElement('img');
                    img.src = chosenSignatureDataUrl;
                    img.alt = 'Your signature';
                    signaturePreviewBox.appendChild(img);
                }
            }

            signSubmitBtn.addEventListener('click', async function() {
                const name = (signerNameInput && signerNameInput.value) ? signerNameInput.value.trim() : '';
                if (!name) {
                    alert('Please enter your full name.');
                    return;
                }
                if (!chosenSignatureDataUrl || chosenSignatureDataUrl.length < 100) {
                    alert('Please place your signature on the document by clicking the signature field.');
                    return;
                }
                if (!signaturePlaced) {
                    alert('Please click on the signature field on the document to place your signature.');
                    return;
                }

                signSubmitBtn.disabled = true;
                signSubmitBtn.innerHTML = 'Signing... <span class="spinner-border spinner-border-sm"></span>';
                var signingOverlay = document.getElementById('signingOverlay');
                if (signingOverlay) signingOverlay.classList.add('show');

                try {
                    const bytesToLoad = (pdfBytesForSign && pdfBytesForSign.byteLength > 0) ? pdfBytesForSign : pdfBytes;
                    const pdfLibDoc = await PDFLib.PDFDocument.load(bytesToLoad);
                    const pages = pdfLibDoc.getPages();
                    const page = pages[0];
                    const { width: pageWidth, height: pageHeight } = page.getSize();

                    const base64Data = chosenSignatureDataUrl.split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    const img = await pdfLibDoc.embedPng(imageBytes);

                    var fieldsPage1 = (typeof window.guestFieldPositions !== 'undefined' && window.guestFieldPositions['1']) ? window.guestFieldPositions['1'] : (fieldPositions && fieldPositions['1']);
                    var f = (fieldsPage1 && fieldsPage1[0]) ? fieldsPage1[0] : null;
                    var pdfX = 100, pdfY = pageHeight - 150, pdfW = 180, pdfH = 54;
                    if (f) {
                        if (f.pdfX != null && f.pdfY != null && f.pdfWidth != null && f.pdfHeight != null) {
                            pdfX = parseFloat(f.pdfX);
                            pdfY = parseFloat(f.pdfY);
                            pdfW = parseFloat(f.pdfWidth);
                            pdfH = parseFloat(f.pdfHeight);
                        } else {
                            var scaleX = viewportWidth > 0 ? pageWidth / viewportWidth : 1;
                            var scaleY = viewportHeight > 0 ? pageHeight / viewportHeight : 1;
                            var fx = f.x ?? 100, fy = f.y ?? (viewportHeight - 54), fw = f.width || 180, fh = f.height || 54;
                            pdfX = fx * scaleX;
                            pdfY = pageHeight - (fy * scaleY) - (fh * scaleY);
                            pdfW = fw * scaleX;
                            pdfH = fh * scaleY;
                        }
                    }
                    // pdf-lib: origin bottom-left. Clamp so image is always on page (fixes "no sign on downloaded file")
                    pdfW = Math.max(10, Math.min(pdfW, pageWidth));
                    pdfH = Math.max(10, Math.min(pdfH, pageHeight));
                    pdfX = Math.max(0, Math.min(pdfX, pageWidth - pdfW));
                    pdfY = Math.max(0, Math.min(pdfY, pageHeight - pdfH));

                    page.drawImage(img, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });

                    const saved = await pdfLibDoc.save();
                    var bytes = new Uint8Array(saved);
                    var chunk = 8192;
                    var binary = '';
                    for (var i = 0; i < bytes.length; i += chunk) {
                        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
                    }
                    const base64 = btoa(binary);

                    const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                    const resp = await fetch(signUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': csrf,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify({
                            signer_name: name,
                            signed_pdf_base64: base64,
                            _token: csrf,
                        }),
                        credentials: 'same-origin',
                    });

                    const data = await resp.json().catch(() => ({}));
                    if (resp.ok && data.redirect) {
                        window.location.href = data.redirect;
                        return;
                    }
                    if (signingOverlay) signingOverlay.classList.remove('show');
                    alert(data.message || 'Something went wrong. Please try again.');
                    signSubmitBtn.disabled = false;
                    signSubmitBtn.innerHTML = '<i class="fas fa-pen me-1"></i> Sign';
                } catch (e) {
                    console.error(e);
                    if (signingOverlay) signingOverlay.classList.remove('show');
                    alert('An error occurred. Please try again.');
                    signSubmitBtn.disabled = false;
                    signSubmitBtn.innerHTML = '<i class="fas fa-pen me-1"></i> Sign';
                }
            });
        })();
    </script>
</body>
</html>
