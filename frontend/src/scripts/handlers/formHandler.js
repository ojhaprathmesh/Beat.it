const strengthIndicator = document.getElementById("strength-indicator") || (() => {
    const indicator = document.createElement("p");
    indicator.id = "strength-indicator";
    return indicator;
})();

// Restrict name inputs to alphabets only
const handleNameInputRestriction = (nameInputs) => {
    nameInputs.forEach((input) => {
        input.addEventListener("keydown", (event) => {
            const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
            if (!/^[a-zA-Z]$/.test(event.key) && !allowedKeys.includes(event.key)) {
                event.preventDefault();
            }
        });
    });
};

// Validate if passwords match
const validatePasswordMatch = (passCreate, passRepeat, errorContainer) => {
    if (passCreate.value !== passRepeat.value) {
        errorContainer.textContent = "Passwords do not match.";
        return false;
    }
    errorContainer.textContent = ""; // Clear error if match
    return true;
};

// Check password strength
const checkPasswordStrength = (passwordElement) => {
    const password = passwordElement.value;
    let strength = "Weak", color = "red";

    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        strength = "Strong"; color = "green";
    } else if (password.length >= 6) {
        strength = "Moderate"; color = "orange";
    }

    strengthIndicator.textContent = password ? `Password strength: ${strength}` : "";
    strengthIndicator.style.color = color;
    passwordElement.parentElement.appendChild(strengthIndicator);
};

// Save profile data to local storage
const handleProfileDataIO = async (profileData, errorContainer) => {
    try {
        const profiles = JSON.parse(localStorage.getItem("profiles")) || [];
        if (profiles.some((profile) => profile.email === profileData.email)) {
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

// Form submission handler
const handlePasswordValidation = (form) => {
    const [firstNameInput, lastNameInput, emailInput, passCreate, passRepeat] = [
        "#first-name-label", "#last-name-label", "#email-label", "#password-label", "#confirm-password-label"
    ].map((id) => form.querySelector(id));

    const errorContainer = document.querySelector(".error-messages") || (() => {
        const error = document.createElement("p");
        error.className = "error-messages";
        return error;
    })();
    errorContainer.style.bottom = "165px";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
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
        form.appendChild(errorContainer);
    });

    passCreate.addEventListener("input", () => {
        checkPasswordStrength(passCreate);
        errorContainer.textContent = validateCharacters(passCreate.value)
            ? "" : "Password contains invalid characters.";
        form.appendChild(errorContainer);
    });
};

// Validate password characters
const validateCharacters = (string) => {
    if (string === "") return true;
    return /^[\w!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]+$/.test(string);
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const nameInputs = document.querySelectorAll(".name-input");
    handleNameInputRestriction(nameInputs);
    handlePasswordValidation(form);
});
