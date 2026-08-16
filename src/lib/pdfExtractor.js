/* ============================================
   PDF Text Extractor using pdf.js v4
   ============================================ */
import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker for v4
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extract text content from a PDF File object
 * @param {File} file - PDF file
 * @param {number} maxChars - Maximum characters to extract (default 14000)
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(file, maxChars = 150000) {
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
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ');
    
    fullText += pageText + '\n\n';
  }
  
  // Clean up and truncate
  fullText = fullText
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim()
    .slice(0, maxChars);
  
  return fullText;
}
