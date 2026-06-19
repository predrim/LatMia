const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Importando as rotas (que agora controlam suas próprias conexões)
const animaisRoutes = require('./routes/Animais.routes.js');
const authRoutes = require('./routes/Auth.routes.js');
const viewsRoutes = require('./routes/View.routes.js'); 
const pedidosRoutes = require('./routes/Pedidos.routes.js');

// Configurações do Express e View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Controle de Sessão
app.use(session({
    secret: 'chave_secreta_latmia',
    resave: false,
    saveUninitialized: false
}));

// Ativação das Rotas
app.use('/api', animaisRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', pedidosRoutes);
app.use('/', viewsRoutes);

// Inicialização do Servidor
app.listen(3000, () => console.log('Rodando em http://localhost:3000'));