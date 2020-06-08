const express = require('express');
const User = require('../models/User');
const errorResObj = require('../util/routerHelp');

const router = express.Router();

router.get('/', (req, res) => {
    const { username, password } = req.body;

    User.getAuthenticated(username, password)
        .then(({ user, failReason }) => {
            if (user === undefined) {
                return res.send(`${failReason}`);
            }
  
            res.json(user);
        })
        .catch(err => {
            res.status(500).json(errorResObj(500, err.message));
        });
});

module.exports = router;