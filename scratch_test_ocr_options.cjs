const fs = require('fs');
const path = require('path');

const OCR_API_KEY = 'K87161803788957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

async function testOcrOptions(filePath, scale, engine) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = `data:image/png;base64,${fileBuffer.toString('base64')}`;

    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', base64Image);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    if (scale) {
      formData.append('scale', 'true');
    }
    if (engine) {
      formData.append('OCREngine', engine);
    }

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error(`Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.IsErroredOnProcessing) {
      console.error(`OCR Error (scale=${scale}, engine=${engine}):`, data.ErrorMessage);
      return null;
    }

    return data.ParsedResults?.[0]?.ParsedText || '';
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

const dir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\7d17faf4-5935-4711-8af4-1eb4db2d5001';
const carImage = path.join(dir, 'media__1780995297592.png');

async function main() {
  console.log('--- Testing combinations on car image: media__1780995297592.png ---');
  
  // Option 1: Engine 1, scale=false (Current)
  const text1 = await testOcrOptions(carImage, false, '1');
  console.log(`[Engine 1, scale=false]: ${JSON.stringify(text1)}`);

  // Option 2: Engine 1, scale=true
  const text2 = await testOcrOptions(carImage, true, '1');
  console.log(`[Engine 1, scale=true]: ${JSON.stringify(text2)}`);

  // Option 3: Engine 2, scale=false
  const text3 = await testOcrOptions(carImage, false, '2');
  console.log(`[Engine 2, scale=false]: ${JSON.stringify(text3)}`);

  // Option 4: Engine 2, scale=true
  const text4 = await testOcrOptions(carImage, true, '2');
  console.log(`[Engine 2, scale=true]: ${JSON.stringify(text4)}`);
}

main();
