// ==UserScript==
// @name         ReadOrNot - AI 連結預覽工具
// @namespace    https://github.com/ChrisTorng/ReadOrNot
// @version      0.1
// @description  懸停於連結上時，使用 AI 預覽文章內容並提供評估指標
// @author       ChrisTorng
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // 設定樣式
    const style = document.createElement('style');
    style.textContent = `
        .readornot-preview {
            position: fixed;
            width: 400px;
            max-height: 300px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 10000;
            overflow-y: auto;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .readornot-preview h3 {
            margin-top: 0;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            color: #333;
        }
        
        .readornot-preview p {
            margin: 8px 0;
        }
        
        .readornot-preview .summary {
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .readornot-preview .metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        
        .readornot-preview .metric {
            display: flex;
            align-items: center;
        }
        
        .readornot-preview .metric-name {
            font-weight: bold;
            margin-right: 5px;
            min-width: 80px;
        }
        
        .readornot-preview .stars {
            color: #f39c12;
        }
        
        .readornot-preview .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
            color: #666;
        }
        
        .readornot-preview .footer {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 5px;
            text-align: right;
        }
    `;
    document.head.appendChild(style);

    // 預覽視窗元素
    let previewElement = null;
    let hoverTimer = null;
    let currentLink = null;
    
    // 監聽所有連結的滑鼠事件
    function setupLinkListeners() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('mouseenter', handleLinkHover);
            link.addEventListener('mouseleave', handleLinkLeave);
        });
    }

    // 處理連結懸停事件
    function handleLinkHover(event) {
        const link = event.target.closest('a');
        if (!link || !link.href || link.href.startsWith('javascript:')) return;
        
        currentLink = link;
        
        // 延遲載入以避免快速滑過連結時觸發
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            showPreview(link);
        }, 500); // 延遲500毫秒
    }

    // 處理連結離開事件
    function handleLinkLeave() {
        clearTimeout(hoverTimer);
        hidePreview();
        currentLink = null;
    }

    // 顯示預覽視窗
    function showPreview(link) {
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'readornot-preview';
            document.body.appendChild(previewElement);
        }

        // 計算位置 (顯示在滑鼠下方)
        const linkRect = link.getBoundingClientRect();
        previewElement.style.left = `${linkRect.left}px`;
        previewElement.style.top = `${linkRect.bottom + 10}px`;
        
        // 顯示載入中訊息
        previewElement.innerHTML = `
            <div class="loading">
                <p>正在載入預覽...</p>
            </div>
        `;
        previewElement.style.display = 'block';
        
        // 取得連結內容
        fetchLinkContent(link.href);
    }

    // 隱藏預覽視窗
    function hidePreview() {
        if (previewElement) {
            previewElement.style.display = 'none';
        }
    }

    // 從連結抓取內容
    function fetchLinkContent(url) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                if (response.status === 200) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    
                    // 提取頁面內容
                    const title = doc.querySelector('title')?.textContent || '無標題';
                    const content = extractMainContent(doc);
                    
                    // 模擬 AI 分析結果
                    const analysis = analyzeContent(content, title, url);
                    
                    // 更新預覽視窗
                    updatePreview(title, analysis);
                } else {
                    previewElement.innerHTML = `
                        <h3>無法載入預覽</h3>
                        <p>無法取得頁面內容 (${response.status})</p>
                    `;
                }
            },
            onerror: function() {
                previewElement.innerHTML = `
                    <h3>無法載入預覽</h3>
                    <p>請求失敗，請稍後再試</p>
                `;
            }
        });
    }

    // 從 HTML 中提取主要內容
    function extractMainContent(doc) {
        // 移除不需要的元素
        ['script', 'style', 'iframe', 'nav', 'footer', 'header', 'aside'].forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => el.remove());
        });
        
        // 嘗試找出主要內容區域
        let mainContent = '';
        const possibleContentElements = [
            doc.querySelector('article'),
            doc.querySelector('main'),
            doc.querySelector('.content'),
            doc.querySelector('.article'),
            doc.querySelector('.post'),
            doc.querySelector('#content'),
            doc.querySelector('#main')
        ];
        
        const contentElement = possibleContentElements.find(el => el) || doc.body;
        
        // 從 contentElement 提取純文字
        mainContent = contentElement.textContent
            .replace(/\s+/g, ' ')
            .trim();
        
        return mainContent.substring(0, 5000); // 限制文字長度
    }

    // 分析內容 (模擬 AI 處理)
    function analyzeContent(content, title, url) {
        // 簡單的關鍵字判斷來模擬 AI 分析
        const wordCount = content.split(' ').length;
        const hasEmotionalWords = /驚人|震驚|爆|超扯|慘|太扯|天才|最強|怒|氣炸|崩潰|超美|吃不下|可怕/.test(content + title);
        const isCelebrityRelated = /藝人|明星|網紅|歌手|演員|主持人|網友|粉絲|直播|開箱/.test(content);
        const hasSourceCitation = /研究|專家|調查|報告|表示|指出|分析|數據|證實/.test(content);
        const hasUsefulInfo = /教學|如何|方法|步驟|技巧|秘訣|建議|解決|提升|改善|注意|預防/.test(content);
        const isNewsOrGossip = /今日|昨天|報導|消息|傳出|爆料|傳言|澄清|回應/.test(content);
        
        // 隨機生成星星評分 (更真實的實現會使用 NLP 或 AI 模型)
        const informationDensity = hasUsefulInfo ? randomStar(2, 4) : (wordCount > 500 ? randomStar(2, 3) : randomStar(0, 2));
        const emotionalImpact = hasEmotionalWords ? randomStar(3, 5) : randomStar(1, 3);
        const perspective = randomStar(1, 5);
        const originality = isCelebrityRelated ? randomStar(0, 2) : randomStar(1, 4);
        const credibility = hasSourceCitation ? randomStar(2, 5) : randomStar(0, 3);
        const usefulness = hasUsefulInfo ? randomStar(3, 5) : randomStar(0, 2);
        
        // 產生摘要
        let summary = '';
        if (isNewsOrGossip && isCelebrityRelated) {
            summary = `這篇文章主要報導了與名人/網紅相關的消息，內容以描述事件經過為主，實際資訊量有限。`;
        } else if (hasUsefulInfo) {
            summary = `這篇文章包含一些實用資訊和建議，可能對某些讀者有幫助。`;
        } else if (wordCount < 300) {
            summary = `這篇文章內容相當精簡，資訊量有限，可能主要是為了吸引點閱。`;
        } else {
            summary = `這篇文章內容中等，包含一些基本資訊，但可能缺乏深度分析。`;
        }
        
        // 估計閱讀時間
        const readingTime = Math.max(1, Math.round(wordCount / 500)); // 假設平均閱讀速度為每分鐘500字
        
        return {
            summary,
            metrics: {
                informationDensity,
                emotionalImpact,
                perspective,
                originality,
                credibility,
                usefulness
            },
            readingTime
        };
    }

    // 產生隨機星星評分 (指定範圍)
    function randomStar(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // 更新預覽視窗內容
    function updatePreview(title, analysis) {
        if (!previewElement) return;
        
        const starRating = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);
        
        previewElement.innerHTML = `
            <h3>${title}</h3>
            <p class="summary">${analysis.summary}</p>
            <div class="metrics">
                <div class="metric">
                    <span class="metric-name">資訊密度:</span>
                    <span class="stars">${starRating(analysis.metrics.informationDensity)}</span>
                </div>
                <div class="metric">
                    <span class="metric-name">情緒影響:</span>
                    <span class="stars">${starRating(analysis.metrics.emotionalImpact)}</span>
                </div>
                <div class="metric">
                    <span class="metric-name">立場:</span>
                    <span class="stars">${starRating(analysis.metrics.perspective)}</span>
                </div>
                <div class="metric">
                    <span class="metric-name">原創性:</span>
                    <span class="stars">${starRating(analysis.metrics.originality)}</span>
                </div>
                <div class="metric">
                    <span class="metric-name">可信度:</span>
                    <span class="stars">${starRating(analysis.metrics.credibility)}</span>
                </div>
                <div class="metric">
                    <span class="metric-name">實用性:</span>
                    <span class="stars">${starRating(analysis.metrics.usefulness)}</span>
                </div>
            </div>
            <div class="footer">
                閱讀時間約 ${analysis.readingTime} 分鐘 | ReadOrNot 預覽
            </div>
        `;
    }

    // 當 DOM 發生變化時重新設定連結監聽
    function observeDOMChanges() {
        const observer = new MutationObserver(function(mutations) {
            let needsUpdate = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                setupLinkListeners();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初始化
    setupLinkListeners();
    observeDOMChanges();
    
    // 當滑鼠點擊其他區域時隱藏預覽
    document.addEventListener('click', function(event) {
        if (previewElement && event.target !== previewElement && !previewElement.contains(event.target)) {
            hidePreview();
        }
    });
    
    console.log('ReadOrNot 腳本已啟動');
})();