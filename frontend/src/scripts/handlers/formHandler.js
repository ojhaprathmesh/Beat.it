import { fetchProfileData } from "../apis/fetchProfileData.js";

// Restricts input for name fields to alphabets only
const handleNameInputRestriction = (nameInputs) => {
    const restrictInputToAlphabets = (event) => {

        // Allowing control keys like Backspace, Delete, and Arrow keys
        const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key);

        if (!/^[a-zA-Z]$/.test(event.key) && !isControlKey && validateCharacters(event.key)) {
            event.preventDefault();
        }
    };

    nameInputs.forEach((nameInput) => {
        nameInput.addEventListener("keydown", restrictInputToAlphabets);
    });
};

const validatePasswordMatch = (passCreate, passRepeat, errorContainer) => {
    if (passCreate.value !== passRepeat.value) {
        errorContainer.textContent = "Passwords do not match. Please re-enter your password.";

        document.querySelector(`label[for="${passCreate.id}"]`).style.color = "red";
        document.querySelector(`label[for="${passRepeat.id}"]`).style.color = "red";

        // Clears error and resets color on input change, triggering only once
        [passCreate, passRepeat].forEach(input => {
            input.addEventListener("input", () => {
                document.querySelector(`label[for="${input.id}"]`).style.color = "";
                errorContainer.textContent = "";
            }, { once: true });
        });
        return false;
    }
    return true;
};

const checkPasswordStrength = (passwordValue, passwordElement) => {
    const strengthIndicator = document.getElementById("strength-indicator") || document.createElement("p");
    strengthIndicator.id = "strength-indicator";

    // Sets strength level with respective color feedback
    let strengthMessage = passwordValue.length >= 8 && /[A-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue) && /[^A-Za-z0-9]/.test(passwordValue)
        ? (strengthIndicator.style.color = "green", "Strong")
        : passwordValue.length >= 6
            ? (strengthIndicator.style.color = "orange", "Moderate")
            : passwordValue.length > 0
                ? (strengthIndicator.style.color = "red", "Weak")
                : (strengthIndicator.style.color = "", "");

    strengthIndicator.textContent = strengthMessage ? `Password strength: ${strengthMessage}` : "";
    passwordElement.parentElement.appendChild(strengthIndicator);
};

// Handles data storage in localStorage and sends data to an external API
const handleProfileDataIO = async (profileData, errorContainer) => {
    try {
        // This is to simulate API calls in later stages
        // const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(profileData),
        // });
        //
        // const result = await response.json();

        let currentId = parseInt(localStorage.getItem("currentProfileId")) || 0;
        currentId += 1;
        profileData.id = currentId; // Use timestamp as a unique ID for local storage

        // Retrieve existing profiles from localStorage
        const existingProfiles = JSON.parse(localStorage.getItem("profiles")) || [];
        existingProfiles.push(profileData);

        // Save the updated profiles array in localStorage
        localStorage.setItem("profiles", JSON.stringify(existingProfiles));

        return true;
    } catch (error) {
        console.error("Error saving profile:", error);
        errorContainer.textContent = "Failed to save profile. Please try again.";
        return false;
    }
};

// Main form handler that validates password and submits data
const handlePasswordValidation = (form) => {
    const errorContainer = document.getElementById("error-messages") || document.createElement('p');
    errorContainer.id = "error-messages";

    const passCreate = form.querySelector("#password-label");
    const passRepeat = form.querySelector("#repeat-password-label");
    const firstNameInput = form.querySelector("#first-name-label");
    const lastNameInput = form.querySelector("#last-name-label");
    const emailInput = form.querySelector("#email-label");

    // Form submission event handler
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Validates password match before proceeding with data handling
        if (validatePasswordMatch(passCreate, passRepeat, errorContainer)) {
            const profileData = {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                email: emailInput.value,
                password: passCreate.value,
            };

            const isSaved = await handleProfileDataIO(profileData, errorContainer);

            // Resets form and redirects if data was saved successfully
            if (isSaved) {
                form.reset();
                errorContainer.textContent = "";
                const strengthIndicator = document.getElementById("strength-indicator");
                if (strengthIndicator) strengthIndicator.textContent = "";
                document.querySelector(`label[for="${passCreate.id}"]`).style.color = "";
                document.querySelector(`label[for="${passRepeat.id}"]`).style.color = "";

                window.location.href = "HomePage.html";
            }
        } else {
            form.appendChild(errorContainer); // Displays error if password validation fails
        }
    });

    // Updates password strength as user types and checks for invalid characters
    passCreate.addEventListener("input", () => {
        if (validateCharacters(passCreate.value)) {
            errorContainer.textContent = "";
            checkPasswordStrength(passCreate.value, passCreate);
        } else {
            errorContainer.textContent = "Password contains invalid characters (', \", ` , $ , \\). Please remove them.";
            form.appendChild(errorContainer);

            const strengthIndicator = document.getElementById("strength-indicator");
            if (strengthIndicator) strengthIndicator.textContent = "";
        }
    });
};

const validateCharacters = (password) => {
    // Only allows a-z, A-Z, 0-9, and certain special characters
    return !/[^\w\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password) && !/\s/.test(password);
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const nameInputs = document.querySelectorAll(".name-input");

    handleNameInputRestriction(nameInputs);
    handlePasswordValidation(form);
});
