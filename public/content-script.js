const getTargetNodes = function* (word) {
  const regex = new RegExp(word, "gi");
  const acceptNode = (node) => {
    if (/script|style/i.test(node.parentNode.nodeName)) {
      return NodeFilter.FILTER_REJECT;
    }
    if (regex.test(node.nodeValue)) {
      return NodeFilter.FILTER_ACCEPT;
    }
  };
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    { acceptNode }
  );

  while (walker.nextNode()) yield walker.currentNode;
};

const toggleStar = async (event) => {
  const word = event.target.innerText.toLowerCase();
  const wordDict = await chrome.storage.sync.get(word);
  if (Object.keys(wordDict).length > 0) {
    await chrome.storage.sync.remove(word);
    const elements = document.getElementsByClassName(`aidext-${word}`);
    for (const element of elements) {
      element.classList.remove("star");
    }
  } else {
    await chrome.storage.sync.set({ [word]: event.target.title });
    const elements = document.getElementsByClassName(`aidext-${word}`);
    for (const element of elements) {
      element.classList.add("star");
    }
  }
};

const addDescription = (node, word, description, star) => {
  const regex = new RegExp(word, "gi");
  const newNode = document.createElement("span");
  let classes = `aidext aidext-${word}`;
  if (star) {
    classes += " star";
  }
  newNode.innerHTML = node.nodeValue.replace(
    regex,
    `<span class="${classes}"><abbr title="${description}">$&</span>`
  );
  newNode.querySelector(".aidext").addEventListener("click", toggleStar);
  node.parentNode.replaceChild(newNode, node);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.message) {
    case "getSelected":
      const selection = window.getSelection();
      if (selection.toString()) {
        sendResponse({
          ok: true,
          word: selection.toString().toLowerCase(),
          context: selection.anchorNode.parentNode.textContent,
        });
      } else {
        sendResponse({
          ok: false,
        });
      }
      break;
    case "addDescriptions":
      const targetNodes = [...getTargetNodes(request.payload.word)];
      for (const node of targetNodes) {
        addDescription(
          node,
          request.payload.word,
          request.payload.description,
          false
        );
      }
      break;
    case "showAlert":
      alert(request.payload);
      break;
    default:
      // 未知のメッセージに対するデフォルトの処理
      break;
  }
});

window.addEventListener("load", async () => {
  const items = await chrome.storage.sync.get(null);
  delete items.openAiApiKey;
  for (const word in items) {
    const targetNodes = [...getTargetNodes(word)];
    for (const node of targetNodes) {
      addDescription(node, word, items[word], true);
    }
  }
});
