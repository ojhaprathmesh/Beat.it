const handleNameInputRestriction = (nameInputs) => {
    const restrictInputToAlphabets = (event) => {
        const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key);

        if (!/^[a-zA-Z]$/.test(event.key) && !isControlKey) {
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

    let strengthMessage;
    if (passwordValue.length >= 8 && /[A-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue) && /[^A-Za-z0-9]/.test(passwordValue)) {
        strengthMessage = "Strong";
        strengthIndicator.style.color = "green";
    } else if (passwordValue.length >= 6) {
        strengthMessage = "Moderate";
        strengthIndicator.style.color = "orange";
    } else if (passwordValue.length > 0) {
        strengthMessage = "Weak";
        strengthIndicator.style.color = "red";
    } else { 
        strengthMessage = "None";
        strengthIndicator.style.color = "blue";
    }

    strengthIndicator.textContent = `Password strength: ${strengthMessage}`;
    passwordElement.parentElement.appendChild(strengthIndicator);
};

const handlePasswordValidation = (form) => {
    const errorContainer = document.getElementById("error-messages") || document.createElement('p');
    errorContainer.id = "error-messages";

    const passCreate = form.querySelector("#password-label");
    const passRepeat = form.querySelector("#repeat-password-label");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (validatePasswordMatch(passCreate, passRepeat, errorContainer)) {
            form.reset();
            errorContainer.textContent = "";
        } else {
            form.appendChild(errorContainer);
        }
    });

    passCreate.addEventListener("input", () => {
        if (validatePasswordCharacters(passCreate.value)) {
            checkPasswordStrength(passCreate.value, passCreate);
        } else {
            errorContainer.textContent = "Password contains invalid characters (\`, \', \", \$). Please remove them.";
            form.appendChild(errorContainer);
        }
    });
};

const validatePasswordCharacters = (password) => {
    return !/[,'"`$]/.test(password);
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const nameInputs = document.querySelectorAll(".name-input");

    handleNameInputRestriction(nameInputs);
    handlePasswordValidation(form);
});
