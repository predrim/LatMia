const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'lat_db'
});

const animaisRoutes = require('./routes/Animais.routes.js');
const authRoutes = require('./routes/Auth.routes.js');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'chave_secreta_latmia', // Em produção, isso fica num arquivo .env
    resave: false,
    saveUninitialized: false
}));
app.use('/api', animaisRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/caes', async (req, res) => {
    try {
        const [caes] = await pool.execute(`
            SELECT a.*, f.url_foto 
            FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.especie = 'cao' AND a.status = 'disponivel'
            ORDER BY a.data_anuncio DESC
        `);
        
        res.render('dogs', { caes: caes });
    } catch (error) {
        console.error('Erro ao buscar cães:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/gatos', async (req, res) => {
    try {
        const [gatos] = await pool.execute(`
            SELECT a.*, f.url_foto 
            FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.especie = 'gato' AND a.status = 'disponivel'
            ORDER BY a.data_anuncio DESC
        `);
        
        res.render('cats', { gatos: gatos });
    } catch (error) {
        console.error('Erro ao buscar gatos:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/anunciar', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    res.render('list_animal', { user: req.session.usuario });
});

app.get('/meus_anuncios', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const anuncianteId = req.session.usuario.id;

    try {
        const [meusAnimais] = await pool.execute(`
            SELECT a.*, f.url_foto 
            FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.anunciante_id = ?
            ORDER BY a.data_anuncio DESC
        `, [anuncianteId]);
        
        res.render('my_listings', { animais: meusAnimais });
    } catch (error) {
        console.error('Erro ao buscar meus anúncios:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(); // Destrói a sessão atual
    res.redirect('/');     // Manda de volta para a tela de login
});

app.get('/perfil', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const userId = req.session.usuario.id;

    try {
        const [usuarios] = await pool.execute('SELECT * FROM usuario WHERE id = ?', [userId]);
        const user = usuarios[0];

        const [anunciosAtivos] = await pool.execute(
            'SELECT COUNT(*) as total FROM animal WHERE anunciante_id = ? AND status = "disponivel"', 
            [userId]
        );

// Busca o histórico de pedidos de adoção que esse usuário fez
        const [pedidos] = await pool.execute(`
            SELECT p.*, a.nome as animal_nome, a.especie, f.url_foto, dono.estado as animal_estado
            FROM pedidos_adocao p
            JOIN animal a ON p.animal_id = a.id
            JOIN usuario dono ON a.anunciante_id = dono.id
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE p.adotante_id = ?
            ORDER BY p.data_criacao DESC
        `, [userId]);

        res.render('profile', { 
            user: user, 
            totalAnuncios: anunciosAtivos[0].total,
            pedidos: pedidos 
        });
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.listen(3000, () => console.log('Rodando em http://localhost:3000'));