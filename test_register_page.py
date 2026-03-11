import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_successful_registration(driver):
    driver.get("http://localhost:3000/register")

    wait = WebDriverWait(driver, 10)
    username_input = wait.until(EC.presence_of_element_located((By.ID, "username")))
    email_input = driver.find_element(By.ID, "email")
    password_input = driver.find_element(By.ID, "password")
    confirm_input = driver.find_element(By.ID, "confirmPassword")

    test_data = {
        "username": f"autotest_{int(time.time())}",
        "email": f"autotest{int(time.time())}@test.ru",
        "password": "TestPass123!"
    }

    username_input.send_keys(test_data["username"])
    email_input.send_keys(test_data["email"])
    password_input.send_keys(test_data["password"])
    confirm_input.send_keys(test_data["password"])

    checkbox = driver.find_element(By.NAME, "agreeToTerms")
    driver.execute_script("arguments[0].click();", checkbox)

    submit_btn = driver.find_element(By.CSS_SELECTOR, ".login-button[type='submit']")
    submit_btn.click()

    success_msg = wait.until(EC.presence_of_element_located((
        By.CSS_SELECTOR, ".success-message")))

    assert "успешно" in success_msg.text.lower(), "Нет success message!"
    print(f"✅ Регистрация: {test_data['email']}")


def test_registration_validation_errors(driver):
    driver.get("http://localhost:3000/register")
    wait = WebDriverWait(driver, 10)

    submit_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".login-button")))
    submit_btn.click()

    errors = wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, ".error-message"))

    error_texts = [e.text for e in errors]
    required_errors = ["обязателен", "обязательно", "согласие"]

    for req in required_errors:
        assert any(req in text.lower() for text in error_texts), f"Ошибка '{req}' не найдена!"

    print(f"✅ Валидация: {len(errors)} ошибок")


def test_password_mismatch(driver):
    driver.get("http://localhost:3000/register")
    wait = WebDriverWait(driver, 10)

    driver.find_element(By.ID, "username").send_keys("testuser")
    driver.find_element(By.ID, "email").send_keys("test@test.ru")
    driver.find_element(By.ID, "password").send_keys("pass123")
    driver.find_element(By.ID, "confirmPassword").send_keys("pass456")  # ≠

    driver.find_element(By.NAME, "agreeToTerms").click()

    driver.find_element(By.CSS_SELECTOR, ".login-button").click()

    mismatch_error = wait.until(EC.presence_of_element_located((
        By.XPATH, "//span[contains(text(), 'не совпадают')]")))

    assert "не совпадают" in mismatch_error.text.lower()


def test_username_too_short(driver):
    driver.get("http://localhost:3000/register")

    driver.find_element(By.ID, "username").send_keys("a")
    driver.find_element(By.ID, "email").send_keys("test@test.ru")
    driver.find_element(By.ID, "password").send_keys("TestPass123!")
    driver.find_element(By.ID, "confirmPassword").send_keys("TestPass123!")
    driver.find_element(By.NAME, "agreeToTerms").click()

    driver.find_element(By.CSS_SELECTOR, ".login-button").click()

    short_error = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'минимум 2')]")))

    assert "минимум 2" in short_error.text.lower()


def test_checkbox_required(driver):
    driver.get("http://localhost:3000/register")

    driver.find_element(By.ID, "username").send_keys("testuser")
    driver.find_element(By.ID, "email").send_keys("test@test.ru")
    driver.find_element(By.ID, "password").send_keys("TestPass123!")
    driver.find_element(By.ID, "confirmPassword").send_keys("TestPass123!")
    driver.find_element(By.CSS_SELECTOR, ".login-button").click()

    checkbox_error = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'согласие')]")))

    assert "согласие" in checkbox_error.text.lower()
