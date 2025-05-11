# Beat It API - Postman Collection

This repository contains a Postman collection and environment for testing the Beat It music application API.

## Files

- `Beat_it_API.postman_collection.json`: The Postman collection containing all API endpoints
- `Beat_it_Environment.postman_environment.json`: The Postman environment containing variables used in the collection

## How to Use

### Importing the Collection and Environment

1. Open Postman
2. Click on "Import" in the top left corner
3. Select "Upload Files" and choose both the collection and environment files
4. Click "Import" to add them to your Postman workspace

### Setting Up the Environment

1. In the top right corner of Postman, click on the environment dropdown
2. Select "Beat It - Local Development" from the dropdown
3. The environment variables will be loaded and ready to use

### Environment Variables

The following environment variables are available:

- `baseUrl`: The base URL of the API (default: http://localhost:3000)
- `email`: The email address to use for authentication
- `password`: The password to use for authentication
- `token`: The token to use for password reset
- `songId`: The ID of a song to use in favorites operations

You can modify these variables by clicking on the "Eye" icon in the top right corner and then clicking "Edit".

### Using the Collection

The collection is organized into the following folders:

1. **Authentication**: Endpoints for user registration, login, logout, and password reset
2. **User Profile**: Endpoints for managing user profiles and preferences
3. **Favorites**: Endpoints for managing user favorite songs
4. **Data**: Endpoints for retrieving application data (songs, albums, profiles)

To use an endpoint:

1. Select the desired request from the collection
2. Click "Send" to execute the request
3. View the response in the bottom panel

### Authentication Flow

To test the complete authentication flow:

1. Use the "Register User" endpoint to create a new account
2. Use the "Login" endpoint to authenticate and get a session cookie
3. Use other endpoints that require authentication
4. Use the "Logout" endpoint to end your session

## Notes

- The API uses session cookies for authentication, which Postman will automatically store and send with subsequent
  requests
- Make sure the Beat It server is running on the URL specified in the environment variables
- If you're testing on a different environment, update the `baseUrl` variable accordingly