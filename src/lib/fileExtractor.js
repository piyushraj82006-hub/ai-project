/* ============================================
   Multi-Format Document Text Extractor
   Supports: PDF (.pdf), EPUB (.epub), DOCX (.docx)
   ============================================ */

import * as pdfjsLib from 'pdfjs-dist';
import ePub from 'epubjs';
import mammoth from 'mammoth';

// PDF worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Detect the file type from a File object
 * @param {File} file
 * @returns {'pdf'|'epub'|'docx'|null}
 */
export function detectFileType(file) {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type === 'application/epub+zip' || name.endsWith('.epub')) return 'epub';
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) return 'docx';

  return null;
}

/**
 * Extract text from a PDF File object
 * @param {File} file
 * @param {number} maxChars
 * @returns {Promise<string>}
 */
async function extractPDF(file, maxChars = 150000) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
  }).promise;

  let fullText = '';
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    if (fullText.length >= maxChars) break;
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim()
    .slice(0, maxChars);
}

/**
 * Convert PDF to base64 for Vision API fallback on scanned PDFs
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

/**
 * Extract text from an EPUB File object
 * @param {File} file
 * @returns {Promise<string>}
 */
async function extractEPUB(file) {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;

  const spine = book.spine;
  let fullText = '';

  for (const item of spine.items) {
    try {
      const doc = await item.load(book.load.bind(book));
      const text = doc.body ? doc.body.textContent : doc.textContent || '';
      fullText += text.trim() + '\n\n';
      item.unload();
    } catch (err) {
      console.warn(`[EPUB] Skipping spine item: ${err.message}`);
    }
  }

  return fullText.trim() || 'No text could be extracted from this EPUB.';
}

/**
 * Extract text from a DOCX File object using mammoth.js
 * @param {File} file
 * @returns {Promise<string>}
 */
async function extractDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();
  return text || 'No text could be extracted from this DOCX file.';
}

/**
 * Universal file text extractor — routes to the correct engine based on file type
 * @param {File} file
 * @param {number} maxChars
 * @returns {Promise<{text: string, fileType: string, needsVision: boolean}>}
 */
export async function extractTextFromFile(file, maxChars = 150000) {
  const fileType = detectFileType(file);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.name}. Please upload a PDF, EPUB, or DOCX file.`);
  }

  let text = '';
  let needsVision = false;

  try {
    if (fileType === 'pdf') {
      text = await extractPDF(file, maxChars);
      // If text is too short, it's likely a scanned PDF
      if (!text || text.trim().length < 20) {
        needsVision = true;
      }
    } else if (fileType === 'epub') {
      text = await extractEPUB(file);
    } else if (fileType === 'docx') {
      text = await extractDOCX(file);
    }
  } catch (err) {
    console.error(`[FileExtractor] ${fileType.toUpperCase()} extraction failed:`, err);
    // For PDFs, fall back to Vision API
    if (fileType === 'pdf') {
      needsVision = true;
      text = '';
    } else {
      throw err;
    }
  }

  return { text, fileType, needsVision };
}

/**
 * Get the appropriate icon color for a file type
 */
export function getFileTypeColor(fileType) {
  const colors = {
    pdf: 'var(--accent-light)',
    epub: '#4ADE80',
    docx: '#38BDF8',
  };
  return colors[fileType] || 'var(--accent-light)';
}

/**
 * Get a human-readable label for a file type
 */
export function getFileTypeLabel(fileType) {
  const labels = {
    pdf: 'PDF',
    epub: 'EPUB',
    docx: 'DOCX',
  };
  return labels[fileType] || 'Document';
}

/**
 * Get the MIME type string for a file type extension
 */
export function getFileAcceptString() {
  return '.pdf,.epub,.docx,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
