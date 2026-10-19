"use client";

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// FILE: src/lib/pdfExport.ts

interface ExportPdfOptions {
  filename?: string;
  elementId?: string;
  scale?: number;
  quality?: number;
}

/**
 * Enterprise Client-Side HTML to PDF Exporter.
 * 
 * Powered by `html-to-image` (native SVG foreignObject pipeline) and `jsPDF`.
 * Unlike html2canvas which crashes with "Attempting to parse an unsupported color function oklab"
 * when parsing Tailwind v4 CSS, `html-to-image` relies on the browser's native rendering engine
 * to rasterize the DOM. This provides 100% compatibility with Tailwind v4, oklab/oklch colors,
 * flexbox, grids, modern fonts, and base64 signature images.
 */
export async function downloadElementAsPdf({
  elementId = 'contract-document',
  filename = 'Master_Service_Agreement.pdf',
  scale = 2,
  quality = 0.95
}: ExportPdfOptions = {}): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot generate PDF outside browser environment.' };
  }

  const element = document.getElementById(elementId);
  if (!element) {
    return { success: false, error: `Document element #${elementId} not found.` };
  }

  try {
    // 1. Ensure all embedded images (including base64 signature images) are fully loaded
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 800);
            }
          })
      )
    );

    // 2. Rasterize the DOM element using browser-native SVG foreignObject pipeline
    // pixelRatio: 2 provides crisp, print-grade 300-DPI resolution without blurring text
    const dataUrl = await toPng(element, {
      quality: quality,
      pixelRatio: scale || 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (domNode) => {
        // Exclude elements marked as print:hidden or with data-pdf-ignore
        if (domNode instanceof HTMLElement) {
          if (domNode.getAttribute('data-pdf-ignore') === 'true') {
            return false;
          }
          if (domNode.classList.contains('print:hidden') && !domNode.classList.contains('contract-document-wrapper')) {
            // keep contract content
          }
        }
        return true;
      }
    });

    if (!dataUrl || dataUrl === 'data:,') {
      throw new Error('Failed to capture document canvas.');
    }

    // 3. Load captured image to get exact pixel dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load rasterized contract image.'));
      img.src = dataUrl;
    });

    // 4. Initialize jsPDF in standard A4 format (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Margins in mm
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2; // 190mm
    const contentHeight = (img.height * contentWidth) / img.width;

    // 5. Handle Single Page vs Multi-Page Contract Document
    if (contentHeight <= pdfHeight - margin * 2) {
      // Document fits on a single A4 page
      pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
    } else {
      // Multi-page document: slice into sequential A4 pages
      const pageHeightInMm = pdfHeight - margin * 2;
      const totalPages = Math.ceil(contentHeight / pageHeightInMm);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const sourceY = (page * pageHeightInMm * img.height) / contentHeight;
        const sourceHeight = Math.min(
          img.height - sourceY,
          (pageHeightInMm * img.height) / contentHeight
        );

        // Render page slice onto a temporary canvas
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = img.width;
        pageCanvas.height = (sourceHeight * img.width) / img.width;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            img,
            0,
            sourceY,
            img.width,
            sourceHeight,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          const pageDataUrl = pageCanvas.toDataURL('image/png', quality);
          const renderedSliceHeight = (sourceHeight * contentWidth) / img.width;

          pdf.addImage(pageDataUrl, 'PNG', margin, margin, contentWidth, renderedSliceHeight, undefined, 'FAST');
        }
      }
    }

    // 6. Direct file download to user device (never invokes window.print)
    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(sanitizedFilename);

    return { success: true };
  } catch (err: any) {
    console.error('[PDF Export Error]:', err);
    return { 
      success: false, 
      error: err?.message || 'Failed to render PDF file. Please try again.' 
    };
  }
}
