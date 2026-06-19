const express = require('express');
const router = express.Router();

// 1. IMPORTA O BANCO
const pool = require('../config/db.js'); 

// Rota para o login utilizando email e senha
router.post('/login', async (req, res) => {
    const email = req.body['user-email'];
    const senha = req.body['user-password'];

    try {
        const [usuarios] = await pool.execute(
            'SELECT * FROM usuario WHERE email = ? AND senha_hash = ?',
            [email, senha]
        );

        if (usuarios.length > 0) {
            const user = usuarios[0];
            delete user.senha_hash; 
            
            req.session.usuario = user;
            
            return res.json({ success: true });
        } else {
            return res.status(401).json({ success: false, erro: 'Email ou senha incorretos.' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ success: false, erro: 'Erro no servidor.' });
    }
});

// Rota para o usuario fazer logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

module.exports = router;