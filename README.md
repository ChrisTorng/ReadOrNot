# ReadOrNot 要看不看?

暫停於充斥低價值文章之網站連結上時，使用預設關鍵字快速分析目標網頁，另提供可選擇 AI 評估指標。

## 功能特色

- 當滑鼠游標暫停在充斥低價值文章之網站連結上時，自動預覽目標網頁完整標題
- 先依關鍵字分析文章內容並提供多項評估指標
- 若有設定 AI 模型，則會使用模型進行進階分析
- 估計閱讀時間，幫助您做出明智的閱讀決定

## 安裝步驟

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/) 擴充套件<br>
   Chromium 相關瀏覽器需要開啟 [Dev mode](https://www.tampermonkey.net/faq.php#Q209)

2. [安裝 ReadOrNot 腳本](https://github.com/ChrisTorng/ReadOrNot/raw/refs/heads/main/ReadOrNot.user.js)

3. 若有安裝本機 Ollama 且有執行模型: 在連結上顯示的分析視窗右下角，點 [設定] 鈕，或在網頁內任意處按右鍵，選 [Tampermonkey] - [ReadOrNot 要看不看?] - [開啟設定視窗]，輸入本機 Ollama URL 及模型名稱，按 [測試連結] 確認成功後，[儲存設定]。

4. 若出現 Tampermonkey 之 cross-origin source 警告，請按 `Always allow all domains` 允許存取目標網頁內容

## 使用方式

安裝完成後，只需將滑鼠游標暫停在充斥低價值文章之網站連結上時，ReadOrNot 就會自動顯示預覽視窗，包含以下資訊：

- 文章標題
- 內容摘要 (若有設定 AI 模型)
- 評估指標 (資訊密度、情緒影響、立場、原創性、可信度、實用性)
- 預估閱讀時間

## 預設支援預覽的目標主機

- [cna.com.tw](https://cna.com.tw)
- [chinapost.com.tw](https://chinapost.com.tw)
- [ctee.com.tw](https://ctee.com.tw)
- [ettoday.net](https://ettoday.net)
- [ftv.com.tw](https://ftv.com.tw)
- [libertytimes.com.tw](https://libertytimes.com.tw)
- [newtalk.tw](https://newtalk.tw)
- [nownews.com](https://nownews.com)
- [peoplenews.tw](https://peoplenews.tw)
- [storm.mg](https://storm.mg)
- [taipeitimes.com](https://taipeitimes.com)
- [taiwannews.com.tw](https://taiwannews.com.tw)
- [taiwanplus.com](https://taiwanplus.com)
- [udn.com](https://udn.com)
- [upmedia.mg](https://upmedia.mg)
- [thenewslens.com](https://thenewslens.com)
- [yahoo.com](https://yahoo.com)

若需要自訂需預覽之連結主機，請在 Tampermonkey 腳本管理頁面中，選擇 [ReadOrNot 要看不看?] - [Settings] - [Includes/Excludes] - [User matches] 中，加入需預覽目標主機名稱。

## 開發環境

- [GitHub ReadOrNot](https://github.com/ChrisTorng/ReadOrNot)
- 將本資料夾啟用本機網頁伺服器 http://localhost:3000
- 設定 `User matches` 增加 `DevMode` 項目，以由本機 http://localhost:3000 存取開發環境 js/json/css 檔案

## 授權條款

本專案採用 MIT 授權條款 - 詳情請參閱 [LICENSE](LICENSE) 檔案
