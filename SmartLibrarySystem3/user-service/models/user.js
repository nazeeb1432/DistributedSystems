import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
name: {
    type: String,
    required: true,
    trim: true
},
email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
},
role: {
    type: String,
    enum: ['student', 'faculty'],
    required: true
},
created_at: {
    type: Date,
    default: Date.now
},
updated_at: {
    type: Date,
    default: Date.now
}
},{minimize: false});

userSchema.pre('save', function(next) {
this.updated_at = Date.now();
next();
});

export default mongoose.model('User', userSchema);