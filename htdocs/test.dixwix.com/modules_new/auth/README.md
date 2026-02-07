# Authentication Pages

## Overview
Authentication pages (Sign Up and Sign In) created following the same UI pattern as existing PDF tool modules.

## Files Created

### 1. `register.html` - Sign Up Page
- **Location**: `/modules/auth/register.html`
- **Features**:
  - Same navbar as existing modules
  - Purple hero section with "Sign Up" title
  - Breadcrumb navigation: "Home | Sign Up"
  - Two-column layout:
    - **Left**: Login form (First Name, Password, social login)
    - **Right**: Create Account card (purple background with star decoration)
  - Security section with badges
  - Orange CTA banner
  - Footer with links and social icons

### 2. `login.html` - Sign In Page
- **Location**: `/modules/auth/login.html`
- **Features**:
  - Same navbar as existing modules
  - Purple hero section with "Sign In" title
  - Breadcrumb navigation: "Home | Sign In"
  - Centered login form (Email, Password, social login)
  - Security section with badges
  - Orange CTA banner
  - Footer with links and social icons

### 3. `auth.css` - Stylesheet
- **Location**: `/modules/auth/auth.css`
- **Features**:
  - Matches existing module CSS patterns
  - Uses same color scheme (Purple #5A26EF, Orange #F56129)
  - Same typography (Poppins, Montserrat, Sora)
  - Responsive design matching module breakpoints
  - All decorative elements styled (triangles, stars)

## Design Pattern Consistency

### ✅ Matches Existing Modules:
1. **Navbar**: White background, logo left, nav center, Login/Sign Up right
2. **Hero Section**: Purple background (#5A26EF), decorative triangle/star, centered title
3. **Breadcrumb**: White background, decorative elements, "Home | [Page]" format
4. **Main Content**: White background, custom content area
5. **Footer**: Orange background, links organized in columns, social icons

### 🎨 Color Scheme:
- Primary Purple: `#5A26EF`
- Primary Orange: `#F56129`
- White: `#FFFFFF`
- Black: `#000000`
- Gray Border: `#E4E4E4`

### 📐 Typography:
- Headings: Montserrat (700-900 weight)
- Body: Sora (400-600 weight)
- Navigation: Poppins (700 weight)

## Assets Used

All assets reference existing module assets:
- Logo: `../compressPDF/assets/logo-ilovepdf.svg`
- Triangle decoration: `../compressPDF/assets/triangle-orange-1.svg`
- Star decoration: `../compressPDF/assets/star-orange.svg`
- Security badges: `/assests/` directory

## Next Steps for Laravel Integration

1. **Convert to Blade Templates**:
   - Rename `.html` to `.blade.php`
   - Move to `resources/views/auth/`
   - Update asset paths to use Laravel's `asset()` helper

2. **Create Laravel Controllers**:
   - `Auth/RegisterController.php`
   - `Auth/LoginController.php`

3. **Set Up Routes**:
   ```php
   Route::get('/register', [RegisterController::class, 'showRegistrationForm']);
   Route::post('/register', [RegisterController::class, 'register']);
   Route::get('/login', [LoginController::class, 'showLoginForm']);
   Route::post('/login', [LoginController::class, 'login']);
   ```

4. **Database Migration**:
   - Create `users` table migration
   - Add fields: name, email, password, role, etc.

5. **Form Handling**:
   - Add CSRF tokens
   - Add validation
   - Add error/success message display

## Access URLs

Once integrated with Laravel:
- Sign Up: `/register` or `/auth/register`
- Sign In: `/login` or `/auth/login`

Currently accessible as static files:
- `/modules/auth/register.html`
- `/modules/auth/login.html`


