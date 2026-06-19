// Contador de caracteres
const textarea = document.getElementById('descricao');
const counter = document.getElementById('char-count');
textarea.addEventListener('input', () => counter.textContent = textarea.value.length);

// Preview de foto ao selecionar
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
      slot.querySelector('.photo-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
});

//async function cadastrarAnimal(dadosAnimal, arquivosFotos, indiceFotoCapa = 0) {
//  const formData = new FormData();

  // Object.entries(dadosAnimal).forEach(([campo, valor]) => formData.append(campo, valor));
  // arquivosFotos.forEach((arquivo) => formData.append('fotos', arquivo));
  // formData.append('foto_principal_index', indiceFotoCapa);

  // const resposta = await fetch('/api/animais', { method: 'POST', body: formData });
  // return resposta.json(); // { success, animal_id, fotos }
//}

// Exemplo de uso em um formulário:
// cadastrarAnimal(
//   { anunciante_id: 3, nome: 'Bidu', especie: 'cao', cor: 'Caramelo', idade_meses: 18, sexo: 'macho', porte: 'medio', descricao: 'Vacinado e dócil.' },
//   inputFotos.files, // FileList do <input type="file" multiple>
//   0
// );