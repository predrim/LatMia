async function handleSubmit(event) {
  event.preventDefault();
  const resultado = await cadastrarAnimal(dadosFormulario, fotosSelecionadas, 0);
  if (resultado.success) {
    
  }
}