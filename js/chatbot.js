const ChatbotWidget = {
  init: function (config) {
    const btn = document.createElement("button");
    btn.innerText = "Chat";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "10000";
    btn.style.padding = "10px 15px";
    btn.style.background = "#00ffd5";
    btn.style.color = "#0f172a";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    document.body.appendChild(btn);

    btn.onclick = function () {
      alert("Chatbot API not implemented yet! URL: " + config.apiUrl);
    };
  },
};