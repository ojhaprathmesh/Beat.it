/**
 * Password Reset Utility Functions
 */

// Validate password strength
const validatePasswordStrength = (password) => {
  // Strong password regex: 8-16 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const strongRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^*_+~?!])[A-Za-z\d@#$%^*_+~?!]{8,16}$/;
  return strongRegex.test(password);
};

// Validate password match
const validatePasswordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

// Show password feedback
const getPasswordFeedback = (password) => {
  if (!password) return { strength: 'None', color: 'gray', message: '' };
  
  // Check for min length
  if (password.length < 8) {
    return { 
      strength: 'Weak', 
      color: 'red', 
      message: 'Password must be at least 8 characters'
    };
  }
  
  // Check for max length
  if (password.length > 16) {
    return { 
      strength: 'Invalid', 
      color: 'red', 
      message: 'Password must be at most 16 characters'
    };
  }
  
  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    return { 
      strength: 'Weak', 
      color: 'red', 
      message: 'Password must include at least one uppercase letter'
    };
  }
  
  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    return { 
      strength: 'Weak', 
      color: 'red', 
      message: 'Password must include at least one lowercase letter'
    };
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    return { 
      strength: 'Moderate', 
      color: 'orange', 
      message: 'Password must include at least one number'
    };
  }
  
  // Check for special character
  if (!/[@#$%^*_+~?!]/.test(password)) {
    return { 
      strength: 'Moderate', 
      color: 'orange', 
      message: 'Password must include at least one special character (@#$%^*_+~?!)'
    };
  }
  
  // Strong password
  return { 
    strength: 'Strong', 
    color: 'green', 
    message: 'Password strength: Strong'
  };
};

// Display password strength feedback
const displayPasswordStrength = (passwordElement, indicatorElement) => {
  const password = passwordElement.value;
  const feedback = getPasswordFeedback(password);
  
  indicatorElement.textContent = feedback.message;
  indicatorElement.style.color = feedback.color;
};

// Export for use in other files
window.passwordReset = {
  validatePasswordStrength,
  validatePasswordsMatch,
  getPasswordFeedback,
  displayPasswordStrength
}; 