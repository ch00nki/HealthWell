// utils/cropImage.ts
type PixelCrop = { x: number; y: number; width: number; height: number };

export default function getCroppedImg(imageSrc: string, pixelCrop: PixelCrop): Promise<Blob> {
  //imageSrc is temp img url, pixelCrop is the crop area in pixels  
  return new Promise((resolve, reject) => {
    //Promise awaits for asynchronous cropping to complete
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
  
        if (!ctx) return reject('Could not get context');
  
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        //binary img file
        canvas.toBlob((blob) => {
          if (!blob) return reject('Canvas is empty');
          resolve(blob);
        }, 'image/jpeg');
      };
      image.onerror = (err) => reject(err);
    });
  }
  