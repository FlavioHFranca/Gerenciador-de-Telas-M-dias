// Painel Administrativo Display Manager (Rota 1)
document.addEventListener('DOMContentLoaded', async () => {
  let socket = null;
  try {
    if (typeof io !== 'undefined' && !window.DisplayStorage?.isGitHubPages) {
      socket = io({ credentials: false, autoConnect: true });
    }
  } catch (e) {
    console.warn('Socket.io não conectado; utilizando modo de armazenamento cliente/GitHub Pages.');
  }

  // Elementos do DOM
  const screenSelect = document.getElementById('screenSelect');
  const btnNewScreen = document.getElementById('btnNewScreen');
  const currentScreenCode = document.getElementById('currentScreenCode');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const playerStatusDot = document.getElementById('playerStatusDot');
  const playerStatusText = document.getElementById('playerStatusText');
  const btnDirectPlayerLink = document.getElementById('btnDirectPlayerLink');
  const btnOpenPlayerNav = document.getElementById('btnOpenPlayerNav');
  const screenNameInput = document.getElementById('screenNameInput');
  const btnSaveScreenName = document.getElementById('btnSaveScreenName');
  const btnDeleteScreen = document.getElementById('btnDeleteScreen');

  const btnOrientHorizontal = document.getElementById('btnOrientHorizontal');
  const btnOrientVertical = document.getElementById('btnOrientVertical');
  const fitModeSelect = document.getElementById('fitModeSelect');
  const defaultDurationInput = document.getElementById('defaultDurationInput');
  const btnSaveConfig = document.getElementById('btnSaveConfig');

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadImageDuration = document.getElementById('uploadImageDuration');
  const uploadProgressContainer = document.getElementById('uploadProgressContainer');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressPercent = document.getElementById('uploadProgressPercent');
  const uploadProgressText = document.getElementById('uploadProgressText');

  const playlistContainer = document.getElementById('playlistContainer');
  const playlistSummary = document.getElementById('playlistSummary');
  const btnRefreshPlaylist = document.getElementById('btnRefreshPlaylist');

  const mockupFrame = document.getElementById('mockupFrame');
  const mockupContent = document.getElementById('mockupContent');
  const mockupScreenLabel = document.getElementById('mockupScreenLabel');
  const previewAspectBadge = document.getElementById('previewAspectBadge');
  const btnTestInPlayer = document.getElementById('btnTestInPlayer');

  // Modais
  const previewModal = document.getElementById('previewModal');
  const previewModalTitle = document.getElementById('previewModalTitle');
  const previewModalBody = document.getElementById('previewModalBody');
  const btnClosePreviewModal = document.getElementById('btnClosePreviewModal');

  const newScreenModal = document.getElementById('newScreenModal');
  const btnCloseNewScreenModal = document.getElementById('btnCloseNewScreenModal');
  const btnCancelNewScreen = document.getElementById('btnCancelNewScreen');
  const btnConfirmNewScreen = document.getElementById('btnConfirmNewScreen');
  const newScreenName = document.getElementById('newScreenName');

  // Modal QR Code Celular
  const btnOpenQrModal = document.getElementById('btnOpenQrModal');
  const qrModal = document.getElementById('qrModal');
  const btnCloseQrModal = document.getElementById('btnCloseQrModal');
  const qrcodeContainer = document.getElementById('qrcode');
  const mobileUrlInput = document.getElementById('mobileUrlInput');
  const btnCopyMobileUrl = document.getElementById('btnCopyMobileUrl');
  let qrcodeInstance = null;

  // Estado Local
  let screens = [];
  let currentScreen = null;
  let activeOrientation = 'horizontal';

  // Cache de ObjectURLs locais para mídias
  const objectUrlCache = new Map();

  async function getMediaSourceUrl(item) {
    if (item.dataUrl) return item.dataUrl;
    if (item.blobUrl) return item.blobUrl;
    if (objectUrlCache.has(item.id)) return objectUrlCache.get(item.id);

    // Se estiver no IndexedDB
    if (window.DisplayStorage) {
      const blob = await window.DisplayStorage.getMediaBlob(item.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrlCache.set(item.id, url);
        return url;
      }
    }

    // Servidor local uploads
    return `./uploads/${item.filename}`;
  }

  // ================= NOTIFICAÇÕES TOAST =================
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.textContent = message;
    if (type === 'error') {
      toastIcon.className = 'fa-solid fa-circle-exclamation text-rose-400';
    } else {
      toastIcon.className = 'fa-solid fa-circle-check text-emerald-400';
    }

    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('translate-y-24', 'opacity-0');
    }, 3200);
  }

  // ================= CARREGAMENTO DE TELAS =================
  async function loadScreens(selectCode = null) {
    try {
      screens = await window.DisplayStorage.getScreens();

      screenSelect.innerHTML = '';
      screens.forEach(screen => {
        const option = document.createElement('option');
        option.value = screen.code;
        option.textContent = `${screen.name} (${screen.code})`;
        screenSelect.appendChild(option);
      });

      if (screens.length > 0) {
        let target = screens[0];
        if (selectCode) {
          const found = screens.find(s => s.code.toUpperCase() === selectCode.toUpperCase());
          if (found) target = found;
        } else if (currentScreen) {
          const found = screens.find(s => s.code.toUpperCase() === currentScreen.code.toUpperCase());
          if (found) target = found;
        }
        await selectScreen(target.code);
      }
      
      if (socket && socket.connected) {
        socket.emit('get-active-players');
      } else {
        // Modo Client-Side / GitHub Pages
        playerStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50';
        playerStatusText.innerHTML = `<span class="text-emerald-400 font-semibold">ATIVO</span> (Modo Local / Web)`;
      }
    } catch (err) {
      console.error('Erro ao carregar telas:', err);
      showToast('Erro ao carregar telas', 'error');
    }
  }

  async function selectScreen(code) {
    const screen = screens.find(s => s.code.toUpperCase() === code.toUpperCase());
    if (!screen) return;
    currentScreen = screen;
    screenSelect.value = screen.code;

    // Atualiza interface
    currentScreenCode.textContent = screen.code;
    screenNameInput.value = screen.name;
    defaultDurationInput.value = screen.defaultImageDuration || 10;
    uploadImageDuration.value = screen.defaultImageDuration || 10;
    fitModeSelect.value = screen.fitMode || 'contain';

    // Links relativos para a Rota 2 com o código preenchido
    const playerUrl = `./player.html?code=${encodeURIComponent(screen.code)}`;
    btnDirectPlayerLink.href = playerUrl;
    btnOpenPlayerNav.href = playerUrl;
    btnTestInPlayer.href = playerUrl;

    // Orientação
    setOrientationUI(screen.orientation || 'horizontal');

    // Renderiza playlist
    await renderPlaylist(screen.playlist || []);

    // Atualiza mockup
    await updateMockupPreview(screen);
  }

  function setOrientationUI(orient) {
    activeOrientation = orient;
    if (orient === 'vertical') {
      btnOrientVertical.classList.add('active');
      btnOrientHorizontal.classList.remove('active');
      mockupFrame.className = 'mockup-vertical bg-slate-950 border-4 border-slate-800 rounded-xl shadow-2xl relative overflow-hidden flex items-center justify-center transition-all duration-300';
      mockupScreenLabel.textContent = '1080 × 1920 (Vertical 9:16)';
      previewAspectBadge.textContent = '9:16 Vertical';
    } else {
      btnOrientHorizontal.classList.add('active');
      btnOrientVertical.classList.remove('active');
      mockupFrame.className = 'mockup-horizontal bg-slate-950 border-4 border-slate-800 rounded-xl shadow-2xl relative overflow-hidden flex items-center justify-center transition-all duration-300';
      mockupScreenLabel.textContent = '1920 × 1080 (Horizontal 16:9)';
      previewAspectBadge.textContent = '16:9 Horizontal';
    }
  }

  btnOrientHorizontal.addEventListener('click', () => setOrientationUI('horizontal'));
  btnOrientVertical.addEventListener('click', () => setOrientationUI('vertical'));

  // Salvar orientação e configurações da tela
  btnSaveConfig.addEventListener('click', async () => {
    if (!currentScreen) return;
    try {
      currentScreen.orientation = activeOrientation;
      currentScreen.fitMode = fitModeSelect.value;
      currentScreen.defaultImageDuration = Number(defaultDurationInput.value) || 10;

      await window.DisplayStorage.saveScreen(currentScreen);
      showToast('Orientação e configurações salvas com sucesso!');
      await updateMockupPreview(currentScreen);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Salvar Nome da Tela
  btnSaveScreenName.addEventListener('click', async () => {
    if (!currentScreen) return;
    const newName = screenNameInput.value.trim();
    if (!newName) return showToast('Nome inválido', 'error');

    try {
      currentScreen.name = newName;
      await window.DisplayStorage.saveScreen(currentScreen);
      await loadScreens(currentScreen.code);
      showToast('Nome da tela atualizado!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Copiar Código da Tela
  btnCopyCode.addEventListener('click', () => {
    if (!currentScreen) return;
    navigator.clipboard.writeText(currentScreen.code);
    showToast(`Código ${currentScreen.code} copiado!`);
  });

  // Selecionar tela no dropdown
  screenSelect.addEventListener('change', (e) => {
    selectScreen(e.target.value);
  });

  // ================= UPLOAD DE MÍDIAS =================
  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('border-indigo-500', 'bg-indigo-950/20');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-indigo-500', 'bg-indigo-950/20');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  });

  async function handleFilesUpload(fileList) {
    if (!currentScreen) return showToast('Selecione uma tela antes de enviar mídias', 'error');
    const files = Array.from(fileList);
    if (files.length === 0) return;

    uploadProgressContainer.classList.remove('hidden');
    uploadProgressBar.style.width = '0%';
    uploadProgressPercent.textContent = '0%';
    uploadProgressText.textContent = `Processando ${files.length} arquivo(s)...`;

    const serverOk = await window.DisplayStorage.checkServerAvailable();

    if (serverOk) {
      // Modo Servidor (Node.js / Docker)
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('duration', uploadImageDuration.value || 10);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/screens/${currentScreen.code}/upload`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          uploadProgressBar.style.width = `${percent}%`;
          uploadProgressPercent.textContent = `${percent}%`;
        }
      };

      xhr.onload = async () => {
        uploadProgressContainer.classList.add('hidden');
        fileInput.value = '';

        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          currentScreen = response.screen;
          await renderPlaylist(currentScreen.playlist);
          await updateMockupPreview(currentScreen);
          showToast(response.message || 'Arquivos enviados com sucesso!');
        } else {
          showToast('Erro no envio de arquivos.', 'error');
        }
      };

      xhr.onerror = () => {
        uploadProgressContainer.classList.add('hidden');
        fileInput.value = '';
        showToast('Falha na conexão durante o envio.', 'error');
      };

      xhr.send(formData);

    } else {
      // Modo Client-Side / GitHub Pages (IndexedDB)
      try {
        const customDuration = Number(uploadImageDuration.value) || currentScreen.defaultImageDuration || 10;
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isVideo = file.type.startsWith('video/') || 
            ['.mp4', '.webm', '.ogg', '.mov'].some(ext => file.name.toLowerCase().endsWith(ext));

          const mediaId = 'media_' + Date.now() + '_' + Math.round(Math.random() * 10000);

          // Salva o Blob no IndexedDB
          await window.DisplayStorage.saveMediaBlob(mediaId, file);

          const mediaItem = {
            id: mediaId,
            filename: file.name,
            originalName: file.name,
            type: isVideo ? 'video' : 'image',
            mimeType: file.type,
            size: file.size,
            duration: isVideo ? 0 : customDuration,
            order: currentScreen.playlist.length,
            active: true,
            createdAt: new Date().toISOString()
          };

          currentScreen.playlist.push(mediaItem);

          const percent = Math.round(((i + 1) / files.length) * 100);
          uploadProgressBar.style.width = `${percent}%`;
          uploadProgressPercent.textContent = `${percent}%`;
        }

        await window.DisplayStorage.saveScreen(currentScreen);
        uploadProgressContainer.classList.add('hidden');
        fileInput.value = '';

        await renderPlaylist(currentScreen.playlist);
        await updateMockupPreview(currentScreen);
        showToast(`${files.length} arquivo(s) salvos localmente com sucesso!`);
      } catch (err) {
        uploadProgressContainer.classList.add('hidden');
        fileInput.value = '';
        showToast('Erro ao salvar arquivos: ' + err.message, 'error');
      }
    }
  }

  // ================= RENDERIZAR PLAYLIST =================
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async function renderPlaylist(playlist) {
    playlistSummary.textContent = `${playlist.length} mídia(s) cadastrada(s)`;

    if (!playlist || playlist.length === 0) {
      playlistContainer.innerHTML = `
        <div class="text-center py-12 text-slate-500">
          <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-40"></i>
          <p class="text-sm">Nenhuma mídia adicionada ainda.</p>
          <p class="text-xs text-slate-600 mt-1">Faça upload de vídeos ou fotos acima para começar.</p>
        </div>
      `;
      return;
    }

    playlistContainer.innerHTML = '';

    for (let index = 0; index < playlist.length; index++) {
      const item = playlist[index];
      const card = document.createElement('div');
      card.className = `playlist-item bg-slate-950/80 border ${item.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'} rounded-xl p-3 flex items-center justify-between gap-3`;
      card.dataset.id = item.id;

      const mediaUrl = await getMediaSourceUrl(item);
      const isVideo = item.type === 'video';

      let thumbHtml = '';
      if (isVideo) {
        thumbHtml = `
          <div class="relative w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
            <video src="${mediaUrl}#t=0.5" preload="metadata" class="w-full h-full object-cover"></video>
            <span class="absolute inset-0 bg-black/30 flex items-center justify-center">
              <i class="fa-solid fa-play text-xs text-white"></i>
            </span>
          </div>
        `;
      } else {
        thumbHtml = `
          <div class="relative w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
            <img src="${mediaUrl}" alt="${item.originalName}" class="w-full h-full object-cover">
          </div>
        `;
      }

      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="text-xs font-mono text-slate-500 w-4 text-center">${index + 1}</span>
          ${thumbHtml}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-white truncate max-w-xs" title="${item.originalName}">${item.originalName}</span>
              <span class="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded ${isVideo ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
                ${isVideo ? 'Vídeo' : 'Imagem'}
              </span>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
              <span>${formatBytes(item.size)}</span>
              ${isVideo 
                ? '<span class="text-indigo-400 flex items-center gap-1"><i class="fa-solid fa-circle-play text-[9px]"></i> Duração total do vídeo</span>' 
                : `<div class="flex items-center gap-1">
                     <i class="fa-regular fa-clock text-[10px]"></i>
                     <span>Duração:</span>
                     <input type="number" min="2" max="180" value="${item.duration || 10}" 
                       data-media-id="${item.id}"
                       class="media-duration-input w-12 bg-slate-800 border border-slate-700 rounded px-1 text-center text-[10px] text-white">
                     <span>s</span>
                   </div>`
              }
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button data-id="${item.id}" data-active="${item.active}" class="btn-toggle-active p-2 rounded-lg ${item.active ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-500'} text-xs transition" title="${item.active ? 'Mídia ativa' : 'Mídia pausada'}">
            <i class="fa-solid ${item.active ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>

          <button data-url="${mediaUrl}" data-type="${item.type}" data-title="${item.originalName}" class="btn-preview-media p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition" title="Visualizar mídia">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </button>

          <button data-id="${item.id}" class="btn-delete-media p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-rose-400 text-xs transition" title="Excluir mídia">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      playlistContainer.appendChild(card);
    }

    // Configuração de eventos nos botões da lista
    document.querySelectorAll('.media-duration-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const mediaId = e.target.dataset.mediaId;
        const newDuration = Number(e.target.value);
        if (!newDuration || newDuration < 1) return;

        const found = currentScreen.playlist.find(m => m.id === mediaId);
        if (found) {
          found.duration = newDuration;
          await window.DisplayStorage.saveScreen(currentScreen);
          showToast('Duração da imagem atualizada!');
        }
      });
    });

    document.querySelectorAll('.btn-toggle-active').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mediaId = btn.dataset.id;
        const currentActive = btn.dataset.active === 'true';

        const found = currentScreen.playlist.find(m => m.id === mediaId);
        if (found) {
          found.active = !currentActive;
          await window.DisplayStorage.saveScreen(currentScreen);
          await renderPlaylist(currentScreen.playlist);
          await updateMockupPreview(currentScreen);
          showToast(!currentActive ? 'Mídia ativada!' : 'Mídia pausada.');
        }
      });
    });

    document.querySelectorAll('.btn-delete-media').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mediaId = btn.dataset.id;
        if (!confirm('Deseja realmente remover esta mídia da tela?')) return;

        currentScreen.playlist = currentScreen.playlist.filter(m => m.id !== mediaId);
        await window.DisplayStorage.saveScreen(currentScreen);
        await renderPlaylist(currentScreen.playlist);
        await updateMockupPreview(currentScreen);
        showToast('Mídia removida com sucesso!');
      });
    });

    document.querySelectorAll('.btn-preview-media').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        const type = btn.dataset.type;
        const title = btn.dataset.title;
        openPreviewModal(url, type, title);
      });
    });
  }

  // ================= ATUALIZAR MOCKUP PREVIEW =================
  async function updateMockupPreview(screen) {
    if (!screen || !screen.playlist || screen.playlist.length === 0) {
      mockupContent.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-4">
          <i class="fa-solid fa-circle-play text-3xl text-indigo-500/40 mb-2"></i>
          <span class="text-xs font-semibold text-slate-400">Prévia da Tela</span>
          <span class="text-[10px] text-slate-600 font-mono mt-1">${screen?.orientation === 'vertical' ? '1080 × 1920' : '1920 × 1080'}</span>
        </div>
      `;
      return;
    }

    const firstActive = screen.playlist.find(m => m.active) || screen.playlist[0];
    const mediaUrl = await getMediaSourceUrl(firstActive);
    const fitClass = screen.fitMode === 'cover' ? 'object-cover' : 'object-contain';

    if (firstActive.type === 'video') {
      mockupContent.innerHTML = `
        <div class="w-full h-full relative bg-black flex items-center justify-center">
          <video src="${mediaUrl}" autoplay muted loop playsinline class="w-full h-full ${fitClass}"></video>
          <div class="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-mono flex items-center gap-1">
            <i class="fa-solid fa-film text-indigo-400"></i> ${firstActive.originalName}
          </div>
        </div>
      `;
    } else {
      mockupContent.innerHTML = `
        <div class="w-full h-full relative bg-black flex items-center justify-center">
          <img src="${mediaUrl}" alt="${firstActive.originalName}" class="w-full h-full ${fitClass}">
          <div class="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-mono flex items-center gap-1">
            <i class="fa-regular fa-image text-emerald-400"></i> ${firstActive.originalName}
          </div>
        </div>
      `;
    }
  }

  // ================= MODAL DE PREVIEW =================
  function openPreviewModal(url, type, title) {
    previewModalTitle.textContent = title;
    if (type === 'video') {
      previewModalBody.innerHTML = `
        <video src="${url}" controls autoplay class="max-h-[60vh] max-w-full rounded-lg shadow-lg"></video>
      `;
    } else {
      previewModalBody.innerHTML = `
        <img src="${url}" alt="${title}" class="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg">
      `;
    }
    previewModal.classList.remove('hidden');
    previewModal.classList.add('flex');
  }

  function closePreviewModal() {
    previewModal.classList.add('hidden');
    previewModal.classList.remove('flex');
    previewModalBody.innerHTML = '';
  }

  btnClosePreviewModal.addEventListener('click', closePreviewModal);
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closePreviewModal();
  });

  // ================= MODAL QR CODE CELULAR =================
  function getNetworkHost() {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
    return '192.168.40.162';
  }

  function openQrModal() {
    if (!currentScreen) return showToast('Selecione uma tela primeiro', 'error');

    let mobileUrl = '';
    if (window.location.protocol === 'file:' || window.location.hostname.includes('github.io')) {
      // URL do GitHub Pages ou local
      const currentUrl = new URL(window.location.href);
      currentUrl.pathname = currentUrl.pathname.replace(/\/index\.html$|\/$/, '') + '/player.html';
      currentUrl.searchParams.set('code', currentScreen.code);
      mobileUrl = currentUrl.toString();
    } else {
      const host = getNetworkHost();
      const port = window.location.port ? `:${window.location.port}` : ':3000';
      mobileUrl = `http://${host}${port}/player.html?code=${encodeURIComponent(currentScreen.code)}`;
    }

    mobileUrlInput.value = mobileUrl;
    qrcodeContainer.innerHTML = '';

    if (window.QRCode) {
      qrcodeInstance = new QRCode(qrcodeContainer, {
        text: mobileUrl,
        width: 190,
        height: 190,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    qrModal.classList.remove('hidden');
    qrModal.classList.add('flex');
  }

  function closeQrModal() {
    qrModal.classList.add('hidden');
    qrModal.classList.remove('flex');
  }

  if (btnOpenQrModal) btnOpenQrModal.addEventListener('click', openQrModal);
  if (btnCloseQrModal) btnCloseQrModal.addEventListener('click', closeQrModal);
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) closeQrModal();
    });
  }

  if (btnCopyMobileUrl) {
    btnCopyMobileUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(mobileUrlInput.value);
      showToast('Link do celular copiado!');
    });
  }

  // ================= CRIAR NOVA TELA =================
  btnNewScreen.addEventListener('click', () => {
    newScreenName.value = '';
    newScreenModal.classList.remove('hidden');
    newScreenModal.classList.add('flex');
  });

  function closeNewScreenModal() {
    newScreenModal.classList.add('hidden');
    newScreenModal.classList.remove('flex');
  }

  btnCloseNewScreenModal.addEventListener('click', closeNewScreenModal);
  btnCancelNewScreen.addEventListener('click', closeNewScreenModal);

  btnConfirmNewScreen.addEventListener('click', async () => {
    const name = newScreenName.value.trim() || 'Nova Tela';
    const orientation = document.querySelector('input[name="newOrientation"]:checked')?.value || 'horizontal';

    try {
      const created = await window.DisplayStorage.createScreen({ name, orientation });
      closeNewScreenModal();
      showToast(`Tela "${created.name}" criada com código ${created.code}!`);
      await loadScreens(created.code);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ================= DELETAR TELA =================
  btnDeleteScreen.addEventListener('click', async () => {
    if (!currentScreen) return;
    if (screens.length <= 1) {
      return showToast('Você precisa manter pelo menos 1 tela cadastrada.', 'error');
    }
    if (!confirm(`Tem certeza que deseja excluir a tela "${currentScreen.name}" (${currentScreen.code})?`)) {
      return;
    }

    try {
      await window.DisplayStorage.deleteScreen(currentScreen.code);
      showToast('Tela excluída com sucesso.');
      await loadScreens();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnRefreshPlaylist.addEventListener('click', async () => {
    if (!currentScreen) return;
    try {
      const data = await window.DisplayStorage.getScreen(currentScreen.code);
      currentScreen = data;
      await renderPlaylist(data.playlist);
      await updateMockupPreview(data);
      showToast('Playlist sincronizada!');
    } catch (e) {}
  });

  // ================= SINCRONIZAÇÃO EM TEMPO REAL =================
  // 1. BroadcastChannel (mesmo navegador / abas diferentes)
  if (window.DisplayStorage.localBroadcast) {
    window.DisplayStorage.localBroadcast.onmessage = async (e) => {
      const msg = e.data;
      if (msg.type === 'screen-updated' && currentScreen && msg.screen.code === currentScreen.code) {
        currentScreen = msg.screen;
        await renderPlaylist(msg.screen.playlist);
        await updateMockupPreview(msg.screen);
      }
    };
  }

  // 2. Socket.io (quando conectado ao servidor)
  if (socket) {
    socket.on('player-status-changed', (data) => {
      if (currentScreen && data.code.toUpperCase() === currentScreen.code.toUpperCase()) {
        if (data.status === 'online' && data.activeCount > 0) {
          playerStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50';
          playerStatusText.innerHTML = `<span class="text-emerald-400 font-semibold">ONLINE</span> (${data.activeCount} player conectado)`;
        } else {
          playerStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-slate-600';
          playerStatusText.innerHTML = `<span class="text-slate-400">Aguardando Player...</span>`;
        }
      }
    });

    socket.on('active-players-status', (statusMap) => {
      if (currentScreen) {
        const count = statusMap[currentScreen.code] || 0;
        if (count > 0) {
          playerStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50';
          playerStatusText.innerHTML = `<span class="text-emerald-400 font-semibold">ONLINE</span> (${count} player conectado)`;
        } else {
          playerStatusDot.className = 'w-3.5 h-3.5 rounded-full bg-slate-600';
          playerStatusText.innerHTML = `<span class="text-slate-400">Aguardando Player...</span>`;
        }
      }
    });

    socket.on('screen-updated', async (updatedScreen) => {
      if (currentScreen && updatedScreen.code.toUpperCase() === currentScreen.code.toUpperCase()) {
        currentScreen = updatedScreen;
        await renderPlaylist(updatedScreen.playlist);
        await updateMockupPreview(updatedScreen);
      }
    });
  }

  // Inicializa o painel
  await loadScreens();
});
