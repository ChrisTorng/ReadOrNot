# ReadOrNot - 要看不要看?

懸停於連結上時，預覽文章內容並依關鍵字或由 AI 提供評估指標，幫助您決定是否值得點閱。

## 功能特色

- 當滑鼠游標懸停在連結上時，自動預覽目標網頁內容
- 分析文章內容並提供多項評估指標
- 估計閱讀時間，幫助您做出明智的閱讀決定

## 安裝步驟

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/) 擴充套件<br>
   Chromium 相關瀏覽器需要開啟 [Dev mode](https://www.tampermonkey.net/faq.php#Q209)

2. [安裝 ReadOrNot 腳本](https://github.com/ChrisTorng/ReadOrNot/raw/refs/heads/main/ReadOrNot.user.js)

3. 若有安裝本機 Ollama 且有執行模型: 在連結上顯示的分析視窗右下角，點 [設定] 鈕，輸入本機 Ollama URL 及模型名稱，按 [測試連結] 確認成功後，[儲存設定]。

4. 若出現 Tampermonkey cross-origin source 警告，請按 `Always allow all domains` 允許存取目標網頁內容

## 使用方式

安裝完成後，只需將滑鼠游標停留在任何網頁上的連結上方約 0.5 秒，ReadOrNot 就會自動顯示預覽視窗，包含以下資訊：

- 文章標題
- 內容摘要
- 評估指標（資訊密度、情緒影響、立場、原創性、可信度、實用性）
- 預估閱讀時間

## 原始碼

[GitHub ReadOrNot](https://github.com/ChrisTorng/ReadOrNot)

## 授權條款

本專案採用 MIT 授權條款 - 詳情請參閱 [LICENSE](LICENSE) 檔案
