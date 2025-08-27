import fs from 'fs'
import path from 'path';

import express from 'express';
import bodyParser from 'body-parser';
import userRouters from './routs/users-routes.js'
import placesRoutes from './routs/places-routes.js';
import mongoose from 'mongoose';
import { mongodbURL } from './auth.js';

const app = express();
app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use('/api/users', userRouters);
app.use('/api/places', placesRoutes);

app.use((error, req, res, next) => {
    if(req.file){
        fs.unlink(req.file.path, err => console.log(err));
    }
    if (res.headersSent) {
        return next(error);
    }

    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
    .connect(mongodbURL)
    .then(() => {
        app.listen(5000);
        console.log('Server is running on port 5000');

    })
    .catch(err => {
        console.log(err);
    });