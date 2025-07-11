import express from 'express';
import * as loanController from '../controllers/loanController.js';

const router = express.Router();


router.post('/', loanController.issueBook);
router.post('/return', loanController.returnBook);
router.get('/user/:user_id', loanController.getUserLoans);
router.get('/overdue', loanController.getOverdueLoans);
router.put('/:id/extend', loanController.extendLoan);

export default router;