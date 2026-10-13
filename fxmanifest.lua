fx_version 'cerulean'
game 'gta5'
lua54 'yes'
use_experimental_fxv2_oal 'yes'

author 'haruki'
description 'NUIテンプレート'
version '0.1.0'

ui_page 'html/index.html'

client_script {
    '@ox_lib/init.lua',
    'client.lua',
}

files {
    'html/index.html',
    'html/base.css',
    'html/style.css',
    'html/base.js',
    'html/script.js',
}

dependency 'ox_lib'