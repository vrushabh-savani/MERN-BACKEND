import express from 'express';
import bodyParser from 'body-parser';
import userRouters from './routs/users-routes.js'
import placesRoutes from './routs/places-routes.js';
import mongoose from 'mongoose';

const app = express();
app.use(bodyParser.json());

app.use('/api/users', userRouters);
app.use('/api/places', placesRoutes);

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
  .connect('mongodb+srv://vrushabhsavani123:MongoDB123@cluster0.r6uti.mongodb.net/places?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    app.listen(5000);
    console.log('Server is running on port 5000');
    
  })
  .catch(err => {
    console.log(err);
  });