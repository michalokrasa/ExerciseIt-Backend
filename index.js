const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const jwt = require('jsonwebtoken');


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


app.post('/api/login', (req, res) => {
    // Authenticate user

    const username = req.body.username;
    const user = { name: username };

    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    
    res.json({accessToken: accessToken});
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => {
        return res.sendStatus(403);
    });
};


const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});