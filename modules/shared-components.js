// Shared Components Loader
// This script loads the header, hero, and breadcrumb components dynamically

document.addEventListener("DOMContentLoaded", function() {
    // Get page title from data attribute or use default
    const pageTitle = document.body.getAttribute('data-page-title') || 'PDF Tool';
    
    // Load Navbar
    const navbarContainer = document.getElementById('shared-navbar');
    if (navbarContainer) {
        fetch('../shared-header.html')
            .then(response => response.text())
            .then(data => {
                navbarContainer.innerHTML = data;
            })
            .catch(error => console.error("Error loading navbar:", error));
    }
    
    // Load Hero Section
    const heroContainer = document.getElementById('shared-hero');
    if (heroContainer) {
        fetch('../shared-hero.html')
            .then(response => response.text())
            .then(data => {
                heroContainer.innerHTML = data;
                // Update page title
                const titleElement = document.getElementById('page-title');
                if (titleElement) {
                    titleElement.textContent = pageTitle;
                }
            })
            .catch(error => console.error("Error loading hero:", error));
    }
    
    // Load Breadcrumb
    const breadcrumbContainer = document.getElementById('shared-breadcrumb');
    if (breadcrumbContainer) {
        fetch('../shared-breadcrumb.html')
            .then(response => response.text())
            .then(data => {
                breadcrumbContainer.innerHTML = data;
            })
            .catch(error => console.error("Error loading breadcrumb:", error));
    }
});


