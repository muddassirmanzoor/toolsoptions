// config.js
fetch('/env')
    .then(response => response.json())
    .then(env => {
        window.env = env;
    })
    .catch(error => {
        console.error('Error loading environment variables:', error);
    });