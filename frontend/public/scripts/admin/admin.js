/**
 * Main Admin Module
 * Initializes all admin modules and handles common functionality
 */

const AdminPanel = {
    /**
     * Current active section
     */
    activeSection: 'dashboard',
    
    /**
     * Initialize the admin panel
     */
    init: function() {
        // Setup sidebar navigation
        this.setupNavigation();
        
        // Load initial section (dashboard by default)
        this.loadSection('dashboard');
        
        console.log('Admin panel initialized');
    },
    
    /**
     * Setup sidebar navigation
     */
    setupNavigation: function() {
        const navItems = document.querySelectorAll('.admin-nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                
                if (section) {
                    this.loadSection(section);
                    
                    // Update active class
                    navItems.forEach(navItem => navItem.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });
    },
    
    /**
     * Load admin section
     * @param {string} section - Section to load
     */
    loadSection: async function(section) {
        try {
            // Show loading state
            document.getElementById('admin-content-container').innerHTML = '<div class="admin-loading">Loading...</div>';
            
            // Always load the section content, even if it's the active section
            const response = await fetch(`/admin/sections/${section}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${section} section`);
            }
            
            const html = await response.text();
            document.getElementById('admin-content-container').innerHTML = html;
            
            // Initialize the appropriate module based on section
            this.initializeModule(section);
            
            // Update active section
            this.activeSection = section;
            
            // Update page title
            document.getElementById('section-title').textContent = this.getSectionTitle(section);
            
        } catch (error) {
            console.error(`Error loading ${section} section:`, error);
            document.getElementById('admin-content-container').innerHTML = 
                `<div class="admin-error">Error loading ${section} section. Please try again.</div>`;
        }
    },
    
    /**
     * Initialize the appropriate module for the section
     * @param {string} section - Section name
     */
    initializeModule: function(section) {
        switch (section) {
            case 'dashboard':
                if (window.AdminDashboard) AdminDashboard.init();
                break;
            case 'users':
                if (window.AdminUsers) AdminUsers.init();
                break;
            case 'songs':
                if (window.AdminSongs) AdminSongs.init();
                break;
            case 'artists':
                if (window.AdminArtists) AdminArtists.init();
                break;
            case 'storage':
                if (window.AdminStorage) AdminStorage.init();
                break;
            case 'analytics':
                if (window.AdminAnalytics) AdminAnalytics.init();
                break;
            default:
                console.warn(`No module found for section: ${section}`);
        }
    },
    
    /**
     * Get section title based on section name
     * @param {string} section - Section name
     * @returns {string} - Section title
     */
    getSectionTitle: function(section) {
        const titles = {
            dashboard: 'Dashboard',
            users: 'User Management',
            songs: 'Song Management',
            artists: 'Artists & Albums',
            storage: 'Storage Management',
            analytics: 'Analytics'
        };
        
        return titles[section] || 'Dashboard';
    }
};

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AdminPanel.init();
}); 