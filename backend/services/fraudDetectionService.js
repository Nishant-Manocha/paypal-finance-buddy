const ocrService = require('./ocrService');
const satelliteService = require('./satelliteService');
const imageProcessingService = require('./imageProcessingService');
const LoanApplication = require('../models/LoanApplication');

class FraudDetectionService {
  constructor() {
    this.riskThresholds = {
      LOW: 20,    // 0-20% fraud score
      MEDIUM: 60, // 21-60% fraud score
      HIGH: 100   // 61-100% fraud score
    };
    
    this.weightings = {
      sizeDifference: 0.6,    // 60% weight for size difference
      ocrConfidence: 0.2,     // 20% weight for OCR confidence
      satelliteConfidence: 0.2 // 20% weight for satellite confidence
    };
  }

  async processLoanApplication(applicationId) {
    try {
      console.log(`Starting fraud detection for application: ${applicationId}`);
      
      // Get loan application from database
      const application = await LoanApplication.findById(applicationId);
      if (!application) {
        throw new Error('Loan application not found');
      }

      // Update status to processing
      application.status = 'PROCESSING';
      await application.save();

      const results = {};
      
      // Step 1: OCR Processing
      console.log('Step 1: Processing document with OCR...');
      try {
        const ocrResults = await ocrService.processLoanDocument(application.documentPath);
        application.ocrResults = ocrResults;
        results.ocr = ocrResults;
        console.log(`OCR completed: extracted ${ocrResults.extractedLandSize} hectares`);
      } catch (error) {
        console.error('OCR processing failed:', error.message);
        results.ocr = { error: error.message };
      }

      // Step 2: Satellite Image Fetching
      console.log('Step 2: Fetching satellite imagery...');
      try {
        const satelliteResults = await satelliteService.fetchSatelliteImage(
          application.landLocation.latitude,
          application.landLocation.longitude
        );
        results.satellite = satelliteResults;
        console.log(`Satellite image fetched from ${satelliteResults.source}`);
      } catch (error) {
        console.error('Satellite fetching failed:', error.message);
        results.satellite = { error: error.message };
      }

      // Step 3: Image Processing for Area Detection
      console.log('Step 3: Processing satellite image for area detection...');
      if (results.satellite && !results.satellite.error) {
        try {
          const imageAnalysis = await imageProcessingService.processImage(results.satellite.imagePath);
          
          application.satelliteAnalysis = {
            imageUrl: results.satellite.imageUrl,
            detectedLandSize: imageAnalysis.detectedArea.hectares,
            processingTime: imageAnalysis.processingTime,
            confidence: imageAnalysis.confidence,
            analysisMethod: 'opencv-hsv-segmentation'
          };
          
          results.imageProcessing = imageAnalysis;
          console.log(`Image processing completed: detected ${imageAnalysis.detectedArea.hectares} hectares`);
        } catch (error) {
          console.error('Image processing failed:', error.message);
          results.imageProcessing = { error: error.message };
        }
      }

      // Step 4: Fraud Analysis
      console.log('Step 4: Calculating fraud score...');
      const fraudAnalysis = await this.calculateFraudScore(application, results);
      application.fraudAnalysis = fraudAnalysis;
      results.fraudAnalysis = fraudAnalysis;

      // Step 5: Generate Recommendations
      const recommendations = this.generateRecommendations(application, results);
      application.fraudAnalysis.recommendations = recommendations;
      results.recommendations = recommendations;

      // Update application status
      application.status = 'COMPLETED';
      application.processedAt = new Date();
      await application.save();

      console.log(`Fraud detection completed for application: ${applicationId}`);
      console.log(`Risk Level: ${fraudAnalysis.riskLevel}, Score: ${fraudAnalysis.fraudScore}`);

      return {
        applicationId,
        fraudScore: fraudAnalysis.fraudScore,
        riskLevel: fraudAnalysis.riskLevel,
        verificationStatus: fraudAnalysis.verificationStatus,
        results,
        recommendations,
        processingTime: Date.now() - new Date(application.submittedAt).getTime()
      };

    } catch (error) {
      console.error('Fraud detection process failed:', error);
      
      // Update application status to failed
      try {
        await LoanApplication.findByIdAndUpdate(applicationId, {
          status: 'FAILED',
          'fraudAnalysis.verificationStatus': 'NEEDS_REVIEW'
        });
      } catch (updateError) {
        console.error('Failed to update application status:', updateError);
      }
      
      throw error;
    }
  }

  async calculateFraudScore(application, results) {
    try {
      const claimedSize = application.claimedLandSize;
      const ocrExtractedSize = results.ocr?.extractedLandSize;
      const detectedSize = results.imageProcessing?.detectedArea?.hectares;
      
      let fraudScore = 0;
      let sizeDifference = 0;
      let sizeDifferencePercent = 0;
      let riskLevel = 'LOW';
      let verificationStatus = 'APPROVED';

      // Primary comparison: Claimed vs Satellite-detected size
      if (claimedSize && detectedSize) {
        sizeDifference = Math.abs(claimedSize - detectedSize);
        sizeDifferencePercent = (sizeDifference / claimedSize) * 100;
        
        // Base fraud score from size difference
        let sizeScore = this.calculateSizeDifferenceScore(sizeDifferencePercent);
        fraudScore += sizeScore * this.weightings.sizeDifference;
      }

      // Secondary validation: OCR vs Claimed size consistency
      if (claimedSize && ocrExtractedSize) {
        const ocrDifference = Math.abs(claimedSize - ocrExtractedSize);
        const ocrDifferencePercent = (ocrDifference / claimedSize) * 100;
        
        if (ocrDifferencePercent > 20) {
          fraudScore += 20; // Penalty for inconsistent document
        }
      }

      // Confidence adjustments
      const ocrConfidence = results.ocr?.confidence || 50;
      const satelliteConfidence = results.imageProcessing?.confidence || 50;
      
      // Lower confidence means higher uncertainty, slight increase in fraud score
      const confidenceScore = (200 - ocrConfidence - satelliteConfidence) / 4;
      fraudScore += confidenceScore * (this.weightings.ocrConfidence + this.weightings.satelliteConfidence);

      // Determine risk level and verification status
      fraudScore = Math.min(100, Math.max(0, fraudScore));
      
      if (fraudScore <= this.riskThresholds.LOW) {
        riskLevel = 'LOW';
        verificationStatus = 'APPROVED';
      } else if (fraudScore <= this.riskThresholds.MEDIUM) {
        riskLevel = 'MEDIUM';
        verificationStatus = 'NEEDS_REVIEW';
      } else {
        riskLevel = 'HIGH';
        verificationStatus = 'REJECTED';
      }

      // Additional risk factors
      const riskFactors = this.assessAdditionalRiskFactors(application, results);
      
      return {
        fraudScore: Math.round(fraudScore),
        riskLevel,
        sizeDifference,
        sizeDifferencePercent: parseFloat(sizeDifferencePercent.toFixed(2)),
        verificationStatus,
        riskFactors,
        confidenceScores: {
          ocr: ocrConfidence,
          satellite: satelliteConfidence,
          overall: Math.round((ocrConfidence + satelliteConfidence) / 2)
        },
        analysisMetadata: {
          claimedSize,
          ocrExtractedSize,
          detectedSize,
          calculationMethod: 'weighted-multi-factor',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Fraud score calculation error:', error);
      return {
        fraudScore: 50,
        riskLevel: 'MEDIUM',
        verificationStatus: 'NEEDS_REVIEW',
        error: error.message
      };
    }
  }

  calculateSizeDifferenceScore(differencePercent) {
    // Progressive scoring based on percentage difference
    if (differencePercent <= 5) return 0;        // Very small difference
    if (differencePercent <= 10) return 10;      // Small difference
    if (differencePercent <= 20) return 25;      // Moderate difference
    if (differencePercent <= 50) return 50;      // Large difference
    if (differencePercent <= 100) return 75;     // Very large difference
    return 100; // Extreme difference
  }

  assessAdditionalRiskFactors(application, results) {
    const riskFactors = [];

    // Check for unusually large loan amounts relative to land size
    if (application.loanAmount && application.claimedLandSize) {
      const loanPerHectare = application.loanAmount / application.claimedLandSize;
      if (loanPerHectare > 100000) { // $100k per hectare threshold
        riskFactors.push({
          type: 'HIGH_LOAN_TO_LAND_RATIO',
          description: 'Loan amount is unusually high relative to claimed land size',
          severity: 'MEDIUM'
        });
      }
    }

    // Check for poor image quality or processing issues
    if (results.imageProcessing?.confidence < 30) {
      riskFactors.push({
        type: 'LOW_SATELLITE_CONFIDENCE',
        description: 'Satellite image analysis has low confidence',
        severity: 'LOW'
      });
    }

    // Check for OCR extraction failures
    if (!results.ocr?.extractedLandSize) {
      riskFactors.push({
        type: 'OCR_EXTRACTION_FAILED',
        description: 'Could not extract land size from submitted document',
        severity: 'MEDIUM'
      });
    }

    // Check for extreme coordinates (potential fake locations)
    const lat = application.landLocation.latitude;
    const lon = application.landLocation.longitude;
    if (Math.abs(lat) > 80 || (lat === 0 && lon === 0)) {
      riskFactors.push({
        type: 'SUSPICIOUS_COORDINATES',
        description: 'Land coordinates appear to be in an unusual or invalid location',
        severity: 'HIGH'
      });
    }

    return riskFactors;
  }

  generateRecommendations(application, results) {
    const recommendations = [];
    const fraudScore = application.fraudAnalysis?.fraudScore || 0;
    const riskLevel = application.fraudAnalysis?.riskLevel;

    if (riskLevel === 'LOW') {
      recommendations.push('Application appears legitimate - recommend approval with standard verification');
      if (fraudScore < 10) {
        recommendations.push('Excellent match between claimed and detected land size');
      }
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Requires manual review by loan officer');
      recommendations.push('Consider conducting physical site visit');
      recommendations.push('Verify documents with additional documentation');
      
      if (application.fraudAnalysis?.sizeDifferencePercent > 25) {
        recommendations.push('Significant discrepancy in land size - investigate further');
      }
    } else if (riskLevel === 'HIGH') {
      recommendations.push('High fraud risk - recommend rejection or thorough investigation');
      recommendations.push('Mandatory physical verification required');
      recommendations.push('Review all submitted documents for authenticity');
      
      if (application.fraudAnalysis?.sizeDifferencePercent > 50) {
        recommendations.push('Extreme land size discrepancy detected - likely fraudulent claim');
      }
    }

    // Technical recommendations
    if (results.ocr?.confidence < 50) {
      recommendations.push('Poor document quality - request clearer document scan');
    }

    if (results.imageProcessing?.confidence < 40) {
      recommendations.push('Satellite analysis has low confidence - manual verification recommended');
    }

    // Risk factor specific recommendations
    const riskFactors = application.fraudAnalysis?.riskFactors || [];
    for (const factor of riskFactors) {
      if (factor.type === 'HIGH_LOAN_TO_LAND_RATIO') {
        recommendations.push('Loan amount appears high for claimed land size - verify market rates');
      }
      if (factor.type === 'SUSPICIOUS_COORDINATES') {
        recommendations.push('Verify land location with official records');
      }
    }

    return recommendations;
  }

  // Method to update risk thresholds
  updateRiskThresholds(newThresholds) {
    this.riskThresholds = { ...this.riskThresholds, ...newThresholds };
  }

  // Method to update weightings
  updateWeightings(newWeightings) {
    this.weightings = { ...this.weightings, ...newWeightings };
  }

  // Get current configuration
  getConfiguration() {
    return {
      riskThresholds: this.riskThresholds,
      weightings: this.weightings
    };
  }
}

module.exports = new FraudDetectionService();