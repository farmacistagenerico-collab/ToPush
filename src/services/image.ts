/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Foto dei prodotti: compressione lato browser prima del salvataggio.
 *
 * In modalità locale l'archivio vive in `localStorage` (~5 MB): una foto da
 * smartphone (3-5 MB) lo farebbe esplodere al primo scatto. Qui l'immagine
 * viene ridimensionata (lato max 320 px) e ricodificata in JPEG ~70%:
 * pochi KB a foto, centinaia di referenze con foto restano nei limiti.
 */

export const PHOTO_MAX_SIDE = 320;
export const PHOTO_QUALITY = 0.72;

/** Legge un file immagine e lo restituisce come data-url JPEG compresso. */
export async function fileToCompressedDataUrl(
  file: File,
  maxSide: number = PHOTO_MAX_SIDE,
  quality: number = PHOTO_QUALITY
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Il file scelto non è un’immagine.');
  }

  const bitmap = await createImageBitmap(file).catch(async () => {
    // Fallback per browser senza createImageBitmap: passa da un <img>.
    const url = URL.createObjectURL(file);
    try {
      return await new Promise<ImageBitmap>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img as unknown as ImageBitmap);
        img.onerror = () => reject(new Error('Immagine non leggibile.'));
        img.src = url;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  });

  const width = (bitmap as unknown as { width: number }).width;
  const height = (bitmap as unknown as { height: number }).height;
  if (!width || !height) throw new Error('Immagine non leggibile.');

  const scale = Math.min(1, maxSide / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponibile in questo browser.');
  ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, w, h);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  return canvas.toDataURL('image/jpeg', quality);
}
