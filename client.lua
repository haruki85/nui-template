local isOpen = false
local KEYBIND_NAME = 'example'
local KEEP_ENABLED_CONTROLS = { 249 }

local function disableControlsWhileOpen()
    CreateThread(function()
        while isOpen do
            DisableAllControlActions(0)
            for i = 1, #KEEP_ENABLED_CONTROLS do
                EnableControlAction(0, KEEP_ENABLED_CONTROLS[i], true)
            end
            Wait(0)
        end
    end)
end

local function setOpen(open)
    if isOpen == open then return end
    isOpen = open
    SetNuiFocus(open, open)
    SetNuiFocusKeepInput(open)  -- 開いている間もトグルキーが届くように、入力をゲーム側にも通す
    SendNUIMessage({ action = open and 'open' or 'close' })
    if open then disableControlsWhileOpen() end
end

-- キーバインド用: 開いていれば閉じる、閉じていれば開く
local function toggle()
    -- 他リソースの NUI（インベントリなど）がフォーカス中は開かない。自分のパネルを閉じる操作は通す
    if not isOpen and IsNuiFocused() then return end
    setOpen(not isOpen)
end

RegisterCommand('example', function()
    setOpen(not isOpen)
end, false)

-- バツボタンやESCでNUIを閉じたとき
RegisterNUICallback('close', function(_, cb)
    setOpen(false)
    cb('ok')
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= cache.resource then return end
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
end)

lib.addKeybind({
    name = KEYBIND_NAME,
    description = 'パネルを開く / 閉じる',
    -- defaultKey = 'F10',
    onPressed = toggle,
})