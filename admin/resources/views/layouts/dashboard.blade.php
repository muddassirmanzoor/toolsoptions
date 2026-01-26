<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Dashboard - I Love PDF')</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="{{ asset('modules/compressPDF/assets/logo-ilovepdf.svg') }}">
    <link rel="alternate icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- intl-tel-input CSS (for phone input with flags like register page) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.3/build/css/intlTelInput.css">

    <!-- Custom CSS (cache-busted) -->
    <link href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}" rel="stylesheet">
</head>
<body class="dashboard-body">
    <div class="dashboard-wrapper">
        <!-- Header -->
        <header class="dashboard-header">
            <div class="container-fluid">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <a class="navbar-brand" href="http://82.180.132.134:3000/">
                            <img src="{{ asset('modules/compressPDF/assets/logo-ilovepdf.svg') }}" alt="I Love PDF" class="logo-img">
                        </a>
                        <nav class="header-nav ms-4">
                            <a href="#" class="nav-link">Browse Tools</a>
                            <a href="#" class="nav-link">How It Works</a>
                            <a href="#" class="nav-link">All Tools PDF</a>
                            <a href="#" class="nav-link">Pricing Plan</a>
                        </nav>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <a href="{{ route('dashboard.premium') }}" class="btn-upgrade">Upgrade Plan</a>
                        <div class="dropdown">
                            <img src="https://ui-avatars.com/api/?name={{ urlencode(auth()->user()->name ?? 'User') }}&background=6366f1&color=fff&size=40" alt="Profile" class="profile-img-header" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="{{ route('dashboard') }}">Dashboard</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <form method="POST" action="{{ route('logout') }}" style="display: inline;">
                                        @csrf
                                        <button type="submit" class="dropdown-item" style="border: none; background: none; width: 100%; text-align: left; cursor: pointer;">Logout</button>
                                    </form>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="dashboard-container">
            <!-- Sidebar (attached directly to header) -->
            <aside class="dashboard-sidebar">
                <div class="sidebar-content">
                    <!-- User Profile Section -->
                    <div class="sidebar-profile">
                        <div class="profile-avatar-wrapper">
                            <img src="https://ui-avatars.com/api/?name={{ urlencode(auth()->user()->name ?? 'User') }}&background=6366f1&color=fff&size=80" alt="Profile" class="profile-img-sidebar">
                        </div>
                        <div class="profile-info">
                            <h3 class="profile-name">{{ auth()->user()->first_name ?? auth()->user()->name ?? 'User' }} {{ auth()->user()->last_name ?? '' }}</h3>
                            <i class="fas fa-bell profile-bell"></i>
                        </div>
                    </div>

                    <!-- Navigation Sections -->
                    <nav class="sidebar-nav">
                        <!-- Profile Section -->
                        <div class="nav-section">
                            <h4 class="nav-section-title">Profile</h4>
                            <ul class="nav-list">
                                <li class="nav-item {{ request()->routeIs('dashboard') ? 'active' : '' }}">
                                    <a href="{{ route('dashboard') }}" class="nav-link">
                                        <i class="fas fa-user"></i>
                                        <span>My Account</span>
                                    </a>
                                </li>
                                <li class="nav-item {{ request()->routeIs('dashboard.security') ? 'active' : '' }}">
                                    <a href="{{ route('dashboard.security') }}" class="nav-link">
                                        <i class="fas fa-shield-alt"></i>
                                        <span>Security</span>
                                    </a>
                                </li>
                                <li class="nav-item {{ request()->routeIs('dashboard.team') ? 'active' : '' }}">
                                    <a href="{{ route('dashboard.team') }}" class="nav-link">
                                        <i class="fas fa-users"></i>
                                        <span>Team</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <!-- Signature Section -->
                        <div class="nav-section">
                            <h4 class="nav-section-title">Signature</h4>
                            <ul class="nav-list">
                                <li class="nav-item {{ request()->routeIs('dashboard.tasks') ? 'active' : '' }}">
                                    <a href="{{ route('dashboard.tasks') }}" class="nav-link">
                                        <i class="fas fa-clock"></i>
                                        <span>Last tasks</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-eye"></i>
                                        <span>Overview</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-paper-plane"></i>
                                        <span>Sent</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-lightbulb"></i>
                                        <span>Business idea</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-inbox"></i>
                                        <span>Inbox</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-check-circle"></i>
                                        <span>Signed</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-file-alt"></i>
                                        <span>Templates</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-address-book"></i>
                                        <span>Contacts</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-cog"></i>
                                        <span>Settings</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <!-- Billing Section -->
                        <div class="nav-section">
                            <h4 class="nav-section-title">Billing</h4>
                            <ul class="nav-list">
                                <li class="nav-item {{ request()->routeIs('dashboard.plans') ? 'active' : '' }}">
                                    <a href="{{ route('dashboard.plans') }}" class="nav-link">
                                        <i class="fas fa-box"></i>
                                        <span>Plan & Packages</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-building"></i>
                                        <span>Business Details</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link">
                                        <i class="fas fa-file-invoice"></i>
                                        <span>Invoices</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    <!-- Upgrade Button -->
                    <div class="sidebar-upgrade">
                        <a href="{{ route('dashboard.premium') }}" class="btn-upgrade-sidebar">Upgrade to Premium</a>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="dashboard-main">
                <!-- Banner (in dashboard content, not in header) -->
                <div class="header-banner">
                    <p class="banner-text">Get 25% off of IlovePDF for unlimited access to thousands of online classes. <a href="#" class="banner-link">Click here to redeem</a></p>
                </div>
                <div class="main-content-wrapper">
                    @if(session('success'))
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            {{ session('success') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    @endif

                    @if(session('error'))
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            {{ session('error') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    @endif

                    @if($errors->any())
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    @endif

                    @yield('content')
                </div>
            </main>
        </div>
    </div>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- intl-tel-input JS -->
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.3/build/js/intlTelInput.min.js"></script>

    <script>
        (function () {
            function setDashboardHeaderHeightVar() {
                const header = document.querySelector('.dashboard-header');
                if (!header) return;
                const h = Math.ceil(header.getBoundingClientRect().height);
                document.documentElement.style.setProperty('--dashboard-header-height', `${h}px`);
            }

            document.addEventListener('DOMContentLoaded', setDashboardHeaderHeightVar);
            window.addEventListener('load', setDashboardHeaderHeightVar);
            window.addEventListener('resize', setDashboardHeaderHeightVar);
        })();
    </script>
    
    @stack('scripts')
    @yield('scripts')
</body>
</html>

