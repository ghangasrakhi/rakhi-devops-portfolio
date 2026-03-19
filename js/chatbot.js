const chatToggle = document.getElementById("chat-toggle");
const chatbot = document.getElementById("chatbot");
const chatBody = document.getElementById("chat-body");

chatToggle.onclick = () => {
chatbot.style.display = chatbot.style.display === "flex" ? "none" : "flex";
chatbot.style.flexDirection = "column";
};

function sendMessage(){

const input = document.getElementById("chat-input");
const text = input.value;

if(text === "") return;

chatBody.innerHTML += `<div class="user">${text}</div>`;

let reply = "I can tell you about Rakhi's DevOps skills.";

if(text.toLowerCase().includes("skills"))
reply = "Rakhi works with Azure, Kubernetes, Terraform, Docker, CI/CD.";

else if(text.toLowerCase().includes("projects"))
reply = "Check the Projects section for Kubernetes and Terraform deployments.";

else if(text.toLowerCase().includes("contact"))
reply = "You can reach Rakhi via GitHub.";

else if(text.toLowerCase().includes("hello"))
reply = "Hello 👋 I'm Rakhi's DevOps assistant.";

chatBody.innerHTML += `<div class="bot">${reply}</div>`;

chatBody.scrollTop = chatBody.scrollHeight;

input.value="";
}