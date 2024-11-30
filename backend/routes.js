const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('SignUpPage', { title: 'signup' });
});

router.get('/home', (req, res) => {
    res.render('HomePage', { title: 'home' });
});

router.get('/album', (req, res) => {
    res.render('AlbumPage', { title: 'album' });
});

router.get('/login', (req, res) => {
    res.render('LoginPage', { title: 'login' });
});

router.get('/profile', (req, res) => {
    res.render('ProfilePage', { title: 'profile' });
});

router.get('/search', (req, res) => {
    res.render('SearchPage', { title: 'search' });
});

module.exports = router;