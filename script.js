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

        data.results.forEach(async item => {
            const mediaItem = document.createElement('div');
            mediaItem.classList.add('media-item');

            const mediaTitle = item.title || item.name;
            const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500/${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';

            let embedUrl = '';
            let seasonDropdown = '';
            let episodeDropdown = '';
            let playButton = '';

            switch (item.media_type) {
                case 'movie':
                    embedUrl = `https://www.2embed.cc/embed/${item.id}`;
                    playButton = `<button onclick="playMedia('${embedUrl}')">Watch Now</button>`;
                    break;
                case 'tv':
                    // Fetch the number of seasons and episodes dynamically
                    const tvShowUrl = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${apiKey}`;
                    const tvShowResponse = await fetch(tvShowUrl);
                    const tvShowData = await tvShowResponse.json();

                    const numSeasons = tvShowData.number_of_seasons;
                    const numEpisodes = tvShowData.number_of_episodes;

                    seasonDropdown = `<select id="seasonSelect${item.id}" onchange="updateEpisodeDropdown(${item.id})">`;
                    for (let i = 1; i <= numSeasons; i++) {
                        seasonDropdown += `<option value="${i}">Season ${i}</option>`;
                    }
                    seasonDropdown += `</select>`;

                    episodeDropdown = `<select id="episodeSelect${item.id}">`;
                    for (let i = 1; i <= numEpisodes; i++) {
                        episodeDropdown += `<option value="${i}">Episode ${i}</option>`;
                    }
                    episodeDropdown += `</select>`;

                    playButton = `<button onclick="playTvShow('${item.id}')">Watch Now</button>`;
                    break;
                case 'anime':
                    embedUrl = `https://2anime.xyz/embed/${item.title.replace(/\s+/g, '-').toLowerCase()}-1`;
                    playButton = `<button onclick="playMedia('${embedUrl}')">Watch Now</button>`;
                    break;
            }

            mediaItem.innerHTML = `
                <img src="${posterPath}" alt="${mediaTitle}">
                <h3>${mediaTitle}</h3>
                ${seasonDropdown} ${episodeDropdown}
                ${playButton}
            `;

            resultsContainer.appendChild(mediaItem);
        });
    } catch (error) {
        resultsContainer.innerHTML = '<p>Something went wrong. Please try again later.</p>';
        console.error('Error fetching data:', error);
    }
});

function playTvShow(id) {
    const season = document.getElementById(`seasonSelect${id}`).value;
    const episode = document.getElementById(`episodeSelect${id}`).value;
    const embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;

    const resultsContainer = document.getElementById('resultsContainer');
    const iframeStyle = window.innerWidth > 768 ? 'width: 1000px;' : 'width: 100%;';
    resultsContainer.innerHTML = `<iframe src="${embedUrl}" style="${iframeStyle} height: 100%; border: none;" allowfullscreen></iframe>`;
    resultsContainer.style.height = "500px";  // Set a specific height for the container
}

function playMedia(embedUrl) {
    const resultsContainer = document.getElementById('resultsContainer');
    const iframeStyle = window.innerWidth > 768 ? 'width: 1000px;' : 'width: 100%;';
    resultsContainer.innerHTML = `<iframe src="${embedUrl}" style="${iframeStyle} height: 100%; border: none;" allowfullscreen></iframe>`;
    resultsContainer.style.height = "500px";  // Set a specific height for the container
}


async function updateEpisodeDropdown(id) {
    const season = document.getElementById(`seasonSelect${id}`).value;
    const episodeSelect = document.getElementById(`episodeSelect${id}`);

    // Update episodes based on the selected season
    // Fetch the number of episodes for the selected season dynamically
    // This is an example. You can dynamically fetch the number of episodes for each season using the TMDB API.
    const episodeUrl = `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${apiKey}`;
    const episodeResponse = await fetch(episodeUrl);
    const episodeData = await episodeResponse.json();

    const numEpisodes = episodeData.episodes.length;

    episodeSelect.innerHTML = ``;
    for (let i = 1; i <= numEpisodes; i++) {
        episodeSelect.innerHTML += `<option value="${i}">Episode ${i}</option>`;
    }
}

