import Loan from '../models/loan.js';
import Book from '../models/book.js';
import User from '../models/user.js';

export const issueBook = async (req, res) => {
try {
    const { user_id, book_id, due_date } = req.body;
    
    const user = await User.findById(user_id);
    if (!user) {
    return res.status(404).json({ error: 'User not found' });
    }

    const book = await Book.findById(book_id);
    if (!book) {
    return res.status(404).json({ error: 'Book not found' });
    }

    if (book.available_copies <= 0) {
    return res.status(400).json({ error: 'No copies available' });
    }

    const loan = new Loan({
    user_id,
    book_id,
    due_date,
    issue_date: new Date()
    });

    book.available_copies -= 1;
    await book.save();
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

    const book = await Book.findById(loan.book_id);
    if (!book) {
    return res.status(404).json({ error: 'Book not found' });
    }

    loan.status = 'RETURNED';
    loan.return_date = new Date();
    book.available_copies += 1;

    await book.save();
    await loan.save();

    res.json(loan);
} catch (error) {
    res.status(400).json({ error: error.message });
}
};

export const getUserLoans = async (req, res) => {
try {
    const loans = await Loan.find({ user_id: req.params.user_id })
    .populate('book_id', 'title author')
    .lean();
    res.json(loans);
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
    })
    .populate('user_id', 'name email')
    .populate('book_id', 'title author')
    .lean();

    const result = overdueLoans.map(loan => ({
    ...loan,
    days_overdue: Math.ceil((now - loan.due_date) / (1000 * 60 * 60 * 24))
    }));

    res.json(result);
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