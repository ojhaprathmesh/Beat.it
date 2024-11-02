const form = document.getElementById("signup-form");
const firstName_input = document.getElementById("first-name-label");
const lastName_input = document.getElementById("last-name-label");
const email_input = document.getElementById("email-label");
const password_input = document.getElementById("password-label");
const repeatPassword_input = document.getElementById("repeat-password-label");
const error_message = document.getElementById("error-messages");

form.addEventListener("submit", (e) => {
    // e.preventDefault() prevent submit
    let errors = []

    if(firstName_input) {
        //if we have a first name input, we are in signup
        errors = getSignupFormErrors(firstName_input.value, email_input.value, password_input.value, repeatPassword_input.value) 
    }
    else{
        //if we are in login page
        errors = getLoginFormErrors(email_input.value, password_input.value)
    }

    if(errors.length>0) {
        e.preventDefault();
        error_message.innerText = errors.join(".\n")
    }
})

function getSignupFormErrors(firstName, email, password, repeatPassword) {
    let errors = [];

    if(firstName === '' || firstName == null) {
        errors.push('First Name is required');
        firstName_input.parentElement.classList.add('incorrect')
    }
    if(email === '' || email == null) {
        errors.push('Email ID is required');
        email_input.parentElement.classList.add('incorrect')
    }
    if(password === '' || password == null) {
        errors.push('Password is required');
        password_input.parentElement.classList.add('incorrect')
    }
    if(repeatPassword === '' || repeatPassword == null) {
        errors.push('Repeat Password field is required');
        repeatPassword_input .parentElement.classList.add('incorrect')
    }
    if(password !== repeatPassword) {
        errors.push('Password does not match repeated password')
        password_input .parentElement.classList.add('incorrect')
        repeatPassword_input .parentElement.classList.add('incorrect')
    }
    if(password.length < 8) {
        errors.push('Password must have atleast 8 characters')
        password_input .parentElement.classList.add('incorrect')
    }
    return errors;
}

function getLoginFormErrors(email, password) {
    let errors = [];

    if(email === '' || email == null) {
        errors.push('Email ID is required');
        email_input.parentElement.classList.add('incorrect')
    }
    if(password === '' || password == null) {
        errors.push('Password is required');
        password_input.parentElement.classList.add('incorrect')
    }
    return errors;
}

const allInputs = [firstName_input, email_input, password_input, repeatPassword_input].filter(input => input!=null)

allInputs.forEach(input=>{
    input.addEventListener('input', ()=>{
        if(input.parentElement.classList.contains('incorrect')) {
            input.parentElement.classList.remove('incorrect')
            error_message.innerText=""
        }
    })
})