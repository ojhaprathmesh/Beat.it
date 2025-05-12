/**
 * Admin Analytics Module
 * Handles analytics visualization using Chart.js
 */

const AdminAnalytics = {
    /**
     * Charts instances
     */
    charts: {},
    
    /**
     * Initialize the analytics module
     */
    init: async function() {
        try {
            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded. Analytics cannot be initialized.');
                return;
            }
            
            // Load analytics data and initialize charts
            await this.loadAnalyticsData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing admin analytics module:', error);
            alert('Error loading analytics data. Please try refreshing the page.');
        }
    },

    /**
     * Load analytics data from API
     */
    loadAnalyticsData: async function() {
        try {
            const response = await fetch('/api/admin/analytics');
            
            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }
            
            const data = await response.json();
            
            // Initialize charts with data
            this.initUserGrowthChart(data.userGrowth);
            this.initSongsByGenreChart(data.songsByGenre);
            this.initPlaysByTimeChart(data.playsByTime);
            this.initTopArtistsChart(data.topArtists);
            
        } catch (error) {
            console.error('Error loading analytics data:', error);
            throw error;
        }
    },

    /**
     * Initialize User Growth Chart
     * @param {Object} data - User growth data
     */
    initUserGrowthChart: function(data) {
        const ctx = document.getElementById('user-growth-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.charts.userGrowth) {
            this.charts.userGrowth.destroy();
        }
        
        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'New Users',
                    data: data.values,
                    borderColor: '#4a6cf7',
                    backgroundColor: 'rgba(74, 108, 247, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'white'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    },

    /**
     * Initialize Songs by Genre Chart
     * @param {Object} data - Songs by genre data
     */
    initSongsByGenreChart: function(data) {
        const ctx = document.getElementById('songs-by-genre-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.charts.songsByGenre) {
            this.charts.songsByGenre.destroy();
        }
        
        this.charts.songsByGenre = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#4a6cf7',
                        '#6c5ce7',
                        '#00d2d3',
                        '#feca57',
                        '#ff6b6b',
                        '#1dd1a1',
                        '#48dbfb',
                        '#ff9ff3'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    },

    /**
     * Initialize Plays by Time Chart
     * @param {Object} data - Plays by time data
     */
    initPlaysByTimeChart: function(data) {
        const ctx = document.getElementById('plays-by-time-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.charts.playsByTime) {
            this.charts.playsByTime.destroy();
        }
        
        this.charts.playsByTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Song Plays',
                    data: data.values,
                    backgroundColor: 'rgba(0, 210, 211, 0.5)',
                    borderColor: '#00d2d3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    },

    /**
     * Initialize Top Artists Chart
     * @param {Object} data - Top artists data
     */
    initTopArtistsChart: function(data) {
        const ctx = document.getElementById('top-artists-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.charts.topArtists) {
            this.charts.topArtists.destroy();
        }
        
        this.charts.topArtists = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Play Count',
                    data: data.values,
                    backgroundColor: 'rgba(108, 92, 231, 0.5)',
                    borderColor: '#6c5ce7',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    },

    /**
     * Setup event listeners for analytics actions
     */
    setupEventListeners: function() {
        // Time range selector
        const timeRangeSelect = document.getElementById('time-range-select');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', this.handleTimeRangeChange.bind(this));
        }
        
        // Export data buttons
        const exportButtons = document.querySelectorAll('.export-data-btn');
        exportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const dataType = e.target.dataset.type;
                this.exportData(dataType);
            });
        });
        
        // Handle window resize for chart responsiveness
        window.addEventListener('resize', this.handleResize.bind(this));
    },

    /**
     * Handle time range change
     * @param {Event} e - Change event
     */
    handleTimeRangeChange: async function(e) {
        const timeRange = e.target.value;
        
        try {
            // Show loading state
            document.querySelectorAll('.chart-container').forEach(container => {
                container.classList.add('loading');
            });
            
            const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }
            
            const data = await response.json();
            
            // Update charts with new data
            this.initUserGrowthChart(data.userGrowth);
            this.initSongsByGenreChart(data.songsByGenre);
            this.initPlaysByTimeChart(data.playsByTime);
            this.initTopArtistsChart(data.topArtists);
            
        } catch (error) {
            console.error('Error updating analytics data:', error);
            alert('Error updating analytics data. Please try again.');
        } finally {
            // Hide loading state
            document.querySelectorAll('.chart-container').forEach(container => {
                container.classList.remove('loading');
            });
        }
    },

    /**
     * Handle window resize to redraw charts
     */
    handleResize: function() {
        // Use a debounce function to avoid excessive redrawing
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            // Update each chart
            for (const chartName in this.charts) {
                if (this.charts[chartName]) {
                    this.charts[chartName].resize();
                }
            }
        }, 250);
    },

    /**
     * Export analytics data
     * @param {string} dataType - Type of data to export
     */
    exportData: async function(dataType) {
        try {
            const response = await fetch(`/api/admin/analytics/export?type=${dataType}`);
            
            if (!response.ok) {
                throw new Error('Failed to export data');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `beatit-${dataType}-analytics.csv`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please try again.');
        }
    }
};

// Export the module
window.AdminAnalytics = AdminAnalytics; 