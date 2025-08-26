import { validationResult } from 'express-validator';
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

    const newUser = new User({
        name,
        email,
        image: 'https://picsum.photos/200/300',
        password,
        places: []
    });

    try {
        await newUser.save();
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }
    res.status(201).json({ user: newUser.toObject({ getters: true }) });
}


const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again later.', 500));
    }


    if (!existingUser || existingUser.password !== password) {
        return next(new HttpError('Invalid credentials, could not log you in.', 401));
    }

    res.json({ message: 'Logged in!', user: existingUser.toObject({ getters: true }) });
}

export { getUsers, signup, login };