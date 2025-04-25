import Tesseract from 'tesseract.js';



export async function tesseractOCR(
    imagePath: string,
    logger: (message: Tesseract.LoggerMessage) => void,
    lang: string = 'eng+chi_sim'
) {
    try {
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            lang,
            {
                logger
            }
        );

        return text;
    } catch (error) {
        console.error('OCR error:', error);
    }
    return '无法识别图片';
}