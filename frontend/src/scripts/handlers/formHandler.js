const restrictInputToAlphabets = (event) => {
    const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key);

    if (!/^[a-zA-Z]$/.test(event.key) && !isControlKey) {
        event.preventDefault();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const errorMessage = document.getElementById("error-messages");
    const nameInputs = document.querySelectorAll(".name-input");

    nameInputs.forEach((nameInput) => {
        nameInput.addEventListener("keydown", restrictInputToAlphabets);
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formDataMap = new Map(new FormData(form).entries());

        if (formDataMap.get("pass-create") !== formDataMap.get("pass-repeat")) {
            errorMessage.textContent = "Passwords do not match. Please re-enter your password.";
        } else {
            errorMessage.textContent = "";
            form.reset();
            nameInputs.forEach((nameInput) => {
                nameInput.removeEventListener("keydown", restrictInputToAlphabets);
            });
        }
    });
});
