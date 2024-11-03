function fetchProfileData() {
    const storedProfiles = localStorage.getItem('profiles');
    return storedProfiles ? JSON.parse(storedProfiles) : [];
}

export { fetchProfileData };
