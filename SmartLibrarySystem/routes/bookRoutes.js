import express from 'express';
import { addBook, getBook, updateBook, deleteBook, searchBooks, getAllBooks } from '../controllers/bookController.js';

const router = express.Router();

router.get('/',getAllBooks);
router.post('/', addBook);
router.get('/', searchBooks);
router.get('/:id', getBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;