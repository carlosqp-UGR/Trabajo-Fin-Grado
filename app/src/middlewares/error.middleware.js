export const errorHandler = (err, req, res, next) => {
    console.error('errorHandler: '+ err.message);
    if (!res.headersSent) {
        res.status(500).render('error');
        res.render('error', {
            error: err
        })
    }
}