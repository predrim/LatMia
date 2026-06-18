// =========================================================
// Rota: Cadastro de animal com upload de fotos
// Requer: npm install express multer mysql2
// =========================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');

const router = express.Router();

// ---------------------------------------------------------
// Conexão com o banco de dados
// ---------------------------------------------------------
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'lat_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// ---------------------------------------------------------
// Configuração de onde/como as fotos serão salvas no servidor
// ---------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/animais'),
  filename: (req, file, cb) => {
    const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, nomeUnico);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limite de 5MB por foto
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const valido = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    cb(valido ? null : new Error('Formato de imagem não suportado.'), valido);
  },
});

// ---------------------------------------------------------
// POST /animais
//
// Cadastra um animal e suas fotos em uma única requisição.
//
// Campos esperados (multipart/form-data):
//   - anunciante_id      (obrigatório)
//   - especie             'cao' ou 'gato' (obrigatório)
//   - nome, cor, idade_meses, sexo, porte, descricao (opcionais)
//   - fotos               arquivos de imagem (até 6)
//   - foto_principal_index índice (0-based) da foto que será a capa (opcional, padrão 0)
//
// Resposta de sucesso (201):
//   { success: true, animal_id: 12, fotos: [{ id: 25, url: "...", e_principal: true }] }
//
// Resposta de erro (400/500):
//   { success: false, erro: "mensagem explicando o problema" }
// ---------------------------------------------------------
router.post('/animais', upload.array('fotos', 6), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      anunciante_id,
      nome,
      especie,
      cor,
      idade_meses,
      sexo,
      porte,
      descricao,
      foto_principal_index,
    } = req.body;

    if (!anunciante_id || !especie) {
      return res.status(400).json({
        success: false,
        erro: 'Os campos anunciante_id e especie são obrigatórios.',
      });
    }

    await connection.beginTransaction();

    // 1. Insere o animal
    const [resultAnimal] = await connection.execute(
      `INSERT INTO animal
        (anunciante_id, nome, especie, cor, idade_meses, sexo, porte, descricao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'disponivel')`,
      [
        anunciante_id,
        nome || null,
        especie,
        cor || null,
        idade_meses || null,
        sexo || null,
        porte || null,
        descricao || null,
      ]
    );

    const animalId = resultAnimal.insertId;
    const principalIndex = Number(foto_principal_index) || 0;
    const fotos = [];

    // 2. Insere as fotos enviadas, já vinculadas ao animal
    const arquivos = req.files || [];
    for (let i = 0; i < arquivos.length; i++) {
      const url = `/uploads/animais/${arquivos[i].filename}`;
      const ePrincipal = i === principalIndex;

      const [resultFoto] = await connection.execute(
        `INSERT INTO fotos_animal (animal_id, url_foto, e_principal) VALUES (?, ?, ?)`,
        [animalId, url, ePrincipal]
      );

      fotos.push({ id: resultFoto.insertId, url, e_principal: ePrincipal });
    }

    await connection.commit();

    return res.status(201).json({ success: true, animal_id: animalId, fotos });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao cadastrar animal:', error);
    return res.status(500).json({
      success: false,
      erro: 'Não foi possível cadastrar o animal. Tente novamente.',
    });
  } finally {
    connection.release();
  }
});

module.exports = router;

// ---------------------------------------------------------
// Como usar no servidor principal (server.js):
//
//   const animaisRoutes = require('./animais.routes');
//   app.use('/routes', animaisRoutes);
//   app.use('/uploads', express.static('uploads')); // para servir as fotos
// ---------------------------------------------------------
