import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { pool } from '../database.js';
import { matchPassword } from './helpers.js';

passport.use(
    'local-login',
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, username, password, done) => {
            const [rows] = await pool.query ('SELECT * FROM usuario WHERE username = ?', 
                [username]
            );

            if (!rows.length) {
                await req.setFlash("error", "El usuario no existe");
                return done(null, false);
            }
        
            const user = rows[0];
            const validPassword = await matchPassword(password, user.password);
        
            if (!validPassword) {
                await req.setFlash("error", "Contraseña incorrecta");
                return done(null, false);
            }
            
            await req.setFlash("success", `Bienvenido de vuelta, ${user.fullname.split(' ')[0]}`); // Doesn´t work
            done(null, user);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser( async (id, done) => {
    const [rows] = await pool.query('SELECT * FROM usuario WHERE id=?', [id]);
    // null cuando error, rows[0] (el usuario) cuando éxito
    done(null, rows[0]);
});
