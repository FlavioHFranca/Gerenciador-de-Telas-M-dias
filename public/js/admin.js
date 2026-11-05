// Painel Administrativo ZappSignage (Rota 1)
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

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
      const res = await fetch('/api/screens');
      screens = await res.json();

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
        selectScreen(target.code);
      }
      
      // Solicita status dos players conectados via socket
      socket.emit('get-active-players');
    } catch (err) {
      console.error('Erro ao carregar telas:', err);
      showToast('Erro ao carregar telas do servidor', 'error');
    }
  }

  function selectScreen(code) {
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

    // Links para a Rota 2 com o código preenchido
    const playerUrl = `/player?code=${encodeURIComponent(screen.code)}`;
    btnDirectPlayerLink.href = playerUrl;
    btnOpenPlayerNav.href = playerUrl;
    btnTestInPlayer.href = playerUrl;

    // Orientação
    setOrientationUI(screen.orientation || 'horizontal');

    // Renderiza playlist
    renderPlaylist(screen.playlist || []);

    // Atualiza mockup
    updateMockupPreview(screen);
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
      const res = await fetch(`/api/screens/${currentScreen.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orientation: activeOrientation,
          fitMode: fitModeSelect.value,
          defaultImageDuration: Number(defaultDurationInput.value) || 10
        })
      });
      if (!res.ok) throw new Error('Falha ao salvar configurações.');
      const updated = await res.json();
      currentScreen = updated;
      showToast('Orientação e configurações salvas com sucesso!');
      updateMockupPreview(updated);
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
      const res = await fetch(`/api/screens/${currentScreen.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (!res.ok) throw new Error('Falha ao atualizar nome.');
      const updated = await res.json();
      currentScreen.name = updated.name;
      loadScreens(currentScreen.code);
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

  function handleFilesUpload(fileList) {
    if (!currentScreen) return showToast('Selecione uma tela antes de enviar mídias', 'error');
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('duration', uploadImageDuration.value || 10);

    // Mostra progresso
    uploadProgressContainer.classList.remove('hidden');
    uploadProgressBar.style.width = '0%';
    uploadProgressPercent.textContent = '0%';
    uploadProgressText.textContent = `Enviando ${files.length} arquivo(s)...`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/screens/${currentScreen.code}/upload`, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        uploadProgressBar.style.width = `${percent}%`;
        uploadProgressPercent.textContent = `${percent}%`;
      }
    };

    xhr.onload = () => {
      uploadProgressContainer.classList.add('hidden');
      fileInput.value = '';

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        currentScreen = response.screen;
        renderPlaylist(currentScreen.playlist);
        updateMockupPreview(currentScreen);
        showToast(response.message || 'Arquivos enviados com sucesso!');
      } else {
        let errMessage = 'Erro no envio de arquivos.';
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error) errMessage = errRes.error;
        } catch (e) {}
        showToast(errMessage, 'error');
      }
    };

    xhr.onerror = () => {
      uploadProgressContainer.classList.add('hidden');
      fileInput.value = '';
      showToast('Falha na conexão durante o envio.', 'error');
    };

    xhr.send(formData);
  }

  // ================= RENDERIZAR PLAYLIST =================
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function renderPlaylist(playlist) {
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

    playlist.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `playlist-item bg-slate-950/80 border ${item.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'} rounded-xl p-3 flex items-center justify-between gap-3`;
      card.dataset.id = item.id;

      const mediaUrl = `/uploads/${item.filename}`;
      const isVideo = item.type === 'video';

      // Thumbnail
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
          <!-- Botão Ativar/Desativar -->
          <button data-id="${item.id}" data-active="${item.active}" class="btn-toggle-active p-2 rounded-lg ${item.active ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-500'} text-xs transition" title="${item.active ? 'Mídia ativa (clique para pausar)' : 'Mídia pausada (clique para ativar)'}">
            <i class="fa-solid ${item.active ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>

          <!-- Botão Visualizar Preview -->
          <button data-url="${mediaUrl}" data-type="${item.type}" data-title="${item.originalName}" class="btn-preview-media p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition" title="Visualizar mídia">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </button>

          <!-- Botão Deletar Mídia -->
          <button data-id="${item.id}" class="btn-delete-media p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-rose-400 text-xs transition" title="Excluir mídia">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      playlistContainer.appendChild(card);
    });

    // Eventos dos botões da lista
    document.querySelectorAll('.media-duration-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const mediaId = e.target.dataset.mediaId;
        const newDuration = Number(e.target.value);
        if (!newDuration || newDuration < 1) return;

        try {
          await fetch(`/api/screens/${currentScreen.code}/media/${mediaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration: newDuration })
          });
          showToast('Duração da imagem atualizada!');
        } catch (err) {
          showToast('Erro ao atualizar duração', 'error');
        }
      });
    });

    document.querySelectorAll('.btn-toggle-active').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mediaId = btn.dataset.id;
        const currentActive = btn.dataset.active === 'true';

        try {
          await fetch(`/api/screens/${currentScreen.code}/media/${mediaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !currentActive })
          });
          showToast(!currentActive ? 'Mídia ativada!' : 'Mídia pausada na exibição.');
        } catch (err) {
          showToast('Erro ao alternar status da mídia', 'error');
        }
      });
    });

    document.querySelectorAll('.btn-delete-media').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mediaId = btn.dataset.id;
        if (!confirm('Deseja realmente remover esta mídia da tela?')) return;

        try {
          const res = await fetch(`/api/screens/${currentScreen.code}/media/${mediaId}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          currentScreen.playlist = data.playlist;
          renderPlaylist(currentScreen.playlist);
          updateMockupPreview(currentScreen);
          showToast('Mídia removida com sucesso!');
        } catch (err) {
          showToast('Erro ao remover mídia', 'error');
        }
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
  function updateMockupPreview(screen) {
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

    // Exibe o primeiro item ativo da playlist como preview
    const firstActive = screen.playlist.find(m => m.active) || screen.playlist[0];
    const mediaUrl = `/uploads/${firstActive.filename}`;
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
    // Se não for localhost ou 127.0.0.1, usa o próprio host de acesso
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
    // IP padrão da máquina detectado na interface Wi-Fi
    return '192.168.40.162';
  }

  function openQrModal() {
    if (!currentScreen) return showToast('Selecione uma tela primeiro', 'error');

    const host = getNetworkHost();
    const port = window.location.port ? `:${window.location.port}` : ':3000';
    const mobileUrl = `http://${host}${port}/player?code=${encodeURIComponent(currentScreen.code)}`;

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

  // ================= MODAL CRIAR NOVA TELA =================
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
    const name = newScreenName.value.trim() || 'Nova Tela Signage';
    const orientation = document.querySelector('input[name="newOrientation"]:checked')?.value || 'horizontal';

    try {
      const res = await fetch('/api/screens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, orientation })
      });
      if (!res.ok) throw new Error('Falha ao criar tela');
      const created = await res.json();
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
    if (!confirm(`Tem certeza que deseja excluir a tela "${currentScreen.name}" (${currentScreen.code}) e todas as suas mídias?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/screens/${currentScreen.code}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir tela');
      showToast('Tela excluída com sucesso.');
      await loadScreens();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Botão de recarregar playlist
  btnRefreshPlaylist.addEventListener('click', async () => {
    if (!currentScreen) return;
    try {
      const res = await fetch(`/api/screens/${currentScreen.code}`);
      const data = await res.json();
      currentScreen = data;
      renderPlaylist(data.playlist);
      updateMockupPreview(data);
      showToast('Playlist sincronizada!');
    } catch (e) {}
  });

  // ================= SOCKET.IO: ATUALIZAÇÕES EM TEMPO REAL =================
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

  socket.on('screen-updated', (updatedScreen) => {
    if (currentScreen && updatedScreen.code.toUpperCase() === currentScreen.code.toUpperCase()) {
      currentScreen = updatedScreen;
      renderPlaylist(updatedScreen.playlist);
      updateMockupPreview(updatedScreen);
    }
  });

  // Inicializa
  loadScreens();
});
