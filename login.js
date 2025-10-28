const LOGIN_URL = 'http://localhost:8080/api/auth/login';
const REGISTER_URL = 'http://localhost:8080/api/auth/register';

let isRegisterMode = false;

// Toggle between login and register mode
function toggleAuthMode(event) {
    event.preventDefault();
    isRegisterMode = !isRegisterMode;

    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const rememberGroup = document.getElementById('remember-group');
    const usernameGroup = document.getElementById('username-group');
    const emailGroup = document.getElementById('email-group');
    const usernameLabel = document.getElementById('username-label');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    if (isRegisterMode) {
        formTitle.textContent = 'Реєстрація';
        formSubtitle.textContent = 'Створіть обліковий запис для керування івентами';
        submitBtn.textContent = 'Зареєструватися';
        toggleText.innerHTML = 'Вже є акаунт? <a href="#" id="toggle-link" onclick="toggleAuthMode(event)">Увійти</a>';
        rememberGroup.style.display = 'none';

        // Show separate username and email fields for registration
        usernameLabel.textContent = 'Ім\'я користувача';
        usernameInput.placeholder = 'Введіть ім\'я користувача';
        emailGroup.style.display = 'block';
        emailInput.required = true;
    } else {
        formTitle.textContent = 'Вхід до системи';
        formSubtitle.textContent = 'Увійдіть, щоб керувати своїми івентами';
        submitBtn.textContent = 'Увійти';
        toggleText.innerHTML = 'Немає акаунту? <a href="#" id="toggle-link" onclick="toggleAuthMode(event)">Зареєструватися</a>';
        rememberGroup.style.display = 'block';

        // Show single username/email field for login
        usernameLabel.textContent = 'Ім\'я користувача або Email';
        usernameInput.placeholder = 'Введіть ім\'я користувача або email';
        emailGroup.style.display = 'none';
        emailInput.required = false;
        emailInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // Redirect to events page if already logged in
        window.location.href = 'events.html';
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        // Get form data
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        // Validate form based on mode
        if (isRegisterMode) {
            if (!username || !email || !password) {
                showError('Будь ласка, заповніть всі поля');
                return;
            }
        } else {
            if (!username || !password) {
                showError('Будь ласка, заповніть всі поля');
                return;
            }
        }

        // Disable submit button
        const submitBtn = authForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = isRegisterMode ? 'Реєстрація...' : 'Вхід...';

        try {
            // Choose API URL based on mode
            const apiUrl = isRegisterMode ? REGISTER_URL : LOGIN_URL;

            // Send request
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            if (isRegisterMode) {
                // Handle registration response
                if (response.ok) {
                    const message = await response.text();
                    showSuccess('Реєстрація успішна! Тепер ви можете увійти.');

                    // Switch to login mode after 2 seconds
                    setTimeout(() => {
                        toggleAuthMode(new Event('click'));
                        // Pre-fill username and email
                        document.getElementById('username').value = username;
                        document.getElementById('email').value = email;
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    showError(errorText || 'Помилка реєстрації');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } else {
                // Handle login response
                const data = await response.json();

                if (response.ok) {
                    // Login successful
                    showSuccess('Успішний вхід! Перенаправлення...');

                    // Save token and user data
                    if (data.token) {
                        localStorage.setItem('authToken', data.token);
                    }
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }

                    // Save remember me preference
                    if (remember) {
                        localStorage.setItem('rememberMe', 'true');
                    } else {
                        localStorage.removeItem('rememberMe');
                    }

                    // Redirect to events page after 1 second
                    setTimeout(() => {
                        window.location.href = 'events.html';
                    }, 1000);

                } else {
                    // Login failed
                    const errorMsg = data.message || 'Невірні дані для входу';
                    showError(errorMsg);

                    // Re-enable submit button
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }

        } catch (error) {
            console.error('Auth error:', error);

            // Handle network errors
            if (error.message.includes('Failed to fetch')) {
                showError('Не вдалося підключитися до сервера. Перевірте, чи запущений backend на http://localhost:8080');
            } else {
                showError('Помилка: ' + error.message);
            }

            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
});
