import Book from '../models/book.js';

export const addBook = async (req, res) => {
  try {
    const { title, author, isbn, copies } = req.body;
    const book = new Book({
      title,
      author,
      isbn,
      copies,
      available_copies: copies
    });
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, copies, available_copies } = req.body;
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, isbn, copies, available_copies, updated_at: Date.now() },
      { new: true }
    );
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchBooks = async (req, res) => {
  try {
    const { search } = req.query;
    const regex = new RegExp(search, 'i');
    const books = await Book.find({
      $or: [
        { title: regex },
        { author: regex },
        { isbn: regex }
      ]
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// This endpoint is added specifically for inter-service communication
export const updateBookAvailability = async (req, res) => {
  try {
    const { increment } = req.body;
    const bookId = req.params.id;
    
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    book.available_copies += increment;
    if (book.available_copies < 0) {
      return res.status(400).json({ error: 'No copies available' });
    }
    
    await book.save();
    res.json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};