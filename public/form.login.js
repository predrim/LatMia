const form = document.querySelector('form');
    const submitBtn = document.querySelector('.submit-button');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Dá feedback visual e bloqueia o botão
        const textoOriginal = submitBtn.textContent;
        submitBtn.textContent = 'Entrando...';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        // Converte o FormData para um objeto JSON
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Login com sucesso! Redireciona para a home de cães
                window.location.href = '/caes';
            } else {
                alert(result.erro);
                submitBtn.textContent = textoOriginal;
                submitBtn.disabled = false;
            }
        } catch (error) {
            alert('Erro de conexão.');
            submitBtn.textContent = textoOriginal;
            submitBtn.disabled = false;
        }
    });