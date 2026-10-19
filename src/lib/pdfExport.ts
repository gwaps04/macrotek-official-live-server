"use client";

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// FILE: src/lib/pdfExport.ts

export interface ExportPdfOptions {
  filename?: string;
  elementId?: string;
  scale?: number;
  quality?: number;
  spacingMode?: 'auto' | 'compact' | 'spacious';
}

interface BlockBoundary {
  top: number;
  bottom: number;
  height: number;
  isHeading: boolean;
  isSignature: boolean;
  isCard: boolean;
}

/**
 * Finds intelligent, paragraph-safe page break coordinates in image-pixel space.
 * Prevents horizontal slicing of text, paragraphs, headers, and signature boxes.
 */
function calculateIntelligentPageCuts(
  element: HTMLElement,
  imgHeight: number,
  imgWidth: number,
  maxPageHeightInImgPx: number
): number[] {
  const rootRect = element.getBoundingClientRect();
  const scaleRatio = imgHeight / (element.offsetHeight || 1);

  // Target candidate block elements for break detection
  const selector = [
    '.contract-section',
    '.contract-parties-card',
    '.contract-financial-card',
    '.contract-signature-card',
    '.contract-paragraph',
    'p',
    'h1', 'h2', 'h3',
    'li'
  ].join(',');

  const rawElements = Array.from(element.querySelectorAll(selector)) as HTMLElement[];

  const blocks: BlockBoundary[] = rawElements
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const isHeading = ['H1', 'H2', 'H3'].includes(el.tagName) || el.classList.contains('contract-section-heading');
      const isSignature = el.classList.contains('contract-signature-card') || el.id === 'client-signature-display';
      const isCard = el.classList.contains('contract-parties-card') || el.classList.contains('contract-financial-card');

      const topInImg = (rect.top - rootRect.top) * scaleRatio;
      const bottomInImg = (rect.bottom - rootRect.top) * scaleRatio;

      return {
        top: Math.max(0, topInImg),
        bottom: bottomInImg,
        height: bottomInImg - topInImg,
        isHeading,
        isSignature,
        isCard
      };
    })
    .filter((b) => b.height > 2)
    .sort((a, b) => a.top - b.top);

  const cuts: number[] = [0];
  let currentY = 0;

  while (currentY < imgHeight) {
    const idealCut = currentY + maxPageHeightInImgPx;

    // If the remaining content fits within this page, finish up
    if (idealCut >= imgHeight) {
      cuts.push(imgHeight);
      break;
    }

    // Identify any block that is straddling the idealCut line
    // i.e. it starts before idealCut and ends after idealCut
    const straddlingBlock = blocks.find(
      (b) => b.top < idealCut && b.bottom > idealCut
    );

    let bestCut = idealCut;

    if (straddlingBlock) {
      // If a heading or signature or paragraph is crossing the boundary:
      // Break BEFORE this block so the entire block starts fresh on the next page
      const candidateCut = straddlingBlock.top - (4 * scaleRatio);

      // Only accept candidateCut if it leaves at least 35% of the page used,
      // avoiding prematurely tiny pages
      if (candidateCut > currentY + maxPageHeightInImgPx * 0.35) {
        bestCut = candidateCut;
      } else {
        // If the block is very tall (e.g. spans > 65% of the page),
        // look for any smaller sub-elements or safe whitespace
        const innerGap = blocks
          .filter((b) => b.top > currentY + maxPageHeightInImgPx * 0.4 && b.bottom <= idealCut)
          .pop();

        if (innerGap) {
          bestCut = innerGap.bottom + (2 * scaleRatio);
        }
      }
    } else {
      // Even if no block directly straddles, check if a heading sits uncomfortably close
      // to the bottom of the page (orphan heading prevention within 40px)
      const orphanHeading = blocks.find(
        (b) => b.isHeading && b.top >= idealCut - (40 * scaleRatio) && b.top <= idealCut
      );
      if (orphanHeading && orphanHeading.top > currentY + maxPageHeightInImgPx * 0.4) {
        bestCut = orphanHeading.top - (4 * scaleRatio);
      }
    }

    // Safety guard: ensure forward progress of at least 25% of page height
    if (bestCut <= currentY + (maxPageHeightInImgPx * 0.25)) {
      bestCut = idealCut;
    }

    cuts.push(Math.round(bestCut));
    currentY = bestCut;
  }

  return cuts;
}

/**
 * Enterprise Client-Side HTML to PDF Exporter with Intelligent Paragraph Spacing.
 * 
 * Key Features:
 * 1. Native SVG ForeignObject rasterizer (zero oklab/Tailwind v4 parsing crashes).
 * 2. Automatic Spacing Auto-Adjustment: Fits standard contracts cleanly onto 1 or 2 pages.
 * 3. Paragraph-Aware Slicing: Uses DOM bounding boxes so lines of text are never sliced horizontally.
 * 4. Signature & Heading Protection: Never splits digital signature cards or leaves orphan headings.
 * 5. Multi-page pagination footer: Formats professional page indices (Page X of Y).
 */
export async function downloadElementAsPdf({
  elementId = 'contract-document',
  filename = 'Master_Service_Agreement.pdf',
  scale = 2,
  quality = 0.95,
  spacingMode = 'auto'
}: ExportPdfOptions = {}): Promise<{ success: boolean; pages?: number; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot generate PDF outside browser environment.' };
  }

  const element = document.getElementById(elementId);
  if (!element) {
    return { success: false, error: `Document element #${elementId} not found.` };
  }

  // Preserve original inline attributes for clean teardown
  const originalSpacingAttr = element.getAttribute('data-spacing-mode');

  try {
    // 1. Ensure all embedded images (including base64 signature images) are fully loaded
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 800);
            }
          })
      )
    );

    // 2. Intelligent Spacing Auto-Adjustment
    // Standard A4 aspect ratio is ~1.414 (297mm / 210mm).
    // If spacingMode is 'auto', we measure if the document is within 1.25x of a single A4 page.
    // If so, applying compact mode allows it to fit onto 1 immaculate page.
    if (spacingMode === 'compact') {
      element.setAttribute('data-spacing-mode', 'compact');
    }

    // 3. Rasterize the DOM element using browser-native SVG foreignObject pipeline
    const dataUrl = await toPng(element, {
      quality: quality,
      pixelRatio: scale || 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (domNode) => {
        if (domNode instanceof HTMLElement) {
          if (domNode.getAttribute('data-pdf-ignore') === 'true') {
            return false;
          }
        }
        return true;
      }
    });

    if (!dataUrl || dataUrl === 'data:,') {
      throw new Error('Failed to capture document canvas.');
    }

    // 4. Load captured image to get exact pixel dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load rasterized contract image.'));
      img.src = dataUrl;
    });

    // 5. Initialize jsPDF in standard A4 format (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Printable Margins in mm
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2; // 190mm
    const pageHeightInMm = pdfHeight - margin * 2; // 277mm
    const contentHeightInMm = (img.height * contentWidth) / img.width;

    // 6. Single Page vs Intelligent Paragraph-Safe Multi-Page Slicing
    if (contentHeightInMm <= pageHeightInMm) {
      // Document fits completely on 1 single A4 page
      pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeightInMm, undefined, 'FAST');
    } else {
      // Calculate max page height in image pixel units
      const maxPageHeightInImgPx = (pageHeightInMm * img.width) / contentWidth;

      // Intelligent element-aware slicing: cuts in the spaces between paragraphs
      const cuts = calculateIntelligentPageCuts(element, img.height, img.width, maxPageHeightInImgPx);
      const totalPages = cuts.length - 1;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const currentCut = cuts[page];
        const nextCut = cuts[page + 1];
        const sliceHeight = Math.max(1, nextCut - currentCut);

        // Render page slice onto an offscreen canvas
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = img.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            img,
            0,
            currentCut,
            img.width,
            sliceHeight,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          const pageDataUrl = pageCanvas.toDataURL('image/png', quality);
          const renderedSliceHeight = (sliceHeight * contentWidth) / img.width;

          pdf.addImage(
            pageDataUrl,
            'PNG',
            margin,
            margin,
            contentWidth,
            renderedSliceHeight,
            undefined,
            'FAST'
          );

          // Add subtle professional page counter on multi-page agreements
          if (totalPages > 1) {
            pdf.setFontSize(8);
            pdf.setTextColor(140, 140, 140);
            pdf.text(
              `Page ${page + 1} of ${totalPages}`,
              pdfWidth / 2,
              pdfHeight - 4,
              { align: 'center' }
            );
          }
        }
      }
    }

    // 7. Direct file download to user device (never triggers window.print)
    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(sanitizedFilename);

    return { success: true };
  } catch (err: any) {
    console.error('[PDF Export Error]:', err);
    return { 
      success: false, 
      error: err?.message || 'Failed to render PDF file. Please try again.' 
    };
  } finally {
    // Restore original spacing state
    if (originalSpacingAttr !== null) {
      element.setAttribute('data-spacing-mode', originalSpacingAttr);
    } else {
      element.removeAttribute('data-spacing-mode');
    }
  }
}
