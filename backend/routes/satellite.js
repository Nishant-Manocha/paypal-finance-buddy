const express = require('express');
const { body, validationResult } = require('express-validator');
const satelliteService = require('../services/satelliteService');
const imageProcessingService = require('../services/imageProcessingService');

const router = express.Router();

// POST /api/satellite/fetch-image
router.post('/fetch-image', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { latitude, longitude } = req.body;

    const result = await satelliteService.fetchSatelliteImage(latitude, longitude);

    res.json({
      success: true,
      message: 'Satellite image fetched successfully',
      result
    });

  } catch (error) {
    console.error('Fetch satellite image error:', error);
    res.status(500).json({
      error: 'Failed to fetch satellite image',
      message: error.message
    });
  }
});

// POST /api/satellite/analyze-area
router.post('/analyze-area', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { latitude, longitude } = req.body;

    // Fetch satellite image
    const satelliteResult = await satelliteService.fetchSatelliteImage(latitude, longitude);
    
    // Process image for area detection
    const analysisResult = await imageProcessingService.processImage(satelliteResult.imagePath);

    res.json({
      success: true,
      message: 'Area analysis completed',
      satellite: satelliteResult,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('Analyze area error:', error);
    res.status(500).json({
      error: 'Failed to analyze area',
      message: error.message
    });
  }
});

// GET /api/satellite/test
router.get('/test', async (req, res) => {
  try {
    // Test coordinates (somewhere in agricultural region)
    const testCoords = {
      latitude: 40.7128,  // New York area
      longitude: -74.0060
    };

    res.json({
      success: true,
      message: 'Satellite service test endpoint',
      testCoordinates: testCoords,
      instructions: 'Use POST /api/satellite/fetch-image with coordinates to test satellite image fetching'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Test endpoint failed',
      message: error.message
    });
  }
});

module.exports = router;