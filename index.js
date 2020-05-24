const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

mongoose.connect(
    process.env.MONGO_URL, 
    { 
        useUnifiedTopology: true, 
        useNewUrlParser: true,
        useFindAndModify: false
    })
    .then(() => console.log('DB connected'))
    .catch(err => {
        console.log('Error on DB connection: ');
        console.log(err);
    });

const userRoutes = require('./routes/users');
app.use('/api/user', userRoutes);

const exerciseRoutes = require('./routes/exercises');
app.use('/api/exercise', exerciseRoutes);



const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});