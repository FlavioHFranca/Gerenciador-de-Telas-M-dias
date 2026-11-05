# 📺 ZappSignage - Sistema de Sinalização Digital Web (Digital Signage)

Sistema web completo de Digital Signage com duas rotas interligadas em tempo real:
- **Rota 1 (`/`):** Painel Administrativo de Gerenciamento de Telas, Configuração de Orientação (Horizontal 1920x1080 ou Vertical 1080x1920) e Upload de Mídias (Vídeos e Imagens).
- **Rota 2 (`/player` ou `/player/:codigo`):** Player de exibição em Full Screen com conexão instantânea via código único gerado pelo painel.

---

## 🚀 Como Executar o Projeto

### Opção A: Com Docker (Recomendado para Deploy e Produção) 🐳

1. Certifique-se de que o **Docker Desktop** esteja aberto.
2. Na pasta do projeto, suba o container:
   ```bash
   docker compose up -d --build
   ```
   *Ou simplesmente dê um duplo clique no arquivo **`docker-start.bat`** no Windows.*

3. Para ver os logs ou parar os containers:
   ```bash
   # Ver logs em tempo real
   docker compose logs -f

   # Parar o serviço
   docker compose down
   # ou clique duas vezes em docker-stop.bat
   ```

> 💾 **Persistência de Dados Garantida:** As pastas `./uploads` (vídeos e fotos) e `./data` (banco de telas e playlists) são montadas como volumes no host, garantindo que nenhum arquivo ou configuração seja perdido ao reiniciar ou atualizar o container.

---

### Opção B: Direto com Node.js

1. Abra o terminal na pasta do projeto:
   ```bash
   cd c:\work\zappsignage
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```
   *(ou `node server.js`)*

---

### 🌐 Acessando a Aplicação:
- **Rota 1 (Painel Admin & Upload):** [http://localhost:3000](http://localhost:3000)
- **Rota 2 (Player Fullscreen):** [http://localhost:3000/player](http://localhost:3000/player)

---

## 🌟 Funcionalidades Principais

### 1️⃣ Rota 1: Painel de Gerenciamento & Upload (`/`)
- **Geração de Códigos Únicos:** Cada tela possui um código amigável de pareamento (ex: `SIGN-1080`, `ZP-XXXX`) e link direto para o player.
- **Opção de Orientação da Tela:**
  - 🖥️ **Horizontal (1920 × 1080 - 16:9):** Ideal para TVs, Monitores Comerciais, Vitrines Horizontais.
  - 📱 **Vertical (1080 × 1920 - 9:16):** Ideal para Totens, Painéis Verticais de Shopping, Displays de Entrada.
- **Upload de Mídias:**
  - Suporte completo às extensões mais comuns:
    - **Vídeos:** `.mp4`, `.webm`, `.mov`, `.ogg`
    - **Imagens:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
  - Upload múltiplo e arrastar-e-soltar (Drag and Drop).
  - Barra de progresso do upload em tempo real.
- **Controle da Playlist:**
  - Tempo de exibição configurável por imagem (ex: 5s, 8s, 10s, 15s).
  - Para vídeos, reproduz a duração natural do vídeo e avança automaticamente.
  - Miniaturas de pré-visualização.
  - Ativar / pausar mídias sem precisar excluí-las.
  - Excluir mídias com 1 clique.
  - Simulador de Proporção ao vivo (mockup da tela).
- **Status do Player em Tempo Real:** Mostra se o player está `ONLINE` ou aguardando conexão via WebSockets (Socket.io).

### 2️⃣ Rota 2: Player de Reprodução Fullscreen (`/player`)
- **Conexão por Código:** Campo intuitivo para digitar o código gerado no painel, ou conexão direta via URL:
  - `http://localhost:3000/player?code=SIGN-1080`
  - `http://localhost:3000/player/SIGN-1080`
- **Modo Tela Cheia (Full Screen):**
  - Botão dedicado para entrar/sair de Fullscreen.
  - Tecla de atalho: pressione **`F`** ou dê **duplo clique** em qualquer lugar da tela.
- **Transição Suave (Crossfade):** Alternância com camada dupla para eliminar telas pretas ou piscadas entre vídeos e imagens.
- **Autoplay Inteligente:** Caso as políticas de áudio do navegador bloqueiem a inicialização automática com som, o player inicia silenciosamente de imediato e exibe um botão elegante para ativar o som.
- **Sincronização em Tempo Real (Socket.io):** Se você adicionar, editar ou excluir mídias na Rota 1, o player na Rota 2 atualiza automaticamente sem precisar recarregar a página!
- **Interface Limpa:** Controles e cursor desaparecem automaticamente após 3 segundos de inatividade do mouse.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, Multer (upload), Socket.io (sincronização bidirecional em tempo real), CORS.
- **Frontend:** HTML5, CSS3 moderno, Tailwind CSS, Font Awesome, JavaScript Vanilla (ES6+).
- **Armazenamento:** Arquivos salvos em `/uploads` e banco de dados leve e portátil em `/data/screens.json`.
