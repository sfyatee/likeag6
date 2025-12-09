document.addEventListener("DOMContentLoaded", function () {
  // Home button (login only)
  const homeBtn = document.getElementById("G6Logo");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "/";
    });
  }

  // Signup redirection from login page
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      window.location.href = "/signup";
    });
  }

  // Back button (login only)
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/";
    });
  }

  //  ADDED FOR GOOGLE OAUTH
  const googleBtn = document.getElementById("googleLoginBtn");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      // Redirect to OAuth login on backend
      window.location.href = "/auth/google/login";
    });
  }

  // Validate email and password on form submit
  const authForm = document.querySelector(".authForm");
  if (authForm) {
    authForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (validateEmail() && validatePassword()) {
        await loginUser();
      }
    });
  }
});

// Existing login via email/password (unchanged)
async function loginUser() {
  const email = document.getElementById("emailField").value.trim();
  const password = document.getElementById("passwordField").value.trim();

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Login successful!");
      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } else {
      alert(data.message || "Invalid email or password.");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    alert("An error occurred. Please try again later.");
  }
}

function validateEmail() {
  const emailField = document.getElementById("emailField");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    !emailField ||
    emailField.value.trim() === "" ||
    !emailRegex.test(emailField.value.trim())
  ) {
    alert("Please enter a valid email address to continue");
    return false;
  }
  return true;
}

function validatePassword() {
  const passwordField = document.getElementById("passwordField");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (
    !passwordField ||
    passwordField.value.trim() === "" ||
    !passwordRegex.test(passwordField.value.trim())
  ) {
    alert(
      "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number."
    );
    return false;
  }
  return true;
}
