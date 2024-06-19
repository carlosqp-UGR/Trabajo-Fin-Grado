import { pool } from "../database.js";

export const renderIndex = (req, res) => {
    let nombre = 'usuario';
    try {
        nombre = req.user.fullname.split(' ')[0];
    } catch (e) {}
    res.render("index", {nombre});
}

export const ping = async (req, res) => {
    const [result] = await pool.query('SELECT * FROM cliente')
    res.json(result);
}