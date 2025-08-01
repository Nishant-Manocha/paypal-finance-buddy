const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs').promises;

class OCRService {
  constructor() {
    this.worker = null;
  }

  async initializeWorker() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng');
    }
    return this.worker;
  }

  async extractTextFromDocument(imagePath) {
    try {
      const startTime = Date.now();
      
      // Initialize worker if not already done
      await this.initializeWorker();
      
      // Perform OCR
      const { data } = await this.worker.recognize(imagePath);
      
      const processingTime = Date.now() - startTime;
      
      return {
        text: data.text,
        confidence: data.confidence,
        processingTime,
        words: data.words,
        lines: data.lines
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  extractLandSizeFromText(text) {
    try {
      // Common patterns for land size extraction
      const patterns = [
        // "X hectares", "X ha", "X acres"
        /(\d+(?:\.\d+)?)\s*(?:hectares?|ha)\b/gi,
        /(\d+(?:\.\d+)?)\s*(?:acres?)\b/gi,
        
        // "Area: X hectares" or "Land size: X ha"
        /(?:area|land\s*size|farm\s*size)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:hectares?|ha|acres?)/gi,
        
        // "X sq m", "X square meters"
        /(\d+(?:\.\d+)?)\s*(?:sq\.?\s*m|square\s*meters?|sqm)\b/gi,
        
        // Numbers followed by unit indicators
        /(\d+(?:\.\d+)?)\s*(?:hectare|ha|acre|sq\.?m|sqm)/gi
      ];

      const extractedSizes = [];
      
      for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
          const value = parseFloat(match[1]);
          if (!isNaN(value) && value > 0) {
            // Convert different units to hectares
            let sizeInHectares = value;
            const unit = match[0].toLowerCase();
            
            if (unit.includes('acre')) {
              sizeInHectares = value * 0.4047; // acres to hectares
            } else if (unit.includes('sq') || unit.includes('square')) {
              sizeInHectares = value / 10000; // sq meters to hectares
            }
            
            extractedSizes.push({
              originalValue: value,
              unit: this.detectUnit(unit),
              hectares: sizeInHectares,
              confidence: this.calculateConfidence(match[0], text)
            });
          }
        }
      }

      // Return the most confident extraction
      if (extractedSizes.length > 0) {
        const bestMatch = extractedSizes.reduce((prev, current) => 
          (current.confidence > prev.confidence) ? current : prev
        );
        return bestMatch;
      }

      return null;
    } catch (error) {
      console.error('Land size extraction error:', error);
      return null;
    }
  }

  detectUnit(text) {
    text = text.toLowerCase();
    if (text.includes('hectare') || text.includes('ha')) return 'hectares';
    if (text.includes('acre')) return 'acres';
    if (text.includes('sq') || text.includes('square')) return 'square_meters';
    return 'unknown';
  }

  calculateConfidence(match, fullText) {
    let confidence = 50; // base confidence
    
    // Increase confidence for explicit keywords
    if (match.toLowerCase().includes('area') || 
        match.toLowerCase().includes('land') ||
        match.toLowerCase().includes('farm')) {
      confidence += 30;
    }
    
    // Increase confidence for proper units
    if (match.toLowerCase().includes('hectare') || 
        match.toLowerCase().includes('acre')) {
      confidence += 20;
    }
    
    // Context analysis - look for surrounding words
    const contextWords = ['total', 'size', 'cultivated', 'agricultural'];
    for (const word of contextWords) {
      if (fullText.toLowerCase().includes(word)) {
        confidence += 10;
        break;
      }
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  async processLoanDocument(documentPath) {
    try {
      // Check if file exists
      await fs.access(documentPath);
      
      // Extract text using OCR
      const ocrResult = await this.extractTextFromDocument(documentPath);
      
      // Extract land size information
      const landSizeInfo = this.extractLandSizeFromText(ocrResult.text);
      
      return {
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        extractedLandSize: landSizeInfo ? landSizeInfo.hectares : null,
        landSizeDetails: landSizeInfo,
        wordCount: ocrResult.words ? ocrResult.words.length : 0,
        lineCount: ocrResult.lines ? ocrResult.lines.length : 0
      };
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

module.exports = new OCRService();