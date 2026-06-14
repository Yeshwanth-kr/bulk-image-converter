import JSZip from 'jszip';

/**
 * Core Canvas operation to scale and convert a single image file
 */
const processCanvasImage = (file, outputFormat, targetWidth = null, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Guardrail: Skip downscaling if image is already narrower than the target breakpoint
        if (targetWidth && img.naturalWidth > targetWidth) {
          const scaleFactor = targetWidth / img.naturalWidth;
          width = targetWidth;
          height = img.naturalHeight * scaleFactor;
        } else if (targetWidth && img.naturalWidth <= targetWidth) {
          // Signal to skip this breakpoint variation to prevent upscaling blur
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fix Transparency Trap: Render white background instead of black if converting to JPEG
        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas compilation returned null byte stream'));
          }
        }, outputFormat, quality);
      };

      img.onerror = () => reject(new Error('Failed to parse image source elements'));
    };

    reader.onerror = () => reject(new Error('Failed to read file buffer array'));
  });
};

/**
 * Orchestrates batch multi-file array rendering into a structured ZIP stream
 */
export const runBatchConversion = async (files, config) => {
  const zip = new JSZip();
  const { isDevMode, generateBreakpoints, outputFormat, quality, customBreakpoints } = config;

  // Convert human-readable UI names to formal browser MIME handles
  const formatMimeMap = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };
  const mimeType = formatMimeMap[outputFormat] || 'image/jpeg';
  const fileExt = outputFormat === 'jpg' ? 'jpg' : outputFormat;

  for (const fileItem of files) {
    const originalFile = fileItem.file;
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;

    if (isDevMode && generateBreakpoints && outputFormat === 'webp') {
      // Option B Setup: Scaffold a separate folder entry inside the ZIP matrix for this file
      const assetFolder = zip.folder(baseName);
      let varianceAdded = false;

      for (const width of customBreakpoints) {
        try {
          const blob = await processCanvasImage(originalFile, mimeType, width, quality);
          if (blob) {
            assetFolder.file(`${baseName}-${width}.${fileExt}`, blob);
            varianceAdded = true;
          }
        } catch (err) {
          console.error(`Skipped sub-rendering resolution ${width}px for ${originalFile.name}:`, err);
        }
      }

      // If all breakpoints were skipped because the source file was too small, preserve its original bounds as webp
      if (!varianceAdded) {
        const fallbackBlob = await processCanvasImage(originalFile, mimeType, null, quality);
        assetFolder.file(`${baseName}.${fileExt}`, fallbackBlob);
      }
    } else {
      // Standard / Non-tech execution mode: Flat files in the root folder directory
      try {
        const blob = await processCanvasImage(originalFile, mimeType, null, quality);
        zip.file(`${baseName}.${fileExt}`, blob);
      } catch (err) {
        console.error(`Failed standard execution on image conversion: ${originalFile.name}`, err);
      }
    }
  }

  // Generate the compiled ZIP archive as a safe download payload
  return await zip.generateAsync({ type: 'blob' });
};