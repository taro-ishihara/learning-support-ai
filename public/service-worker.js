const createPrompt = (word, context) => {
  return `${context}という文章の中での「${word}」という単語または表現の意味を日本語で説明してください。`;
};

let isProcessing = false;
const startProcessing = () => {
  isProcessing = true
  const details = {};
  details.path = { 16: "icons/iconred16.png", 32: "icons/iconred32.png" };
  chrome.action.setIcon(details);
};
const endProcessing = () => {
  isProcessing = false;
  const details = {};
  details.path = { 16: "icons/icon16.png", 32: "icons/icon32.png" };
  chrome.action.setIcon(details);
};

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: "search",
    title: "言語サポートAI検索",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "search":
      if (isProcessing) {
        break;
      }
      startProcessing(tab.id);
      const apiUrl = "https://api.openai.com/v1/chat/completions";
      const apiKey = (await chrome.storage.sync.get("openAiApiKey"))[
        "openAiApiKey"
      ];
      chrome.tabs.sendMessage(
        tab.id,
        { message: "getSelected" },
        (selected) => {
          if(!selected.ok){
            return
          }
          fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "user",
                  content: createPrompt(selected.word, selected.context),
                },
              ],
            }),
          })
            .then((fetchResponse) => {
              fetchResponse.json().then((jsonData) => {
                endProcessing();
                if (jsonData.hasOwnProperty("choices")) {
                  chrome.tabs.sendMessage(tab.id, {
                    message: "addDescriptions",
                    payload: {
                      word: selected.word,
                      description: jsonData.choices[0].message.content.replace(
                        /"/g,
                        "'"
                      ),
                    },
                  });
                } else {
                  console.error("レスポンスが不正です。", jsonData);
                }
              });
            })
            .catch((error) => {
              console.error(error);
              endProcessing();
            });
        }
      );
      break;
    default:
      // 未知のメッセージに対するデフォルトの処理
      break;
  }
});
