const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

const validatePostInput = require('../../validation/post');
const validateCommentInput = require('../../validation/comment');

// Crate post

router.post('/', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const {errors, isValid} = validatePostInput(req.body);

    if(!isValid) {
        res.status(400).json(errors);
    }
    
    const post = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    try {
        const newPost = await post.save();
        res.json(newPost)
    } catch(e){
        res.status(400).json(e);
    }
});

// Get all posts

router.get('/', async (req, res) => {
    
    try {
        const posts = await Post.find().sort({date: -1});
        res.json(posts);
    } catch(e) {
        res.status(400).json(e);
    }
});

// Get one post

router.get('/:post_id', passport.authenticate('jwt', {session: false}), async (req, res) => {
   
    try {
        const post = await Post.findOne({_id: req.params.post_id});
        res.json(post);
    } catch(e) {
        res.status(404).json(e);
    }
});

// Delete post

router.delete('/post/:post_id', passport.authenticate('jwt', {session: false}), async (req, res) => {

    try {
        const posts = await Post.findOneAndRemove({_id: req.params.post_id});
        res.json(posts);
    } catch(e) {
        res.status(404).json(e)
    }
});


// Like post

router.post('/like/:id', passport.authenticate('jwt', {session: false}), async (req, res) => {
  
    try{
        const profile = await Profile.findOne({user: req.user.id});

        try {
            const post = await Post.findById(req.params.id);
            if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                return res.status(400).json({error: 'Already liked.'})
            }

            // Add user id to likes
            post.likes.unshift({user: req.user.id});

            try {
                const newPost = await post.save();
                res.json(newPost);
            }
             catch(e) {
                res.status(400).json(e);
             }
        } catch(e) {
            res.status(404).json(e);
        }
    } catch(e) {
        res.status(404).json(e);
    }
    
});

// Unlike post

router.post('/unlike/:id', passport.authenticate('jwt', {session: false}), async (req, res) => {
  
    try{
        const profile = await Profile.findOne({user: req.user.id});

        try {
            const post = await Post.findById(req.params.id);
            if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                return res.status(400).json({error: 'You have not yet liked this post'})
            }

            // Get the remove index
            const removeIndex = post.likes
                                    .map(item => item.user.toString())
                                    .indexOf(req.user.id);

            post.likes.splice(removeIndex, 1);

            try {
                const newPost = await post.save();
                res.json(newPost);
            }
             catch(e) {
                res.status(400).json(e);
             }
        } catch(e) {
            res.status(404).json(e);
        }
    } catch(e) {
        res.status(404).json(e);
    }
    
});

// Add comment

router.post('/comment/:id', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const {errors, isValid} = validateCommentInput(req.body);

    if(!isValid) {
        res.status(400).json(errors);
    }
 
    const post = await Post.findById(req.params.id);

  const comment = {
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  };

  post.comments.unshift(comment);
  const newComment = await post.save();
  
  res.json(newComment);

});


// Delete comment

router.delete('/comment/:id/:comment_id',
    passport.authenticate('jwt', {session: false}),
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
                return res.status(404).json({comment: 'Comment does not exist'});
            }

            const removeIndex = post.comments
                .map(item => item._id.toString())
                .indexOf(req.params.comment_id);

            post.comments.splice(removeIndex, 1);

            try {
                const newPost = await post.save();
                res.json(newPost);
            } catch(e) {
                res.status(404).json(e)
            }
        } catch(e) {
            res.status(404).json(e);
        }
    })


module.exports = router;