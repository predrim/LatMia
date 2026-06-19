-- LAT db

CREATE DATABASE IF NOT EXISTS lat_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE lat_db;

-- =========================================================
-- Tabela: usuario
-- =========================================================
CREATE TABLE IF NOT EXISTS usuario (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(150)        NOT NULL,
    email         VARCHAR(150)        NOT NULL,
    senha_hash    VARCHAR(255)        NOT NULL,
    telefone      VARCHAR(20)         NULL,
    estado        CHAR(2)             NULL,
    CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE=InnoDB;

-- =========================================================
-- Tabela: animal
-- =========================================================
CREATE TABLE IF NOT EXISTS animal (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    anunciante_id   INT UNSIGNED                                NOT NULL,
    nome            VARCHAR(100)                                NULL,
    especie         ENUM('cao', 'gato')                         NOT NULL,
    cor             VARCHAR(100)                                NULL,
    idade_meses     INT UNSIGNED                                NULL,
    sexo            ENUM('macho', 'femea')                      NULL,
    porte           ENUM('pequeno', 'medio', 'grande')          NULL,
    descricao       TEXT                                        NULL,
    status          ENUM('disponivel', 'adotado', 'pausado')    NOT NULL DEFAULT 'disponivel',
    data_anuncio    TIMESTAMP                                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_animal_anunciante
        FOREIGN KEY (anunciante_id) REFERENCES usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_animal_status (status),
    INDEX idx_animal_especie (especie)
) ENGINE=InnoDB;

-- =========================================================
-- Tabela: fotos_animal
-- =========================================================
CREATE TABLE IF NOT EXISTS fotos_animal (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id     INT UNSIGNED        NOT NULL,
    url_foto      VARCHAR(500)        NOT NULL,
    e_principal   BOOLEAN             NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_foto_animal
        FOREIGN KEY (animal_id) REFERENCES animal(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_foto_animal_id (animal_id)
) ENGINE=InnoDB;

-- =========================================================
-- Tabela: pedidos_adocao
-- =========================================================
CREATE TABLE IF NOT EXISTS pedidos_adocao (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT UNSIGNED                                            NOT NULL,
    adotante_id     INT UNSIGNED                                            NOT NULL,
    status_adocao   ENUM('pendente', 'aprovado', 'recusado', 'em_analise')  NOT NULL DEFAULT 'pendente',
    data_criacao    TIMESTAMP                                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_animal
        FOREIGN KEY (animal_id) REFERENCES animal(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_adotante
        FOREIGN KEY (adotante_id) REFERENCES usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_pedido_status (status_adocao)
) ENGINE=InnoDB;

INSERT INTO usuario (nome, email, senha_hash, telefone, estado) VALUES
('Luiz Gustavo Carvalho de Brito', 'luizex@gmail.com', 'Luiz123', '(61) 99876-5432', 'DF'),
('Carlos Eduardo Souza', 'carlos.souza@gmail.com', 'CE123', '(11) 98765-4321', 'SP'),
('Mariana Costa Lima', 'mariana.lima@gmail.com', 'Mariana321', '(31) 97654-3210', 'MG'),
('João Pedro Almeida', 'joao.almeida@gmail.com', 'JPGamer2011', '(85) 96543-2109', 'CE'),
('Pedro Ferraz de Souza Pereira', 'pedreiro@gmail.com', 'pedro', '(61) 95432-1098', 'DF');

ALTER TABLE pedidos_adocao 
MODIFY COLUMN status_adocao ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente';

-- insert animais
INSERT INTO animal (anunciante_id, nome, especie, cor, idade_meses, sexo, porte, descricao, status) VALUES
(
    (SELECT id FROM usuario WHERE email = 'luizex@gmail.com'), 
    'Rex', 
    'cao', 
    'Caramelo', 
    24, 
    'macho', 
    'medio', 
    'Muito dócil, brincalhão e adora correr no quintal.', 
    'disponivel'
),
(
    (SELECT id FROM usuario WHERE email = 'mariana.lima@gmail.com'), 
    'Mia', 
    'gato', 
    'Escaminha', 
    12, 
    'femea', 
    'pequeno', 
    'Calma, carinhosa e adora dormir em locais quentinhos.', 
    'disponivel'
),
(
    (SELECT id FROM usuario WHERE email = 'carlos.souza@gmail.com'), 
    'Thor', 
    'cao', 
    'Preto e Branco', 
    36, 
    'macho', 
    'grande', 
    'Ótimo cão de guarda, mas muito carinhoso com a família.', 
    'disponivel'
);