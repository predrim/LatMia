const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');

// PÁGINA INICIAL
router.get('/', (req, res) => {
    res.render('index');
});

// PÁGINA DE CÃES
router.get('/caes', async (req, res) => {
    try {
        const [recentes] = await pool.execute(`
            SELECT a.*, f.url_foto FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.especie = 'cao' AND a.status = 'disponivel'
            ORDER BY a.data_anuncio DESC LIMIT 5
        `);
        const [todos] = await pool.execute(`
            SELECT a.*, f.url_foto FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.especie = 'cao' AND a.status = 'disponivel'
            ORDER BY a.data_anuncio DESC
        `);
        res.render('dogs', { recentes, caes: todos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro interno do servidor');
    }
});

// PÁGINA DE GATOS
router.get('/gatos', async (req, res) => {
    try {
        const [recentes] = await pool.execute(`
            SELECT a.*, f.url_foto FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.especie = 'gato' AND a.status = 'disponivel'
            ORDER BY a.data_anuncio DESC LIMIT 5
        `);
        const [todos] = await pool.execute(`
            SELECT a.*, f.url_foto FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.especie = 'gato' AND a.status = 'disponivel'
            ORDER BY a.data_anuncio DESC
        `);
        res.render('cats', { recentes, gatos: todos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro interno do servidor');
    }
});

// ANUNCIAR
router.get('/anunciar', (req, res) => {
    if (!req.session.usuario) return res.redirect('/');
    res.render('list_animal', { user: req.session.usuario });
});

// MEUS ANÚNCIOS
router.get('/meus_anuncios', async (req, res) => {
    if (!req.session.usuario) return res.redirect('/');
    try {
        const [meusAnimais] = await pool.execute(`
            SELECT a.*, f.url_foto FROM animal a
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE a.anunciante_id = ? ORDER BY a.data_anuncio DESC
        `, [req.session.usuario.id]);
        res.render('my_listings', { animais: meusAnimais });
    } catch (error) {
        res.status(500).send('Erro interno');
    }
});

// PERFIL
router.get('/perfil', async (req, res) => {
    if (!req.session.usuario) return res.redirect('/');
    try {
        const [usuarios] = await pool.execute('SELECT * FROM usuario WHERE id = ?', [req.session.usuario.id]);
        const [anunciosAtivos] = await pool.execute('SELECT COUNT(*) as total FROM animal WHERE anunciante_id = ? AND status = "disponivel"', [req.session.usuario.id]);
        const [pedidos] = await pool.execute(`
            SELECT p.*, a.nome as animal_nome, a.especie, f.url_foto, dono.estado as animal_estado
            FROM pedidos_adocao p
            JOIN animal a ON p.animal_id = a.id
            JOIN usuario dono ON a.anunciante_id = dono.id
            LEFT JOIN fotos_animal f ON a.id = f.animal_id AND f.e_principal = TRUE
            WHERE p.adotante_id = ? ORDER BY p.data_criacao DESC
        `, [req.session.usuario.id]);
        res.render('profile', { user: usuarios[0], totalAnuncios: anunciosAtivos[0].total, pedidos });
    } catch (error) {
        res.status(500).send('Erro interno');
    }
});

// PÁGINA DE DETALHES DO ANIMAL
router.get('/animal/:id', async (req, res) => {
    const animalId = req.params.id;

    try {
        const [animais] = await pool.execute(`
            SELECT a.*, u.nome as anunciante_nome, u.telefone as anunciante_telefone 
            FROM animal a
            JOIN usuario u ON a.anunciante_id = u.id
            WHERE a.id = ?
        `, [animalId]);

        if (animais.length === 0) {
            return res.status(404).send('Animal não encontrado.');
        }

        const animal = animais[0];

        const [fotos] = await pool.execute(
            'SELECT url_foto FROM fotos_animal WHERE animal_id = ?', 
            [animalId]
        );

        res.render('animal_detail', { animal: animal, fotos: fotos });
    } catch (error) {
        console.error('Erro ao buscar detalhes do animal:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// PÁGINA DE PEDIDOS DE UM ANIMAL (visão do anunciante — quem recebeu os pedidos)
router.get('/animal/:id/pedidos', async (req, res) => {
    if (!req.session.usuario) return res.redirect('/');
    const animalId = req.params.id;

    try {
        const [animais] = await pool.execute('SELECT * FROM animal WHERE id = ?', [animalId]);

        if (animais.length === 0) {
            return res.status(404).send('Animal não encontrado.');
        }

        const animal = animais[0];

        // só o dono do anúncio pode ver quem pediu pra adotar
        if (Number(animal.anunciante_id) !== Number(req.session.usuario.id)) {
            return res.status(403).send('Você não tem permissão para ver os pedidos deste animal.');
        }

        const [fotoPrincipal] = await pool.execute(
            'SELECT url_foto FROM fotos_animal WHERE animal_id = ? AND e_principal = TRUE LIMIT 1',
            [animalId]
        );

        const [pedidos] = await pool.execute(`
            SELECT p.*, u.nome AS adotante_nome, u.email AS adotante_email,
                   u.telefone AS adotante_telefone, u.estado AS adotante_estado
            FROM pedidos_adocao p
            JOIN usuario u ON p.adotante_id = u.id
            WHERE p.animal_id = ?
            ORDER BY p.data_criacao DESC
        `, [animalId]);

        res.render('pedidos', {
            animal,
            urlFoto: fotoPrincipal[0] ? fotoPrincipal[0].url_foto : null,
            pedidos,
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos do animal:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// CRIA UM PEDIDO DE ADOÇÃO (formulário "Enviar pedido de adoção" da página de detalhes)
router.post('/animal/:id/pedidos', async (req, res) => {
    if (!req.session.usuario) return res.redirect('/');
    const animalId = req.params.id;
    const adotanteId = req.session.usuario.id;

    try {
        const [animais] = await pool.execute('SELECT anunciante_id, status FROM animal WHERE id = ?', [animalId]);

        if (animais.length === 0) {
            return res.status(404).send('Animal não encontrado.');
        }

        const animal = animais[0];

        if (Number(animal.anunciante_id) === Number(adotanteId)) {
            return res.status(400).send('Você não pode enviar um pedido de adoção para o seu próprio anúncio.');
        }

        if (animal.status !== 'disponivel') {
            return res.status(400).send('Este animal não está mais disponível para adoção.');
        }

        const [existente] = await pool.execute(
            'SELECT id FROM pedidos_adocao WHERE animal_id = ? AND adotante_id = ? AND status_adocao = "pendente"',
            [animalId, adotanteId]
        );

        if (existente.length === 0) {
            await pool.execute(
                'INSERT INTO pedidos_adocao (animal_id, adotante_id) VALUES (?, ?)',
                [animalId, adotanteId]
            );
        }

        res.redirect(`/animal/${animalId}`);
    } catch (error) {
        console.error('Erro ao criar pedido de adoção:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
