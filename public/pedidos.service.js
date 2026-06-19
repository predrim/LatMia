async function atualizarStatusPedido(id, status) {
    const res = await fetch(`/api/pedidos/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_adocao: status }),
    });
    return res.ok;
}

async function excluirPedido(id) {
    const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
    return res.ok;
}

document.querySelectorAll('.action-btn--approve').forEach(btn => {
    btn.addEventListener('click', async () => {
        const ok = await atualizarStatusPedido(btn.dataset.id, 'aprovado');
        if (ok) location.reload();
        else alert('Não foi possível aprovar o pedido. Tente novamente.');
    });
});

document.querySelectorAll('.action-btn--reject').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!confirm('Recusar este pedido de adoção?')) return;
        const ok = await atualizarStatusPedido(btn.dataset.id, 'recusado');
        if (ok) location.reload();
        else alert('Não foi possível recusar o pedido. Tente novamente.');
    });
});

document.querySelectorAll('.action-btn--delete').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!confirm('Excluir este pedido definitivamente?')) return;
        const ok = await excluirPedido(btn.dataset.id);
        if (ok) {
            btn.closest('.pedido-card').remove();
        } else {
            alert('Não foi possível excluir o pedido. Tente novamente.');
        }
    });
});
