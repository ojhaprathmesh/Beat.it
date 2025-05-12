/**
 * Admin Storage Module
 * Handles file storage management using Vercel Blob
 */

const AdminStorage = {
    /**
     * Initialize the storage module
     */
    init: async function() {
        try {
            await this.loadStorageData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing admin storage module:', error);
            alert('Error loading storage data. Please try refreshing the page.');
        }
    },

    /**
     * Load storage data from API
     */
    loadStorageData: async function() {
        try {
            const response = await fetch('/api/admin/storage');
            
            if (!response.ok) {
                throw new Error('Failed to fetch storage data');
            }
            
            const data = await response.json();
            
            // Update storage usage stats
            this.updateStorageStats(data.stats);
            
            // Update files list
            this.renderFilesList(data.files);
            
        } catch (error) {
            console.error('Error loading storage data:', error);
            throw error;
        }
    },

    /**
     * Update storage statistics display
     * @param {Object} stats - Storage usage statistics
     */
    updateStorageStats: function(stats) {
        document.getElementById('total-storage').textContent = stats.total || '0 GB';
        document.getElementById('used-storage').textContent = stats.used || '0 MB';
        document.getElementById('available-storage').textContent = stats.available || '0 GB';
        
        // Update progress bar
        const percentage = stats.percentage || 0;
        const progressBar = document.getElementById('storage-progress-bar');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
            
            // Change color based on usage
            if (percentage > 90) {
                progressBar.classList.add('critical');
            } else if (percentage > 70) {
                progressBar.classList.add('warning');
            } else {
                progressBar.classList.add('normal');
            }
        }
    },

    /**
     * Render files list table
     * @param {Array} files - List of files in storage
     */
    renderFilesList: function(files) {
        const filesTable = document.getElementById('files-table').querySelector('tbody');
        filesTable.innerHTML = '';
        
        if (files && files.length > 0) {
            files.forEach(file => {
                const tr = document.createElement('tr');
                tr.dataset.fileUrl = file.url;
                
                // Format file size
                const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                
                // Extract filename from URL
                const filename = this.getFilenameFromUrl(file.url);
                
                // Format date
                const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
                
                tr.innerHTML = `
                    <td>${filename}</td>
                    <td>${file.type || 'Unknown'}</td>
                    <td>${sizeInMB} MB</td>
                    <td>${uploadDate}</td>
                    <td>
                        <button class="admin-btn view-file" data-url="${file.url}">View</button>
                        <button class="admin-btn admin-btn-danger delete-file" data-url="${file.url}">Delete</button>
                    </td>
                `;
                filesTable.appendChild(tr);
            });
        } else {
            filesTable.innerHTML = '<tr><td colspan="5">No files found</td></tr>';
        }
    },

    /**
     * Extract filename from URL
     * @param {string} url - File URL
     * @returns {string} - Extracted filename
     */
    getFilenameFromUrl: function(url) {
        if (!url) return 'Unknown';
        
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            
            // Get the last part of the path (the filename)
            const parts = pathname.split('/');
            return parts[parts.length - 1];
        } catch (error) {
            console.error('Error parsing URL:', error);
            return url.substring(url.lastIndexOf('/') + 1);
        }
    },

    /**
     * Setup event listeners for storage actions
     */
    setupEventListeners: function() {
        // Upload button
        const uploadBtn = document.getElementById('upload-file-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', this.showUploadModal.bind(this));
        }
        
        // Upload form
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', this.handleFileUpload.bind(this));
        }
        
        // Files table actions (using event delegation)
        const filesTable = document.getElementById('files-table');
        if (filesTable) {
            filesTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('view-file')) {
                    window.open(e.target.dataset.url, '_blank');
                } else if (e.target.classList.contains('delete-file')) {
                    this.deleteFile(e.target.dataset.url);
                }
            });
        }
    },

    /**
     * Show upload file modal
     */
    showUploadModal: function() {
        const modal = document.getElementById('upload-modal');
        const form = document.getElementById('upload-form');
        
        // Reset form
        form.reset();
        
        // Show modal
        modal.classList.add('active');
    },

    /**
     * Handle file upload
     * @param {Event} e - Form submit event
     */
    handleFileUpload: async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('file-upload');
        const filePathInput = document.getElementById('file-path');
        
        if (fileInput.files.length === 0) {
            alert('Please select a file to upload');
            return;
        }
        
        const file = fileInput.files[0];
        const filePath = filePathInput.value.trim() || 'uploads';
        
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', filePath);
        
        try {
            // Show loading state
            document.getElementById('upload-submit').disabled = true;
            document.getElementById('upload-submit').textContent = 'Uploading...';
            
            const response = await fetch('/api/admin/storage/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload file');
            }
            
            // Reset form and close modal
            document.getElementById('upload-form').reset();
            document.getElementById('upload-modal').classList.remove('active');
            
            // Refresh storage data
            await this.loadStorageData();
            
            alert('File uploaded successfully');
            
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // Reset button state
            document.getElementById('upload-submit').disabled = false;
            document.getElementById('upload-submit').textContent = 'Upload';
        }
    },

    /**
     * Delete file from storage
     * @param {string} fileUrl - URL of the file to delete
     */
    deleteFile: async function(fileUrl) {
        if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/admin/storage/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileUrl })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete file');
            }
            
            // Remove from table
            const row = document.querySelector(`tr[data-file-url="${fileUrl}"]`);
            if (row) row.remove();
            
            // Refresh storage stats
            await this.loadStorageData();
            
            alert('File deleted successfully');
            
        } catch (error) {
            console.error('Error deleting file:', error);
            alert(`Error: ${error.message}`);
        }
    }
};

// Export the module
window.AdminStorage = AdminStorage; 