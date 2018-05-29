const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

router.get('/', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const errors= {};
    try {
        const profile = await Profile.findOne({ user: req.user.id })
            .populate('user', ['name', 'avatar']); 
        if(!profile) {
            errors.noprofile = 'There is no profile for this user'
            return res.status(404).json(errors)
        }
        res.json(profile);
    } catch(e) {
        res.status(404).json(e);
    }
});

// Get all profiles

router.get('/all', async (req, res) => {
    const errors = {}
    try{
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        if(!profiles) {
            return res.status(404).json(errors);
        }
        res.json(profiles);

} catch(e) {
    res.status(404).json(e);
    }
});



// Get profile by handle

router.get('/handle/:handle', async (req, res) => {
    const errors = {};
    try{
        const profile = await Profile.findOne({handle: req.params.handle})
        .populate('user', ['name', 'avatar']);

    if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
    }

    res.json(profile);
    } catch(e) {
        res.status(404).json(e);
    }
});

// Get profile by user_id

router.get('/handle/:user_id', async (req, res) => {
    const errors = {};
    try{
        const profile = await Profile.findOne({handle: req.params.user_id})
        .populate('user', ['name', 'avatar']);

    if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
    }

    res.json(profile);
    } catch(e) {
        res.status(404).json(e);
    }
});


router.post('/', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const {errors, isValid} = validateProfileInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }

    let profileFields = {};
    profileFields.user = req.user.id;

    if(req.body.handle) profileFields.handle = req.body.handle;
    if(req.body.company) profileFields.company = req.body.company;
    if(req.body.website) profileFields.website = req.body.website;
    if(req.body.location) profileFields.location = req.body.location;
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.status) profileFields.status = req.body.status;
    if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;
   
    // Skills - Split into array
    if(typeof req.body.skills !== undefined) {
        profileFields.skills = req.body.skills.split(',');
    }

    // Social
    profileFields.social = {};
    
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;
    if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
    
    try {
        const profile = await Profile.findOne({user: req.user.id});
        
        if(profile){
            try {
                const updatedProfile = await Profile.findOneAndUpdate({ user: req.user.id}, {$set: profileFields}, {new: true});       
                res.json(updatedProfile);
            } catch (e) {
                res.json({message: 'here', e});
            }
          
        } else {
            // check if handle exists
           const profile = await Profile.findOne({handle: profileFields.handle});
           if(profile) {
               errors.handle = 'That handle already exists';
               res.status(400).json(errors);
           }

        //    Save profile
                const newProfile =await new Profile(profileFields).save();
                res.json(newProfile);
        }
    } catch (e) {
        res.status(400).json(e);
    }

 
});

// Add experience

router.post('/experience', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const {errors, isValid} = validateExperienceInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }
    
    try {
        const profile = await Profile.findOne({user: req.user.id});

        const newExperience = {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        };

        // Add to exp array
        profile.experience.unshift(newExperience);
        try {
            const newProfile = await profile.save();
            res.json(newProfile);

        } catch(e) {
            return res.status(404).json(e);
        }

    } catch(e) {
        return res.status(404).json(e);
    }
});

router.post('/education', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const {errors, isValid} = validateEducationInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }
    
    
    const education = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
    };

    try{
        const profile = await Profile.findOne({user: req.user.id});

        if(profile) {
            profile.education.unshift(education);

            try{
                const newProfile = await profile.save();
                res.json(newProfile);
            }  catch(e) {
                return res.status(400).json(e);
            }
        }
    } catch(e) {
        return res.status(404).json(e);
    }
});

// Delete experience

router.delete('/experience/:exp_id',passport.authenticate('jwt', {session: false}), async (req, res) => {

    try {
        const profile = await Profile.findOne({user: req.user.id});
        if(profile) {
            const removeIndex = profile.experience
                .map(item => item.id)
                .indexOf(req.params.exp_id);
            // Splice out of array
            profile.experience.splice(removeIndex, 1);
            try{
                const newProfile = await profile.save()
                res.json(newProfile); 
            } catch(e) {
                res.status(404).json(e);
            }
            
        }
    } catch(e) {
        return res.status(404).json(e);
    }
});

// Delete education

router.delete('/education/:edc_id',passport.authenticate('jwt', {session: false}), async (req, res) => {

    try {
        const profile = await Profile.findOne({user: req.user.id});
        if(profile) {
            const removeIndex = profile.education
                .map(item => item.id)
                .indexOf(req.params.exp_id);
            // Splice out of array
            profile.education.splice(removeIndex, 1);
            try{
                const newProfile = await profile.save()
                res.json(newProfile); 
            } catch(e) {
                res.status(404).json(e);
            }
            
        }
    } catch(e) {
        return res.status(404).json(e);
    }
});

module.exports = router;