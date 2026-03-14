/**
 * Canvas tabanlı client-side görüntü sıkıştırma.
 * Ekstra paket gerektirmez.
 *
 * @param {File} file - Orijinal görüntü dosyası
 * @param {{ maxDimension?: number, quality?: number }} options
 * @returns {Promise<File>} Sıkıştırılmış dosya (veya orijinal, hangisi küçükse)
 */
export async function compressImage(file, { maxDimension = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Zaten küçükse sıkıştırmaya gerek yok
      if (width <= maxDimension && height <= maxDimension && file.size < 300 * 1024) {
        resolve(file);
        return;
      }

      // Boyutları maxDimension'a sığdır
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
          // Sıkıştırma büyütüyorsa orijinali kullan
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
      resolve(file); // Hata durumunda orijinali kullan
    };

    img.src = objectUrl;
  });
}
