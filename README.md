## How to Use
1. **Clone the Repository:**
   ```
   git clone https://github.com/ojhaprathmesh/Beat.it_Team.git
   ```
   
2. **Install Dependencies:**
   ```
   npm install
   ```
   
3. **Run the server:**
   ```
   npm run dev
   ```

## Firebase Integration

This project uses Firebase for authentication and data storage. This allows for user authentication and song storage without needing to store files locally.

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Firebase Configuration**:
   Firebase config is already set up in `backend/firebase/firebaseConfig.js`. The application uses these credentials for all Firebase services.

3. **Run the Application**:
   ```bash
   npm run dev
   ```

### Authentication Features

User authentication is handled by Firebase Authentication:
- User signup process creates a Firebase Auth account and stores additional user data in Firestore
- Login process verifies credentials against Firebase Auth
- The "Forgot Password" feature sends a password reset email through Firebase

### Storage Features

Songs are stored in Firebase Storage:
- Song metadata is stored in Firestore
- Audio files are accessed via secure URLs
- Profile pictures are stored in Cloudinary

## Project Structure

```plaintext
Beat.it/
├── backend/                                 # Backend code
│   ├── cloudinary/                          # Cloudinary integration
│   │   ├── cloudinaryConfig.js              # Cloudinary configuration
│   │   └── imageService.js                  # Profile picture storage service
│   ├── firebase/                            # Firebase integration
│   │   ├── authService.js                   # Authentication service
│   │   ├── firebaseConfig.js                # Firebase configuration
│   │   └── songsService.js                  # Songs management service
│   └── server.js                            # Express server and API endpoints
├── frontend/                                # Frontend code
│   ├── public/                              # Static assets
│   │   ├── assets/                          # Images and media
│   │   │   ├── album-covers/                # Album cover images
│   │   │   ├── home/                        # Home page assets
│   │   │   ├── login/                       # Login page assets
│   │   │   ├── profile/                     # Profile assets
│   │   │   ├── search/                      # Search assets
│   │   │   └── signup/                      # Signup assets
│   │   ├── data/                            # JSON data files
│   │   │   ├── albumsData.json              # Album data
│   │   │   ├── profileData.json             # Profile data
│   │   │   └── songsData.json               # Song data
│   │   ├── scripts/                         # Frontend JavaScript
│   │   │   ├── classes/                     # JS classes
│   │   │   ├── components/                  # UI components
│   │   │   ├── handlers/                    # Event handlers
│   │   │   └── utility/                     # Utility functions
│   │   └── styles/                          # CSS styles
│   │       ├── background.css               # Background styles
│   │       ├── colors.css                   # Color variables
│   │       ├── font.css                     # Typography
│   │       ├── form.css                     # Form styles
│   │       ├── logo.css                     # Logo styles
│   │       ├── navbar.css                   # Navigation styles
│   │       ├── player.css                   # Music player styles
│   │       ├── profile.css                  # Profile page styles
│   │       └── song-album.css               # Song/album styles
│   ├── uploads/                             # Audio files (for local testing)
│   └── views/                               # EJS templates
│       ├── AlbumPage.ejs                    # Album page
│       ├── HomePage.ejs                     # Home page
│       ├── LoginPage.ejs                    # Login page
│       ├── ProfilePage.ejs                  # Profile page
│       ├── ResetPasswordPage.ejs            # Password reset page
│       ├── SearchPage.ejs                   # Search page
│       ├── SignupPage.ejs                   # Signup page
│       └── partials/                        # Reusable EJS components
│           ├── navbar.ejs                   # Navigation bar
│           └── songs.ejs                    # Song components
├── package.json                             # Project dependencies
└── README.md                                # Project documentation
```

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ojhaprathmesh">
        <img src="https://github.com/ojhaprathmesh.png" width="100px;" style="border-radius: 50%;" alt="Prathmesh Ojha"/>
        <br />
        <sub><b>Prathmesh Ojha</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/jaisw07">
        <img src="https://github.com/jaisw07.png" width="100px;" style="border-radius: 50%;" alt="Shrey Jaiswal"/>
        <br />
        <sub><b>Shrey Jaiswal</b> (v1.0 only)</sub>
      </a>
    </td>
  </tr>
</table>
