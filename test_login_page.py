from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TEST_USER = {
    "username": "autotest_123",
    "email": "autotest_login@test.ru",
    "password": "TestPass123!"
}

def test_successful_login(driver):
    driver.get("http://localhost:3000/login")
    wait = WebDriverWait(driver, 10)
    username_input = wait.until(EC.presence_of_element_located((By.ID, "username")))
    password_input = driver.find_element(By.ID, "password")

    username_input.send_keys(TEST_USER["username"])
    password_input.send_keys(TEST_USER["password"])

    submit_btn = driver.find_element(By.CSS_SELECTOR, ".login-button[type='submit']")
    submit_btn.click()

    success_msg = wait.until(EC.presence_of_element_located((
        By.CSS_SELECTOR, ".success-message")))
    assert "успешно" in success_msg.text.lower()

    token = driver.execute_script("return localStorage.getItem('authToken');")
    username = driver.execute_script("return localStorage.getItem('username');")

    assert token is not None, "❌ authToken не сохранен!"
    assert username == TEST_USER["username"], "❌ username не совпадает!"

    print(f"✅ Логин: {username}, token: {token[:20]}...")


def test_login_validation_errors(driver):
    driver.get("http://localhost:3000/login")
    wait = WebDriverWait(driver, 10)

    submit_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".login-button")))
    submit_btn.click()

    errors = wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, ".error-message"))

    error_texts = [e.text for e in errors]
    assert any("обязателен" in text.lower() for text in error_texts), "Нет ошибки 'обязателен'"

    print(f"✅ Валидация: {len(errors)} ошибок")


def test_username_too_short(driver):
    driver.get("http://localhost:3000/login")

    driver.find_element(By.ID, "username").send_keys("ab")
    driver.find_element(By.ID, "password").send_keys("TestPass123!")

    driver.find_element(By.CSS_SELECTOR, ".login-button").click()

    short_error = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'минимум 3')]")))

    assert "минимум 3" in short_error.text.lower()


def test_password_too_short(driver):
    driver.get("http://localhost:3000/login")

    driver.find_element(By.ID, "username").send_keys("autotest_login")
    driver.find_element(By.ID, "password").send_keys("12345")  # 5 символов

    driver.find_element(By.CSS_SELECTOR, ".login-button").click()

    pass_error = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'минимум 6')]")))

    assert "минимум 6" in pass_error.text.lower()


def test_invalid_credentials(driver):
    driver.get("http://localhost:3000/login")

    driver.find_element(By.ID, "username").send_keys("wrong_user")
    driver.find_element(By.ID, "password").send_keys("wrongpass")

    driver.find_element(By.CSS_SELECTOR, ".login-button").click()

    submit_error = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".error-message.submit-error")))

    assert any(msg in submit_error.text.lower() for msg in [
        "неверное", "неверные", "неверный", "ошибка", "авторизации"
    ]), "Серверная ошибка не показана!"


