import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import HttpError from '../models/http-error.js';
import User from '../models/User.js';

const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        return next(new HttpError('Fetching users failed, please try again later.', 500));
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) });
}


const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }

    if (existingUser) {
        return next(new HttpError('User exists already, please login instead.', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('Could not create user, please try again.', 500));
    }

    const newUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    });

    try {
        await newUser.save();
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }

    let token;
    try {
        token = jwt.sign({ userId: newUser.id, email: newUser.email }, 'supersecret_dont_share', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }

    res.status(201).json({ userId: newUser.id, email: newUser.email, token: token });
}


const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }
    if (!existingUser) {
        return next(new HttpError('Invalid credentials, could not log you in.', 403));
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        return next(new HttpError('Could not log you in, please check your credentials and try again.', 500));
    }

    if (!isValidPassword) {
        return next(new HttpError('Invalid credentials, could not log you in.', 403));
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, 'supersecret_dont_share', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Logging in failed, please try again later.', 500));
    }

    res.json({ userId: existingUser.id, email: existingUser.email, token: token });
}

export { getUsers, signup, login };