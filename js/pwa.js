// Keep installation available even when the browser offers no native prompt.
(() => {
  const $ = id => document.getElementById(id);
  const button = $('install-button');
  const dialog = $('install-dialog');
  const action = $('install-confirm');
  const status = $('install-status');
  const displayMode = window.matchMedia('(display-mode: standalone)');
  let pendingPrompt = null;
  let installedHere = false;
  let busy = false;
  let opener;
  const installed = () => installedHere || displayMode.matches || navigator.standalone === true;
  function render() {
    button.hidden = installed();
    action.hidden = installed() || !pendingPrompt;
    action.disabled = busy;
    status.textContent = installed()
      ? '밤페이 앱으로 실행 중이야. 다음에도 홈 화면의 밤페이를 눌러 줘!'
      : pendingPrompt ? '준비 완료! 아래 버튼을 누르고 브라우저의 설치 창에서 확인해 줘.'
        : '설치 버튼이 보이지 않으면 아래에서 사용하는 기기에 맞는 방법을 따라 해 줘.';
  }
  button.addEventListener('click', () => {
    opener = document.activeElement;
    render();
    if (!dialog.open) dialog.showModal();
  });
  $('install-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (opener && !opener.hidden) opener.focus(); });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingPrompt = event;
    render();
  });
  action.addEventListener('click', async () => {
    if (!pendingPrompt || busy) return;
    const prompt = pendingPrompt;
    pendingPrompt = null;
    busy = true;
    action.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      render();
      status.textContent = choice.outcome === 'accepted'
        ? '설치 요청을 수락했어. 설치가 끝나면 홈 화면이나 앱 목록의 밤페이로 들어와!'
        : '설치를 취소했어. 언제든 앱 설치를 다시 열어도 돼.';
    } catch {
      render();
      status.textContent = '설치 창을 열지 못했어. 아래 브라우저 메뉴 안내로 추가해 줘.';
    } finally {
      busy = false;
      action.disabled = false;
    }
  });
  window.addEventListener('appinstalled', () => {
    installedHere = true;
    pendingPrompt = null;
    render();
    status.textContent = '설치 완료! 이제 밤페이 아이콘으로 연구소를 열 수 있어.';
  });
  displayMode.addEventListener?.('change', render);
  render();

  // Preserve the existing opt-in release update: no forced reload during experiments.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', async () => {
      try {
        const hadController = Boolean(navigator.serviceWorker.controller);
        const reg = await navigator.serviceWorker.register('./sw.js');
        let refreshing = false;
        const showUpdate = () => { $('pwa-update').hidden = !reg.waiting; };
        showUpdate();
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
          });
        });
        $('pwa-update').addEventListener('click', () => reg.waiting?.postMessage({type:'SKIP_WAITING'}));
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          if (hadController && navigator.serviceWorker.controller) location.reload();
        });
      } catch {
        // The online lab and manual home-screen instructions remain usable.
      }
    });
  }
})();
