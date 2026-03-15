/**
 * Canvas-based client-side image compression.
 * No external packages required.
 *
 * @param {File} file - Original image file
 * @param {{ maxDimension?: number, quality?: number }} options
 * @returns {Promise<File>} Compressed file (or original, whichever is smaller)
 */
export async function compressImage(file, { maxDimension = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Skip compression if already small enough
      if (width <= maxDimension && height <= maxDimension && file.size < 300 * 1024) {
        resolve(file);
        return;
      }

      // Scale down to fit within maxDimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          // Use original if compression makes it larger
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fall back to original on error
    };

    img.src = objectUrl;
  });
}
