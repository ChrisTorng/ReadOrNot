/**
 * ReadOrNot 預覽功能
 * 此檔案包含預覽視窗相關的所有功能實現
 */

const devMode = GM_info.script.options.override.use_matches.includes('DevMode');
if (devMode) {
    console.log('ReadOrNotPreview.js devMode');
}

// console.log("ReadOrNot: 預覽功能腳本已載入");

function initializeReadOrNotPreview(
    PREVIEWED_HOSTS, 
    OLLAMA_API_URL, 
    DEFAULT_MODEL, 
    DEFAULT_HOVER_DELAY, 
    DEFAULT_ANALYSIS_TIMEOUT
) {
    'use strict';
    
    // 預覽視窗元素
    let previewElement = null;
    let hoverTimer = null;
    let currentLink = null;
    let isAnalyzing = false;

    // 檢查連結是否屬於支援的網站主機
    function isPreviewedHost(url) {
        const linkHost = new URL(url).hostname;
        return PREVIEWED_HOSTS.some(host => linkHost.includes(host));
    }

    // 從儲存中取得模型名稱
    function getModelName() {
        return GM_getValue('ollama_model', DEFAULT_MODEL);
    }
    
    // 在 Tampermonkey 選單中註冊開啟設定視窗的功能
    GM_registerMenuCommand('開啟設定視窗', showConfigPanel);

    // 檢查本機儲存的設定
    function getSettings() {
        const defaultSettings = {
            ollamaApiUrl: OLLAMA_API_URL,
            ollamaModel: GM_getValue('ollama_model', DEFAULT_MODEL),
            hoverDelay: DEFAULT_HOVER_DELAY, // 預設滑鼠移過觸發延遲（秒）
            analysisTimeout: DEFAULT_ANALYSIS_TIMEOUT // 預設 AI 分析逾時時間（秒）
        };

        const savedSettings = localStorage.getItem('readornot-settings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }

    // 儲存設定
    function saveSettings(settings) {
        localStorage.setItem('readornot-settings', JSON.stringify(settings));
        // 同時更新 Tampermonkey 儲存的模型名稱
        if (settings.ollamaModel) {
            GM_setValue('ollama_model', settings.ollamaModel);
        }
    }

    // 顯示設定面板
    function showConfigPanel() {
        const settings = getSettings();
        
        const configPanel = document.createElement('div');
        configPanel.className = 'readornot-config';
        configPanel.innerHTML = `
            <span class="close">&times;</span>
            <h3>ReadOrNot 設定</h3>
            <p>若需要自訂需預覽之連結主機，請在 Tampermonkey 腳本管理頁面中，選擇 [ReadOrNot 要看不看?] - [Settings] - [Includes/Excludes] - [User matches] 中，加入需預覽目標主機名稱。</p>
            <form>
                <label for="ollama-api">Ollama API 網址:</label>
                <input type="text" id="ollama-api" value="${settings.ollamaApiUrl}">
                
                <label for="ollama-model">Ollama 模型名稱:</label>
                <input type="text" id="ollama-model" value="${settings.ollamaModel}">
                
                <label for="hover-delay">滑鼠移過觸發延遲 (秒):</label>
                <input type="number" id="hover-delay" value="${settings.hoverDelay}" min="0.1" max="5" step="0.1">
                
                <label for="analysis-timeout">AI 分析逾時時間 (秒):</label>
                <input type="number" id="analysis-timeout" value="${settings.analysisTimeout}" min="1" max="60">
                
                <div style="display: flex; justify-content: space-between;">
                    <button type="button" id="test-connection">測試連接</button>
                    <div>
                        <button type="button" id="save-settings">確定</button>
                        <button type="button" id="cancel-settings">取消</button>
                    </div>
                </div>
            </form>
            <div id="connection-status"></div>
        `;
        document.body.appendChild(configPanel);
        
        // 關閉按鈕
        configPanel.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(configPanel);
        });
        
        // 儲存設定
        configPanel.querySelector('#save-settings').addEventListener('click', () => {
            const newSettings = {
                ollamaApiUrl: configPanel.querySelector('#ollama-api').value,
                ollamaModel: configPanel.querySelector('#ollama-model').value,
                hoverDelay: parseFloat(configPanel.querySelector('#hover-delay').value),
                analysisTimeout: parseFloat(configPanel.querySelector('#analysis-timeout').value)
            };
            saveSettings(newSettings);
            document.body.removeChild(configPanel);
        });

        // 取消設定
        configPanel.querySelector('#cancel-settings').addEventListener('click', () => {
            document.body.removeChild(configPanel);
        });
        
        // 測試連接
        configPanel.querySelector('#test-connection').addEventListener('click', () => {
            const apiUrl = configPanel.querySelector('#ollama-api').value;
            const model = configPanel.querySelector('#ollama-model').value;
            const statusElement = configPanel.querySelector('#connection-status');
            
            statusElement.textContent = '測試連接中...';
            
            testOllamaConnection(apiUrl, model)
                .then(isAvailable => {
                    if (isAvailable) {
                        statusElement.textContent = '✓ 連接成功！Ollama 服務正常運作。';
                        statusElement.style.color = 'green';
                    } else {
                        statusElement.textContent = '✗ 無法連接到 Ollama 服務，請檢查 API 網址及模型名稱。';
                        statusElement.style.color = 'red';
                    }
                })
                .catch(error => {
                    statusElement.textContent = `✗ 發生錯誤: ${error.message}`;
                    statusElement.style.color = 'red';
                });
        });
    }

    // 測試 Ollama 連接
    function testOllamaConnection(apiUrl, model) {
        return new Promise((resolve, reject) => {
            const testPrompt = "Say 'ReadOrNot connection successful'";
            
            GM_xmlhttpRequest({
                method: 'POST',
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    model: model,
                    prompt: testPrompt,
                    stream: false
                }),
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    } catch (e) {
                        reject(new Error('解析回應失敗'));
                    }
                },
                onerror: function(error) {
                    reject(new Error('連接錯誤'));
                },
                ontimeout: function() {
                    reject(new Error('連接逾時'));
                }
            });
        });
    }
    
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
        if (!link || !link.href || link.href.startsWith('javascript:') || !isPreviewedHost(link.href)) return;
        
        currentLink = link;
        
        // 從設定中取得滑鼠移過觸發延遲（秒）並轉換為毫秒
        const settings = getSettings();
        const hoverDelayMs = settings.hoverDelay * 1000;
        
        // 延遲載入以避免快速滑過連結時觸發
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            showPreview(link);
        }, hoverDelayMs);
    }

    // 處理連結離開事件
    function handleLinkLeave(event) {
        clearTimeout(hoverTimer);
        
        // 檢查滑鼠是否移到預覽視窗上
        // 如果是移到預覽視窗上，就不要隱藏預覽
        const relatedTarget = event.relatedTarget;
        if (previewElement && (previewElement.contains(relatedTarget) || previewElement === relatedTarget)) {
            return;
        }
        
        // 否則設定延遲隱藏，讓使用者有時間移到預覽視窗上
        hoverTimer = setTimeout(() => {
            // 再次檢查滑鼠是否在預覽視窗上
            if (previewElement && previewElement.matches(':hover')) {
                return;
            }
            hidePreview();
            currentLink = null;
        }, 200);
    }

    // 顯示預覽視窗
    function showPreview(link) {
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'readornot-preview';
            
            // 增加滑鼠進入預覽視窗的事件處理
            previewElement.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
            });
            
            // 增加滑鼠離開預覽視窗的事件處理
            previewElement.addEventListener('mouseleave', () => {
                // 設定延遲隱藏
                hoverTimer = setTimeout(() => {
                    hidePreview();
                    currentLink = null;
                }, 300);
            });
            
            document.body.appendChild(previewElement);
        }

        // 計算更貼近連結的位置
        const linkRect = link.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        // 預設顯示在連結下方且對齊左側
        let left = linkRect.left;
        let top = linkRect.bottom + 5; // 更貼近連結，只留 5px 的間距
        
        // 確保預覽視窗不會超出視窗右側邊界
        if (left + 400 > windowWidth) {
            left = Math.max(5, windowWidth - 405);
        }
        
        previewElement.style.left = `${left}px`;
        previewElement.style.top = `${top}px`;
        
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
        isAnalyzing = false;
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
                    
                    // 先顯示關鍵字比對結果
                    const keywordAnalysis = getKeywordAnalysis(title, content);
                    updatePreview(title, keywordAnalysis, true);
                    
                    // 然後在背景中使用 Ollama 分析內容
                    analyzeWithOllama(content, title, url);
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

    // 使用關鍵字分析內容
    function getKeywordAnalysis(title, content) {
        // 簡單的關鍵字判斷來模擬 AI 分析
        const wordCount = content.split(' ').length;
        const hasEmotionalWords = /驚人|震驚|爆|超扯|慘|太扯|天才|最強|怒|氣炸|崩潰|超美|吃不下|可怕/.test(content + title);
        const isCelebrityRelated = /藝人|明星|網紅|歌手|演員|主持人|網友|粉絲|直播|開箱/.test(content);
        const hasSourceCitation = /研究|專家|調查|報告|表示|指出|分析|數據|證實/.test(content);
        const hasUsefulInfo = /教學|如何|方法|步驟|技巧|秘訣|建議|解決|提升|改善|注意|預防/.test(content);
        
        return {
            summary: '這是基於關鍵字的初步分析結果。正在使用 AI 進行更詳細的分析...',
            metrics: {
                informationDensity: hasUsefulInfo ? 3 : 1,
                emotionalImpact: hasEmotionalWords ? 4 : 2,
                perspective: 3,
                originality: isCelebrityRelated ? 1 : 3,
                credibility: hasSourceCitation ? 3 : 1,
                usefulness: hasUsefulInfo ? 4 : 1
            },
            readingMinutes: Math.max(1, Math.round(wordCount / 500)),
            isKeywordAnalysis: true
        };
    }

    // 使用 Ollama API 分析內容
    function analyzeWithOllama(content, title, url) {
        if (isAnalyzing) return;
        isAnalyzing = true;
        
        const settings = getSettings();
        
        // 檢查 API URL 和模型是否已設定
        if (!settings.ollamaApiUrl || !settings.ollamaModel) {
            updatePreview(title, {
                summary: "未設定 AI 分析，底下是基於關鍵字的初步分析結果。",
                metrics: {
                    informationDensity: 0,
                    emotionalImpact: 0,
                    perspective: 0,
                    originality: 0,
                    credibility: 0,
                    usefulness: 0
                },
                readingMinutes: 0
            }, false, "未設定 AI 分析");
            isAnalyzing = false;
            return;
        }
        
        // 建立提示詞
        const prompt = `
請分析以下網頁內容，提供簡短摘要、評估指標和閱讀時間估計。
不需要引言或額外說明，直接提供 JSON 格式的分析結果。

網頁標題: ${title}
網頁內容: ${content.substring(0, 3000)}

必須按照以下 JSON 格式回應，所有值都是必須的:
{
    "summary": "60字內的內容摘要",
    "metrics": {
        "informationDensity": 0-5的整數 (資訊密度：文章包含多少實質內容),
        "emotionalImpact": 0-5的整數 (情緒影響：對閱讀者情緒的影響程度),
        "perspective": 0-5的整數 (立場：內容的價值觀傾向，5為最公正),
        "originality": 0-5的整數 (原創性：內容獨特程度),
        "credibility": 0-5的整數 (可信度：資訊來源的可靠性),
        "usefulness": 0-5的整數 (實用性：對讀者的實際幫助程度)
    },
    "readingMinutes": 閱讀時間的分鐘數整數
}

所有回應均以繁體中文台灣用語撰寫。`;

        // 從設定中取得 AI 分析逾時時間（秒）並轉換為毫秒
        const analysisTimeoutMs = settings.analysisTimeout * 1000;

        // 建立超時處理
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('分析逾時')), analysisTimeoutMs)
        );
        
        // 呼叫 Ollama API
        const ollamaPromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: settings.ollamaApiUrl,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    model: settings.ollamaModel,
                    prompt: prompt,
                    stream: false
                }),
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            resolve(data);
                        } else {
                            reject(new Error(`API 回應錯誤 (${response.status})`));
                        }
                    } catch (e) {
                        reject(new Error('解析 API 回應失敗'));
                    }
                },
                onerror: function() {
                    reject(new Error('API 請求失敗'));
                }
            });
        });
        
        // 使用 Promise.race 處理超時
        Promise.race([ollamaPromise, timeoutPromise])
            .then(data => {
                try {
                    // 解析 AI 的 JSON 回應
                    const responseText = data.response || '';
                    
                    // 尋找 JSON 格式的部分
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('找不到有效的 JSON 回應');
                    }

                    const jsonStr = jsonMatch[0];
                    const analysis = JSON.parse(jsonStr);

                    // 更新預覽視窗
                    updatePreview(title, analysis, false);
                } catch (error) {
                    console.error('解析 AI 回應失敗:', error);
                    updatePreview(title, getKeywordAnalysis(title, content), false, `AI 分析失敗: ${error.message}`);
                }
            })
            .catch(error => {
                console.error('AI 分析錯誤:', error);
                updatePreview(title, getKeywordAnalysis(title, content), false, `AI 分析錯誤: ${error.message}`);
            })
            .finally(() => {
                isAnalyzing = false;
            });
    }

    // 更新預覽視窗內容
    function updatePreview(title, analysis, isLoading, errorMessage) {
        if (!previewElement) return;
        
        const starRating = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);
        
        // 顯示分析結果
        let html = `
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
                閱讀時間約 ${analysis.readingMinutes} 分鐘 | ReadOrNot 預覽
                <span class="readornot-preview-settings">設定</span>
            </div>
        `;

        // 如果是關鍵字分析且仍在載入AI結果，顯示載入中的訊息
        if (isLoading) {
            // 檢查是否已設定 API URL 和模型，若未設定則不顯示「正在使用 AI」的訊息
            const settings = getSettings();
            if (settings.ollamaApiUrl && settings.ollamaModel) {
                html += `<div class="ai-loading">正在使用 AI 進行更深入的分析...</div>`;
            }
        }
        
        // 如果有錯誤訊息，則顯示
        if (errorMessage) {
            html += `<div class="ai-loading" style="color: #d9534f;">${errorMessage}</div>`;
        }
        
        previewElement.innerHTML = html;
        
        // 為設定按鈕加入事件處理
        const settingsBtn = previewElement.querySelector('.readornot-preview-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', showConfigPanel);
        }
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
}

// 確保在全域範圍可使用
window.initializeReadOrNotPreview = initializeReadOrNotPreview;
