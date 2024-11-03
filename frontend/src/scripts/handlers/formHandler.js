const profile = [];

const handleNameInputRestriction = (nameInputs) => {
    const restrictInputToAlphabets = (event) => {
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

const handlePasswordValidation = (form) => {
    const errorContainer = document.getElementById("error-messages") || document.createElement('p');
    errorContainer.id = "error-messages";

    const passCreate = form.querySelector("#password-label");
    const passRepeat = form.querySelector("#repeat-password-label");
    const firstNameInput = form.querySelector("#first-name-label");
    const lastNameInput = form.querySelector("#last-name-label");
    const emailInput = form.querySelector("#email-label");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (validatePasswordMatch(passCreate, passRepeat, errorContainer)) {
            const profileData = {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                email: emailInput.value,
                password: passCreate.value,
            };

            try {
                const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profileData),
                });

                const result = await response.json();
                profileData.id = result.id; // Unique identifier

                profile.push(profileData);
                localStorage.setItem("profile", JSON.stringify(profile));

                form.reset();
                errorContainer.textContent = "";
                const strengthIndicator = document.getElementById("strength-indicator");
                if (strengthIndicator) strengthIndicator.textContent = "";
                document.querySelector(`label[for="${passCreate.id}"]`).style.color = "";
                document.querySelector(`label[for="${passRepeat.id}"]`).style.color = "";

                window.location.href = "HomePage.html";
            } catch (error) {
                console.error("Error saving profile:", error);
                errorContainer.textContent = "Failed to save profile. Please try again.";
            }
        } else {
            form.appendChild(errorContainer);
        }
    });

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
    // This regex allows: a-z, A-Z, 0-9, no whitespaces and special characters except ', ", `, $, \
    return !/[^\w\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password) && !/\s/.test(password);
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const nameInputs = document.querySelectorAll(".name-input");

    handleNameInputRestriction(nameInputs);
    handlePasswordValidation(form);
});
