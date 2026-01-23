// Shared Components Loader
// This script loads the header, hero, and breadcrumb components dynamically

// Run immediately if DOM is already loaded, otherwise wait
(function() {
    console.log('📦 shared-components.js loaded, document.readyState:', document.readyState);
    
    // Also try immediately
    setTimeout(() => {
        console.log('⏰ Delayed initialization attempt...');
        if (document.getElementById('shared-navbar')) {
            console.log('✅ Navbar container found in delayed check, initializing...');
            initSharedComponents();
        }
    }, 100);
    
    if (document.readyState === 'loading') {
        console.log('Waiting for DOMContentLoaded...');
        document.addEventListener("DOMContentLoaded", function() {
            console.log('✅ DOMContentLoaded fired, initializing components...');
            initSharedComponents();
        });
    } else {
        console.log('✅ DOM already ready, initializing components immediately...');
        // Use setTimeout to ensure DOM is fully parsed
        setTimeout(() => {
            initSharedComponents();
        }, 50);
    }
})();

// Also make it available globally for manual triggering
window.initSharedComponents = initSharedComponents;

function initSharedComponents() {
    console.log('🚀 initSharedComponents called');
    console.log('Document ready state:', document.readyState);
    console.log('Body exists:', !!document.body);
    
    // Get page title from data attribute or use default
    const pageTitle = document.body ? document.body.getAttribute('data-page-title') || 'PDF Tool' : 'PDF Tool';
    
    // Load Navbar
    const navbarContainer = document.getElementById('shared-navbar');
    console.log('Navbar container found:', !!navbarContainer);
    
    if (!navbarContainer) {
        console.error('❌ Navbar container not found! Make sure <div id="shared-navbar"></div> exists in HTML.');
        // Still load other components
        const pageTitleForHero = document.body ? document.body.getAttribute('data-page-title') || 'PDF Tool' : 'PDF Tool';
        loadHeroSection(pageTitleForHero);
        loadBreadcrumb();
        return;
    }
    
    if (navbarContainer) {
        // Use absolute path since Node.js serves static files from modules root
        // This works from both root (/) and subdirectories (/compressPDF/, etc.)
        const headerPath = '/shared-header.html';
        
        console.log('Fetching navbar from:', headerPath);
        fetch(headerPath)
            .then(response => {
                console.log('Navbar fetch response:', response.status, response.statusText);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                console.log('✅ Navbar HTML received, length:', data.length);
                navbarContainer.innerHTML = data;
                console.log('✅ Navbar HTML loaded, immediately checking auth...');
                
                // Immediately hide both, then show correct one based on auth
                const guestNav = document.getElementById('guest-nav');
                const userNav = document.getElementById('user-nav');
                if (guestNav) {
                    guestNav.style.cssText = 'display: none !important;';
                    guestNav.hidden = true;
                }
                if (userNav) {
                    userNav.style.cssText = 'display: none !important;';
                    userNav.hidden = true;
                }
                
                // Immediately check auth status - use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                    updateNavbarForUser();
                    
                    // Check again after short delay to ensure it sticks
                    setTimeout(() => {
                        console.log('Second check to ensure navbar state...');
                        updateNavbarForUser();
                    }, 200);
                    
                    setTimeout(() => {
                        console.log('Third check to ensure navbar state...');
                        updateNavbarForUser();
                    }, 800);
                    
                    // Also check periodically in case user logs in while on page
                    if (!window.navbarInterval) {
                        window.navbarInterval = setInterval(() => {
                            updateNavbarForUser();
                        }, 2000); // Check every 2 seconds
                    }
                });
            })
            .catch(error => {
                console.error("❌ Error loading navbar from /shared-header.html:", error);
                console.error("Error details:", error.message);
                
                // Try fallback paths
                const fallbackPaths = ['../shared-header.html', './shared-header.html', 'shared-header.html'];
                let fallbackIndex = 0;
                
                const tryFallback = () => {
                    if (fallbackIndex >= fallbackPaths.length) {
                        console.error("❌ Could not load navbar from any path. Showing error message.");
                        navbarContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">⚠️ Navbar failed to load. Please refresh the page.</div>';
                        return;
                    }
                    
                    const fallbackPath = fallbackPaths[fallbackIndex];
                    console.log(`🔄 Trying fallback path: ${fallbackPath}`);
                    
                    fetch(fallbackPath)
                        .then(response => {
                            console.log(`Fallback ${fallbackPath} response:`, response.status);
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            return response.text();
                        })
                        .then(data => {
                            console.log(`✅ Navbar loaded from fallback: ${fallbackPath}`);
                            navbarContainer.innerHTML = data;
                            setTimeout(() => {
                                updateNavbarForUser();
                            }, 100);
                        })
                        .catch(err => {
                            console.warn(`❌ Fallback path ${fallbackPath} failed:`, err);
                            fallbackIndex++;
                            tryFallback();
                        });
                };
                
                tryFallback();
            });
    } else {
        console.error('❌ Navbar container element not found in DOM');
    }
    
    // Load Hero Section
    const pageTitleForHero = document.body ? document.body.getAttribute('data-page-title') || 'PDF Tool' : 'PDF Tool';
    loadHeroSection(pageTitleForHero);
}

function loadHeroSection(pageTitle) {
    // Load Hero Section
    const heroContainer = document.getElementById('shared-hero');
    if (heroContainer) {
        fetch('/shared-hero.html')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.text();
            })
            .then(data => {
                heroContainer.innerHTML = data;
                // Update page title
                const titleElement = document.getElementById('page-title');
                if (titleElement) {
                    titleElement.textContent = pageTitle;
                }
            })
            .catch(error => {
                console.error("Error loading hero:", error);
                // Try fallback
                fetch('../shared-hero.html')
                    .then(response => response.text())
                    .then(data => {
                        heroContainer.innerHTML = data;
                        const titleElement = document.getElementById('page-title');
                        if (titleElement) {
                            titleElement.textContent = pageTitle;
                        }
                    })
                    .catch(err => console.error("Error loading hero from fallback:", err));
            });
    }
}

function loadBreadcrumb() {
    // Load Breadcrumb
    const breadcrumbContainer = document.getElementById('shared-breadcrumb');
    if (breadcrumbContainer) {
        fetch('/shared-breadcrumb.html')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.text();
            })
            .then(data => {
                breadcrumbContainer.innerHTML = data;
            })
            .catch(error => {
                console.error("Error loading breadcrumb:", error);
                // Try fallback
                fetch('../shared-breadcrumb.html')
                    .then(response => response.text())
                    .then(data => {
                        breadcrumbContainer.innerHTML = data;
                    })
                    .catch(err => console.error("Error loading breadcrumb from fallback:", err));
            });
    }
}

// Function to update navbar based on user authentication status
async function updateNavbarForUser(retryCount = 0) {
    const maxRetries = 5;
    const laravelUrl = 'http://82.180.132.134:8000';
    
    // Wait for elements to be available (retry if needed)
    let guestNav = document.getElementById('guest-nav');
    let userNav = document.getElementById('user-nav');
    let userAvatar = document.getElementById('user-avatar');
    
    console.log('updateNavbarForUser called, retry:', retryCount);
    console.log('Elements found:', { guestNav: !!guestNav, userNav: !!userNav, userAvatar: !!userAvatar });
    
    // If elements not found, wait a bit and try again
    if ((!guestNav || !userNav) && retryCount < maxRetries) {
        console.log(`Elements not found, retrying in 300ms... (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
            updateNavbarForUser(retryCount + 1);
        }, 300);
        return;
    }
    
    if (!guestNav || !userNav) {
        console.error('Could not find navbar elements after', maxRetries, 'retries');
        return;
    }
    
    try {
        const apiUrl = `${laravelUrl}/api/current-user`;
        console.log('Fetching user data from:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include', // Include cookies for session
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('API Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ User data received:', userData);
            
            if (userData.authenticated && userData.user_id) {
                // User is logged in - show user dropdown, hide login/signup
                console.log('✅ User is authenticated, updating navbar...');
                console.log('User ID:', userData.user_id, 'User Name:', userData.user?.name || userData.user?.email);
                
                // Hide guest nav completely - use multiple methods
                if (guestNav) {
                    guestNav.style.cssText = 'display: none !important;';
                    guestNav.style.setProperty('display', 'none', 'important');
                    guestNav.hidden = true;
                    guestNav.removeAttribute('style');
                    guestNav.setAttribute('style', 'display: none !important;');
                }
                
                // Show user nav - use multiple methods
                if (userNav) {
                    userNav.style.cssText = 'display: flex !important;';
                    userNav.style.setProperty('display', 'flex', 'important');
                    userNav.hidden = false;
                    userNav.removeAttribute('style');
                    userNav.setAttribute('style', 'display: flex !important;');
                }
                
                // Double-check after a micro-delay
                setTimeout(() => {
                    if (guestNav && guestNav.style.display !== 'none') {
                        console.warn('Guest nav still visible, forcing hide again...');
                        guestNav.style.cssText = 'display: none !important;';
                        guestNav.hidden = true;
                    }
                    if (userNav && userNav.style.display !== 'flex') {
                        console.warn('User nav not visible, forcing show again...');
                        userNav.style.cssText = 'display: flex !important;';
                        userNav.hidden = false;
                    }
                }, 50);
                
                // Set user avatar
                if (userAvatar && userData.user) {
                    const userName = userData.user.name || userData.user.email || 'User';
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;
                    userAvatar.src = avatarUrl;
                    userAvatar.alt = userName;
                    userAvatar.style.cssText = 'cursor: pointer;';
                    console.log('✅ User avatar set:', avatarUrl, 'for user:', userName);
                }
                
                console.log('✅ Navbar updated: User authenticated, showing user nav');
                
                // Prevent any reverting - add observer to maintain state
                if (guestNav && userNav && !window.navbarObserver) {
                    window.navbarObserver = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                                // Check if user is authenticated
                                const userStyle = userNav.getAttribute('style') || '';
                                const isAuth = userStyle.includes('display: flex') || !userNav.hidden;
                                
                                if (isAuth) {
                                    // User is authenticated - keep guest hidden, user visible
                                    const guestStyle = guestNav.getAttribute('style') || '';
                                    if (!guestStyle.includes('display: none') || guestNav.hidden === false) {
                                        console.warn('Guest nav style changed, forcing hide...');
                                        guestNav.style.cssText = 'display: none !important;';
                                        guestNav.hidden = true;
                                    }
                                    const currentUserStyle = userNav.getAttribute('style') || '';
                                    if (!currentUserStyle.includes('display: flex') || userNav.hidden === true) {
                                        console.warn('User nav style changed, forcing show...');
                                        userNav.style.cssText = 'display: flex !important;';
                                        userNav.hidden = false;
                                    }
                                }
                            }
                        });
                    });
                    
                    window.navbarObserver.observe(guestNav, { attributes: true, attributeFilter: ['style', 'class'], subtree: false });
                    window.navbarObserver.observe(userNav, { attributes: true, attributeFilter: ['style', 'class'], subtree: false });
                    console.log('Navbar observer set up to prevent reverting');
                }
                
                // Also set up a continuous check every second to maintain state
                if (!window.navbarMaintainer) {
                    window.navbarMaintainer = setInterval(() => {
                        const gNav = document.getElementById('guest-nav');
                        const uNav = document.getElementById('user-nav');
                        if (gNav && uNav) {
                            const uStyle = uNav.getAttribute('style') || '';
                            const isAuth = uStyle.includes('display: flex') || !uNav.hidden;
                            if (isAuth) {
                                // Force maintain authenticated state
                                if (!gNav.hidden || !gNav.getAttribute('style')?.includes('display: none')) {
                                    gNav.style.cssText = 'display: none !important;';
                                    gNav.hidden = true;
                                }
                                if (uNav.hidden || !uNav.getAttribute('style')?.includes('display: flex')) {
                                    uNav.style.cssText = 'display: flex !important;';
                                    uNav.hidden = false;
                                }
                            }
                        }
                    }, 1000); // Check every second
                    console.log('Navbar maintainer set up to continuously check state');
                }
            } else {
                // User is not logged in - show login/signup, hide user dropdown
                console.log('User is NOT authenticated, showing guest nav');
                
                // Force show guest nav
                if (guestNav) {
                    guestNav.setAttribute('style', 'display: flex !important; visibility: visible !important; opacity: 1 !important;');
                    guestNav.classList.remove('d-none');
                    guestNav.hidden = false;
                }
                
                // Force hide user nav
                if (userNav) {
                    userNav.setAttribute('style', 'display: none !important; visibility: hidden !important; opacity: 0 !important;');
                    userNav.classList.add('d-none');
                    userNav.hidden = true;
                }
                
                console.log('✅ Navbar updated: Guest view');
            }
        } else {
            // API call failed - default to guest view
            const errorText = await response.text();
            console.error('API call failed:', response.status, errorText);
            
            if (guestNav) {
                guestNav.style.cssText = 'display: flex !important;';
                guestNav.hidden = false;
            }
            if (userNav) {
                userNav.style.cssText = 'display: none !important;';
                userNav.hidden = true;
            }
        }
    } catch (error) {
        console.error('❌ Error checking user authentication:', error);
        // Default to guest view on error
        if (guestNav) {
            guestNav.style.cssText = 'display: flex !important;';
            guestNav.hidden = false;
        }
        if (userNav) {
            userNav.style.cssText = 'display: none !important;';
            userNav.hidden = true;
        }
    }
}

// Helper function to get CSRF token
function getCsrfToken() {
    // Try to get from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        return metaTag.getAttribute('content');
    }
    
    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'XSRF-TOKEN') {
            return decodeURIComponent(value);
        }
    }
    
    return null;
}

// Make function available globally for debugging
window.updateNavbarForUser = updateNavbarForUser;

// Also update navbar when page becomes visible (user might have logged in in another tab)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('Page became visible, checking user status...');
        updateNavbarForUser();
    }
});



