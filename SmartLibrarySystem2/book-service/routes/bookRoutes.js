import express from 'express';
import { 
  addBook, 
  getBook, 
  updateBook, 
  deleteBook, 
  searchBooks, 
  getAllBooks,
  updateBookAvailability
} from '../controllers/bookController.js';

const router = express.Router();

router.get('/', getAllBooks);
router.post('/', addBook);
router.get('/search', searchBooks);//changed here slightly
router.get('/:id', getBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
router.patch('/:id/availability', updateBookAvailability); // New endpoint for updating availability

export default router;