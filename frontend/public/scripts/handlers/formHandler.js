const strengthIndicator = document.getElementById("strength-indicator") || (() => {
    const indicator = document.createElement("p");
    indicator.id = "strength-indicator";
    return indicator;
})();

// Create an error container outside form submission handler
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
    // Exit if the form doesn't exist
    if (!form) {
        console.error("Form element not found");
        return;
    }

    const [firstNameInput, lastNameInput, emailInput, passCreate, passRepeat] = [
        "#first-name-label", "#last-name-label", "#email-label", "#password-label", "#confirm-password-label"
    ].map(id => form.querySelector(id));

    // Check if all required elements exist
    if (!firstNameInput || !lastNameInput || !emailInput || !passCreate || !passRepeat) {
        console.error("Required form elements not found");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
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

                try {
                    const success = await handleProfileDataIO(profileData, errorContainer);
                    if (success) {
                        form.reset();
                        strengthIndicator.textContent = "";
                        window.location.href = "/home";
                    }
                } catch (ioError) {
                    console.error("Error during profile data submission:", ioError);
                    errorContainer.textContent = ioError.message || "Error during registration. Please try again.";
                    form.appendChild(errorContainer);
                }
            }
        } catch (err) {
            console.error("Form submission error:", err);
            errorContainer.textContent = "An unexpected error occurred. Please try again.";
            form.appendChild(errorContainer);
        }
    });

    // Checking password strength and matching password continuously
    const handlePasswordInput = () => {
        try {
            checkPasswordStrength(passCreate);
            validatePasswordMatch(passCreate, passRepeat, errorContainer);
            form.appendChild(errorContainer); // Append the error container once per input event
        } catch (err) {
            console.error("Password validation error:", err);
            // Do not display this error to the user as it's during typing
        }
    };

    passCreate.addEventListener("input", handlePasswordInput);
    passRepeat.addEventListener("input", handlePasswordInput);
};

// Firebase authentication
const handleProfileDataIO = async (profileData, errorContainer) => {
    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        });

        // Handle HTTP errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Registration failed" }));
            errorContainer.textContent = errorData.error || "Registration failed";
            return false;
        }

        return true; // Successfully registered
    } catch (error) {
        console.error("Registration error:", error);
        errorContainer.textContent = error.message || "Connection error. Please try again.";
        return false;
    }
};

// Check password strength and validate characters
const checkPasswordStrength = (passwordElement) => {
    try {
        const password = passwordElement.value;

        // Regex for strong password validation
        const strongRegex = /^(?=.[A-Z])(?=.[a-z])(?=.\d)(?=.[@#$%^_+~?!])[A-Za-z\d@#$%^_+~?!]{8,16}$/;
        const invalidCharRegex = /[^A-Za-z\d@#$%^*_+~?!]/; // Regex for invalid characters

        // Check for invalid characters
        if (invalidCharRegex.test(password)) {
            strengthIndicator.textContent = "Password contains invalid characters.";
            strengthIndicator.style.color = "red";
            passwordElement.parentElement.appendChild(strengthIndicator);
            return false;
        }

        // Check password strength
        const isStrong = strongRegex.test(password);
        const strength = isStrong ? "Strong" : (password.length >= 6 ? "Moderate" : "Weak");
        const color = isStrong ? "green" : password.length >= 6 ? "orange" : "red";

        strengthIndicator.textContent = password ? `Password strength: ${strength}` : "";
        strengthIndicator.style.color = color;
        passwordElement.parentElement.appendChild(strengthIndicator);

        return strength !== "Weak";
    } catch (error) {
        console.error("Error checking password strength:", error);
        return false;
    }
};

// Validate if passwords match
const validatePasswordMatch = (passCreate, passRepeat, errorContainer) => {
    try {
        if (!passCreate || !passRepeat) return false;

        if (passCreate.value !== passRepeat.value) {
            errorContainer.textContent = "Passwords do not match.";
            return false;
        }
        errorContainer.textContent = "";  // Clear error if match
        return true;
    } catch (error) {
        console.error("Error validating password match:", error);
        return false;
    }
};

// Validate input characters
document.addEventListener("DOMContentLoaded", () => {
    try {
        const form = document.getElementById("signup-form");
        const nameInputs = document.querySelectorAll(".name-input");

        if (form) {
            handleNameInputRestriction(nameInputs);
            handleFormSubmission(form);
        }
    } catch (err) {
        console.error("Error initializing form handler:", err);
    }
});