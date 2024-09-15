document.getElementById('searchBtn').addEventListener('click', async function () {
    const query = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('resultsContainer');

    if (query.trim() === '') {
        alert('Please enter a search query.');
        return;
    }

    resultsContainer.innerHTML = '';  // Clear previous results

    const apiKey = '1d21d96347d1b72f32806b6256c3a132';  // Your TMDB API key
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.results.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        data.results.forEach(item => {
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item');

            const mediaTitle = item.title || item.name;
            const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500/${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';

            let embedUrl = '';
            switch (item.media_type) {
                case 'movie':
                    embedUrl = `https://www.2embed.cc/embed/${item.id}`;
                    break;
                case 'tv':
                    embedUrl = `https://www.2embed.cc/embedtv/${item.id}&s=1&e=1`;
                    break;
                case 'anime':
                    embedUrl = `https://2anime.xyz/embed/${item.title.replace(/\s+/g, '-').toLowerCase()}-1`;
                    break;
            }

            mediaItem.innerHTML = `
                <img src="${posterPath}" alt="${mediaTitle}">
                <h3>${mediaTitle}</h3>
                <button onclick="playMedia('${embedUrl}')">Watch Now</button>
            `;

            resultsContainer.appendChild(mediaItem);
        });
    } catch (error) {
        resultsContainer.innerHTML = '<p>Something went wrong. Please try again later.</p>';
        console.error('Error fetching data:', error);
    }
});

function playMedia(embedUrl) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `<iframe src="${embedUrl}" width="100%" height="500px" allowfullscreen></iframe>`;
}
