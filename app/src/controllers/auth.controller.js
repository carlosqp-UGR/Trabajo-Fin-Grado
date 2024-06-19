import passport from 'passport';

export const renderLogin = (req, res, next) => {
    res.render('auth/login');
};

export const login = passport.authenticate('local-login', { 
    successRedirect: '/',
    successFlash: true, // doesn`t work
    failureRedirect: '/login',
    passReqToCallback: true,
    failureFlash: true
});

export const logout = async (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
};


