import fs from 'fs';
import HttpError from "../models/http-error.js";
import { validationResult } from "express-validator";
import getCoordsForAddress from "../util/location.js";
import Place from "../models/place.js";
import User from "../models/User.js";
import mongoose from "mongoose";


const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(new HttpError('Fetching place failed, please try again later.', 500));
    }

    if (!place) {
        throw new HttpError('Could not find a place for the provided id.', 404);
    }
    res.json({ place: place.toObject({ getters: true }) });
}

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        return next(new HttpError('Fetching places failed, please try again later.', 500));
    }
    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        throw new HttpError('Could not find places for the provided user id.', 404);
    }
    res.json({ userPlaces: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }
    const { title, description, address, creator } = req.body;
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (err) {
        return next(err);
    }
    const newPlace = new Place({
        title,
        description,
        location: coordinates,
        image:  req.file.path,
        address,
        creator
    });

    let user;
    try {
        user = await User.findById(creator);
    } catch (err) {
        return next(new HttpError('Creating place failed, please try again.', 500));
    }

    if (!user) {
        return next(new HttpError('Could not find user for provided creator id.', 404));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newPlace.save({ session: sess });
        user.places.push(newPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        return next(new HttpError('Creating place failed, please try again.', 500));
    }
    res.status(201).json({ place: newPlace });
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs, please check your data.', 422));
    }

    let place;
    try {
        place = await Place.findById(req.params.pid);
    } catch (err) {
        return next(new HttpError('Fetching place failed, please try again later.', 500));
    }

    if (!place) {
        return next(new HttpError('Could not find a place for the provided id.', 404));
    }

    const { title, description, address } = req.body;
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (err) {
        return next(err);
    }
    const updatedPlace = {
        id: place.id,
        title,
        description,
        location: coordinates,
        address,
        creator: place.creator
    };
    try {
        await Place.findByIdAndUpdate(req.params.pid, updatedPlace);
    } catch (err) {
        return next(new HttpError('Updating place failed, please try again later.', 500));
    }
    res.status(200).json({ place: updatedPlace });
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        return next(new HttpError('Fetching place failed, please try again later.', 500));
    }

    if (!place) {
        return next(new HttpError('Could not find a place for the provided id.', 404));
    }

    const imagePath = place.image;
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await Place.findByIdAndDelete(placeId, { session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        return next(new HttpError('Deleting place failed, please try again later.', 500));
    }

    fs.unlink(imagePath, err => console.log(err));
    res.status(200).json({ message: 'Place deleted.' });
}

export { getPlaceById, getPlacesByUserId, createPlace, updatePlace, deletePlace };