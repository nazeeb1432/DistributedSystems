import express from 'express';
import { registerUser, getUser, updateUser, verifyUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/', registerUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.get('/:id/verify', verifyUser); // New endpoint for service verification

export default router;