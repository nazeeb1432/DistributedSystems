import User from '../models/user.js';

  export const registerUser = async (req, res) => {
    try {
      
      const { name, email, role } = req.body;
      const user = new User({ name, email, role });
      await user.save();
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  export const getUser = async (req, res) => {
    try {
      const userId= req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  export const updateUser = async (req, res) => {
    try {
      const { name, email, role } = req.body;
      const userId= req.params.id;
      const user = await User.findByIdAndUpdate(
         userId,
        { name, email, role, updated_at: Date.now() },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

    // Service method (non-API, internal use) , this was in monolithic architecture
  export const getUserById = async (id) => {
    try {
      const user = await User.findById(id);
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // This endpoint is added specifically for inter-service communication
export const verifyUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ verified: true, user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

