import Loan from '../models/loan.js';
import Book from '../models/book.js';
import User from '../models/user.js';

  export const getPopularBooks = async (req, res) => {
    try {
      const popularBooks = await Loan.aggregate([
        { $group: { _id: '$book_id', borrow_count: { $sum: 1 } } },
        { $sort: { borrow_count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book'
          }
        },
        { $unwind: '$book' },
        {
          $project: {
            book_id: '$_id',
            title: '$book.title',
            author: '$book.author',
            borrow_count: 1
          }
        }
      ]);

      res.json(popularBooks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  export const getActiveUsers = async (req, res) => {
    try {
      const activeUsers = await Loan.aggregate([
        { $group: { _id: '$user_id', books_borrowed: { $sum: 1 }, current_borrows: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } } } },
        { $sort: { books_borrowed: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            user_id: '$_id',
            name: '$user.name',
            books_borrowed: 1,
            current_borrows: 1
          }
        }
      ]);

      res.json(activeUsers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

 export const getSystemOverview = async (req, res) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now.setHours(23, 59, 59, 999));

      const [totalBooks, totalUsers, booksAvailable, booksBorrowed, overdueLoans, loansToday, returnsToday] = await Promise.all([
        Book.countDocuments(),
        User.countDocuments(),
        Book.aggregate([{ $group: { _id: null, total: { $sum: '$available_copies' } } }]).then(result => result[0]?.total || 0),
        Loan.countDocuments({ status: 'ACTIVE' }),
        Loan.countDocuments({ status: 'ACTIVE', due_date: { $lt: now } }),
        Loan.countDocuments({ issue_date: { $gte: todayStart, $lte: todayEnd } }),
        Loan.countDocuments({ return_date: { $gte: todayStart, $lte: todayEnd } })
      ]);

      res.json({
        total_books: totalBooks,
        total_users: totalUsers,
        books_available: booksAvailable,
        books_borrowed: booksBorrowed,
        overdue_loans: overdueLoans,
        loans_today: loansToday,
        returns_today: returnsToday
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };