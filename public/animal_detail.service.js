// Troca a foto principal da galeria ao clicar em uma miniatura
document.querySelectorAll('.thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
        document.getElementById('gallery-main-img').src = thumb.src;
        document.querySelectorAll('.thumb').forEach(t => t.classList.remove('thumb-active'));
        thumb.classList.add('thumb-active');
    });
});
