const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const User = mongoose.model('users');
const key = require('../config/keys');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = key.secretofKey;

module.exports = passport => {
    passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {

        try{
            const userId = await User.findById(jwt_payload.id);

            if(userId) {
                return done(null, userId);
            }
            return done(null, fasle);
        } catch(e) {
            console.log(e);
        }

    }));
}