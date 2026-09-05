/**
 * Compress an image file client-side using HTML5 Canvas.
 * Reduces the file size to approximately 50% by converting to JPEG with 0.5 quality.
 */
export function compressImage(file: File, quality = 0.5): Promise<{ base64: string; size: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not a valid image."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Downscale very large images to save CDN bandwidth (max 1200px)
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi canvas untuk kompresi."));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Detect transparent formats to output PNG, else output JPEG
        const isTransparent = file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif" || file.type === "image/svg+xml";
        const mimeType = isTransparent ? "image/png" : "image/jpeg";

        // Convert canvas contents to base64 data URL
        const compressedBase64 = canvas.toDataURL(mimeType, mimeType === "image/jpeg" ? quality : undefined);
        
        // Estimate the size in bytes from the base64 string length
        const base64Content = compressedBase64.split(",")[1] || "";
        const sizeInBytes = Math.round((base64Content.length * 3) / 4);

        resolve({
          base64: compressedBase64,
          size: sizeInBytes,
          mimeType,
        });
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar untuk proses kompresi."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
