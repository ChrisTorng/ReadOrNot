// ==UserScript==
// @name         ReadOrNot 要看不看?
// @namespace    https://github.com/ChrisTorng/ReadOrNot
// @version      2025_03_17_0.6
// @description  暫停於充斥低價值文章之網站連結上時，使用預設關鍵字快速分析目標網頁，另提供可選擇 AI 評估指標。
// @author       ChrisTorng
// @homepage     https://github.com/ChrisTorng/ReadOrNot/
// @downloadURL  https://github.com/ChrisTorng/ReadOrNot/raw/refs/heads/main/ReadOrNot.user.js
// @updateURL    https://github.com/ChrisTorng/ReadOrNot/raw/refs/heads/main/ReadOrNot.user.js
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceText
// @resource     REMOTE_CSS https://github.com/ChrisTorng/ReadOrNot/raw/refs/heads/main/ReadOrNot.css
// @resource     LOCAL_CSS http://localhost:3000/ReadOrNot.css
// @require      https://github.com/ChrisTorng/ReadOrNot/raw/refs/heads/main/ReadOrNotPreview.js
// @require      http://localhost:3000/ReadOrNotPreview.js
// @connect      *
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    const isLocalDevelopment = GM_info.script.options.override.use_matches.includes('localhost');
    console.log('isLocalDevelopment', isLocalDevelopment);

    // Ollama API 設定
    const OLLAMA_API_URL = 'http://localhost:11434/api/generate'; // 本機 Ollama 服務位址
    const DEFAULT_MODEL = ''; // 預設模型名稱，作為建議值
    const DEFAULT_HOVER_DELAY = 0.5; // 預設滑鼠移過觸發延遲（秒）
    const DEFAULT_ANALYSIS_TIMEOUT = 10; // 預設 AI 分析逾時時間（秒）
    
    // 預覽的網站主機列表
    const PREVIEWED_HOSTS = [
        "cna.com.tw",
        "chinapost.com.tw",
        "ctee.com.tw",
        "ettoday.net",
        "ftv.com.tw",
        "libertytimes.com.tw",
        "newtalk.tw",
        "nownews.com",
        "peoplenews.tw",
        "storm.mg",
        "taipeitimes.com",
        "taiwannews.com.tw",
        "taiwanplus.com",
        "udn.com",
        "upmedia.mg",
        "thenewslens.com",
        "yahoo.com",
    ];

    // 設定樣式
    const style = document.createElement('style');
    try {
        // 判斷環境並載入對應的 CSS 資源
        let cssContent;
        try {
            cssContent = GM_getResourceText(isLocalDevelopment ? 'LOCAL_CSS' : 'REMOTE_CSS');
        } catch (error) {
            console.error('ReadOrNot: CSS 載入失敗:', error);
        }
        style.textContent = cssContent;
    } catch (e) {
        console.error('ReadOrNot: CSS 載入過程發生錯誤:', e);
    }
    document.head.appendChild(style);

    // 初始化預覽功能
    if (typeof initializeReadOrNotPreview === 'function') {
        initializeReadOrNotPreview(
            isLocalDevelopment,
            PREVIEWED_HOSTS,
            OLLAMA_API_URL,
            DEFAULT_MODEL,
            DEFAULT_HOVER_DELAY,
            DEFAULT_ANALYSIS_TIMEOUT
        );
        console.log('ReadOrNot 腳本已啟動 (使用 Ollama API)');
    } else {
        console.error('ReadOrNot: 無法初始化預覽功能，預覽腳本可能未正確載入');
    }
})();