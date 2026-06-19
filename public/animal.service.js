// ── CONTADOR DE CARACTERES ─────────────────────────
const textarea = document.getElementById('descricao');
const counter = document.getElementById('char-count');
if(textarea && counter) {
    textarea.addEventListener('input', () => counter.textContent = textarea.value.length);
}

// ── PREVIEW DA FOTO AO SELECIONAR ──────────────────
document.querySelectorAll('.photo-input').forEach(input => {
  input.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    const slot = this.closest('.photo-slot');
    reader.onload = e => {
      slot.style.backgroundImage = `url(${e.target.result})`;
      slot.style.backgroundSize = 'cover';
      slot.style.backgroundPosition = 'center';
      
      const placeholder = slot.querySelector('.photo-placeholder');
      if(placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
});

// ── ENVIO DO FORMULÁRIO PARA O BACKEND ─────────────
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede a página de piscar/recarregar

    const formData = new FormData(form);

    // Pega o ID do usuário que injetamos no Passo 5!
    if (window.userSession && window.userSession.id) {
        formData.append('anunciante_id', window.userSession.id);
    } else {
        alert('Erro: Sessão perdida. Faça login novamente.');
        window.location.href = '/';
        return;
    }

    // Informa ao banco que a primeira foto enviada será a foto de capa
    formData.append('foto_principal_index', 0); 

    // Muda o texto do botão para dar um feedback visual
    const btnSubmit = form.querySelector('.btn-primary');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Publicando...';
    btnSubmit.disabled = true;

    try {
        // Dispara os dados para aquela rota que você criou com o Multer e MySQL
        const resposta = await fetch('/api/animais', { 
            method: 'POST', 
            body: formData 
        });
        const resultado = await resposta.json(); 

        if (resultado.success) {
            alert('Animal cadastrado com sucesso! 🐾');
            window.location.href = '/meus_anuncios'; // Redireciona para ver o pet!
        } else {
            alert('Ocorreu um erro: ' + (resultado.erro || 'Verifique os campos.'));
            btnSubmit.textContent = textoOriginal;
            btnSubmit.disabled = false;
        }
    } catch (erro) {
        alert('Erro de conexão. O servidor caiu?');
        console.error(erro);
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
    }
  });
}