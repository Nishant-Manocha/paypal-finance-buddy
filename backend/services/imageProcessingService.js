const cv = require('opencv4nodejs');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessingService {
  constructor() {
    // Farmland detection parameters
    this.farmlandHSVRanges = {
      // Green vegetation (crops)
      green_low: [40, 40, 40],
      green_high: [80, 255, 255],
      // Brown soil/field
      brown_low: [10, 50, 20],
      brown_high: [25, 255, 200]
    };
    
    // Pixel to area conversion (approximate)
    this.METERS_PER_PIXEL = 10; // For Sentinel-2 data (10m resolution)
    this.HECTARES_PER_SQ_METER = 0.0001;
  }

  async processImage(imagePath) {
    try {
      const startTime = Date.now();
      
      // Load the image
      const image = await cv.imreadAsync(imagePath);
      if (image.empty) {
        throw new Error('Could not load image');
      }

      // Convert to HSV color space for better vegetation detection
      const hsvImage = image.cvtColor(cv.COLOR_BGR2HSV);
      
      // Detect farmland areas
      const farmlandMask = await this.detectFarmland(hsvImage);
      
      // Calculate area
      const areaPixels = cv.countNonZero(farmlandMask);
      const areaSquareMeters = areaPixels * (this.METERS_PER_PIXEL * this.METERS_PER_PIXEL);
      const areaHectares = areaSquareMeters * this.HECTARES_PER_SQ_METER;
      
      // Create visualization overlay
      const overlayImage = await this.createOverlay(image, farmlandMask);
      
      // Save processed images
      const outputPath = await this.saveProcessedImages(imagePath, overlayImage, farmlandMask);
      
      const processingTime = Date.now() - startTime;
      
      return {
        detectedArea: {
          pixels: areaPixels,
          squareMeters: areaSquareMeters,
          hectares: parseFloat(areaHectares.toFixed(4))
        },
        confidence: await this.calculateConfidence(farmlandMask, image),
        processingTime,
        outputImages: outputPath,
        metadata: {
          imageSize: { width: image.cols, height: image.rows },
          metersPerPixel: this.METERS_PER_PIXEL,
          totalPixels: image.cols * image.rows,
          farmlandPixelPercentage: ((areaPixels / (image.cols * image.rows)) * 100).toFixed(2)
        }
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  async detectFarmland(hsvImage) {
    try {
      // Create masks for different farmland types
      const greenMask = hsvImage.inRange(
        new cv.Vec3(...this.farmlandHSVRanges.green_low),
        new cv.Vec3(...this.farmlandHSVRanges.green_high)
      );
      
      const brownMask = hsvImage.inRange(
        new cv.Vec3(...this.farmlandHSVRanges.brown_low),
        new cv.Vec3(...this.farmlandHSVRanges.brown_high)
      );
      
      // Combine masks
      let combinedMask = greenMask.bitwiseOr(brownMask);
      
      // Apply morphological operations to clean up the mask
      const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
      combinedMask = combinedMask.morphologyEx(cv.MORPH_CLOSE, kernel);
      combinedMask = combinedMask.morphologyEx(cv.MORPH_OPEN, kernel);
      
      // Remove small noise using contour filtering
      const contours = combinedMask.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      const filteredMask = new cv.Mat(combinedMask.rows, combinedMask.cols, cv.CV_8UC1, 0);
      
      for (const contour of contours) {
        const area = cv.contourArea(contour);
        // Only keep contours larger than 100 pixels (to remove noise)
        if (area > 100) {
          filteredMask.drawContours([contour], -1, new cv.Vec3(255), -1);
        }
      }
      
      return filteredMask;
    } catch (error) {
      console.error('Farmland detection error:', error);
      throw error;
    }
  }

  async createOverlay(originalImage, farmlandMask) {
    try {
      // Create colored overlay for farmland areas
      const overlay = originalImage.clone();
      
      // Create a green overlay for detected farmland
      const greenOverlay = new cv.Mat(originalImage.rows, originalImage.cols, cv.CV_8UC3, [0, 255, 0]);
      
      // Apply mask to create transparent overlay
      const maskedOverlay = new cv.Mat();
      greenOverlay.copyTo(maskedOverlay, farmlandMask);
      
      // Blend with original image
      const result = overlay.addWeighted(maskedOverlay, 0.3, overlay, 0.7, 0);
      
      return result;
    } catch (error) {
      console.error('Overlay creation error:', error);
      throw error;
    }
  }

  async saveProcessedImages(originalPath, overlayImage, maskImage) {
    try {
      const timestamp = Date.now();
      const baseName = path.basename(originalPath, path.extname(originalPath));
      const outputDir = path.join('uploads', 'processed');
      
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      const overlayPath = path.join(outputDir, `${baseName}_overlay_${timestamp}.jpg`);
      const maskPath = path.join(outputDir, `${baseName}_mask_${timestamp}.jpg`);
      
      // Save images
      await cv.imwriteAsync(overlayPath, overlayImage);
      await cv.imwriteAsync(maskPath, maskImage);
      
      return {
        overlayPath: overlayPath,
        maskPath: maskPath,
        overlayUrl: `/uploads/processed/${path.basename(overlayPath)}`,
        maskUrl: `/uploads/processed/${path.basename(maskPath)}`
      };
    } catch (error) {
      console.error('Error saving processed images:', error);
      throw error;
    }
  }

  async calculateConfidence(farmlandMask, originalImage) {
    try {
      const totalPixels = originalImage.cols * originalImage.rows;
      const farmlandPixels = cv.countNonZero(farmlandMask);
      const farmlandPercentage = (farmlandPixels / totalPixels) * 100;
      
      let confidence = 50; // Base confidence
      
      // Adjust confidence based on detected area percentage
      if (farmlandPercentage > 5 && farmlandPercentage < 80) {
        confidence += 30; // Reasonable farmland percentage
      } else if (farmlandPercentage < 1) {
        confidence -= 20; // Very little farmland detected
      } else if (farmlandPercentage > 90) {
        confidence -= 10; // Suspiciously high farmland percentage
      }
      
      // Check for edge connectivity (farmland usually doesn't touch all edges)
      const edgeConnectivity = await this.checkEdgeConnectivity(farmlandMask);
      if (edgeConnectivity < 0.8) {
        confidence += 10; // Good, farmland not touching all edges
      } else {
        confidence -= 15; // Suspicious, might be detecting background
      }
      
      // Check contour regularity
      const contours = farmlandMask.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      const contourRegularity = await this.assessContourRegularity(contours);
      confidence += contourRegularity * 10;
      
      return Math.max(10, Math.min(95, confidence)); // Clamp between 10-95%
    } catch (error) {
      console.error('Confidence calculation error:', error);
      return 50; // Default confidence
    }
  }

  async checkEdgeConnectivity(mask) {
    try {
      const rows = mask.rows;
      const cols = mask.cols;
      
      // Check edges for farmland pixels
      let edgePixels = 0;
      let totalEdgePixels = (rows + cols - 2) * 2;
      
      // Top and bottom edges
      for (let col = 0; col < cols; col++) {
        if (mask.at(0, col) > 0) edgePixels++;
        if (mask.at(rows - 1, col) > 0) edgePixels++;
      }
      
      // Left and right edges
      for (let row = 1; row < rows - 1; row++) {
        if (mask.at(row, 0) > 0) edgePixels++;
        if (mask.at(row, cols - 1) > 0) edgePixels++;
      }
      
      return edgePixels / totalEdgePixels;
    } catch (error) {
      console.error('Edge connectivity check error:', error);
      return 0.5; // Default value
    }
  }

  async assessContourRegularity(contours) {
    try {
      if (contours.length === 0) return 0;
      
      let totalRegularity = 0;
      let validContours = 0;
      
      for (const contour of contours) {
        const area = cv.contourArea(contour);
        if (area > 500) { // Only assess larger contours
          const perimeter = cv.arcLength(contour, true);
          const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
          
          // Farmland should have reasonable circularity (not too round, not too irregular)
          if (circularity > 0.1 && circularity < 0.8) {
            totalRegularity += circularity;
            validContours++;
          }
        }
      }
      
      return validContours > 0 ? (totalRegularity / validContours) : 0;
    } catch (error) {
      console.error('Contour regularity assessment error:', error);
      return 0.5; // Default value
    }
  }

  // Method to manually adjust detection parameters
  updateDetectionParameters(params) {
    if (params.greenRange) {
      this.farmlandHSVRanges.green_low = params.greenRange.low;
      this.farmlandHSVRanges.green_high = params.greenRange.high;
    }
    
    if (params.brownRange) {
      this.farmlandHSVRanges.brown_low = params.brownRange.low;
      this.farmlandHSVRanges.brown_high = params.brownRange.high;
    }
    
    if (params.metersPerPixel) {
      this.METERS_PER_PIXEL = params.metersPerPixel;
    }
  }

  // Get current detection parameters
  getDetectionParameters() {
    return {
      farmlandHSVRanges: this.farmlandHSVRanges,
      metersPerPixel: this.METERS_PER_PIXEL,
      hectaresPerSqMeter: this.HECTARES_PER_SQ_METER
    };
  }
}

module.exports = new ImageProcessingService();