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
    const book = await getBookById(req.params.id);
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


export const getBookById = async (id) => {
  try {
    const book = await Book.findById(id);
    return book;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateBookCopies = async (id, increment) => {
  try {
    const book = await Book.findById(id);
    if (!book) {
      throw new Error('Book not found');
    }
    book.available_copies += increment;
    if (book.available_copies < 0) {
      throw new Error('No copies available');
    }
    await book.save();
    return book;
  } catch (error) {
    throw new Error(error.message);
  }
};