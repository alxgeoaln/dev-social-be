const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

const validateRegisterInput = require('../../validation/register'); 
const validateLoginInput = require('../../validation/login'); 

// Register
router.post('/register', (req, res) => {
    const {errors, isValid} = validateRegisterInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({email: req.body.email})
        .then(user => {
            if(user){
                return res.status(400).json({email: 'Email already exists'});
            } else {
                const avatar = gravatar.url(req.body.email, {
                    s: '200',
                    r: 'pg',
                    d: 'mm'
                });

                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then(user => res.json(user))
                            .catch(err => console.log(err));
                    });
                });
            }
        });
});

// Login
router.post('/login', async (req, res) => {
    
    const {errors, isValid} = validateLoginInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    const user = await User.findOne({email});
    if(!user) {
        errors.email = 'User not found'
        res.status(404).json(errors );
    } 

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if(isMatch) {
        
        const payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar
        };
        // sign token
        jwt.sign(payload, 
                keys.secretofKey, 
                {expiresIn: 3600}, 
                (err, token) => {
                    res.json({success: true, token: `Bearer ${token}`});
        });
    } else {
        errors.password = 'Password incorect'
        return res.status(400).json(errors);
    }
});

// Current
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({msg: req.user})
})

module.exports = router;