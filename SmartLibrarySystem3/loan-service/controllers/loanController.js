import Loan from '../models/loan.js';
import { verifyUser, getBookDetails, updateBookAvailability } from '../utils/serviceClient.js';
import mongoose from 'mongoose';

export const issueBook = async (req, res) => {
  try {
    const { user_id, book_id, due_date } = req.body;

    // Validate inputs
    if (!user_id || !book_id || !due_date) {
      return res.status(400).json({ error: 'Missing required fields: user_id, book_id, due_date' });
    }

    // Validate ObjectIDs
    if (!mongoose.isValidObjectId(user_id)) {
      return res.status(400).json({ error: 'Invalid user_id format' });
    }
    if (!mongoose.isValidObjectId(book_id)) {
      return res.status(400).json({ error: 'Invalid book_id format' });
    }
    
    // Validate due_date
    const dueDate = new Date(due_date);
    if (isNaN(dueDate.getTime())) {
      return res.status(400).json({ error: 'Invalid due_date format' });
    }
    
    // Verify user exists via User Service
    try {
      await verifyUser(user_id);
    } catch (error) {
      return res.status(404).json({ error: 'User verification failed' });
    }
    
    // Check book availability via Book Service
    let book;
    try {
      book = await getBookDetails(book_id);
      
      if (book.available_copies <= 0) {
        return res.status(400).json({ error: 'No copies available' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'Book verification failed' });
    }
    
    // Create loan
    const loan = new Loan({
      user_id,
      book_id,
      due_date: dueDate,
      issue_date: new Date()
    });
    
    // Update book availability via Book Service
    try {
      await updateBookAvailability(book_id, -1);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update book availability' });
    }
    
    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const returnBook = async (req, res) => {
  try {
    const { loan_id } = req.body;
    const loan = await Loan.findById(loan_id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status === 'RETURNED') {
      return res.status(400).json({ error: 'Book already returned' });
    }

    loan.status = 'RETURNED';
    loan.return_date = new Date();

    // Update book availability via Book Service
    try {
      await updateBookAvailability(loan.book_id, 1);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update book availability' });
    }
    
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user_id: req.params.user_id });
    
    // Enrich loan data with book details
    const enrichedLoans = await Promise.all(loans.map(async (loan) => {
      try {
        const bookDetails = await getBookDetails(loan.book_id);
        return {
          ...loan.toObject(),
          book: {
            title: bookDetails.title,
            author: bookDetails.author
          }
        };
      } catch (error) {
        // Return loan without book details if unable to fetch
        return loan.toObject();
      }
    }));
    
    res.json(enrichedLoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOverdueLoans = async (req, res) => {
  try {
    const now = new Date();
    const overdueLoans = await Loan.find({
      status: 'ACTIVE',
      due_date: { $lt: now }
    });

    // Enrich loan data with user and book details
    const enrichedLoans = await Promise.all(overdueLoans.map(async (loan) => {
      try {
        const [userDetails, bookDetails] = await Promise.all([
          verifyUser(loan.user_id),
          getBookDetails(loan.book_id)
        ]);
        
        return {
          ...loan.toObject(),
          days_overdue: Math.ceil((now - loan.due_date) / (1000 * 60 * 60 * 24)),
          user: {
            name: userDetails.user.name,
            email: userDetails.user.email
          },
          book: {
            title: bookDetails.title,
            author: bookDetails.author
          }
        };
      } catch (error) {
        // Return basic loan with days_overdue if enrichment fails
        return {
          ...loan.toObject(),
          days_overdue: Math.ceil((now - loan.due_date) / (1000 * 60 * 60 * 24))
        };
      }
    }));
    
    res.json(enrichedLoans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const extendLoan = async (req, res) => {
  try {
    const { extension_days } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status === 'RETURNED') {
      return res.status(400).json({ error: 'Cannot extend returned loan' });
    }

    if (loan.extensions_count >= 2) {
      return res.status(400).json({ error: 'Maximum extensions reached' });
    }

    const original_due_date = loan.due_date;
    loan.due_date = new Date(loan.due_date.getTime() + extension_days * 24 * 60 * 60 * 1000);
    loan.extensions_count += 1;

    await loan.save();

    res.json({
      ...loan.toObject(),
      original_due_date,
      extended_due_date: loan.due_date
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};