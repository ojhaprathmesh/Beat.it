/**
 * Admin Users Module
 * Handles user management functionality
 */

const AdminUsers = {
    /**
     * Initialize the users module
     */
    init: async function() {
        try {
            await this.loadUsers();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing admin users module:', error);
            alert('Error loading user data. Please try refreshing the page.');
        }
    },

    /**
     * Load users from API
     */
    loadUsers: async function() {
        try {
            const response = await fetch('/api/admin/users');
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const users = await response.json();
            this.renderUsersTable(users);
            
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    },

    /**
     * Render users table
     * @param {Array} users - List of users
     */
    renderUsersTable: function(users) {
        const usersTable = document.getElementById('users-table').querySelector('tbody');
        usersTable.innerHTML = '';
        
        if (users.length > 0) {
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.dataset.userId = user.id;
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.isAdmin ? 'admin' : 'user'}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="admin-btn edit-user" data-id="${user.id}">Edit</button>
                        <button class="admin-btn admin-btn-danger delete-user" data-id="${user.id}">Delete</button>
                    </td>
                `;
                usersTable.appendChild(tr);
            });
        } else {
            usersTable.innerHTML = '<tr><td colspan="5">No users found</td></tr>';
        }
    },

    /**
     * Setup event listeners for user actions
     */
    setupEventListeners: function() {
        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', this.showAddUserModal.bind(this));
        }
        
        // Form submission
        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', this.handleUserFormSubmit.bind(this));
        }
        
        // Edit and delete buttons (using event delegation)
        const usersTable = document.getElementById('users-table');
        if (usersTable) {
            usersTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-user')) {
                    this.editUser(e.target.dataset.id);
                } else if (e.target.classList.contains('delete-user')) {
                    this.deleteUser(e.target.dataset.id);
                }
            });
        }
    },

    /**
     * Show add user modal
     */
    showAddUserModal: function() {
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-form');
        
        // Reset form
        form.reset();
        form.dataset.mode = 'add';
        document.getElementById('user-modal-title').textContent = 'Add New User';
        
        // Show modal
        modal.classList.add('active');
    },

    /**
     * Edit user
     * @param {string} userId - User ID to edit
     */
    editUser: async function(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user details');
            
            const user = await response.json();
            
            // Fill form
            const form = document.getElementById('user-form');
            form.dataset.mode = 'edit';
            form.dataset.userId = userId;
            
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-role').value = user.role;
            
            // Show modal
            document.getElementById('user-modal-title').textContent = 'Edit User';
            document.getElementById('user-modal').classList.add('active');
            
        } catch (error) {
            console.error('Error fetching user details:', error);
            alert('Error loading user details. Please try again.');
        }
    },

    /**
     * Delete user
     * @param {string} userId - User ID to delete
     */
    deleteUser: async function(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete user');
            
            // Remove from table
            const row = document.querySelector(`tr[data-user-id="${userId}"]`);
            if (row) row.remove();
            
            alert('User deleted successfully');
            
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
        }
    },

    /**
     * Handle user form submission
     * @param {Event} e - Form submit event
     */
    handleUserFormSubmit: async function(e) {
        e.preventDefault();
        
        const form = e.target;
        const isEditMode = form.dataset.mode === 'edit';
        const userData = {
            username: document.getElementById('user-username').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value
        };
        
        // Add password for new users
        if (!isEditMode) {
            userData.password = document.getElementById('user-password').value;
        }
        
        try {
            const url = isEditMode 
                ? `/api/admin/users/${form.dataset.userId}` 
                : '/api/admin/users';
                
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) throw new Error('Failed to save user');
            
            // Close modal and refresh list
            document.getElementById('user-modal').classList.remove('active');
            await this.loadUsers();
            
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user data. Please try again.');
        }
    }
};

// Export the module
window.AdminUsers = AdminUsers; 