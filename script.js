document.getElementById('searchBtn').addEventListener('click', function () {
    const query = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('resultsContainer');
    const playerContainer = document.getElementById('playerContainer');
    const episodeContainer = document.getElementById('episodeContainer');

    if (query.trim() === '') {
        alert('Please enter a search query.');
        return;
    }

    resultsContainer.innerHTML = '';  // Clear previous results
    playerContainer.style.display = 'none';  // Hide player initially
    episodeContainer.style.display = 'none'; // Hide episode controls

    const apiKey = '1d21d96347d1b72f32806b6256c3a132';  // Use your TMDB API key here
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results.length === 0) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
                return;
            }

            data.results.forEach(item => {
                let embedUrl = '';
                const isTVShow = item.media_type === 'tv';
                const isAnime = item.media_type === 'anime';

                if (item.media_type === 'movie') {
                    embedUrl = `https://www.2embed.cc/embed/${item.id}`;
                } else if (isTVShow) {
                    embedUrl = `https://www.2embed.cc/embedtv/${item.id}&s=1&e=1`;
                } else if (isAnime) {
                    embedUrl = `https://2anime.xyz/embed/${item.title.replace(/\s+/g, '-').toLowerCase()}-1`;
                }

                const mediaItem = document.createElement('div');
                mediaItem.classList.add('media-item');

                const mediaTitle = item.title || item.name;
                const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500/${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';

                mediaItem.innerHTML = `
                    <img src="${posterPath}" alt="${mediaTitle}">
                    <h3>${mediaTitle}</h3>
                    <button onclick="playMedia('${embedUrl}', ${isTVShow ? item.id : 'null'})">Watch Now</button>
                `;

                resultsContainer.appendChild(mediaItem);
            });
        })
        .catch(error => {
            resultsContainer.innerHTML = '<p>Something went wrong. Please try again later.</p>';
            console.error(error);
        });
});

function playMedia(embedUrl, tvShowId = null) {
    const playerContainer = document.getElementById('playerContainer');
    const episodeContainer = document.getElementById('episodeContainer');
    const mediaPlayer = document.getElementById('mediaPlayer');

    mediaPlayer.src = embedUrl;
    playerContainer.style.display = 'block';  // Show player

    if (tvShowId) {
        loadSeasons(tvShowId);  // Load season/episode selection for TV shows
    } else {
        episodeContainer.style.display = 'none'; // Hide if it's a movie
    }
}

function loadSeasons(tvShowId) {
    const apiKey = '1d21d96347d1b72f32806b6256c3a132';
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    const episodeContainer = document.getElementById('episodeContainer');
    
    fetch(`https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            seasonSelect.innerHTML = '';
            episodeSelect.innerHTML = '';

            data.seasons.forEach((season, index) => {
                const option = document.createElement('option');
                option.value = season.season_number;
                option.text = `Season ${season.season_number}`;
                seasonSelect.appendChild(option);
            });

            loadEpisodes(tvShowId, data.seasons[0].season_number);
            episodeContainer.style.display = 'flex';  // Show episode controls
        });
}

function loadEpisodes(tvShowId, seasonNumber) {
    const apiKey = '1d21d96347d1b72f32806b6256c3a132';
    const episodeSelect = document.getElementById('episodeSelect');

    fetch(`https://api.themoviedb.org/3/tv/${tvShowId}/season/${seasonNumber}?api_key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            episodeSelect.innerHTML = '';

            data.episodes.forEach((episode) => {
                const option = document.createElement('option');
                option.value = episode.episode_number;
                option.text = `Episode ${episode.episode_number}`;
                episodeSelect.appendChild(option);
            });
        });
}

document.getElementById('seasonSelect').addEventListener('change', function () {
    const tvShowId = document.getElementById('seasonSelect').getAttribute('data-tv-show-id');
    const seasonNumber = this.value;
    loadEpisodes(tvShowId, seasonNumber);
});

document.getElementById('loadEpisodeBtn').addEventListener('click', function () {
    const seasonNumber = document.getElementById('seasonSelect').value;
    const episodeNumber = document.getElementById('episodeSelect').value;
    const tvShowId = document.getElementById('seasonSelect').getAttribute('data-tv-show-id');

    const embedUrl = `https://www.2embed.cc/embedtv/${tvShowId}&s=${seasonNumber}&e=${episodeNumber}`;
    playMedia(embedUrl, tvShowId);
});
