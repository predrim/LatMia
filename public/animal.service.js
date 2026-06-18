async function cadastrarAnimal(dadosAnimal, arquivosFotos, indiceFotoCapa = 0) {
  const formData = new FormData();

  Object.entries(dadosAnimal).forEach(([campo, valor]) => formData.append(campo, valor));
  arquivosFotos.forEach((arquivo) => formData.append('fotos', arquivo));
  formData.append('foto_principal_index', indiceFotoCapa);

  const resposta = await fetch('/api/animais', { method: 'POST', body: formData });
  return resposta.json(); // { success, animal_id, fotos }
}

// Exemplo de uso em um formulário:
// cadastrarAnimal(
//   { anunciante_id: 3, nome: 'Bidu', especie: 'cao', cor: 'Caramelo', idade_meses: 18, sexo: 'macho', porte: 'medio', descricao: 'Vacinado e dócil.' },
//   inputFotos.files, // FileList do <input type="file" multiple>
//   0
// );