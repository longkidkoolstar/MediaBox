document.getElementById("searchBtn").addEventListener("click", function () {
    const mediaId = document.getElementById("searchInput").value;
    const contentType = document.getElementById("contentType").value;
    const mediaContainer = document.getElementById("mediaContainer");

    let embedUrl = "";

    if (contentType === "movie") {
        embedUrl = `https://www.2embed.cc/embed/${mediaId}`;
    } else if (contentType === "tv") {
        // Example uses season 1, episode 1 by default
        embedUrl = `https://www.2embed.cc/embedtv/${mediaId}&s=1&e=1`;
    } else if (contentType === "anime") {
        // Example anime episode 1 by default
        embedUrl = `https://2anime.xyz/embed/${mediaId}-1`;
    }

    mediaContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
});
