// MATRIX EFFECT
const canvas=document.getElementById("matrix");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const letters="DEVOPS0123456789KUBERNETESAZURE";
const matrix=letters.split("");
const fontSize=16;
const columns=canvas.width/fontSize;
const drops=[];
for(let x=0;x<columns;x++) drops[x]=1;
function draw(){
  ctx.fillStyle="rgba(0,0,0,0.05)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#0078d4";
  ctx.font=fontSize+"px monospace";
  for(let i=0;i<drops.length;i++){
    const text=matrix[Math.floor(Math.random()*matrix.length)];
    ctx.fillText(text,i*fontSize,drops[i]*fontSize);
    if(drops[i]*fontSize>canvas.height && Math.random()>0.975) drops[i]=0;
    drops[i]++;
  }
}
setInterval(draw,35);

// DARK/LIGHT MODE
document.getElementById("modeToggle").onclick=function(){document.body.classList.toggle("light");};

// SKILL BARS
window.addEventListener("scroll",()=>{document.querySelectorAll(".skill-bar").forEach(bar=>{
  const rect=bar.getBoundingClientRect();
  if(rect.top<window.innerHeight){bar.style.width=bar.getAttribute("data-width");}
});});

// SCROLL REVEAL
ScrollReveal().reveal(".tech",{delay:200,distance:"50px",origin:"bottom",interval:200});
ScrollReveal().reveal(".card",{delay:200,distance:"40px",origin:"bottom",interval:200});
ScrollReveal().reveal(".blog-card",{delay:200,distance:"40px",origin:"bottom",interval:200});


// Medium Blog Integration
const blogContainer=document.getElementById('blog-container')
fetch('/api/mediumFeed')
  .then(res=>res.json())
  .then(posts=>{
    if(!posts||posts.length===0) throw new Error('No posts found')
    posts.forEach(post=>{
      const postCard=document.createElement('div')
      postCard.className='blog-card'
      postCard.innerHTML=`
        <img src="${post.thumbnail||'img/default-blog.jpg'}" alt="${post.title}">
        <div class="blog-content">
          <h3>${post.title}</h3>
          <p>${new Date(post.pubDate).toLocaleDateString()}</p>
          <a href="${post.link}" target="_blank">Read More</a>
        </div>
      `
      blogContainer.appendChild(postCard)
    })
  })
  .catch(err=>{
    console.error(err)
    blogContainer.innerHTML='<p style="color:#00ffd5;text-align:center;">Unable to load blogs at this time.</p>'
  })



const chatToggle = document.getElementById("chat-toggle");
const chatbot = document.getElementById("chatbot");
const chatBody = document.getElementById("chat-body");

chatToggle.onclick = () => {
chatbot.style.display = chatbot.style.display === "flex" ? "none" : "flex";
chatbot.style.flexDirection = "column";
};

// Add "Enter" key support
document.getElementById("chat-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

document.addEventListener('mousemove', (e) => {
  const moveX = (e.clientX / window.innerWidth) * 100;
  const moveY = (e.clientY / window.innerHeight) * 100;
  
  document.body.style.background = `radial-gradient(circle at ${moveX}% ${moveY}%, #0a192f 0%, #000 80%)`;
});


async function sendMessage() {
    const input = document.getElementById("chat-input");
    const chatBody = document.getElementById("chat-body");
    const text = input.value.trim();

    if (text === "") return;

    // 1. Show User Message
    chatBody.innerHTML += `<div class="user">${text}</div>`;
    input.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Add a "Thinking..." bubble
    const botDiv = document.createElement("div");
    botDiv.className = "bot";
    botDiv.innerText = "Thinking...";
    chatBody.appendChild(botDiv);

    try {
        const response = await fetch("/api/chatProxy", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: text })
        });

        // Check if the response is actually a success (200 OK)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        
        // 3. Display AI Response
        const replyText = data.reply || "I'm having trouble reaching the cloud.";
        botDiv.innerText = ""; // Clear the "Thinking..." text
        let i = 0;

        function typeWriter() {
            if (i < replyText.length) {
                botDiv.innerHTML += replyText.charAt(i);
                i++;
                chatBody.scrollTop = chatBody.scrollHeight;
                setTimeout(typeWriter, 15); // Adjust speed here
            }
        }
        typeWriter();

    } catch (error) {
        // Updated error message to help you debug in real-time
        botDiv.innerHTML = `<span style="color: #ff4d4d;">⚠️ Error: ${error.message}</span>`;
        console.error("Chat Error Details:", error);
    }

    chatBody.scrollTop = chatBody.scrollHeight;
}

