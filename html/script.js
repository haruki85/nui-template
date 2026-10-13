const app = document.getElementById('app');

// JSからLuaへ送る(RegisterNUICallbackが受け取る)
function post(name, data = {}) {
    return fetch(`https://${GetParentResourceName()}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data),
    });
}

// ---- 開く・閉じる ----

function show() {
    app.classList.remove('hidden');
    Base.keepInside();  // 非表示中は大きさがわからないので、表示してから画面内に収め直す
}

function hide() {
    app.classList.add('hidden');
}

// Lua から JS へのメッセージを受け取る（SendNUIMessage）
window.addEventListener('message', (e) => {
    if (e.data.action === 'open') show();
    if (e.data.action === 'close') hide();
});

// UI 側で閉じる操作をしたら、Lua にも伝えてフォーカスを外してもらう
function requestClose() {
    post('close');
}

// ESCキーと画面内のバツボタンを認識させる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !e.isComposing) requestClose();
});

document.getElementById('close').addEventListener('click', requestClose);
