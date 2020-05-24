const express = require('express');
const Exercise = require('../models/Exercise');
const User = require('../models/User');
const errorResObj = require('../util/routerHelp');

const router = express.Router();

// Add new exercise
router.post('/', async (req, res) => {
    const { description, duration, date } = req.body;
    let fetchedName;
    let fetchedId;

    if (req.body.userId) {
        try {
            const { username } = await User.findById(userId);
            fetchedName = username;
        } catch (err) {
            res.status(404).json(errorResObj(404, "Unknown _id."));
            return
        }
    }
    else if (req.body.username) {
        try {
            const { _id } = await User.findOne({username: req.body.username});
            fetchedId = _id;
        } catch (err) {
            res.status(404).json(errorResObj(404, "Unknown username."));
            return
        }
    }
    else {
        res.status(400).json(errorResObj(400, "Bad request."));
        return
    }

    const exercise = new Exercise({
        userId: fetchedId,
        description,
        duration,
        date
    });

    
    const valErr = exercise.validateSync();
    if (valErr !== undefined) {
        const errors = valErr.errors;
        let errorMsg = '';

        for (const key in errors) {
            errorMsg += errors[key] + '\n';
        }
        
        res.status(400).json(errorResObj(400, errorMsg));
        return
    }

    exercise.save()
    .then(result => {
        res.status(201).json({ 
            username: fetchedName, 
            description, duration, 
            _id: fetchedId, 
            date: result.date.toDateString() 
        });
        console.log(result);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});

router.get('/', (req, res) => {
    Exercise.find()
        .then(exercises => {
            User.find()
                .then(users => {
                    
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});

// Get logs
router.get('/log', (req, res) => {
    let { userId, from, to, limit } = req.query;

    if (!userId) {
        res.status(400).json(errorResObj(400, "UserId unspecified."));
        return
    }

    from = new Date(from);
    to = new Date(to);

    if (limit && limit < 1) {
        limit = undefined;
    }

    User.findById(userId).lean()
    .then(user => {
        Exercise.find({ userId }).lean()
        .then( exercises => {
            user.count = exercises.length;
            user.log = exercises
            .filter(e => {
                if (!isNaN(from) && e.date < from) {
                    return false;
                }
                if (!isNaN(to) && e.date >= to) {
                    return false;
                }
                return true;
            })
            .map(e => { 
                const dateString = e.date.toDateString();
                return {
                    description: e.description, 
                    duration: e.duration,
                    date: dateString
                }
            })
            
            if (limit) {
                user.log = user.log.slice(0, limit);
            }

            delete user.__v;
            res.json(user);
        })
        .catch(err => {
            console.log(err);
            res.status(404).json(err);
        });
    })
    .catch(err => {
        console.log(err);
        res.status(404).json(errorResObj(404, "Unknown userId."));
    });
});

module.exports = router;