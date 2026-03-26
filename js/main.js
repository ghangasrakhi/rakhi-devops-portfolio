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

// MEDIUM BLOG INTEGRATION
// const blogContainer = document.getElementById('blog-container');
// const mediumRSS = 'https://medium.com/feed/ghangas-rakhi';
// const rss2jsonURL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(mediumRSS)}&count=6`;

// fetch(rss2jsonURL)
//   .then(res => res.json())
//   .then(data => {
//     if(!data.items) throw new Error('No items returned');
//     data.items.forEach(post => {
//       const postCard = document.createElement('div');
//       postCard.className = 'blog-card';
//       postCard.innerHTML = `
//         <img src="${post.thumbnail || 'img/blog-placeholder.jpg'}" alt="${post.title}">
//         <div class="blog-content">
//           <h3>${post.title}</h3>
//           <p>${new Date(post.pubDate).toLocaleDateString()}</p>
//           <a href="${post.link}" target="_blank">Read More</a>
//         </div>
//       `;
//       blogContainer.appendChild(postCard);
//     });
//   })
//   .catch(err => {
//     console.error('Failed to fetch Medium posts', err);
//     blogContainer.innerHTML = '<p style="color:#00ffd5;text-align:center;">Unable to load blogs at this time.</p>';
//   });


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
        // CALL YOUR AZURE FUNCTION PROXY
        const response = await fetch("/api/chatProxy", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: text })
        });

        const data = await response.json();
        
        // 3. Display AI Response
        botDiv.innerText = data.reply || "I'm having trouble reaching the cloud.";

    } catch (error) {
        botDiv.innerText = "Connection lost. My DevOps heart is broken.";
        console.error("Chat Error:", error);
    }

    chatBody.scrollTop = chatBody.scrollHeight;
}