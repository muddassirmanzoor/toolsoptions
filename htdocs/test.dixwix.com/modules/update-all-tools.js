// Script to update all tools with shared header/navbar/breadcrumb
// This will be run manually or can be used as reference

const fs = require('fs');
const path = require('path');

const tools = [
    'splitPDF', 'mergePDF', 'cropPDF', 'protectPDF', 'unlockPDF',
    'convertExceltoPDF', 'convertPDFtoDOC', 'convertDoctoPDF', 'convertPDFtoExcel',
    'convertPDFtoJPG', 'convertJPGtoPDF', 'convertPDFtoPNG', 'convertPNGtoPDF',
    'convertPDFtoOCR', 'convertPDFtoPDFA', 'convertPPTtoPDF', 'convertPDFtoPPT',
    'convertHTMLtoPDF', 'convertDOCtoPPT', 'faviconICON', 'organizePDF',
    'pageNumberPDF', 'redactPDF', 'repairPDF', 'rotatePDF', 'watermarkPDF',
    'comparePDF', 'signature'
];

const pageTitles = {
    'splitPDF': 'Split PDF',
    'mergePDF': 'Merge PDF',
    'cropPDF': 'Crop PDF',
    'protectPDF': 'Protect PDF',
    'unlockPDF': 'Unlock PDF',
    'convertExceltoPDF': 'Excel to PDF',
    'convertPDFtoDOC': 'PDF to Word',
    'convertDoctoPDF': 'Word to PDF',
    'convertPDFtoExcel': 'PDF to Excel',
    'convertPDFtoJPG': 'PDF to JPG',
    'convertJPGtoPDF': 'JPG to PDF',
    'convertPDFtoPNG': 'PDF to PNG',
    'convertPNGtoPDF': 'PNG to PDF',
    'convertPDFtoOCR': 'PDF to OCR',
    'convertPDFtoPDFA': 'PDF to PDF/A',
    'convertPPTtoPDF': 'PPT to PDF',
    'convertPDFtoPPT': 'PDF to PPT',
    'convertHTMLtoPDF': 'HTML to PDF',
    'convertDOCtoPPT': 'DOC to PPT',
    'faviconICON': 'Favicon & Icons',
    'organizePDF': 'Organize PDF',
    'pageNumberPDF': 'Page Numbers PDF',
    'redactPDF': 'Redact PDF',
    'repairPDF': 'Repair PDF',
    'rotatePDF': 'Rotate PDF',
    'watermarkPDF': 'Watermark PDF',
    'comparePDF': 'Compare PDF',
    'signature': 'Signature'
};

console.log('Tool update script ready. Use this as reference for manual updates.');


