const { model, Schema } = require('mongoose');
const HashPassword = require('../utils/HashPassword'); // Import the HashPassword function

// Define the User schema
const UserModel = new Schema({
    'img': {
        type: String,
        required: true,
        default: 'uploads/default/profile.webp'
    },
    "name": {
        type: String,
        required: [true, 'name is required'],
    },
    "email": {
        type: String,
        required: [true, 'email is required'],
        unique: true
    },
    "password": {
        type: String,
        required: [true, 'password is required'],
    },
    "provider": {
        type: String,
        required: true,
        default: 'credential'
    },
    "block": {
        type: Boolean,
        required: true,
        enum: [true, false],
        default: false
    },
    "role": {
        type: String,
        required: true,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    "access": {
        type: Number,
        required: true,
        enum: [0, 1],
        default: 0,
    },
    verified: {
        type: Boolean,
        required: true,
        enum: [true, false],
        default: false
    },
    address: {
        type: String,
        required: false,
        default: null
    },
    phone: {
        type: Number,
        required: false,
        default: null
    },
    genres: {
        type: [String],
        required: false,
        default: []
    },
    subscription: {
        type: Boolean,
        default: false,
    },
    subscription_ends: {
        type: Date,
        default: null
    }
}, { timestamps: true });

UserModel.pre('save', async function (next) {
    this.email = this.email.toLowerCase();
    if (this.isModified('password')) {
        try {
            this.password = await HashPassword(this.password);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

const User = model('User', UserModel);
module.exports = User;
