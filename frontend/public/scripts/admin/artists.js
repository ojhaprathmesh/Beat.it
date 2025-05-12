/**
 * Admin Artists Module
 * Handles artist and album management functionality
 */

const AdminArtists = {
    /**
     * Initialize the artists module
     */
    init: async function() {
        try {
            await Promise.all([
                this.loadArtists(),
                this.loadAlbums()
            ]);
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing admin artists module:', error);
            alert('Error loading artist data. Please try refreshing the page.');
        }
    },

    /**
     * Load artists from API
     */
    loadArtists: async function() {
        try {
            const response = await fetch('/api/admin/artists');
            
            if (!response.ok) {
                throw new Error('Failed to fetch artists');
            }
            
            const artists = await response.json();
            this.renderArtistsTable(artists);
            return artists;
            
        } catch (error) {
            console.error('Error loading artists:', error);
            throw error;
        }
    },

    /**
     * Load albums from API
     */
    loadAlbums: async function() {
        try {
            const response = await fetch('/api/admin/albums');
            
            if (!response.ok) {
                throw new Error('Failed to fetch albums');
            }
            
            const albums = await response.json();
            this.renderAlbumsTable(albums);
            return albums;
            
        } catch (error) {
            console.error('Error loading albums:', error);
            throw error;
        }
    },

    /**
     * Render artists table
     * @param {Array} artists - List of artists
     */
    renderArtistsTable: function(artists) {
        const artistsTable = document.getElementById('artists-table').querySelector('tbody');
        artistsTable.innerHTML = '';
        
        if (artists.length > 0) {
            artists.forEach(artist => {
                const tr = document.createElement('tr');
                tr.dataset.artistId = artist.id;
                tr.innerHTML = `
                    <td>${artist.name}</td>
                    <td>${artist.albums?.length || 0}</td>
                    <td>${artist.songs?.length || 0}</td>
                    <td>
                        <button class="admin-btn edit-artist" data-id="${artist.id}">Edit</button>
                        <button class="admin-btn admin-btn-danger delete-artist" data-id="${artist.id}">Delete</button>
                    </td>
                `;
                artistsTable.appendChild(tr);
            });
        } else {
            artistsTable.innerHTML = '<tr><td colspan="4">No artists found</td></tr>';
        }
    },

    /**
     * Render albums table
     * @param {Array} albums - List of albums
     */
    renderAlbumsTable: function(albums) {
        const albumsTable = document.getElementById('albums-table').querySelector('tbody');
        albumsTable.innerHTML = '';
        
        if (albums.length > 0) {
            albums.forEach(album => {
                const tr = document.createElement('tr');
                tr.dataset.albumId = album.id;
                tr.innerHTML = `
                    <td>${album.title}</td>
                    <td>${album.artist}</td>
                    <td>${album.year || 'N/A'}</td>
                    <td>${album.songs?.length || 0}</td>
                    <td>
                        <button class="admin-btn edit-album" data-id="${album.id}">Edit</button>
                        <button class="admin-btn admin-btn-danger delete-album" data-id="${album.id}">Delete</button>
                    </td>
                `;
                albumsTable.appendChild(tr);
            });
        } else {
            albumsTable.innerHTML = '<tr><td colspan="5">No albums found</td></tr>';
        }
    },

    /**
     * Setup event listeners for artist and album actions
     */
    setupEventListeners: function() {
        // Artist tab functionality
        const artistsTab = document.getElementById('artists-tab');
        const albumsTab = document.getElementById('albums-tab');
        
        if (artistsTab && albumsTab) {
            artistsTab.addEventListener('click', () => {
                document.getElementById('artists-content').classList.add('active');
                document.getElementById('albums-content').classList.remove('active');
                artistsTab.classList.add('active');
                albumsTab.classList.remove('active');
            });
            
            albumsTab.addEventListener('click', () => {
                document.getElementById('albums-content').classList.add('active');
                document.getElementById('artists-content').classList.remove('active');
                albumsTab.classList.add('active');
                artistsTab.classList.remove('active');
            });
        }
        
        // Artist buttons
        const addArtistBtn = document.getElementById('add-artist-btn');
        if (addArtistBtn) {
            addArtistBtn.addEventListener('click', this.showAddArtistModal.bind(this));
        }
        
        // Album buttons
        const addAlbumBtn = document.getElementById('add-album-btn');
        if (addAlbumBtn) {
            addAlbumBtn.addEventListener('click', this.showAddAlbumModal.bind(this));
        }
        
        // Artist form
        const artistForm = document.getElementById('artist-form');
        if (artistForm) {
            artistForm.addEventListener('submit', this.handleArtistFormSubmit.bind(this));
        }
        
        // Album form
        const albumForm = document.getElementById('album-form');
        if (albumForm) {
            albumForm.addEventListener('submit', this.handleAlbumFormSubmit.bind(this));
        }
        
        // Artist table actions (using event delegation)
        const artistsTable = document.getElementById('artists-table');
        if (artistsTable) {
            artistsTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-artist')) {
                    this.editArtist(e.target.dataset.id);
                } else if (e.target.classList.contains('delete-artist')) {
                    this.deleteArtist(e.target.dataset.id);
                }
            });
        }
        
        // Album table actions (using event delegation)
        const albumsTable = document.getElementById('albums-table');
        if (albumsTable) {
            albumsTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-album')) {
                    this.editAlbum(e.target.dataset.id);
                } else if (e.target.classList.contains('delete-album')) {
                    this.deleteAlbum(e.target.dataset.id);
                }
            });
        }
    },

    /**
     * Show add artist modal
     */
    showAddArtistModal: function() {
        const modal = document.getElementById('artist-modal');
        const form = document.getElementById('artist-form');
        
        // Reset form
        form.reset();
        form.dataset.mode = 'add';
        document.getElementById('artist-modal-title').textContent = 'Add New Artist';
        
        // Show modal
        modal.classList.add('active');
    },

    /**
     * Show add album modal
     */
    showAddAlbumModal: function() {
        const modal = document.getElementById('album-modal');
        const form = document.getElementById('album-form');
        
        // Reset form
        form.reset();
        form.dataset.mode = 'add';
        document.getElementById('album-modal-title').textContent = 'Add New Album';
        
        // Populate artist dropdown
        this.populateArtistDropdown();
        
        // Show modal
        modal.classList.add('active');
    },

    /**
     * Populate artist dropdown in album form
     */
    populateArtistDropdown: async function() {
        const artistSelect = document.getElementById('album-artist');
        
        try {
            // Get artists if we don't have them yet
            let artists = await this.loadArtists();
            
            artistSelect.innerHTML = '<option value="">Select Artist</option>';
            
            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist.id;
                option.textContent = artist.name;
                artistSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating artist dropdown:', error);
        }
    },

    /**
     * Edit artist
     * @param {string} artistId - Artist ID to edit
     */
    editArtist: async function(artistId) {
        try {
            const response = await fetch(`/api/admin/artists/${artistId}`);
            if (!response.ok) throw new Error('Failed to fetch artist details');
            
            const artist = await response.json();
            
            // Fill form
            const form = document.getElementById('artist-form');
            form.dataset.mode = 'edit';
            form.dataset.artistId = artistId;
            
            document.getElementById('artist-name').value = artist.name;
            document.getElementById('artist-bio').value = artist.bio || '';
            
            // Show modal
            document.getElementById('artist-modal-title').textContent = 'Edit Artist';
            document.getElementById('artist-modal').classList.add('active');
            
        } catch (error) {
            console.error('Error fetching artist details:', error);
            alert('Error loading artist details. Please try again.');
        }
    },

    /**
     * Edit album
     * @param {string} albumId - Album ID to edit
     */
    editAlbum: async function(albumId) {
        try {
            const response = await fetch(`/api/admin/albums/${albumId}`);
            if (!response.ok) throw new Error('Failed to fetch album details');
            
            const album = await response.json();
            
            // Populate artist dropdown first
            await this.populateArtistDropdown();
            
            // Fill form
            const form = document.getElementById('album-form');
            form.dataset.mode = 'edit';
            form.dataset.albumId = albumId;
            
            document.getElementById('album-title').value = album.title;
            document.getElementById('album-artist').value = album.artistId;
            document.getElementById('album-year').value = album.year || '';
            document.getElementById('album-description').value = album.description || '';
            
            // Show modal
            document.getElementById('album-modal-title').textContent = 'Edit Album';
            document.getElementById('album-modal').classList.add('active');
            
        } catch (error) {
            console.error('Error fetching album details:', error);
            alert('Error loading album details. Please try again.');
        }
    },

    /**
     * Delete artist
     * @param {string} artistId - Artist ID to delete
     */
    deleteArtist: async function(artistId) {
        if (!confirm('Are you sure you want to delete this artist? This will also delete all associated albums and songs.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/artists/${artistId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete artist');
            
            // Remove from table
            const row = document.querySelector(`tr[data-artist-id="${artistId}"]`);
            if (row) row.remove();
            
            // Refresh albums list too
            await this.loadAlbums();
            
            alert('Artist deleted successfully');
            
        } catch (error) {
            console.error('Error deleting artist:', error);
            alert('Error deleting artist. Please try again.');
        }
    },

    /**
     * Delete album
     * @param {string} albumId - Album ID to delete
     */
    deleteAlbum: async function(albumId) {
        if (!confirm('Are you sure you want to delete this album? Songs associated with this album will be kept but will no longer be linked to an album.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/albums/${albumId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete album');
            
            // Remove from table
            const row = document.querySelector(`tr[data-album-id="${albumId}"]`);
            if (row) row.remove();
            
            alert('Album deleted successfully');
            
        } catch (error) {
            console.error('Error deleting album:', error);
            alert('Error deleting album. Please try again.');
        }
    },

    /**
     * Handle artist form submission
     * @param {Event} e - Form submit event
     */
    handleArtistFormSubmit: async function(e) {
        e.preventDefault();
        
        const form = e.target;
        const isEditMode = form.dataset.mode === 'edit';
        
        const artistData = {
            name: document.getElementById('artist-name').value,
            bio: document.getElementById('artist-bio').value
        };
        
        try {
            const url = isEditMode 
                ? `/api/admin/artists/${form.dataset.artistId}` 
                : '/api/admin/artists';
                
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(artistData)
            });
            
            if (!response.ok) throw new Error('Failed to save artist');
            
            // Close modal and refresh list
            document.getElementById('artist-modal').classList.remove('active');
            await this.loadArtists();
            
        } catch (error) {
            console.error('Error saving artist:', error);
            alert('Error saving artist data. Please try again.');
        }
    },

    /**
     * Handle album form submission
     * @param {Event} e - Form submit event
     */
    handleAlbumFormSubmit: async function(e) {
        e.preventDefault();
        
        const form = e.target;
        const isEditMode = form.dataset.mode === 'edit';
        
        const albumData = {
            title: document.getElementById('album-title').value,
            artistId: document.getElementById('album-artist').value,
            year: document.getElementById('album-year').value,
            description: document.getElementById('album-description').value
        };
        
        try {
            const url = isEditMode 
                ? `/api/admin/albums/${form.dataset.albumId}` 
                : '/api/admin/albums';
                
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(albumData)
            });
            
            if (!response.ok) throw new Error('Failed to save album');
            
            // Close modal and refresh lists
            document.getElementById('album-modal').classList.remove('active');
            await Promise.all([
                this.loadAlbums(),
                this.loadArtists() // Refresh artists too as album counts may have changed
            ]);
            
        } catch (error) {
            console.error('Error saving album:', error);
            alert('Error saving album data. Please try again.');
        }
    }
};

// Export the module
window.AdminArtists = AdminArtists; 