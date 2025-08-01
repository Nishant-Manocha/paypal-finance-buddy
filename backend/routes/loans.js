const express = require('express');
const LoanApplication = require('../models/LoanApplication');

const router = express.Router();

// GET /api/loans - Get all loan applications
router.get('/', async (req, res) => {
  try {
    const applications = await LoanApplication.find()
      .select('-documentPath -ocrResults.extractedText')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch loan applications',
      message: error.message
    });
  }
});

// GET /api/loans/:id - Get specific loan application
router.get('/:id', async (req, res) => {
  try {
    const application = await LoanApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        error: 'Loan application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch loan application',
      message: error.message
    });
  }
});

module.exports = router;