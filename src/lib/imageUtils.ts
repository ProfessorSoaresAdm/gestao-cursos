export async function resizeImage(
  file: File, maxW: number, maxH: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxW/img.width, maxH/img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas falhou')),
        'image/webp', 0.85);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
