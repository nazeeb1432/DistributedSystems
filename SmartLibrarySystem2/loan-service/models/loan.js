import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  user_id: {
    type: String,  // Changed from ObjectId to String for cross-service referencing
    required: true
  },
  book_id: {
    type: String,  // Changed from ObjectId to String for cross-service referencing
    required: true
  },
  issue_date: {
    type: Date,
    default: Date.now
  },
  due_date: {
    type: Date,
    required: true
  },
  return_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RETURNED'],
    default: 'ACTIVE'
  },
  extensions_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

loanSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Loan', loanSchema);