const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: {
    type: String,
    required: true,
    trim: true
  },
  applicantPhone: {
    type: String,
    required: true
  },
  applicantAddress: {
    type: String,
    required: true
  },
  
  // Loan Details
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  loanPurpose: {
    type: String,
    required: true,
    enum: ['agriculture', 'livestock', 'equipment', 'other']
  },
  
  // Land Information
  claimedLandSize: {
    type: Number, // in hectares
    required: true,
    min: 0
  },
  landLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String
  },
  
  // Document Information
  documentPath: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['pdf', 'jpeg', 'jpg', 'png'],
    required: true
  },
  
  // OCR Results
  ocrResults: {
    extractedText: String,
    confidence: Number,
    extractedLandSize: Number,
    processingTime: Number
  },
  
  // Satellite Analysis
  satelliteAnalysis: {
    imageUrl: String,
    detectedLandSize: Number, // in hectares
    processingTime: Number,
    confidence: Number,
    analysisMethod: String
  },
  
  // Fraud Detection Results
  fraudAnalysis: {
    fraudScore: {
      type: Number,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW'
    },
    sizeDifference: Number, // absolute difference in hectares
    sizeDifferencePercent: Number, // percentage difference
    recommendations: [String],
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'],
      default: 'PENDING'
    }
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'SUBMITTED'
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  
  // Bank/Institution Info
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  loanOfficerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
loanApplicationSchema.index({ userId: 1, status: 1 });
loanApplicationSchema.index({ 'landLocation.latitude': 1, 'landLocation.longitude': 1 });
loanApplicationSchema.index({ 'fraudAnalysis.riskLevel': 1 });
loanApplicationSchema.index({ submittedAt: -1 });

// Virtual for total processing time
loanApplicationSchema.virtual('totalProcessingTime').get(function() {
  if (this.submittedAt && this.processedAt) {
    return this.processedAt - this.submittedAt;
  }
  return null;
});

// Method to calculate fraud score
loanApplicationSchema.methods.calculateFraudScore = function() {
  if (!this.claimedLandSize || !this.satelliteAnalysis.detectedLandSize) {
    return null;
  }
  
  const claimed = this.claimedLandSize;
  const detected = this.satelliteAnalysis.detectedLandSize;
  const difference = Math.abs(claimed - detected);
  const percentDifference = (difference / claimed) * 100;
  
  let fraudScore = 0;
  let riskLevel = 'LOW';
  
  if (percentDifference <= 10) {
    fraudScore = percentDifference * 2; // 0-20
    riskLevel = 'LOW';
  } else if (percentDifference <= 30) {
    fraudScore = 20 + ((percentDifference - 10) * 2); // 20-60
    riskLevel = 'MEDIUM';
  } else {
    fraudScore = 60 + Math.min((percentDifference - 30) * 1.3, 40); // 60-100
    riskLevel = 'HIGH';
  }
  
  this.fraudAnalysis.fraudScore = Math.round(fraudScore);
  this.fraudAnalysis.riskLevel = riskLevel;
  this.fraudAnalysis.sizeDifference = difference;
  this.fraudAnalysis.sizeDifferencePercent = percentDifference;
  
  return this.fraudAnalysis.fraudScore;
};

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);