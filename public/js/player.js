// Player Fullscreen ZappSignage (Rota 2)
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Elementos do DOM
  const pairingScreen = document.getElementById('pairingScreen');
  const inputScreenCode = document.getElementById('inputScreenCode');
  const btnConnectScreen = document.getElementById('btnConnectScreen');
  const pairingError = document.getElementById('pairingError');

  const emptyScreen = document.getElementById('emptyScreen');
  const emptyScreenCode = document.getElementById('emptyScreenCode');

  const signageViewport = document.getElementById('signageViewport');
  const layerA = document.getElementById('layerA');
  const layerB = document.getElementById('layerB');
  const mediaLoader = document.getElementById('mediaLoader');
  const unmuteBanner = document.getElementById('unmuteBanner');

  const playerControlBar = document.getElementById('playerControlBar');
  const controlScreenName = document.getElementById('controlScreenName');
  const controlScreenCode = document.getElementById('controlScreenCode');
  const controlScreenOrient = document.getElementById('controlScreenOrient');

  const btnPrevMedia = document.getElementById('btnPrevMedia');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const pauseResumeIcon = document.getElementById('pauseResumeIcon');
  const btnNextMedia = document.getElementById('btnNextMedia');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  const btnToggleFullscreen = document.getElementById('btnToggleFullscreen');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const fullscreenText = document.getElementById('fullscreenText');
  const btnDisconnect = document.getElementById('btnDisconnect');

  const mediaProgressBar = document.getElementById('mediaProgressBar');

  // Estado da Reprodução
  let currentScreen = null;
  let activePlaylist = [];
  let currentIndex = 0;
  let isPaused = false;
  let isMuted = true; // Por padrão mudo para garantir autoplay imediato em todos os navegadores
  let currentLayer = 'A'; // 'A' ou 'B'
  let mediaTimer = null;
  let progressInterval = null;
  let hideControlsTimeout = null;

  // ================= CONTROLE DE URL E CÓDIGO =================
  function getCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return params.get('code').toUpperCase().trim();

    // Ou /player/CODE
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'player') {
      return decodeURIComponent(parts[1]).toUpperCase().trim();
    }
    return null;
  }

  // Tenta auto-conectar caso venha na URL ou no localStorage
  const urlCode = getCodeFromUrl() || localStorage.getItem('zapp_last_screen_code');
  if (urlCode) {
    inputScreenCode.value = urlCode;
    connectToScreen(urlCode);
  }

  btnConnectScreen.addEventListener('click', () => {
    const code = inputScreenCode.value.trim().toUpperCase();
    if (!code) {
      pairingError.textContent = 'Por favor, digite o código da tela.';
      pairingError.classList.remove('hidden');
      return;
    }
    connectToScreen(code);
  });

  inputScreenCode.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') btnConnectScreen.click();
  });

  async function connectToScreen(code) {
    pairingError.classList.add('hidden');
    try {
      const res = await fetch(`/api/screens/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error('Código de tela inválido ou não encontrado.');
      }
      const screenData = await res.json();
      localStorage.setItem('zapp_last_screen_code', screenData.code);
      initPlayer(screenData);

      // Entra na sala socket da tela
      socket.emit('join-screen', screenData.code);
    } catch (err) {
      pairingError.textContent = err.message || 'Erro ao conectar à tela.';
      pairingError.classList.remove('hidden');
    }
  }

  // ================= INICIALIZAÇÃO DO PLAYER =================
  function initPlayer(screenData) {
    currentScreen = screenData;
    pairingScreen.classList.add('hidden');

    // Atualiza controles
    controlScreenName.textContent = screenData.name || 'Tela Signage';
    controlScreenCode.textContent = screenData.code;
    controlScreenOrient.textContent = screenData.orientation === 'vertical' ? '9:16 Vertical' : '16:9 Horizontal';

    // Ajusta classes de orientação e fit
    applyScreenStyles(screenData);

    // Filtra mídias ativas
    activePlaylist = (screenData.playlist || []).filter(item => item.active !== false);

    if (activePlaylist.length === 0) {
      showEmptyScreen();
    } else {
      hideEmptyScreen();
      currentIndex = 0;
      playCurrentMedia();
    }

    startAutoHideControls();
  }

  function applyScreenStyles(screenData) {
    // Modo de preenchimento
    if (screenData.fitMode === 'cover') {
      signageViewport.classList.add('cover-mode');
      signageViewport.classList.remove('contain-mode');
    } else {
      signageViewport.classList.add('contain-mode');
      signageViewport.classList.remove('cover-mode');
    }

    // Orientação
    if (screenData.orientation === 'vertical') {
      document.body.classList.add('orientation-vertical');
      document.body.classList.remove('orientation-horizontal');
    } else {
      document.body.classList.add('orientation-horizontal');
      document.body.classList.remove('orientation-vertical');
    }
  }

  function showEmptyScreen() {
    emptyScreenCode.textContent = currentScreen ? currentScreen.code : '------';
    emptyScreen.classList.remove('hidden');
    emptyScreen.classList.add('flex');
    layerA.innerHTML = '';
    layerB.innerHTML = '';
    layerA.classList.remove('active');
    layerB.classList.remove('active');
  }

  function hideEmptyScreen() {
    emptyScreen.classList.add('hidden');
    emptyScreen.classList.remove('flex');
  }

  // ================= MÁQUINA DE REPRODUÇÃO =================
  function playCurrentMedia() {
    if (activePlaylist.length === 0) {
      showEmptyScreen();
      return;
    }

    // Garante índice válido
    if (currentIndex >= activePlaylist.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = activePlaylist.length - 1;

    const media = activePlaylist[currentIndex];
    const targetLayer = currentLayer === 'A' ? layerB : layerA;
    const oldLayer = currentLayer === 'A' ? layerA : layerB;

    clearTimers();
    mediaProgressBar.style.width = '0%';
    mediaLoader.classList.remove('hidden');

    const mediaUrl = `/uploads/${media.filename}`;

    if (media.type === 'video') {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.playsInline = true;
      video.muted = isMuted;
      video.autoplay = true;
      video.preload = 'auto';

      video.onloadeddata = () => {
        mediaLoader.classList.add('hidden');
        // Alterna camadas (crossfade)
        targetLayer.innerHTML = '';
        targetLayer.appendChild(video);
        targetLayer.classList.add('active');
        oldLayer.classList.remove('active');
        currentLayer = currentLayer === 'A' ? 'B' : 'A';

        // Tenta reproduzir vídeo
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Se autoplay com som foi bloqueado, muta e retenta
            video.muted = true;
            isMuted = true;
            updateSoundIcon();
            unmuteBanner.classList.remove('hidden');
            unmuteBanner.classList.add('flex');
            video.play();
          });
        }

        // Progresso do vídeo
        video.ontimeupdate = () => {
          if (video.duration) {
            const pct = (video.currentTime / video.duration) * 100;
            mediaProgressBar.style.width = `${pct}%`;
          }
        };

        // Quando o vídeo termina, vai para a próxima mídia da lista
        video.onended = () => {
          nextMedia();
        };

        // Em caso de erro de playback no vídeo, pula em 3 segundos para não travar a tela
        video.onerror = () => {
          console.error('Erro ao reproduzir vídeo:', media.originalName);
          setTimeout(nextMedia, 2000);
        };
      };

    } else {
      // É uma imagem
      const img = new Image();
      img.src = mediaUrl;
      img.onload = () => {
        mediaLoader.classList.add('hidden');
        targetLayer.innerHTML = '';
        targetLayer.appendChild(img);
        targetLayer.classList.add('active');
        oldLayer.classList.remove('active');
        currentLayer = currentLayer === 'A' ? 'B' : 'A';

        // Duração da imagem em segundos
        const durationSec = Number(media.duration) || Number(currentScreen.defaultImageDuration) || 10;
        const durationMs = durationSec * 1000;
        const startTime = Date.now();

        // Barra de progresso animada
        progressInterval = setInterval(() => {
          if (!isPaused) {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(100, (elapsed / durationMs) * 100);
            mediaProgressBar.style.width = `${pct}%`;
          }
        }, 50);

        mediaTimer = setTimeout(() => {
          clearInterval(progressInterval);
          nextMedia();
        }, durationMs);
      };

      img.onerror = () => {
        console.error('Erro ao carregar imagem:', media.originalName);
        setTimeout(nextMedia, 2000);
      };
    }
  }

  function nextMedia() {
    if (activePlaylist.length === 0) return;
    currentIndex = (currentIndex + 1) % activePlaylist.length;
    playCurrentMedia();
  }

  function prevMedia() {
    if (activePlaylist.length === 0) return;
    currentIndex = (currentIndex - 1 + activePlaylist.length) % activePlaylist.length;
    playCurrentMedia();
  }

  function clearTimers() {
    if (mediaTimer) clearTimeout(mediaTimer);
    if (progressInterval) clearInterval(progressInterval);
    // Para vídeos tocando na camada antiga
    [layerA, layerB].forEach(layer => {
      const v = layer.querySelector('video');
      if (v) {
        v.pause();
        v.src = '';
      }
    });
  }

  // ================= CONTROLES DE INTERFACE & FULLSCREEN =================
  btnNextMedia.addEventListener('click', nextMedia);
  btnPrevMedia.addEventListener('click', prevMedia);

  btnPauseResume.addEventListener('click', () => {
    isPaused = !isPaused;
    const activeEl = (currentLayer === 'A' ? layerA : layerB).querySelector('video');
    if (isPaused) {
      pauseResumeIcon.className = 'fa-solid fa-play';
      if (activeEl) activeEl.pause();
    } else {
      pauseResumeIcon.className = 'fa-solid fa-pause';
      if (activeEl) activeEl.play();
    }
  });

  // Som / Áudio
  btnToggleSound.addEventListener('click', () => {
    isMuted = !isMuted;
    updateSoundIcon();
    const activeVideo = (currentLayer === 'A' ? layerA : layerB).querySelector('video');
    if (activeVideo) {
      activeVideo.muted = isMuted;
    }
    unmuteBanner.classList.add('hidden');
    unmuteBanner.classList.remove('flex');
  });

  unmuteBanner.addEventListener('click', () => {
    isMuted = false;
    updateSoundIcon();
    const activeVideo = (currentLayer === 'A' ? layerA : layerB).querySelector('video');
    if (activeVideo) {
      activeVideo.muted = false;
    }
    unmuteBanner.classList.add('hidden');
    unmuteBanner.classList.remove('flex');
  });

  function updateSoundIcon() {
    if (isMuted) {
      soundIcon.className = 'fa-solid fa-volume-xmark';
    } else {
      soundIcon.className = 'fa-solid fa-volume-high text-indigo-400';
    }
  }

  // Alternar Tela Cheia (Fullscreen)
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Erro ao entrar em tela cheia:', err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  btnToggleFullscreen.addEventListener('click', toggleFullscreen);

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenIcon.className = 'fa-solid fa-compress';
      fullscreenText.textContent = 'Sair da Tela Cheia';
    } else {
      fullscreenIcon.className = 'fa-solid fa-expand';
      fullscreenText.textContent = 'Tela Cheia';
    }
  });

  // Duplo clique na tela ativa Fullscreen
  signageViewport.addEventListener('dblclick', toggleFullscreen);

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f') {
      toggleFullscreen();
    } else if (e.key === 'ArrowRight' || e.key === 'Space') {
      nextMedia();
    } else if (e.key === 'ArrowLeft') {
      prevMedia();
    }
  });

  // Desconectar tela
  btnDisconnect.addEventListener('click', () => {
    clearTimers();
    localStorage.removeItem('zapp_last_screen_code');
    currentScreen = null;
    activePlaylist = [];
    pairingScreen.classList.remove('hidden');
  });

  // ================= OCULTAÇÃO AUTOMÁTICA DOS CONTROLES =================
  function showControls() {
    document.body.classList.remove('hide-cursor');
    playerControlBar.style.opacity = '1';
    playerControlBar.style.pointerEvents = 'auto';

    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
      document.body.classList.add('hide-cursor');
      playerControlBar.style.opacity = '0';
      playerControlBar.style.pointerEvents = 'none';
    }, 3000);
  }

  function startAutoHideControls() {
    window.addEventListener('mousemove', showControls);
    window.addEventListener('touchstart', showControls);
    showControls();
  }

  // ================= SOCKET.IO: ATUALIZAÇÃO EM TEMPO REAL =================
  socket.on('screen-updated', (updatedScreen) => {
    if (!currentScreen || updatedScreen.code.toUpperCase() !== currentScreen.code.toUpperCase()) {
      return;
    }

    console.log('🔄 Tela atualizada em tempo real via Painel!', updatedScreen);
    currentScreen = updatedScreen;
    controlScreenName.textContent = updatedScreen.name;
    controlScreenOrient.textContent = updatedScreen.orientation === 'vertical' ? '9:16 Vertical' : '16:9 Horizontal';
    applyScreenStyles(updatedScreen);

    const prevCount = activePlaylist.length;
    activePlaylist = (updatedScreen.playlist || []).filter(item => item.active !== false);

    if (activePlaylist.length === 0) {
      showEmptyScreen();
    } else {
      hideEmptyScreen();
      // Se estava vazia e recebeu mídias, ou se o item atual foi removido
      if (prevCount === 0 || currentIndex >= activePlaylist.length) {
        currentIndex = 0;
        playCurrentMedia();
      }
    }
  });

  socket.on('screen-deleted', (data) => {
    if (currentScreen && data.code.toUpperCase() === currentScreen.code.toUpperCase()) {
      alert('Esta tela foi removida no painel administrativo.');
      window.location.reload();
    }
  });

  socket.on('screen-init', (screen) => {
    initPlayer(screen);
  });
});
