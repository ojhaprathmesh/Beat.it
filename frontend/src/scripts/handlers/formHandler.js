const strengthIndicator = document.getElementById("strength-indicator") || (() => {
    const indicator = document.createElement("p");
    indicator.id = "strength-indicator";
    return indicator;
})();

// Create error container outside form submission handler
const errorContainer = document.querySelector(".error-messages") || (() => {
    const error = document.createElement("p");
    error.className = "error-messages";
    error.style.bottom = "165px";  // Setting style here
    return error;
})();

// Restrict name inputs to alphabets only
const handleNameInputRestriction = (nameInputs) => {
    nameInputs.forEach(input => {
        input.addEventListener("keydown", (event) => {
            if (!/^[a-zA-Z]$/.test(event.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key)) {
                event.preventDefault();
            }
        });
    });
};

// Form submission handler
const handleFormSubmission = (form) => {
    const [firstNameInput, lastNameInput, emailInput, passCreate, passRepeat] = [
        "#first-name-label", "#last-name-label", "#email-label", "#password-label", "#confirm-password-label"
    ].map(id => form.querySelector(id));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Check password strength before validating passwords match
        if (!checkPasswordStrength(passCreate)) {
            errorContainer.textContent = "Password is too weak. Please choose a stronger password.";
            form.appendChild(errorContainer);
            return; // Prevent form submission
        }

        if (validatePasswordMatch(passCreate, passRepeat, errorContainer)) {
            const profileData = {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                email: emailInput.value,
                password: passCreate.value,
            };
            if (await handleProfileDataIO(profileData, errorContainer)) {
                form.reset();
                strengthIndicator.textContent = "";
                window.location.href = "/home";
            }
        }
        form.appendChild(errorContainer); // Append error container once
    });

    // Checking password strength and matching password continuously
    const handlePasswordInput = () => {
        checkPasswordStrength(passCreate);
        validatePasswordMatch(passCreate, passRepeat, errorContainer);
        form.appendChild(errorContainer); // Append error container once per input event
    };

    passCreate.addEventListener("input", handlePasswordInput);
    passRepeat.addEventListener("input", handlePasswordInput);
};

// Save profile data to local storage
const handleProfileDataIO = async (profileData, errorContainer) => {
    try {
        const profiles = JSON.parse(localStorage.getItem("profiles")) || [];
        if (profiles.some(profile => profile.email === profileData.email)) {
            throw new Error("Duplicate email");
        }

        profileData.id = profiles.length ? profiles[profiles.length - 1].id + 1 : 1;
        profiles.push(profileData);
        localStorage.setItem("profiles", JSON.stringify(profiles));
        return true;
    } catch (error) {
        errorContainer.textContent = error.message === "Duplicate email"
            ? "This email is already associated with another account."
            : "Failed to save profile. Please try again.";
        return false;
    }
};

// Check password strength
const checkPasswordStrength = (passwordElement) => {
    const password = passwordElement.value;

    const isStrong = /^[A-Za-z\d[^A-Za-z0-9]]{8,}$/.test(password);
    const strength = isStrong ? "Strong" : (password.length >= 6 ? "Moderate" : "Weak");
    const color = isStrong ? "green" : password.length >= 6 ? "orange" : "red";

    strengthIndicator.textContent = password ? `Password strength: ${strength}` : "";
    strengthIndicator.style.color = color;
    passwordElement.parentElement.appendChild(strengthIndicator);

    return strength !== "Weak";
};

// Validate if passwords match
const validatePasswordMatch = (passCreate, passRepeat, errorContainer) => {
    if (passCreate.value !== passRepeat.value) {
        errorContainer.textContent = "Passwords do not match.";
        return false;
    }
    errorContainer.textContent = "";  // Clear error if match
    return true;
};

// Validate input characters
const validateCharacters = (string) => {
    if (string === "") return true;
    return /^[\w!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]+$/.test(string);
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const nameInputs = document.querySelectorAll(".name-input");
    handleNameInputRestriction(nameInputs);
    handleFormSubmission(form);
});
