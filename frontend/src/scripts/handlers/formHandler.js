document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const errorMessage = document.getElementById("error-messages");

    if (form) { // Check if the form is successfully retrieved
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            const formDataMap = new Map(formData.entries());

            if (formDataMap.get("pass-create") !== formDataMap.get("pass-repeat")) {
                errorMessage.textContent = "Passwords do not match. Please re-enter your password.";
            } else {
                errorMessage.textContent = "";
                form.reset();
            }
        });
    } else {
        console.error("Form not found!");
    }
});
