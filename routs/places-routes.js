import express from 'express';
import HttpError from '../models/http-error';

const router = express.Router();

const DUMMY_PLACES = [
    {
        id: 'p1',
        title: 'Empire State Building',
        description: 'A famous skyscraper in New York City.',
        location: {
            lat: 40.7484474,
            lng: -73.9871516
        },
        address: '20 W 34th St, New York, NY 10001, USA',
        creator: 'u1'
    },
    {
        id: 'p2',
        title: 'Eiffel Tower',
        description: 'An iconic iron tower located in Paris, France.',
        location: {
            lat: 48.858844,
            lng: 2.294351
        },
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
        creator: 'u2'
    }
];

router.get('/:pid', (req, res, next) => {
    const placeId = req.params.pid;
    const place = DUMMY_PLACES.find(p => p.id === placeId);
    if (!place) {
        const error = new Error('Could not find a place for the provided id.');
        error.code = 404;
        throw error;
    }
    res.json({ place });
});


router.get('/user/:uid', (req, res, next) => {
    const userId = req.params.uid;
    const userPlaces = DUMMY_PLACES.filter(p => p.creator === userId);
    if (!userPlaces || userPlaces.length === 0) {
        const error = new Error('Could not find a place for the provided user id.');
        error.code = 404;
        return next(error);
    }
    res.json({ userPlaces });
});

export default router;
