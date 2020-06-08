const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_WORK_FACTOR = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000;

mongoose.set('useCreateIndex', true);

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: { unique: true }
    },
    password: {
        type: String,
        required: true
    },
    loginAttempts: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    lockUntil: { 
        type: Date 
    }
});

UserSchema.virtual('isLocked').get(function () {
    // check for a future lockUntil timestamp
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre('save', function(next) {
    const user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    bcrypt.hash(user.password, SALT_WORK_FACTOR)
        .then(hash => {
            user.password = hash;
            next();
        })
});

// returns bcrypt promise
UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// returns update promise
UserSchema.methods.incLoginAttempts = function () {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }).exec();
    }
    // otherwise we're incrementing
    const updates = { $inc: { loginAttempts: 1 } };
    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }

    return this.updateOne(updates).exec();
};

// expose enum on the model, and provide an internal convenience reference 
const reasons = UserSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};

UserSchema.statics.getAuthenticated = function (username, password) {
    return this.findOne({ username: username })
        .then(user => {
            // make sure the user exists
            if (!user) {
                return { failReason: reasons.NOT_FOUND };
            }

            //check if the account is currently locked
            if (user.isLocked) {
                // just increment login attempts if account is already locked
                return user.incLoginAttempts()
                    .then(() => ({ failReason: reasons.MAX_ATTEMPTS }));
            }

            //test for a matching password
            return user.comparePassword(password)
                .then(isMatch => {
                    if (isMatch) {
                        // if there's no lock or failed attempts, just return the user
                        if (!user.loginAttempts && !user.lockUntil) {
                            return { user };
                        }
                        // reset attempts and lock info
                        const updates = {
                            $set: { loginAttempts: 0 },
                            $unset: { lockUntil: 1 }
                        };
                    
                        return user.updateOne(updates)
                            .then((data) => ({ user }));
                    }

                    //password is incorrect, so increment login attempts before responding
                    return user.incLoginAttempts()
                        .then((data) => ({ failReason: reasons.PASSWORD_INCORRECT }));
                });
        })
};

module.exports = mongoose.model('Users', UserSchema);