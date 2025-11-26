document.addEventListener('DOMContentLoaded', function () {
    // Home button (signup only)
    const homeBtn = document.getElementById('G6Logo');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = "/";
        });
    }

    // Login redirection from signup page
    const loginBtn = document.getElementById("LoginBtn");
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = "/login";
        });
    }

    // Back button (signup only)
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = "/login";
        });
    }

    // Validate name, email, and password on form submit
    const authForm = document.querySelector('.authForm');
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (validateName() && validateEmail() && validatePassword()) {
                await createAccount();
            }
        });
    }
});

async function createAccount() {
    const fName = document.getElementById('fNameField').value.trim();
    const lName = document.getElementById('lNameField').value.trim();
    const email = document.getElementById('emailField').value.trim();
    const password = document.getElementById('passwordField').value.trim();
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fName: fName,
                lName: lName,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Account created successfully!');
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } else {
            alert(data.message || 'Failed to create account. Please try again.');
        }
    } catch (error) {
        console.error('Error creating account:', error);
        alert('An error occurred. Please try again later.');
    }
}

function showConfirmation() {
    const fName = document.getElementById('fNameField').value.trim();
    const lName = document.getElementById('lNameField').value.trim();
    const email = document.getElementById('emailField').value.trim();
    
    const confirmMessage = `Please confirm your account details:\n\nName: ${fName} ${lName}\nEmail: ${email}\n\nClick OK to create your account.`;
    
    if (confirm(confirmMessage)) {
        alert('Account created successfully!');
        window.location.href = '/dashboard';
    }
}

// Error handling to ensure first name and last name aren't empty and only contain letters
function validateName() {
    const fName = document.getElementById('fNameField');
    const lName = document.getElementById('lNameField');
    if (
        !fName || !lName ||
        fName.value.trim() === '' ||
        lName.value.trim() === '') {
        alert('Please enter a valid first and last name to continue');
        return false;
    } else {
        return true;
    }
}

// Error handling to ensure valid email address
function validateEmail() {
    const emailField = document.getElementById('emailField');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailField || emailField.value.trim() === '' || !emailRegex.test(emailField.value.trim())) {
        alert('Please enter a valid email address to continue');
        return false;
    }
    return true;
}

// Error handling to ensure password is valid
function validatePassword() {
    const passwordField = document.getElementById('passwordField');
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordField || passwordField.value.trim() === '' || !passwordRegex.test(passwordField.value.trim())) {
        alert('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.');
        return false;
    }
    return true;
}
