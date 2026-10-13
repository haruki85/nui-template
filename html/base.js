const Base = (() => {
    const app = document.getElementById('app');
    const dragHandle = document.getElementById('drag');
    const themeButton = document.getElementById('theme');

    const STORAGE_PREFIX = 'template:';  // 別リソースにコピーしたらここを変える
    const POS_KEY = STORAGE_PREFIX + 'position';
    const THEME_KEY = STORAGE_PREFIX + 'theme';
    const SIZE_KEY = STORAGE_PREFIX + 'size';
    const MIN_WIDTH = 320;
    const MIN_HEIGHT = 360;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), Math.max(min, max));
    }

    // ---- テーマ ----
    function loadTheme() {
        try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
    }

    function saveTheme(theme) {
        try { localStorage.setItem(THEME_KEY, theme); } catch { /* 保存できなくても動作は続ける */ }
    }

    let theme = loadTheme();

    function applyTheme() {
        const isDark = theme === 'dark';
        app.classList.toggle('dark', isDark);
        app.classList.toggle('light', !isDark);
        const label = isDark ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え';
        themeButton.setAttribute('aria-label', label);
        themeButton.title = label;
    }

    themeButton.addEventListener('click', () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveTheme(theme);
    });

    // ---- 位置 ----
    function clampPosition(left, top) {
        const maxLeft = Math.max(0, window.innerWidth - app.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - app.offsetHeight);
        return {
            left: Math.min(Math.max(0, left), maxLeft),
            top: Math.min(Math.max(0, top), maxTop),
        };
    }

    // CSS の右下基準（right / bottom）をやめて、左上基準の位置で置く
    function moveTo(left, top) {
        const pos = clampPosition(left, top);
        app.style.left = pos.left + 'px';
        app.style.top = pos.top + 'px';
        app.style.right = 'auto';
        app.style.bottom = 'auto';
    }

    function savePosition() {
        if (!app.style.left) return;  // 動かしていなければ保存しない
        try {
            localStorage.setItem(POS_KEY, JSON.stringify({ left: parseFloat(app.style.left), top: parseFloat(app.style.top) }));
        } catch { /* 保存できなくても動作は続ける */ }
    }

    function loadPosition() {
        try {
            const pos = JSON.parse(localStorage.getItem(POS_KEY));
            if (!Number.isFinite(pos?.left) || !Number.isFinite(pos?.top)) return;
            // まだ非表示で大きさがわからないので、画面内に収め直すのは表示後の keepInside() で行う
            app.style.left = pos.left + 'px';
            app.style.top = pos.top + 'px';
            app.style.right = 'auto';
            app.style.bottom = 'auto';
        } catch { /* 読めなければ右下のまま */ }
    }

    // 一度でも動かしていれば、今の位置を画面内に収め直す
    function keepInside() {
        if (app.style.width) app.style.width = Math.min(parseFloat(app.style.width), window.innerWidth) + 'px';
        if (app.style.height) app.style.height = Math.min(parseFloat(app.style.height), window.innerHeight) + 'px';
        if (app.style.left) moveTo(parseFloat(app.style.left), parseFloat(app.style.top));
    }

    // ---- トップをドラッグでウィンドウ移動 ----
    let drag = null; // ドラッグ中の情報 { offsetX, offsetY }（パネル左上からマウスまでのずれ）

    dragHandle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;  // 左ボタンだけ
        e.preventDefault();          // 文字の選択が始まらないようにする
        const rect = app.getBoundingClientRect();
        drag = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        dragHandle.setPointerCapture(e.pointerId);  // つかみの外にマウスが出ても追いかける
        app.classList.add('dragging');
    });

    dragHandle.addEventListener('pointermove', (e) => {
        if (drag) moveTo(e.clientX - drag.offsetX, e.clientY - drag.offsetY);
    });

    function endDrag() {
        if (!drag) return;
        drag = null;
        app.classList.remove('dragging');
        savePosition();
    }
    dragHandle.addEventListener('pointerup', endDrag);
    dragHandle.addEventListener('pointercancel', endDrag);

    // ---- ふちのドラッグで大きさを変える ----
    let sizing = null;

    function saveSize() {
        try {
            localStorage.setItem(SIZE_KEY, JSON.stringify({ width: parseFloat(app.style.width), height: parseFloat(app.style.height) }));
        } catch { /* 保存できなくても動作は続ける */ }
    }

    function loadSize() {
        try {
            const size = JSON.parse(localStorage.getItem(SIZE_KEY));
            if (Number.isFinite(size?.width)) app.style.width = size.width + 'px';
            if (Number.isFinite(size?.height)) app.style.height = size.height + 'px';
        } catch { /* 読めなかったらCSSの既定の大きさ */ }
    }

    function resizeTo(e) {
        if (!sizing) return;
        const { dir, left, top, width, height } = sizing;
        const dx = e.clientX - sizing.startX;
        const dy = e.clientY - sizing.startY;

        if (dir.includes('e')) {
            // 右のふち：左端はそのままで、画面の右端まで広げられる
            app.style.width = clamp(width + dx, MIN_WIDTH, window.innerWidth - left) + 'px';
        }
        if (dir.includes('w')) {
            // 左のふち：右端はそのままで、左端を動かす
            const right = left + width;
            const newWidth = clamp(width - dx, MIN_WIDTH, right);
            app.style.width = newWidth + 'px';
            app.style.left = (right - newWidth) + 'px';
        }
        if (dir.includes('s')) {
            // 下のふち：上端はそのままで、画面の下端まで広げられる
            app.style.height = clamp(height + dy, MIN_HEIGHT, window.innerHeight - top) + 'px';
        }
    }

    function endResize() {
        if (!sizing) return;
        sizing = null;
        app.classList.remove('resizing');
        saveSize();
        savePosition();  // 左のふちでは位置も変わるので一緒に保存する
    }

    for (const handle of document.querySelectorAll('.resize-handle')) {
        handle.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;  // 左ボタンだけ
            e.preventDefault();          // 文字の選択が始まらないようにする
            const rect = app.getBoundingClientRect();
            moveTo(rect.left, rect.top); // 右下基準のままだと計算しにくいので、左上基準に切り替える
            sizing = {
                dir: handle.dataset.dir, startX: e.clientX, startY: e.clientY,
                left: rect.left, top: rect.top, width: rect.width, height: rect.height,
            };
            handle.setPointerCapture(e.pointerId);  // つまみの外にマウスが出ても追いかける
            app.classList.add('resizing');
        });
        handle.addEventListener('pointermove', resizeTo);
        handle.addEventListener('pointerup', endResize);
        handle.addEventListener('pointercancel', endResize);
    }

    // ---- 初期化 ----
    applyTheme();
    loadPosition();
    loadSize();

    // ゲームの解像度などが変わっても、画面からはみ出さないようにする
    window.addEventListener('resize', keepInside);

    return { keepInside };
})();
