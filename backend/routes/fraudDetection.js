const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');

const fraudDetectionService = require('../services/fraudDetectionService');
const LoanApplication = require('../models/LoanApplication');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join('uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
    }
  }
});

// Validation middleware
const validateLoanApplication = [
  body('applicantName').trim().isLength({ min: 2 }).withMessage('Applicant name is required'),
  body('applicantPhone').isMobilePhone().withMessage('Valid phone number is required'),
  body('applicantAddress').trim().isLength({ min: 10 }).withMessage('Complete address is required'),
  body('loanAmount').isNumeric().isFloat({ min: 1000 }).withMessage('Loan amount must be at least $1000'),
  body('loanPurpose').isIn(['agriculture', 'livestock', 'equipment', 'other']).withMessage('Invalid loan purpose'),
  body('claimedLandSize').isNumeric().isFloat({ min: 0.1 }).withMessage('Land size must be at least 0.1 hectares'),
  body('landLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('landLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

// POST /api/fraud-detection/submit-application
router.post('/submit-application', upload.single('document'), validateLoanApplication, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Document file is required'
      });
    }

    const {
      applicantName,
      applicantPhone,
      applicantAddress,
      loanAmount,
      loanPurpose,
      claimedLandSize,
      landLocation
    } = req.body;

    // Parse landLocation if it's a string
    let parsedLocation;
    try {
      parsedLocation = typeof landLocation === 'string' ? JSON.parse(landLocation) : landLocation;
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid land location format'
      });
    }

    // Create loan application record
    const loanApplication = new LoanApplication({
      userId: req.user?.id || null, // Will be set if authentication is implemented
      applicantName,
      applicantPhone,
      applicantAddress,
      loanAmount: parseFloat(loanAmount),
      loanPurpose,
      claimedLandSize: parseFloat(claimedLandSize),
      landLocation: {
        latitude: parseFloat(parsedLocation.latitude),
        longitude: parseFloat(parsedLocation.longitude),
        address: parsedLocation.address || ''
      },
      documentPath: req.file.path,
      documentType: req.file.mimetype.includes('pdf') ? 'pdf' : path.extname(req.file.originalname).toLowerCase().replace('.', ''),
      status: 'SUBMITTED'
    });

    await loanApplication.save();

    // Start fraud detection process asynchronously
    fraudDetectionService.processLoanApplication(loanApplication._id)
      .catch(error => {
        console.error('Background fraud detection failed:', error);
      });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      applicationId: loanApplication._id,
      status: 'SUBMITTED',
      estimatedProcessingTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      error: 'Failed to submit loan application',
      message: error.message
    });
  }
});

// GET /api/fraud-detection/status/:applicationId
router.get('/status/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await LoanApplication.findById(applicationId)
      .select('-__v -documentPath'); // Exclude sensitive fields

    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }

    res.json({
      applicationId: application._id,
      status: application.status,
      fraudAnalysis: application.fraudAnalysis,
      submittedAt: application.submittedAt,
      processedAt: application.processedAt,
      applicantName: application.applicantName,
      loanAmount: application.loanAmount,
      claimedLandSize: application.claimedLandSize,
      landLocation: application.landLocation
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: 'Failed to get application status',
      message: error.message
    });
  }
});

// GET /api/fraud-detection/report/:applicationId
router.get('/report/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await LoanApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }

    // Generate comprehensive report
    const report = {
      applicationDetails: {
        id: application._id,
        applicantName: application.applicantName,
        loanAmount: application.loanAmount,
        loanPurpose: application.loanPurpose,
        claimedLandSize: application.claimedLandSize,
        landLocation: application.landLocation,
        submittedAt: application.submittedAt,
        processedAt: application.processedAt,
        status: application.status
      },
      fraudAnalysis: application.fraudAnalysis,
      ocrResults: {
        extractedText: application.ocrResults?.extractedText?.substring(0, 500) + '...', // Truncate for security
        confidence: application.ocrResults?.confidence,
        extractedLandSize: application.ocrResults?.extractedLandSize,
        processingTime: application.ocrResults?.processingTime
      },
      satelliteAnalysis: application.satelliteAnalysis,
      riskAssessment: {
        overallRisk: application.fraudAnalysis?.riskLevel,
        fraudScore: application.fraudAnalysis?.fraudScore,
        verificationStatus: application.fraudAnalysis?.verificationStatus,
        recommendations: application.fraudAnalysis?.recommendations
      },
      processingMetadata: {
        totalProcessingTime: application.processedAt ? 
          new Date(application.processedAt) - new Date(application.submittedAt) : null,
        analysisMethod: 'satellite-ocr-cross-verification'
      }
    };

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

// POST /api/fraud-detection/process/:applicationId
router.post('/process/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }

    if (application.status === 'PROCESSING') {
      return res.status(409).json({
        error: 'Application is already being processed'
      });
    }

    // Start fraud detection process
    const result = await fraudDetectionService.processLoanApplication(applicationId);

    res.json({
      success: true,
      message: 'Fraud detection completed',
      result
    });

  } catch (error) {
    console.error('Process application error:', error);
    res.status(500).json({
      error: 'Failed to process application',
      message: error.message
    });
  }
});

// GET /api/fraud-detection/applications
router.get('/applications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const riskLevel = req.query.riskLevel;

    const query = {};
    if (status) query.status = status;
    if (riskLevel) query['fraudAnalysis.riskLevel'] = riskLevel;

    const skip = (page - 1) * limit;

    const applications = await LoanApplication.find(query)
      .select('-ocrResults.extractedText -documentPath')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoanApplication.countDocuments(query);

    res.json({
      success: true,
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      error: 'Failed to get applications',
      message: error.message
    });
  }
});

// GET /api/fraud-detection/statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await LoanApplication.aggregate([
      {
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          completedApplications: { 
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } 
          },
          lowRiskApplications: { 
            $sum: { $cond: [{ $eq: ['$fraudAnalysis.riskLevel', 'LOW'] }, 1, 0] } 
          },
          mediumRiskApplications: { 
            $sum: { $cond: [{ $eq: ['$fraudAnalysis.riskLevel', 'MEDIUM'] }, 1, 0] } 
          },
          highRiskApplications: { 
            $sum: { $cond: [{ $eq: ['$fraudAnalysis.riskLevel', 'HIGH'] }, 1, 0] } 
          },
          averageFraudScore: { $avg: '$fraudAnalysis.fraudScore' },
          totalLoanAmount: { $sum: '$loanAmount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalApplications: 0,
      completedApplications: 0,
      lowRiskApplications: 0,
      mediumRiskApplications: 0,
      highRiskApplications: 0,
      averageFraudScore: 0,
      totalLoanAmount: 0
    };

    res.json({
      success: true,
      statistics: result
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

module.exports = router;