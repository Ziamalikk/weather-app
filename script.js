let geoapifyKey = '1acc7fcbc20b49a18d498219207bc7fe';
let weatherApiKey = "6f2b4cd9bfbf526f47d67711c165017c";

async function fetchLocations(query) {
    if (!query) return;

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${geoapifyKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        const list = document.getElementById('result-list');
        list.innerHTML = '';

        const seenCities = new Set();
        if (!data.features || data.features.length === 0) return;

        for (let feature of data.features) {
            const city = feature.properties.city;
            const [lon, lat] = feature.geometry.coordinates;
            if (city && lat && lon && !seenCities.has(city)) {
                seenCities.add(city);
                const { temperature, humidity, weather, windspeed, weatherIcon } = await fetchTemperature(lat, lon);
                const listItem = document.createElement('li');
                listItem.textContent = `${city} - ${temperature}°C`;
                listItem.addEventListener('click', () => {
                    displayTemperatureDetails(city, temperature, humidity, weather, windspeed, weatherIcon);
                    list.innerHTML = '';
                });
                list.appendChild(listItem);
            }
        }
    } catch (error) {
        console.error('Geoapify fetch error:', error);
    }
}

async function fetchTemperature(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const weatherData = await response.json();
        console.log(weatherData);
        const humidity = weatherData.main.humidity;
        const windspeed = weatherData.wind.speed;
        const weather = weatherData.weather[0].description;
        const temperature = Math.round(weatherData.main.temp);
        const weatherIcon = weatherData.weather[0].icon;
        return { temperature, humidity, weather, windspeed, weatherIcon };
    } catch (error) {
        console.error('Weather fetch error:', error);
        return { temperature: 'N/A', humidity: 'N/A', weather: 'N/A', windspeed: 'N/A', weatherIcon: '' };
    }
}

function displayTemperatureDetails(city, temperature, humidity, weather, windspeed, weatherIcon) {
    const details = {
        celius: { label: "Temperature", value: `${temperature}°C` },
        windspeed: { label: "Wind Speed", value: `${windspeed} m/s` },
        humidity: { label: "Humidity", value: `${humidity}%` },
        currentweather: { label: "Weather", value: weather }
    };

    for (const id in details) {
        const element = document.getElementById(id);
        element.style.display = 'flex';
        element.style.flexDirection = 'column'; // Stack label and value
        element.style.alignItems = 'center'; // Center align
        element.innerHTML = `${details[id].label}<br><b>${details[id].value}</b>`;
    }

    // Display the place name, weather icon, and description
    const placeNameContainer = document.getElementById('place-name');
    placeNameContainer.innerHTML = `<b>${city}</b>`;
    
    const weatherIconContainer = document.getElementById('weather-icon-container');
    weatherIconContainer.innerHTML = `
        <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="Weather Icon" />
        <div class="temperature">${temperature}°C</div>
    `;

    const weatherDescriptionContainer = document.getElementById('weather-description');
    weatherDescriptionContainer.textContent = weather;
}

// Debounce function to limit API calls
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Event listener for the location input field
document.getElementById('location').addEventListener('input', debounce((event) => {
    fetchLocations(event.target.value.trim());
}, 200));

