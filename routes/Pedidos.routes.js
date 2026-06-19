const express = require('express');
const router = express.Router();

// Importa a conexão com o banco
const pool = require('../config/db.js');

// cria uma rota para criar um novo pedido de adoção (CREATE)
router.post('/pedidos', async (req, res) => {
  const { animal_id, adotante_id } = req.body;

  if (!animal_id || !adotante_id) {
    return res.status(400).json({
      success: false,
      erro: 'Os campos animal_id e adotante_id são obrigatórios.',
    });
  }

  try {
    // Opcional: Verifica se o adotante já não fez um pedido pendente para este mesmo animal
    const [existente] = await pool.execute(
      'SELECT id FROM pedidos_adocao WHERE animal_id = ? AND adotante_id = ? AND status_adocao = "pendente"',
      [animal_id, adotante_id]
    );

    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        erro: 'Você já possui um pedido de adoção pendente para este animal.',
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO pedidos_adocao (animal_id, adotante_id) VALUES (?, ?)',
      [animal_id, adotante_id]
    );

    return res.status(201).json({
      success: true,
      pedido_id: result.insertId,
      mensagem: 'Pedido de adoção enviado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao criar pedido de adoção:', error);
    return res.status(500).json({ success: false, erro: 'Erro interno do servidor.' });
  }
});

// seta/atualiza o status do pedido de adoção (UPDATE)
router.put('/pedidos/:id/status', async (req, res) => {
  const pedidoId = req.params.id;
  const { status_adocao } = req.body; // Espera 'pendente', 'aprovado' ou 'recusado'

  const statusPermitidos = ['pendente', 'aprovado', 'recusado'];
  if (!statusPermitidos.includes(status_adocao)) {
    return res.status(400).json({
      success: false,
      erro: 'Status de adoção inválido. Use pendente, aprovado ou recusado.',
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Precisamos saber a qual animal esse pedido pertence
    const [pedidos] = await connection.execute(
      'SELECT animal_id FROM pedidos_adocao WHERE id = ?',
      [pedidoId]
    );

    if (pedidos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, erro: 'Pedido de adoção não encontrado.' });
    }

    const { animal_id } = pedidos[0];

    const [result] = await connection.execute(
      'UPDATE pedidos_adocao SET status_adocao = ? WHERE id = ?',
      [status_adocao, pedidoId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, erro: 'Pedido de adoção não encontrado.' });
    }

    //muda o status do animal quando o status do pedido é aprovado
    if (status_adocao === 'aprovado') {
      await connection.execute(
        'UPDATE animal SET status = "adotado" WHERE id = ?',
        [animal_id]
      );

      await connection.execute(
        'UPDATE pedidos_adocao SET status_adocao = "recusado" WHERE animal_id = ? AND id != ? AND status_adocao = "pendente"',
        [animal_id, pedidoId]
      );
    }

    await connection.commit();

    return res.json({ success: true, mensagem: `Status do pedido atualizado para ${status_adocao}.` });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar status do pedido:', error);
    return res.status(500).json({ success: false, erro: 'Erro interno do servidor.' });
  } finally {
    connection.release();
  }
});

// exclui o pedido de adoção do banco (DELETE)
router.delete('/pedidos/:id', async (req, res) => {
  const pedidoId = req.params.id;

  try {
    const [result] = await pool.execute(
      'DELETE FROM pedidos_adocao WHERE id = ?',
      [pedidoId]
    );

    if (result.affectedRows > 0) {
      return res.json({ success: true, mensagem: 'Pedido de adoção cancelado/excluído com sucesso.' });
    } else {
      return res.status(404).json({ success: false, erro: 'Pedido de adoção não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao excluir pedido de adoção:', error);
    return res.status(500).json({ success: false, erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;