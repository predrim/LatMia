// ── LÓGICA DAS ABAS (Filtros) ───────────────────
        const tabs = document.querySelectorAll('.tab');
        const cards = document.querySelectorAll('.listing-card');
        const empty = document.getElementById('empty-state');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const filter = tab.dataset.filter;
                let visible = 0;

                cards.forEach(card => {
                    const show = filter === 'todos' || card.dataset.status === filter;
                    card.style.display = show ? '' : 'none';
                    if (show) visible++;
                });

                empty.style.display = visible === 0 ? 'flex' : 'none';
            });
        });

        // ── MODAL DE EXCLUSÃO (Agora conectado ao Backend) ──
        const backdrop = document.getElementById('modal-backdrop');
        let pendingId = null;

        document.querySelectorAll('.action-btn--delete').forEach(btn => {
            btn.addEventListener('click', () => {
                pendingId = btn.dataset.id;
                backdrop.classList.add('active');
            });
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            backdrop.classList.remove('active');
            pendingId = null;
        });

        document.getElementById('modal-confirm').addEventListener('click', async () => {
            if (pendingId) {
                // Trocando o texto do botão para mostrar que está carregando
                const btnConfirm = document.getElementById('modal-confirm');
                btnConfirm.textContent = 'Excluindo...';
                
                try {
                    // Chama a rota DELETE no Node.js
                    const resposta = await fetch(`/api/animais/${pendingId}`, { method: 'DELETE' });
                    const resultado = await resposta.json();

                    if (resultado.success) {
                        const card = document.querySelector(`.action-btn--delete[data-id="${pendingId}"]`).closest('.listing-card');
                        if (card) {
                            card.style.animation = 'fadeOut 0.3s ease forwards';
                            setTimeout(() => {
                                card.remove();
                                window.location.reload(); // Recarrega para atualizar os números do topo
                            }, 300);
                        }
                    } else {
                        alert('Erro ao excluir: ' + resultado.erro);
                    }
                } catch (error) {
                    alert('Erro de conexão ao tentar excluir o anúncio.');
                }
                btnConfirm.textContent = 'Sim, excluir';
            }
            backdrop.classList.remove('active');
            pendingId = null;
        });

        // ── BOTÃO PAUSAR (Conectado ao Backend) ────────
        document.querySelectorAll('.action-btn--pause').forEach(btn => {
            btn.addEventListener('click', async () => {
                const animalId = btn.dataset.id;
                btn.textContent = 'Pausando...'; // Feedback visual

                try {
                    const resposta = await fetch(`/api/animais/${animalId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'pausado' })
                    });
                    const resultado = await resposta.json();

                    if (resultado.success) {
                        window.location.reload(); // Atualiza a tela para mudar de aba e contadores
                    } else {
                        alert('Erro ao pausar: ' + resultado.erro);
                        btn.textContent = 'Pausar';
                    }
                } catch (error) {
                    alert('Erro de conexão.');
                    btn.textContent = 'Pausar';
                }
            });
        });

        // ── BOTÃO REATIVAR (Conectado ao Backend) ──────
        document.querySelectorAll('.action-btn--activate').forEach(btn => {
            btn.addEventListener('click', async () => {
                const animalId = btn.dataset.id;
                btn.textContent = 'Reativando...'; // Feedback visual

                try {
                    const resposta = await fetch(`/api/animais/${animalId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'disponivel' })
                    });
                    const resultado = await resposta.json();

                    if (resultado.success) {
                        window.location.reload(); // Atualiza a tela para mudar de aba e contadores
                    } else {
                        alert('Erro ao reativar: ' + resultado.erro);
                        btn.textContent = 'Reativar';
                    }
                } catch (error) {
                    alert('Erro de conexão.');
                    btn.textContent = 'Reativar';
                }
            });
        });