export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Wrap in a 15-second timeout so it never hangs permanently
  const compressionPromise = new Promise<File>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback to original if canvas fails
          return;
        }

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas back to file
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Ensure we return a smaller file. If compression made it larger, return original.
              if (blob.size < file.size || width !== img.width) {
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            } else {
              resolve(file); // fallback to original
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file); // on error, return original
    };
    reader.onerror = () => resolve(file); // on error, return original
  });

  // Race compression against a 15s timeout — always fallback to original file
  const timeoutPromise = new Promise<File>((resolve) =>
    setTimeout(() => resolve(file), 15000)
  );

  return Promise.race([compressionPromise, timeoutPromise]);
}
