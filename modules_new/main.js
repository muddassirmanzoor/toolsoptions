document.addEventListener("DOMContentLoaded", function() {
    // Check if the navbar element exists before loading the navbar HTML
    const navbar = document.getElementById("navbar");
    if (navbar) {
        fetch("/modules/navbar.html")
            .then(response => response.text())
            .then(data => {
                navbar.innerHTML = data;
            })
            .catch(error => console.error("Error loading the navbar:", error));
    }

    // Check if the footer element exists before loading the footer HTML
    const footer = document.getElementById("footer");
    if (footer) {
        fetch("/modules/footer.html")
            .then(response => response.text())
            .then(data => {
                footer.innerHTML = data;
            })
            .catch(error => console.error("Error loading the footer:", error));
    }
});
