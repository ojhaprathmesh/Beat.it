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
   nodemon backend/server
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
├── backend/                                   # Backend-related files
│   ├── server.js                              # Server app
├── frontend/                                  # Frontend-related files
│   ├── public/                                # Public assets
│   │   ├── assets/                            # Asset files
│   │   │   ├── Beat.it Logo.webp              # Project logo image
│   │   │   ├── Beat.it White Logo.webp        # Project white logo image
│   │   │   ├── bg-graphic.webp                # Background graphic image
│   │   │   ├── loading.gif                    # Loading animation
│   │   │   ├── album-covers/                  # Album cover images
│   │   │   │   ├── bhool-bhulaiyaa.webp       # Album cover - Bhool Bhulaiyaa
│   │   │   │   ├── cocktail.webp              # Album cover - Cocktail
│   │   │   │   ├── desi-kalakaar.webp         # Album cover - Desi Kalakaar
│   │   │   │   ├── kabhi-kabhi-aditi.webp     # Album cover - Kabhi Kabhi Aditi
│   │   │   │   ├── sooraj-ki-baahon-mein.webp # Album cover - Sooraj Ki Baahon Mein
│   │   │   │   ├── veer-zaara.webp            # Album cover - Veer Zaara
│   │   │   ├── home/                          # Home-related images
│   │   │   │   ├── Album Cover - 1.webp       # Album cover image 1
│   │   │   │   ├── Album Cover - 2.webp       # Album cover image 2
│   │   │   │   ├── Album Cover - 3.webp       # Album cover image 3
│   │   │   │   ├── Search.webp                # Search image
│   │   │   │   ├── Song Cover - 1.webp        # Song cover image 1
│   │   │   │   ├── Song Cover - 2.webp        # Song cover image 2
│   │   │   │   ├── volume.png                 # Volume icon
│   │   │   ├── login/                         # Login-related images
│   │   │   │   ├── Background.webp            # Login background image
│   │   │   ├── profile/                       # Profile-related images
│   │   │   │   ├── Shrey Jaiswal Pic.webp     # Profile image of Shrey Jaiswal
│   │   │   ├── search/                        # Search-related images
│   │   │   │   ├── Artist Closeup.webp        # Closeup image of artist
│   │   │   ├── signup/                        # Signup-related images
│   │   │   │   ├── DJ Girl.webp               # DJ girl image for signup
│   │   │   │   ├── Graphic Design.webp        # Graphic design element for signup
│   │   │   │   ├── Singing Boy.webp           # Singing boy image for signup
│   │   ├── data/                              # Data files
│   │   │   ├── albumsData.json                # Album data
│   │   │   ├── profileData.json               # Profile data
│   │   │   ├── songsData.json                 # Song data
│   │   ├── scripts/                           # Script files
│   │   │   ├── classes/                       # Class files
│   │   │   │   ├── MusicControl.js            # Music control class
│   │   │   ├── components/                    # Component scripts
│   │   │   │   ├── album.js                   # Album-related components
│   │   │   │   ├── navbar.js                  # Navbar components
│   │   │   │   ├── player.js                  # Player components
│   │   │   │   ├── songs.js                   # Song components
│   │   │   ├── handlers/                      # Event handler scripts
│   │   │   │   ├── albumHandler.js            # Album event handler
│   │   │   │   ├── formHandler.js             # Form event handler
│   │   │   │   ├── navbarHandler.js           # Navbar event handler
│   │   │   │   ├── playerHandler.js           # Player event handler
│   │   │   │   ├── songHandler.js             # Song event handler
│   │   │   ├── utility/                       # Utility scripts
│   │   │   │   ├── fetchSongData.js           # Fetch song data
│   │   │   │   ├── loading.js                 # Loading utility
│   │   │   │   ├── shuffle.js                 # Shuffle utility
│   │   ├── styles/                            # CSS files
│   │   │   ├── background.css                 # Background styles
│   │   │   ├── colors.css                     # Color scheme
│   │   │   ├── font.css                       # Fonts
│   │   │   ├── form.css                       # Form styles
│   │   │   ├── logo.css                       # Logo styles
│   │   │   ├── navbar.css                     # Navbar styles
│   │   │   ├── player.css                     # Player styles
│   │   │   ├── profile.css                    # Profile styles
│   │   │   ├── song-album.css                 # Song/album styles
│   ├── uploads/                               # Uploaded audio files
│   │   ├── bhool-bhulaiyaa.mp3                # Bhool Bhulaiyaa song
│   │   ├── daaru-desi.mp3                     # Daaru Desi song
│   │   ├── desi-kalakaar.mp3                  # Desi Kalakaar song
│   │   ├── dil-dhadakne-do.mp3                # Dil Dhadakne Do song
│   │   ├── do-pal.mp3                         # Do Pal song
│   │   ├── im-your-dj-tonight.mp3             # I'm Your DJ Tonight song
│   │   ├── kabhi-kabhi-aditi.mp3              # Kabhi Kabhi Aditi song
│   │   ├── labon-ko-bhool-bhulaiyaa.mp3       # Labon Ko Bhool Bhulaiyaa song
│   │   ├── love-dose.mp3                      # Love Dose song
│   │   ├── main-yahaan-hoon.mp3               # Main Yahaan Hoon song
│   │   ├── mere-dholna-bhool-bhulaiyaa.mp3    # Mere Dholna song
│   │   ├── nazrein-milaana-nazrein-churaana.mp3 # Nazrein Milaana song
│   │   ├── pappu-cant-dance.mp3               # Pappu Can't Dance song
│   │   ├── second-hand-jawaani.mp3            # Second Hand Jawaani song
│   │   ├── senorita.mp3                       # Senorita song
│   │   ├── sooraj-ki-baahon-mein.mp3          # Sooraj Ki Baahon Mein song
│   │   ├── tera-naam-japdi-phiran.mp3         # Tera Naam Japdi Phiran song
│   │   ├── tere-liye.mp3                      # Tere Liye song
│   ├── views/                                 # Views directory for EJS templates
│   │   ├── AlbumPage.ejs                      # Album page template
│   │   ├── HomePage.ejs                       # Home page template
│   │   ├── LoginPage.ejs                      # Login page template
│   │   ├── ProfilePage.ejs                    # Profile page template
│   │   ├── SearchPage.ejs                     # Search page template
│   │   ├── SignupPage.ejs                     # Signup page template
│   │   ├── partials/                          # Partials for reusability
│   │   │   ├── navbar.ejs                     # Navbar partial
│   │   │   ├── songs.ejs                      # Songs partial
├── .gitattributes                             # Git attributes
├── .gitignore                                 # Git ignore file
├── LICENSE                                    # License file
├── README.md                                  # Project documentation
├── package.json                               # Package configuration
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
