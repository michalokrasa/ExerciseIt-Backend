const mongoose = require('mongoose');
const User = require('./User');

const ExerciseSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        ref: User,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Exercises', ExerciseSchema);