import { production } from "../config.js";

export const isLoggedIn = (req, res, next) => {
    if(!production) return next();

    if (req.isAuthenticated()) return next(); 
    else return res.redirect('/login');
};

export const isAPILoggedIn = (req, res, next) => {
    if(!production) return next();
 
    if (req.isAuthenticated()) return next(); 
    else return res.status(401).send('Unauthorized');
};

export const isNotLoggedIn = (req, res, next) => {
    if(!production) return next();

    if (!req.isAuthenticated()) return next(); 
    else return res.redirect('/perfil');
};

export const isAdminLoggedIn = (req, res, next) => {
    if(!production) return next();

    if (req.isAuthenticated() && req.user.admin) return next(); 
    return res.redirect('/');
};
