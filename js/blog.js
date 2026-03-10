fetch("/api/mediumFeed")
  .then(res => res.json())
  .then(posts => {

    const container = document.getElementById("blog-posts");
    container.innerHTML = "";

    posts.forEach(post => {

      const date = new Date(post.pubDate).toLocaleDateString();

      const postHTML = `
        <div class="blog-card">

          <div class="blog-image">
            <img src="${post.thumbnail}" 
                 onerror="this.src='/img/default-blog.png'">
          </div>

          <div class="blog-content">
            <h3>
              <a href="${post.link}" target="_blank">
                ${post.title}
              </a>
            </h3>

            <p>${post.description}</p>

            <span class="blog-date">${date}</span>

          </div>

        </div>
      `;

      container.innerHTML += postHTML;

    });

  })
  .catch(() => {
    document.getElementById("blog-posts").innerHTML =
      "<p>Unable to load blogs at this time.</p>";
  });