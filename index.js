const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');

// const fs = require('fs');
const fs = require('fs').promises;
const fsNormal = require('fs');
const cors = require('cors');
const https = require('https');
const http = require('http');
require('dotenv').config();
const glob = require('glob'); // Requires glob package to match files
const JSZip = require('jszip');
const puppeteer = require('puppeteer'); // Added Puppeteer for HTML to PDF conversion
const { spawn } = require('child_process');
const { recordProcessedFile } = require('./recordProcessedFile');

const app = express();
const port = process.env.PUBLIC_PORT || 3000;
const serverName = process.env.PUBLIC_SERVER_NAME || 'http://localhost';
const upload = multer({ dest: 'uploads/' });
const pythonPath = process.env.PYTHON_PATH || 'python';

app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies (for form data)

// Helper function to handle file deletion
const cleanUpFiles = async (inputPath, outputPath) => {
    try {
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
    } catch (unlinkErr) {
        console.error('Error removing files:', unlinkErr);
    }
};

// Helper function to record file for custom implementations
const recordFileForCustomTool = async (outputPath, toolName, userId, originalFilename) => {
    if (!toolName) return;
    
    const laravelStoragePath = path.join(__dirname, 'admin', 'storage', 'app', 'processed_files');
    const storageFileName = `${Date.now()}_${path.basename(outputPath)}`;
    const storagePath = path.join(laravelStoragePath, storageFileName);
    
    let fileStored = false;
    try {
        await fs.mkdir(laravelStoragePath, { recursive: true });
        await fs.copyFile(outputPath, storagePath);
        fileStored = true;
    } catch (err) {
        console.error('Error storing file:', err);
    }
    
    const finalUserId = userId ? parseInt(userId) : 1;
    const relativePath = fileStored ? `processed_files/${storageFileName}` : `uploads/${path.basename(outputPath)}`;
    
    try {
        await recordProcessedFile({
            userId: finalUserId,
            toolName: toolName,
            fileCount: 1,
            status: 'completed',
            filePath: relativePath,
            originalFilename: originalFilename || path.basename(outputPath),
            metadata: { file_stored: fileStored }
        });
    } catch (error) {
        console.error('Error recording file:', error);
    }
};

// Helper function to handle file conversion
const handleFileConversion = async (req, res, conversionCommand, outputExtension, toolName = null, userId = null) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 HANDLE FILE CONVERSION CALLED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Tool name: ${toolName || 'NOT PROVIDED'}`);
    console.log(`   User ID parameter: ${userId || 'NOT PROVIDED'}`);
    console.log(`   Output extension: ${outputExtension}`);
    
    const inputPath = path.normalize(req.file.path);
    const outputPath = path.normalize(path.join(__dirname, 'uploads', `${req.file.filename}${outputExtension}`));

    console.log(`   Executing command: ${conversionCommand}`);
    console.log(`   Input path: ${inputPath}`);
    console.log(`   Output path: ${outputPath}`);
    console.log(`${'='.repeat(60)}\n`);
    
    exec(conversionCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(stderr);
            console.error(stdout);
            res.status(500).send(stdout);
            return;
        }

        console.log(`Python stdout: ${stdout}`);
        console.error(`Python stderr: ${stderr}`);

        // Check if the output file exists
        try {
            await fs.access(outputPath);
        } catch (accessErr) {
            console.error('Output file not found:', accessErr);
            res.status(500).send('Failed to generate the converted document.');
            return;
        }

        // Store file in Laravel storage directory for later access
        const laravelStoragePath = path.join(__dirname, 'admin', 'storage', 'app', 'processed_files');
        const storageFileName = `${Date.now()}_${req.file.filename}${outputExtension}`;
        const storagePath = path.join(laravelStoragePath, storageFileName);
        
        // Ensure directory exists
        try {
            await fs.mkdir(laravelStoragePath, { recursive: true });
        } catch (mkdirErr) {
            console.error('Error creating storage directory:', mkdirErr);
        }

        // Copy file to Laravel storage (don't delete immediately)
        let fileStored = false;
        console.log(`📁 Attempting to store file:`);
        console.log(`   Source: ${outputPath}`);
        console.log(`   Destination: ${storagePath}`);
        console.log(`   Storage directory exists: ${await fs.access(laravelStoragePath).then(() => true).catch(() => false)}`);
        
        try {
            await fs.copyFile(outputPath, storagePath);
            fileStored = true;
            console.log(`✅ File successfully copied to storage: ${storagePath}`);
        } catch (copyErr) {
            console.error(`❌ Error copying file to storage:`, copyErr);
            console.error(`❌ Error details:`, copyErr.message, copyErr.code);
        }

        // Record in database if tool name is provided
        // IMPORTANT: Record even if file storage failed (with appropriate status)
        console.log(`🔍 Checking if should record file:`);
        console.log(`   Tool name: ${toolName}`);
        console.log(`   File stored: ${fileStored}`);
        
        if (toolName) {
            // Use stored file path if available, otherwise use output path
            const relativePath = fileStored ? `processed_files/${storageFileName}` : null;
            const filePathToRecord = relativePath || `uploads/${path.basename(outputPath)}`;
            
            // Parse user_id: try parameter first, then req.body, then default to 1
            let finalUserId = userId;
            if (!finalUserId && req.body && req.body.user_id) {
                finalUserId = parseInt(req.body.user_id);
            }
            if (!finalUserId || isNaN(finalUserId)) {
                finalUserId = 1; // Default to guest user
                console.warn(`⚠️ No valid user_id found, defaulting to guest user (ID: 1)`);
            }
            
            // Determine status based on file storage success
            const recordStatus = fileStored ? 'completed' : 'completed'; // Still mark as completed even if storage failed
            
            console.log(`📝 Recording processed file:`);
            console.log(`   Tool: ${toolName}`);
            console.log(`   User ID: ${finalUserId} (type: ${typeof finalUserId})`);
            console.log(`   Path: ${filePathToRecord}`);
            console.log(`   Original Filename: ${path.basename(outputPath)}`);
            console.log(`   File stored: ${fileStored}`);
            console.log(`   Status: ${recordStatus}`);
            
            try {
                const result = await recordProcessedFile({
                    userId: finalUserId,
                    toolName: toolName,
                    fileCount: 1,
                    status: recordStatus,
                    filePath: filePathToRecord,
                    originalFilename: path.basename(outputPath),
                    metadata: {
                        file_stored: fileStored,
                        storage_location: fileStored ? 'laravel_storage' : 'uploads_temp'
                    }
                });
                
                if (result) {
                    console.log(`✅ Successfully recorded processed file in database`);
                    if (!fileStored) {
                        console.warn(`⚠️ File recorded but NOT stored in Laravel storage - check permissions`);
                    }
                } else {
                    console.error(`❌ Failed to record processed file in database - check Laravel logs`);
                }
            } catch (error) {
                console.error(`❌ Error recording processed file:`, error);
                console.error(`❌ Error stack:`, error.stack);
            }
        } else {
            console.warn(`⚠️ No tool name provided, skipping database record`);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(outputPath)}"`);
        res.sendFile(outputPath, async (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Failed to send the converted document.');
            }
            // Clean up input file immediately, but keep output file for 2 hours
            try {
                await fs.unlink(inputPath);
                // Schedule output file deletion after 2 hours (7200000 ms)
                setTimeout(async () => {
                    try {
                        await fs.unlink(outputPath);
                        if (fileStored) {
                            await fs.unlink(storagePath).catch(() => {});
                        }
                    } catch (unlinkErr) {
                        console.error('Error removing scheduled file:', unlinkErr);
                    }
                }, 7200000); // 2 hours
            } catch (unlinkErr) {
                console.error('Error removing input file:', unlinkErr);
            }
        });
    });
};

// Protect PDF
app.post('/api/protect-pdf', upload.single('pdf'), (req, res) => {
    const password = req.body.password;
    if (!password) {
        res.status(400).send('Password is required.');
        return;
    }
    const scriptPath = path.join(__dirname, 'protect_pdf.py');
    const conversionCommand = `"${pythonPath}" "${scriptPath}" "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}_protected.pdf`).replace(/\\/g, '/')}" ${password}`;
    handleFileConversion(req, res, conversionCommand, '_protected.pdf', 'Protect PDF', req.body.user_id);
});
// Compress PDF
app.post('/api/compress-pdf', upload.single('pdfFile'), (req, res) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 COMPRESS PDF REQUEST RECEIVED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   File received: ${req.file ? req.file.originalname : 'NO FILE'}`);
    console.log(`   Compression level: ${req.body.compression || 'NOT PROVIDED'}`);
    console.log(`   User ID from request: ${req.body.user_id || 'NOT PROVIDED'}`);
    console.log(`   User ID parsed: ${req.body.user_id ? parseInt(req.body.user_id) : null}`);
    console.log(`   Request body keys:`, Object.keys(req.body));
    console.log(`   Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`${'='.repeat(60)}\n`);
    
    const compression = req.body.compression;
    const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
    const conversionCommand = `python compress_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}_compressed.pdf`).replace(/\\/g, '/')}" ${compression}`;
    handleFileConversion(req, res, conversionCommand, '_compressed.pdf', 'Compress PDF', userId);
});
app.post('/api/crop-pdf', upload.single('file'), (req, res) => {
    const left = req.body.left;
    const top = req.body.top;
    const right = req.body.right;
    const bottom = req.body.bottom;
    const mode = req.body.mode;
    const pageIndex = req.body.pageIndex;
    const conversionCommand = `python crop_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}_croped.pdf`).replace(/\\/g, '/')}" ${left} ${top} ${right} ${bottom} ${mode} ${pageIndex}`;
    handleFileConversion(req, res, conversionCommand, '_croped.pdf', 'Crop PDF', req.body.user_id);
});
// Define the /env route
app.get('/env', (req, res) => {
    // Filter out environment variables that should not be exposed
    const envVars = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('PUBLIC_')) { // Add a prefix check or other filters as needed
            envVars[key] = value;
        }
    }

    res.json(envVars);
});

// Serve index.html on the root route - MUST come before static middleware
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'modules', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Internal Server Error: ' + err.message);
        }
    });
});

app.use(express.static(path.join(__dirname, 'modules')));

app.post('/api/convert-html-to-pdf', upload.single('html'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No HTML file uploaded' });
    }

    const htmlFilePath = req.file.path;
    const outputFilePath = path.join(__dirname, 'uploads', `${req.file.filename}.pdf`);

    try {
        // Launch Puppeteer browser instance
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Read the HTML file content and set it to the page
        const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
        await page.setContent(htmlContent, { waitUntil: 'networkidle2' });

        // Wait for the page to load completely
        await page.waitForFunction('document.readyState === "complete"');

        // Generate the PDF and save it to the output path
        await page.pdf({
            path: outputFilePath,
            format: 'A4',
            printBackground: true, // Ensure backgrounds are included
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        // Record file in database
        const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
        await recordFileForCustomTool(outputFilePath, 'Convert HTML to PDF (Puppeteer)', userId, req.file.originalname);

        // Send the PDF file back to the client
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(outputFilePath)}"`);
        res.sendFile(outputFilePath, async (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Failed to send the converted PDF.');
            } else {
                // Clean up the uploaded HTML file and the generated PDF
                await cleanUpFiles(htmlFilePath, outputFilePath);
            }
        });
    } catch (error) {
        console.error(`Error converting HTML to PDF: ${error.message}`);
        res.status(500).json({ error: 'Failed to convert HTML to PDF' });
    }
});


// DOCX to PPTX
app.post('/api/convert-doc-to-pptx', upload.single('docx'), (req, res) => {
    const conversionCommand = `python convert_docx_to_pptx.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.pptx`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.pptx', 'Convert DOCX to PPTX', req.body.user_id);
});

// PDF to Word
app.post('/api/convert-pdf-to-word', upload.single('pdf'), (req, res) => {
    const conversionCommand = `python convert_pdf_to_docx.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.docx`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.docx');
});

// PDF to PPTX
app.post('/api/convert-pdf-to-pptx', upload.single('pdf'), (req, res) => {
    const conversionCommand = `python convert_pdf_to_pptx.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.pptx`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.pptx', 'Convert PDF to PPTX', req.body.user_id);
});

// Excel to PDF
app.post('/api/convert-excel-to-pdf', upload.single('excel'), (req, res) => {
    const conversionCommand = `python convert_excel_to_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.pdf`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.pdf', 'Convert Excel to PDF', req.body.user_id);
});

// Word to PDF
app.post('/api/convert-word-to-pdf', upload.single('word'), (req, res) => {
    const conversionCommand = `python convert_excel_to_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.pdf`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.pdf', 'Convert Word to PDF', req.body.user_id);
});

// HTML to PDF
app.post('/api/convert-html-to-pdf', upload.single('html'), (req, res) => {
    const conversionCommand = `python convert_html_to_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.pdf`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.pdf', 'Convert HTML to PDF', req.body.user_id);
});

// Unprotect PDF
app.post('/api/unprotect-pdf', upload.single('pdf'), (req, res) => {
    const password = req.body.password || ''; // Use empty string if no password provided
    const conversionCommand = `python unprotect_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}_unprotected.pdf`).replace(/\\/g, '/')}" "${password}"`;
    handleFileConversion(req, res, conversionCommand, '_unprotected.pdf', 'Unlock PDF', req.body.user_id);
});

// Watermark PDF
app.post('/api/add-watermark', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
    const { text = '', position = 'top-left', transparency = '100', textSize = '30', imageSize = '200' } = req.body;
    const pdfFile = req.files['pdf'][0];
    const pdfPath = path.normalize(pdfFile.path);
    const outputFileName = `${pdfFile.filename}_watermarked.pdf`;
    const outputPath = path.normalize(path.join(__dirname, 'uploads', outputFileName));

    // Build the watermark command based on whether an image or text is provided
    let watermarkCommand;
    if (req.files['image']) {
        const imageFile = req.files['image'][0];
        const imagePath = path.normalize(imageFile.path);
        watermarkCommand = `python add_watermark.py "${pdfPath.replace(/\\/g, '/')}" "${outputPath.replace(/\\/g, '/')}" --image "${imagePath.replace(/\\/g, '/')}" --position "${position}" --opacity ${transparency} --image-size ${imageSize}`;
    } else {
        watermarkCommand = `python add_watermark.py "${pdfPath.replace(/\\/g, '/')}" "${outputPath.replace(/\\/g, '/')}" --text "${text}" --position "${position}" --opacity ${transparency} --text-size ${textSize}`;
    }
    
    console.log(watermarkCommand);
    // Execute the watermark command
    exec(watermarkCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(stderr);
            res.status(500).send('Failed to add watermark.');
            return;
        }

        // Check if the output file exists
        try {
            await fs.access(outputPath);
            
            // Record file in database
            const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
            await recordFileForCustomTool(outputPath, 'Add Watermark', userId, pdfFile.originalname);
            
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(outputPath)}"`);
            res.sendFile(outputPath, async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Failed to send the watermarked PDF.');
                }
                try {
                    await fs.unlink(pdfPath);
                    await fs.unlink(outputPath);
                } catch (unlinkErr) {
                    console.error('Error removing file:', unlinkErr);
                }
            });
        } catch (accessErr) {
            console.error('Output file not found:', accessErr);
            res.status(500).send('Failed to generate the watermarked PDF.');
        }
    });
});

// Add Page Number to PDF
app.post('/api/add-page-number', upload.single('pdf'), (req, res) => {
    // Multer stores file in req.file, form data in req.body
    // Log the raw body to see what we're receiving
    console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
    
    const { 
        position = 'bottom-right', 
        transparency = '50', 
        pageSize = '35',
        pageType = 'single',
        pageMargin = 'medium',
        startPage = '1',
        endPage = '1',
        textTemplate = '',
        customText = '',
        fontFamily = 'Helvetica',
        textBold = 'false',
        textItalic = 'false',
        textUnderline = 'false',
        textColor = '#000000',
        totalPages = '1'
    } = req.body;
    
    const pdfFile = req.file;
    const pdfPath = path.normalize(pdfFile.path);
    const outputFileName = `${pdfFile.filename}_numbered.pdf`;
    const outputPath = path.normalize(path.join(__dirname, 'uploads', outputFileName));

    // Build the page numbering command with all parameters
    // Use proper escaping for all arguments
    const escapeArg = (arg) => {
        if (typeof arg === 'string') {
            // Escape quotes and backslashes, wrap in quotes
            return `"${arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
        }
        return arg;
    };
    
    let pageNumberCommand = `python add_page_number.py ${escapeArg(pdfPath.replace(/\\/g, '/'))} ${escapeArg(outputPath.replace(/\\/g, '/'))}`;
    pageNumberCommand += ` --position ${escapeArg(position)}`;
    pageNumberCommand += ` --transparency ${transparency}`;
    pageNumberCommand += ` --page-size ${pageSize}`;
    pageNumberCommand += ` --page-type ${escapeArg(pageType)}`;
    pageNumberCommand += ` --page-margin ${escapeArg(pageMargin)}`;
    pageNumberCommand += ` --start-page ${startPage}`;
    pageNumberCommand += ` --end-page ${endPage}`;
    pageNumberCommand += ` --font-family ${escapeArg(fontFamily)}`;
    pageNumberCommand += ` --text-bold ${textBold}`;
    pageNumberCommand += ` --text-italic ${textItalic}`;
    pageNumberCommand += ` --text-underline ${textUnderline}`;
    pageNumberCommand += ` --text-color ${escapeArg(textColor)}`;
    pageNumberCommand += ` --total-pages ${totalPages}`;
    
    // Add text template or custom text
    if (textTemplate && textTemplate.trim()) {
        pageNumberCommand += ` --text-template ${escapeArg(textTemplate)}`;
    } else if (customText && customText.trim()) {
        pageNumberCommand += ` --custom-text ${escapeArg(customText)}`;
    }
    
    console.log('Executing command:', pageNumberCommand);
    console.log('Command length:', pageNumberCommand.length);
    
    // Execute the page numbering command
    exec(pageNumberCommand, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
        // Log stdout and stderr for debugging
        if (stdout) {
            console.log('Python stdout:', stdout);
        }
        if (stderr) {
            console.log('Python stderr:', stderr);
        }
        
        if (error) {
            console.error(`exec error: ${error}`);
            console.error('Error code:', error.code);
            console.error('Error signal:', error.signal);
            console.error('stderr:', stderr);
            res.status(500).send('Failed to add page numbers: ' + (stderr || error.message));
            return;
        }

        // Check if the output file exists
        try {
            await fs.access(outputPath);
            
            // Record file in database
            const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
            await recordFileForCustomTool(outputPath, 'Add Page Number', userId, pdfFile.originalname);
            
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(outputPath)}"`);
            res.sendFile(outputPath, async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Failed to send the numbered PDF.');
                }
                try {
                    await fs.unlink(pdfPath);
                    await fs.unlink(outputPath);
                } catch (unlinkErr) {
                    console.error('Error removing file:', unlinkErr);
                }
            });
        } catch (accessErr) {
            console.error('Output file not found:', accessErr);
            res.status(500).send('Failed to generate the numbered PDF.');
        }
    });
});

// OCR PDF
app.post('/api/convert-pdf-to-ocr', upload.single('pdf'), (req, res) => {
    const conversionCommand = `python convert_pdf_to_ocr.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}_ocr.pdf`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '_ocr.pdf', 'Convert PDF to OCR', req.body.user_id);
});

// New Route for PDF to MS Excel (.xlsx)
app.post('/api/convert-pdf-to-excel', upload.single('pdf'), (req, res) => {
    const conversionCommand = `python convert_pdf_to_excel.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.xlsx`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.xlsx', 'Convert PDF to Excel', req.body.user_id);
});

// PowerPoint PPT/PPTX to PDF route
app.post('/api/convert-ppt-to-pdf', upload.single('ppt'), (req, res) => {
    const extension = path.extname(req.file.originalname).toLowerCase();
    if (extension !== '.ppt' && extension !== '.pptx') {
        return res.status(400).send('Only PPT or PPTX files are allowed.');
    }
    const conversionCommand = `python convert_pptx_to_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}.pdf`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, conversionCommand, '.pdf', 'Convert PPT to PDF', req.body.user_id);
});

// API route for comparing PDFs
app.post('/api/compare-pdfs', upload.fields([{ name: 'pdf1', maxCount: 1 }, { name: 'pdf2', maxCount: 1 }]), (req, res) => {
    const pdf1 = req.files['pdf1'][0];
    const pdf2 = req.files['pdf2'][0];
    const pdf1Path = path.normalize(pdf1.path);
    const pdf2Path = path.normalize(pdf2.path);
    const outputFileName = `${pdf1.filename}_comparison.pdf`;
    const outputPath = path.normalize(path.join(__dirname, 'uploads', outputFileName));

    const compareCommand = `python compare_pdfs.py "${pdf1Path.replace(/\\/g, '/')}" "${pdf2Path.replace(/\\/g, '/')}" "${outputPath.replace(/\\/g, '/')}"`;

    console.log(compareCommand);
    exec(compareCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(stderr);
            res.status(500).send('Failed to compare PDFs.');
            return;
        }

         // Log stdout and stderr from Python script
        //  console.log(`Python stdout: ${stdout}`);
        //  console.error(`Python stderr: ${stderr}`);

        // Check if the output file exists
        try {
            await fs.access(outputPath);
            
            // Record file in database
            const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
            await recordFileForCustomTool(outputPath, 'Compare PDFs', userId, pdf1.originalname);
            
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(outputPath)}"`);
            res.sendFile(outputPath, async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Failed to send the compared PDF.');
                }
                try {
                    await fs.unlink(pdf1Path);
                    await fs.unlink(pdf2Path);
                    await fs.unlink(outputPath);
                } catch (unlinkErr) {
                    console.error('Error removing file:', unlinkErr);
                }
            });
        } catch (accessErr) {
            console.error('Output file not found:', accessErr);
            res.status(500).send('Failed to generate the compared PDF.');
        }
    });
});

// Redact PDF
app.post('/api/redact-pdf', upload.single('pdf'), (req, res) => {
    console.log('Redact PDF request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('File uploaded:', req.file ? req.file.filename : 'none');
    
    const textToRedact = req.body.textToRedact || '';
    console.log('textToRedact:', textToRedact);

    // Validate the presence of the file
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).send('PDF file is required.');
    }
    
    // Validate that text is provided
    if (!textToRedact || textToRedact.trim().length === 0) {
        console.error('Validation failed: No text to redact provided');
        return res.status(400).json({
            error: 'Text to redact is required. Please enter words or sentences to redact.'
        });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'uploads', `${req.file.filename}_redacted.pdf`);
    
    // Prepare command arguments
    const safeTextToRedact = textToRedact.replace(/"/g, '\\"'); // Escape quotes
    const redactionArgs = `"${inputPath.replace(/\\/g, '/')}" "${outputPath.replace(/\\/g, '/')}" "${safeTextToRedact}" ""`;
    
    // Use pythonPath from environment or default to 'python'
    const pythonCmd = pythonPath || 'python';
    const scriptPath = path.join(__dirname, 'redact_pdf.py').replace(/\\/g, '/');
    const redactionCommand = `${pythonCmd} "${scriptPath}" ${redactionArgs}`;
    
    console.log('Executing redaction command:', redactionCommand);
    console.log('Python path:', pythonCmd);
    console.log('Script path:', scriptPath);

    exec(redactionCommand, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Redaction Error:', error);
            console.error('Error code:', error.code);
            console.error('stderr:', stderr);
            console.error('stdout:', stdout);
            
            // Check if it's a Python script error (exit code 1)
            if (error.code === 1 || stderr) {
                const errorMsg = stderr || stdout || error.message;
                return res.status(500).send('Redaction failed: ' + errorMsg);
            }
            return res.status(500).send('Redaction failed: ' + (stderr || error.message));
        }
        
        // Check if output file exists
        fsNormal.access(outputPath, fsNormal.constants.F_OK, async (accessErr) => {
            if (accessErr) {
                console.error('Output file not found:', accessErr);
                console.error('stdout:', stdout);
                return res.status(500).send('Failed to generate the redacted PDF. Check server logs.');
            }
            
            // Record file in database
            const userId = req.body.user_id ? parseInt(req.body.user_id) : null;
            await recordFileForCustomTool(outputPath, 'Redact PDF', userId, req.file.originalname);
            
            // Send the redacted PDF file
            res.sendFile(outputPath, (sendErr) => {
                if (sendErr) {
                    console.error('Error sending file:', sendErr);
                    return res.status(500).send('Error sending redacted PDF.');
                }
                
                // Clean up after a delay to ensure file is sent
                setTimeout(() => {
                    try {
                        if (fsNormal.existsSync(outputPath)) {
                            fsNormal.unlinkSync(outputPath);
                        }
                        if (fsNormal.existsSync(inputPath)) {
                            fsNormal.unlinkSync(inputPath);
                        }
                    } catch (cleanupError) {
                        console.error('Error cleaning up files:', cleanupError);
                    }
                }, 5000);
            });
        });
    });
});

// PDF to JPG API route
app.post('/api/convert-pdf-to-jpg', upload.single('pdf'), (req, res) => {
    const outputDir = path.join(__dirname, 'uploads');
    const scriptPath = path.join(__dirname, 'convert_pdf_to_jpg.py');
    const outputBase = path.join(outputDir, req.file.filename.split('.')[0]);
    const conversionCommand = `"${pythonPath}" "${scriptPath}" "${req.file.path.replace(/\\/g, '/')}" "${outputBase.replace(/\\/g, '/')}"`;

    exec(conversionCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Conversion Error:', stderr);
            return res.status(500).json({ error: 'Conversion failed', details: stderr });
        }

        console.log('Python stdout:', stdout);

        // Use glob to find all generated JPG files
        glob(`${outputBase}_page_*.jpg`, (err, files) => {
            if (err || files.length === 0) {
                console.error('File Matching Error:', err);
                return res.status(500).json({ error: 'No output files found' });
            }

            try {
                // Send the list of files as a response
                res.json({ files: files.map(file => path.basename(file)) });
            } catch (err) {
                console.error('Response Error:', err);
                res.status(500).json({ error: 'Failed to send output files' });
            }
        });
    });
});

// JPG to PDF
app.post('/api/convert-jpgs-to-pdf', upload.array('images', 50), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No image files uploaded.');
    }

    // Create a unique name for the output PDF file
    const outputFileName = `${Date.now()}.pdf`;
    const outputPath = path.resolve(__dirname, 'uploads', outputFileName);

    // Prepare the command to convert JPGs to PDF
    const jpgPaths = req.files.map(file => path.resolve(file.path)).join(' ');
    const conversionCommand = `python convert_jpgs_to_pdf.py "${outputPath}" ${jpgPaths}`;

    console.log(`Executing command: ${conversionCommand}`);
    
    exec(conversionCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(stderr);
            res.status(500).send('Failed to convert JPGs to PDF.');
            return;
        }

        console.log(`Python stdout: ${stdout}`);
        console.error(`Python stderr: ${stderr}`);

        // Check if the output file exists
        try {
            await fs.access(outputPath);
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(outputPath, async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Failed to send the PDF.');
                }
                try {
                    // Clean up uploaded images
                    for (const file of req.files) {
                        await fs.unlink(file.path);
                    }
                    await fs.unlink(outputPath);
                } catch (unlinkErr) {
                    console.error('Error removing files:', unlinkErr);
                }
            });
        } catch (accessErr) {
            console.error('Output file not found:', accessErr);
            res.status(500).send('Failed to generate the PDF.');
        }
    });
});

// PDF to PNG API route
app.post('/api/convert-pdf-to-png', upload.single('pdf'), (req, res) => {
    const outputDir = path.join(__dirname, 'uploads');
    const outputBase = path.join(outputDir, req.file.filename.split('.')[0]);
    const conversionCommand = `python convert_pdf_to_png.py "${req.file.path.replace(/\\/g, '/')}" "${outputBase.replace(/\\/g, '/')}"`;

    exec(conversionCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Conversion Error:', stderr);
            return res.status(500).json({ error: 'Conversion failed', details: stderr });
        }

        console.log('Python stdout:', stdout);

        // Use glob to find all generated PNG files
        glob(`${outputBase}_page_*.png`, (err, files) => {
            if (err || files.length === 0) {
                console.error('File Matching Error:', err);
                return res.status(500).json({ error: 'No output files found' });
            }

            try {
                // Send the list of files as a response
                res.json({ files: files.map(file => path.basename(file)) });
            } catch (err) {
                console.error('Response Error:', err);
                res.status(500).json({ error: 'Failed to send output files' });
            }
        });
    });
});

// PNG to PDF
app.post('/api/convert-pngs-to-pdf', upload.array('images', 50), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No image files uploaded.');
    }

    // Create a unique name for the output PDF file
    const outputFileName = `${Date.now()}.pdf`;
    const outputPath = path.resolve(__dirname, 'uploads', outputFileName);

    // Prepare the command to convert PNGs to PDF
    const pngPaths = req.files.map(file => path.resolve(file.path)).join(' ');
    const conversionCommand = `python convert_pngs_to_pdf.py "${outputPath}" ${pngPaths}`;

    console.log(`Executing command: ${conversionCommand}`);
    
    exec(conversionCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(stderr);
            res.status(500).send('Failed to convert PNGs to PDF.');
            return;
        }

        console.log(`Python stdout: ${stdout}`);
        console.error(`Python stderr: ${stderr}`);

        // Check if the output file exists
        try {
            await fs.access(outputPath);
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            res.sendFile(outputPath, async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Failed to send the PDF.');
                }
                try {
                    // Clean up uploaded images
                    for (const file of req.files) {
                        await fs.unlink(file.path);
                    }
                    await fs.unlink(outputPath);
                } catch (unlinkErr) {
                    console.error('Error removing files:', unlinkErr);
                }
            });
        } catch (accessErr) {
            console.error('Output file not found:', accessErr);
            res.status(500).send('Failed to generate the PDF.');
        }
    });
});


// Serve the ICC profile
app.use('/icc_profiles', express.static(path.join(__dirname, 'icc_profiles')));

// PDF to PDF/A conversion route
app.post('/api/convert-pdf-to-pdfa', upload.single('pdf'), (req, res) => {
    const conformanceLevel = req.body.profile;

    if (!conformanceLevel) {
        return res.status(400).send('Conformance level is required.');
    }

    const validProfiles = [
        'pdfa1a', 'pdfa1b', 'pdfa2a', 'pdfa2b', 'pdfa2u',
        'pdfa3a', 'pdfa3b', 'pdfa3u'
    ];

    if (!validProfiles.includes(conformanceLevel)) {
        return res.status(400).send('Invalid conformance level.');
    }

    const outputFileName = `${req.file.filename}_${conformanceLevel}.pdf`;
    const outputPath = path.join(__dirname, 'uploads', outputFileName);
    
    // Updated ICC profile path
    const defaultICCProfilePath = path.join(__dirname, 'icc_profiles', 'sRGB-v4.icc');
    
    // Check if ICC profile file exists
    if (!fsNormal.existsSync(defaultICCProfilePath)) {
        return res.status(500).send('ICC profile file is missing.');
    }

    const conversionCommand = `python convert_pdf_to_pdfa.py "${req.file.path.replace(/\\/g, '/')}" "${outputPath.replace(/\\/g, '/')}" "${conformanceLevel}" "${defaultICCProfilePath.replace(/\\/g, '/')}"`;

    handleFileConversion(req, res, conversionCommand, `_${conformanceLevel}.pdf`, 'Convert PDF to PDF/A', req.body.user_id);
});

// Repair PDF route
app.post('/api/repair-pdf', upload.single('pdf'), (req, res) => {
    const repairCommand = `python repair_pdf.py "${req.file.path.replace(/\\/g, '/')}" "${path.join(__dirname, 'uploads', `${req.file.filename}_repaired.pdf`).replace(/\\/g, '/')}"`;
    handleFileConversion(req, res, repairCommand, '_repaired.pdf', 'Repair PDF', req.body.user_id);
});



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the favicon.ico file from the root directory
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.post('/api/generate-icons', upload.single('image'), async (req, res) => {
    const iconType = req.body.option; // Directly access 'option' from request body
    const inputPath = path.normalize(req.file.path);
    const outputDir = path.join(__dirname, 'uploads', 'icons');

    console.log(`Input Dir: ${inputPath} --- Output Dir: ${outputDir}`); // Log the command for debugging

    console.log(`Received iconType: ${iconType}`); // Log iconType to verify

    // Ensure the output directory exists
    if (!fsNormal.existsSync(outputDir)) {
        fsNormal.mkdirSync(outputDir, { recursive: true });
    }

    let scriptPath = 'generate_icons.py';  // Path to your Python script
    let commandArgs = [inputPath, iconType].map(arg => `"${arg}"`).join(' ');

    console.log(`Running command: python ${scriptPath} ${commandArgs}`); // Log the command for debugging

    exec(`python ${scriptPath} ${commandArgs}`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(stderr);
            return res.status(500).send('Failed to generate icons.');
        }

        console.log(`Python stdout: ${stdout}`);
        console.error(`Python stderr: ${stderr}`);

        // Create a zip file containing the generated icons
        try {
            const zip = new JSZip();
            const files = fsNormal.readdirSync(outputDir);

            for (const file of files) {
                const filePath = path.join(outputDir, file);
                zip.file(file, fsNormal.readFileSync(filePath));
            }

            const zipData = await zip.generateAsync({ type: 'nodebuffer' });

            res.setHeader('Content-Disposition', 'attachment; filename="icons.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipData);

            // Remove the original input file
            fsNormal.unlinkSync(inputPath);

            // Clean up
            files.forEach(file => fsNormal.unlinkSync(path.join(outputDir, file)));
            fsNormal.rmdirSync(outputDir);
        } catch (err) {
            console.error('Error zipping files:', err);
            res.status(500).send('Failed to create zip file.');
        }
    });
});

// Route to serve processed files by UUID/ID
// This route matches UUIDs (with hyphens, case-insensitive) or numeric IDs
app.get('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[0-9]+)', async (req, res) => {
    const fileId = req.params.id;
    const laravelUrl = process.env.LARAVEL_API_URL || 'http://82.180.132.134:8000';
    
    console.log(`📥 File download request for ID: ${fileId}`);
    
    try {
        // Call Laravel API to get file info
        const url = new URL(`${laravelUrl}/api/processed-files/${fileId}`);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };
        
        const fileInfo = await new Promise((resolve, reject) => {
            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const data = JSON.parse(responseData);
                            resolve(data);
                        } catch (e) {
                            console.error('Failed to parse API response:', responseData);
                            reject(new Error('Failed to parse API response'));
                        }
                    } else {
                        console.error(`Laravel API returned status ${res.statusCode}:`, responseData);
                        try {
                            const errorData = JSON.parse(responseData);
                            reject(new Error(errorData.message || `API returned status ${res.statusCode}`));
                        } catch (e) {
                            reject(new Error(`API returned status ${res.statusCode}: ${responseData}`));
                        }
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('Error calling Laravel API:', error.message);
                reject(error);
            });
            
            req.end();
        });
        
        if (!fileInfo.success || !fileInfo.data) {
            console.error('File info not found in API response:', fileInfo);
            return res.status(404).json({ 
                error: 'File not found',
                message: 'The file ID does not exist in the database. Note: Blob URL UUIDs are not database IDs. Use the numeric ID from the database.'
            });
        }
        
        const filePath = fileInfo.data.file_path;
        const originalFilename = fileInfo.data.original_filename;
        
        // Try multiple locations for the file
        const laravelStoragePath = path.join(__dirname, 'admin', 'storage', 'app', 'processed_files');
        const possiblePaths = [
            path.join(laravelStoragePath, path.basename(filePath)),
            path.join(laravelStoragePath, filePath.replace('processed_files/', '')),
            path.join(__dirname, 'admin', 'storage', 'app', filePath),
            filePath // Absolute path
        ];
        
        let foundPath = null;
        for (const possiblePath of possiblePaths) {
            try {
                await fs.access(possiblePath);
                foundPath = possiblePath;
                break;
            } catch (e) {
                // File doesn't exist at this path, try next
            }
        }
        
        if (!foundPath) {
            console.error(`❌ File not found at any location for: ${filePath}`);
            return res.status(404).send('File not found on server');
        }
        
        console.log(`✅ Serving file: ${foundPath}`);
        res.setHeader('Content-Disposition', `attachment; filename="${originalFilename || path.basename(foundPath)}"`);
        res.sendFile(foundPath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).send('Failed to send file');
                }
            }
        });
    } catch (error) {
        console.error(`❌ Error serving file ${fileId}:`, error.message);
        console.error('Error stack:', error.stack);
        
        // Provide more specific error messages
        if (error.message.includes('404') || error.message.includes('not found')) {
            return res.status(404).json({
                error: 'File not found',
                message: 'The file ID does not exist in the database. Note: Blob URL UUIDs (like blob:http://...) are browser-generated identifiers, not database IDs. Use the numeric ID from the processed_files table.'
            });
        }
        
        res.status(500).json({
            error: 'Failed to retrieve file',
            message: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at ${serverName}:${port}`);
});
