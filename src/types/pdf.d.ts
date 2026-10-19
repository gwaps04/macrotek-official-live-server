// FILE: src/types/pdf.d.ts

declare module 'html2canvas' {
  export interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    logging?: boolean;
    backgroundColor?: string | null;
    windowWidth?: number;
    windowHeight?: number;
    onclone?: (clonedDoc: Document) => void;
    [key: string]: any;
  }

  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module 'jspdf' {
  export interface JsPdfOptions {
    orientation?: 'portrait' | 'landscape' | 'p' | 'l';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
    format?: string | [number, number];
    compress?: boolean;
  }

  export class jsPDF {
    constructor(options?: JsPdfOptions);
    constructor(
      orientation?: 'portrait' | 'landscape' | 'p' | 'l',
      unit?: string,
      format?: string | [number, number],
      compress?: boolean
    );

    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };

    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): this;

    addPage(format?: string | [number, number], orientation?: 'portrait' | 'landscape' | 'p' | 'l'): this;
    save(filename: string): void;
  }
}
