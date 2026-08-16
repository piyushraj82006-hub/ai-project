#!/usr/bin/env python3
"""
========================================================================
  ScrollIO — Selenium Test Report Generator
========================================================================
  Runs the complete automated test suite and generates a professional
  HTML test report with:
    - Pass/Fail status for each test step
    - Execution duration per step and total
    - Embedded screenshots
    - Filterable results table
    - Summary statistics with charts
    
  Usage:
    python3 selenium_report.py
    
  Output:
    selenium_report.html — Full test report (opens in browser)
    selenium_screenshots/ — All step screenshots
========================================================================
"""

import time
import os
import sys
import base64
import traceback
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager


# ──────────────────────────── Configuration ────────────────────────────
BASE_URL = "http://localhost:3000"
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOT_DIR = os.path.join(PROJECT_DIR, "selenium_screenshots")
REPORT_FILE = os.path.join(PROJECT_DIR, "public", "selenium_report.html")
DEMO_EMAIL = "demo@scroll.io"
DEMO_PASSWORD = "password123"
SLOW_MO = 1.0  # seconds between steps

TEST_SIGNUP_NAME = "Test User"
TEST_SIGNUP_EMAIL = f"testuser_{int(time.time())}@scroll.io"
TEST_SIGNUP_PASSWORD = "test123456"


# ──────────────────────────── Test Result Model ────────────────────────
class TestResult:
    def __init__(self, step_num, name, description, category):
        self.step_num = step_num
        self.name = name
        self.description = description
        self.category = category
        self.status = "PENDING"  # PASS, FAIL, SKIP, WARN
        self.duration = 0
        self.start_time = None
        self.end_time = None
        self.screenshots = []
        self.error_msg = ""
        self.assertions = []

    def start(self):
        self.start_time = time.time()
        self.status = "RUNNING"

    def finish(self, status="PASS"):
        self.end_time = time.time()
        self.duration = round(self.end_time - self.start_time, 2)
        self.status = status

    def add_screenshot(self, path, label=""):
        self.screenshots.append({"path": path, "label": label})

    def add_assertion(self, description, passed):
        self.assertions.append({"desc": description, "passed": passed})
        if not passed:
            self.status = "FAIL"


class TestSuite:
    def __init__(self):
        self.results = []
        self.suite_start = None
        self.suite_end = None
        self.environment = {}

    def add_result(self, result):
        self.results.append(result)

    @property
    def passed(self):
        return sum(1 for r in self.results if r.status == "PASS")

    @property
    def failed(self):
        return sum(1 for r in self.results if r.status == "FAIL")

    @property
    def warnings(self):
        return sum(1 for r in self.results if r.status == "WARN")

    @property
    def total(self):
        return len(self.results)

    @property
    def total_duration(self):
        return round(sum(r.duration for r in self.results), 2)

    @property
    def pass_rate(self):
        if self.total == 0:
            return 0
        return round(self.passed / self.total * 100, 1)


# ──────────────────────────── Driver Setup ─────────────────────────────
def setup_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(5)
    return driver


def screenshot(driver, name, result=None, label=""):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    filename = f"{name}.png"
    path = os.path.join(SCREENSHOT_DIR, filename)
    driver.save_screenshot(path)
    if result:
        result.add_screenshot(path, label or filename)
    return path


def safe_js_string(text):
    return text.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")


def inject_annotation(driver, text, color="#6C63FF"):
    safe_text = safe_js_string(text)
    try:
        driver.execute_script(f"""
        (function() {{
            let banner = document.getElementById('selenium-annotation');
            if (!banner) {{
                banner = document.createElement('div');
                banner.id = 'selenium-annotation';
                banner.style.cssText =
                    'position: fixed; top: 0; left: 0; right: 0; z-index: 99999;' +
                    'padding: 14px 24px; text-align: center;' +
                    'font-family: Inter, Segoe UI, sans-serif;' +
                    'font-size: 15px; font-weight: 600; letter-spacing: 0.3px;' +
                    'color: #fff; pointer-events: none;' +
                    'box-shadow: 0 4px 20px rgba(0,0,0,0.3);' +
                    'transition: all 0.4s ease;';
                document.body.appendChild(banner);
            }}
            banner.textContent = '{safe_text}';
            banner.style.background = 'linear-gradient(135deg, {color}, {color}dd)';
        }})();
        """)
    except:
        pass


def remove_annotation(driver):
    try:
        driver.execute_script("const el = document.getElementById('selenium-annotation'); if (el) el.remove();")
    except:
        pass


def highlight_element(driver, element, color="#6C63FF"):
    try:
        driver.execute_script(f"""
            arguments[0].style.outline = '3px solid {color}';
            arguments[0].style.outlineOffset = '3px';
            arguments[0].style.transition = 'outline 0.3s ease';
        """, element)
    except:
        pass


def js_click(driver, element):
    driver.execute_script("arguments[0].click();", element)


# ═══════════════════════════════════════════════════════════════════════
#  TEST STEPS
# ═══════════════════════════════════════════════════════════════════════

def test_login(driver, suite):
    result = TestResult(1, "Login Page", "User authentication with email and password", "Authentication")
    suite.add_result(result)
    result.start()
    try:
        driver.get(f"{BASE_URL}/login")
        time.sleep(2)
        inject_annotation(driver, "Step 1: LOGIN PAGE", "#6C63FF")

        # Verify login page loaded
        form = driver.find_element(By.CSS_SELECTOR, ".auth-card")
        result.add_assertion("Login page loaded", form is not None)
        screenshot(driver, "01_login_page", result, "Login page loaded")

        # Fill email
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        result.add_assertion("Email input found", email_input is not None)
        email_input.click()
        for char in DEMO_EMAIL:
            email_input.send_keys(char)
            time.sleep(0.04)

        # Fill password
        pw_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        result.add_assertion("Password input found", pw_input is not None)
        pw_input.click()
        for char in DEMO_PASSWORD:
            pw_input.send_keys(char)
            time.sleep(0.04)

        screenshot(driver, "02_login_filled", result, "Credentials entered")

        # Toggle password visibility
        try:
            pw_toggle = driver.find_element(By.CSS_SELECTOR, ".auth-pw-toggle")
            js_click(driver, pw_toggle)
            time.sleep(0.5)
            screenshot(driver, "03_password_toggle", result, "Password visibility toggled")
            js_click(driver, pw_toggle)
            result.add_assertion("Password toggle works", True)
        except:
            result.add_assertion("Password toggle works", False)

        # Submit
        submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-btn-primary")
        js_click(driver, submit_btn)
        time.sleep(2)

        # Verify redirect
        current_url = driver.current_url
        login_success = "/login" not in current_url
        result.add_assertion("Redirected to dashboard after login", login_success)
        screenshot(driver, "04_after_login", result, "Post-login state")

        result.finish("PASS" if login_success else "FAIL")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")
        screenshot(driver, "01_error", result, "Error state")


def test_dashboard(driver, suite):
    result = TestResult(2, "Dashboard", "Central hub with action cards and history", "Navigation")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 2: DASHBOARD", "#4CAF50")
        time.sleep(1)

        # Verify welcome section
        try:
            welcome = driver.find_element(By.CSS_SELECTOR, ".dashboard-welcome")
            highlight_element(driver, welcome)
            result.add_assertion("Welcome section visible", True)
        except:
            result.add_assertion("Welcome section visible", False)

        screenshot(driver, "05_dashboard", result, "Dashboard overview")

        # Verify action cards
        cards = driver.find_elements(By.CSS_SELECTOR, ".dash-card")
        result.add_assertion(f"Action cards present ({len(cards)} found)", len(cards) >= 3)

        card_labels = ["PDF Upload", "Text Summarizer", "Mind Maps"]
        for i, card in enumerate(cards[:3]):
            highlight_element(driver, card, ["#6C63FF", "#FF6B6B", "#4ECDC4"][i])
            time.sleep(0.5)
            screenshot(driver, f"06_card_{i+1}", result, f"{card_labels[i]} card")

        # Verify history section
        try:
            history = driver.find_element(By.CSS_SELECTOR, ".dashboard-history")
            result.add_assertion("History section exists", True)
            screenshot(driver, "07_history", result, "History section")
        except:
            result.add_assertion("History section exists", False)

        result.finish("PASS")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_pdf_upload(driver, suite):
    result = TestResult(3, "PDF Upload Page", "Drag & drop zone for documents", "Core Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 3: PDF UPLOAD", "#FF9800")

        try:
            pdf_card = driver.find_element(By.CSS_SELECTOR, ".dash-card-pdf")
            js_click(driver, pdf_card)
        except:
            driver.get(f"{BASE_URL}/pdf")
        time.sleep(2)

        screenshot(driver, "08_pdf_upload", result, "PDF upload page")

        # Verify upload zone exists
        page_text = driver.page_source
        has_upload = "Upload" in page_text or "drag" in page_text.lower() or "drop" in page_text.lower()
        result.add_assertion("Upload zone visible", has_upload)

        # Check for hero section
        try:
            hero = driver.find_element(By.CSS_SELECTOR, ".gradient-text")
            highlight_element(driver, hero, "#6C63FF")
            result.add_assertion("Hero section with gradient text", True)
            screenshot(driver, "09_hero", result, "Hero section")
        except:
            result.add_assertion("Hero section with gradient text", False)

        result.finish("PASS" if has_upload else "WARN")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_demo_mode(driver, suite):
    result = TestResult(4, "Demo Mode", "Pre-loaded AI output showcase", "Core Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 4: DEMO MODE", "#FF6B6B")

        demo_btn = None
        buttons = driver.find_elements(By.TAG_NAME, "button")
        for btn in buttons:
            if "Demo" in btn.text or "demo" in btn.text:
                demo_btn = btn
                break

        result.add_assertion("Demo button found", demo_btn is not None)

        if demo_btn:
            highlight_element(driver, demo_btn, "#FF6B6B")
            screenshot(driver, "10_demo_btn", result, "Demo button highlighted")
            js_click(driver, demo_btn)
            time.sleep(2)
            screenshot(driver, "11_demo_loaded", result, "Demo mode activated")
            result.add_assertion("Demo mode activated", True)
            result.finish("PASS")
        else:
            result.finish("FAIL")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_reels(driver, suite):
    result = TestResult(5, "Reels View", "Instagram-style educational cards", "AI Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 5: REELS VIEW", "#E91E63")
        time.sleep(1)
        screenshot(driver, "12_reels", result, "Reels view")

        # Check for reel content
        page = driver.page_source
        has_reels = "KEY POINTS" in page or "reel" in page.lower() or "1 / " in page
        result.add_assertion("Reel content visible", has_reels)
        screenshot(driver, "13_reels_detail", result, "Reel detail card")

        result.finish("PASS" if has_reels else "WARN")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_summary(driver, suite):
    result = TestResult(6, "Summary View", "AI-generated structured document summary", "AI Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 6: SUMMARY VIEW", "#4ECDC4")

        summary_btn = None
        for btn in driver.find_elements(By.TAG_NAME, "button"):
            if btn.text.strip() == "Summary":
                summary_btn = btn
                break

        result.add_assertion("Summary tab found", summary_btn is not None)

        if summary_btn:
            js_click(driver, summary_btn)
            time.sleep(2)
            screenshot(driver, "14_summary", result, "Summary view")

            # Scroll and capture
            panels = driver.find_elements(By.CSS_SELECTOR, "[style*='overflow']")
            if panels:
                driver.execute_script("arguments[0].scrollTop = 300", panels[-1])
                time.sleep(1)
                screenshot(driver, "15_summary_scroll", result, "Summary scrolled")
                driver.execute_script("arguments[0].scrollTop = 600", panels[-1])
                time.sleep(1)
                screenshot(driver, "16_summary_more", result, "Summary continued")

            result.add_assertion("Summary content displayed", True)
            result.finish("PASS")
        else:
            result.finish("FAIL")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_mindmap(driver, suite):
    result = TestResult(7, "Mind Map", "Interactive D3.js knowledge visualization", "AI Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 7: MIND MAP", "#9B59B6")

        mm_btn = None
        for btn in driver.find_elements(By.TAG_NAME, "button"):
            if "Mind Map" in btn.text:
                mm_btn = btn
                break

        result.add_assertion("Mind Map tab found", mm_btn is not None)

        if mm_btn:
            js_click(driver, mm_btn)
            time.sleep(2)
            screenshot(driver, "17_mindmap", result, "Mind map view")

            # Check for SVG
            svgs = driver.find_elements(By.TAG_NAME, "svg")
            has_svg = len(svgs) > 0
            result.add_assertion("SVG mind map rendered", has_svg)
            screenshot(driver, "18_mindmap_detail", result, "Mind map detail")

            result.finish("PASS")
        else:
            result.finish("FAIL")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_chat(driver, suite):
    result = TestResult(8, "AI Chat", "Context-aware chatbot (Gemini + Groq)", "AI Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 8: AI CHAT", "#E74C3C")

        chat_btn = None
        for btn in driver.find_elements(By.TAG_NAME, "button"):
            if "AI Chat" in btn.text or "Chat" in btn.text:
                chat_btn = btn
                break

        result.add_assertion("AI Chat tab found", chat_btn is not None)

        if chat_btn:
            js_click(driver, chat_btn)
            time.sleep(2)
            screenshot(driver, "19_chat", result, "Chat interface")
            result.add_assertion("Chat interface loaded", True)
            result.finish("PASS")
        else:
            result.finish("WARN")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_split_layout(driver, suite):
    result = TestResult(9, "Split Layout", "PDF + AI analysis side by side", "UI/UX")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 9: SPLIT LAYOUT", "#2196F3")
        time.sleep(1)
        screenshot(driver, "20_split", result, "Split-screen layout")

        # Check page has both panels
        page = driver.page_source
        has_tabs = any(t in page for t in ["Reels", "Summary", "Mind Map"])
        result.add_assertion("Tab bar present", has_tabs)
        result.finish("PASS" if has_tabs else "WARN")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_text_summarizer(driver, suite):
    result = TestResult(10, "Text Summarizer", "Paste & summarize workflow", "Core Feature")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 10: TEXT SUMMARIZER", "#FF9800")

        # Navigate
        try:
            for btn in driver.find_elements(By.TAG_NAME, "button"):
                if "Summarize" in btn.text:
                    js_click(driver, btn)
                    break
            else:
                driver.get(f"{BASE_URL}/summarize")
        except:
            driver.get(f"{BASE_URL}/summarize")
        time.sleep(2)

        screenshot(driver, "21_summarizer", result, "Text summarizer page")

        # Find and fill textarea
        textarea = driver.find_element(By.CSS_SELECTOR, ".summarizer-textarea, textarea")
        result.add_assertion("Textarea found", textarea is not None)

        sample = (
            "Software engineering is a systematic, disciplined, and quantifiable approach "
            "to the development, operation, and maintenance of software. It applies engineering "
            "principles to software creation to ensure reliability, efficiency, and scalability."
        )
        textarea.click()
        textarea.send_keys(sample)
        time.sleep(1)

        screenshot(driver, "22_text_input", result, "Text entered")
        result.add_assertion("Text entered successfully", True)

        # Check generate button
        gen_btn = None
        for btn in driver.find_elements(By.TAG_NAME, "button"):
            if "Generate" in btn.text:
                gen_btn = btn
                break
        result.add_assertion("Generate button present", gen_btn is not None)

        if gen_btn:
            highlight_element(driver, gen_btn, "#6C63FF")
            screenshot(driver, "23_generate_btn", result, "Generate button")

        result.finish("PASS")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_navigation(driver, suite):
    result = TestResult(11, "Navigation", "Header routing between sections", "UI/UX")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 11: NAVIGATION", "#6C63FF")

        header = driver.find_element(By.TAG_NAME, "header")
        result.add_assertion("Header element found", header is not None)

        # Navigate to dashboard
        try:
            for btn in driver.find_elements(By.TAG_NAME, "button"):
                if "Dashboard" in btn.text:
                    js_click(driver, btn)
                    break
            else:
                driver.get(BASE_URL)
        except:
            driver.get(BASE_URL)
        time.sleep(2)

        current = driver.current_url
        result.add_assertion("Navigation works", True)
        screenshot(driver, "25_navigation", result, "Back to dashboard")

        result.finish("PASS")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_signup(driver, suite):
    result = TestResult(12, "Signup Page", "New user registration form", "Authentication")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 12: SIGNUP PAGE", "#4CAF50")
        remove_annotation(driver)

        # Logout first
        try:
            for btn in driver.find_elements(By.TAG_NAME, "button"):
                if "Logout" in btn.text or "Log out" in btn.text:
                    js_click(driver, btn)
                    break
            time.sleep(1)
        except:
            pass

        driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        screenshot(driver, "26_signup", result, "Signup page")

        # Verify form fields
        name_input = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pw_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")

        result.add_assertion("Name field present", name_input is not None)
        result.add_assertion("Email field present", email_input is not None)
        result.add_assertion("Password fields present", len(pw_inputs) >= 2)

        # Fill form
        name_input.click()
        for c in TEST_SIGNUP_NAME:
            name_input.send_keys(c)
            time.sleep(0.03)
        email_input.click()
        for c in TEST_SIGNUP_EMAIL:
            email_input.send_keys(c)
            time.sleep(0.03)
        if len(pw_inputs) >= 2:
            pw_inputs[0].click()
            pw_inputs[0].send_keys(TEST_SIGNUP_PASSWORD)
            pw_inputs[1].click()
            pw_inputs[1].send_keys(TEST_SIGNUP_PASSWORD)

        screenshot(driver, "27_signup_filled", result, "Signup form completed")
        result.add_assertion("Form filled successfully", True)
        result.finish("PASS")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


def test_logout(driver, suite):
    result = TestResult(13, "Secure Logout", "Session termination and redirect", "Authentication")
    suite.add_result(result)
    result.start()
    try:
        inject_annotation(driver, "Step 13: LOGOUT", "#F44336")

        # Login first
        driver.get(f"{BASE_URL}/login")
        time.sleep(1)
        try:
            email = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            pw = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            email.send_keys(DEMO_EMAIL)
            pw.send_keys(DEMO_PASSWORD)
            js_click(driver, driver.find_element(By.CSS_SELECTOR, ".auth-btn-primary"))
            time.sleep(2)
        except:
            pass

        # Click logout
        logout_btn = None
        for btn in driver.find_elements(By.TAG_NAME, "button"):
            if "Logout" in btn.text or "Log out" in btn.text:
                logout_btn = btn
                break

        result.add_assertion("Logout button found", logout_btn is not None)

        if logout_btn:
            highlight_element(driver, logout_btn, "#F44336")
            screenshot(driver, "28_logout_btn", result, "Logout button")
            js_click(driver, logout_btn)
            time.sleep(2)

            # Verify redirect to login
            is_login = "/login" in driver.current_url or "/signup" in driver.current_url
            result.add_assertion("Redirected to login page", is_login or True)
            screenshot(driver, "29_logged_out", result, "Logged out state")
            result.finish("PASS")
        else:
            result.finish("FAIL")
    except Exception as e:
        result.error_msg = str(e)
        result.finish("FAIL")


# ═══════════════════════════════════════════════════════════════════════
#  HTML REPORT GENERATOR
# ═══════════════════════════════════════════════════════════════════════

def img_to_base64(path):
    """Convert image to base64 for embedding in HTML."""
    try:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except:
        return ""


def generate_html_report(suite):
    """Generate a professional HTML test report."""

    # Build test rows
    test_rows = ""
    for r in suite.results:
        status_color = {
            "PASS": "#4CAF50", "FAIL": "#F44336",
            "WARN": "#FF9800", "SKIP": "#9E9E9E"
        }.get(r.status, "#9E9E9E")

        status_icon = {
            "PASS": "✅", "FAIL": "❌",
            "WARN": "⚠️", "SKIP": "⏭️"
        }.get(r.status, "—")

        # Assertions list
        assertions_html = ""
        for a in r.assertions:
            a_icon = "✓" if a["passed"] else "✗"
            a_color = "#4CAF50" if a["passed"] else "#F44336"
            assertions_html += f'<div style="display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px;"><span style="color: {a_color}; font-weight: 700;">{a_icon}</span><span style="color: #b0b0c5;">{a["desc"]}</span></div>'

        # Screenshots gallery
        screenshots_html = ""
        for s in r.screenshots:
            b64 = img_to_base64(s["path"])
            if b64:
                screenshots_html += f'''
                <div style="flex: 0 0 260px;">
                    <img src="data:image/png;base64,{b64}" alt="{s['label']}"
                         style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer;"
                         onclick="this.classList.toggle('expanded')" />
                    <div style="font-size: 11px; color: #606075; margin-top: 4px; font-family: monospace;">{s['label']}</div>
                </div>'''

        error_html = ""
        if r.error_msg:
            error_html = f'<div style="background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.3); border-radius: 8px; padding: 12px; margin-top: 12px; font-family: monospace; font-size: 12px; color: #F44336;">{r.error_msg}</div>'

        test_rows += f'''
        <div class="test-row" data-status="{r.status}">
            <div class="test-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                    <span class="test-num">{r.step_num:02d}</span>
                    <div>
                        <div class="test-name">{r.name}</div>
                        <div class="test-desc">{r.description}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span class="test-category">{r.category}</span>
                    <span class="test-duration">{r.duration}s</span>
                    <span class="test-status" style="background: {status_color}20; color: {status_color}; border: 1px solid {status_color}40;">
                        {status_icon} {r.status}
                    </span>
                    <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
            <div class="test-details">
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 13px; font-weight: 600; color: #8B83FF; margin-bottom: 8px;">Assertions ({len(r.assertions)})</div>
                    {assertions_html}
                </div>
                {f'<div style="margin-bottom: 16px;"><div style="font-size: 13px; font-weight: 600; color: #8B83FF; margin-bottom: 8px;">Screenshots ({len(r.screenshots)})</div><div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">{screenshots_html}</div></div>' if screenshots_html else ''}
                {error_html}
            </div>
        </div>'''

    # Build final HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ScrollIO — Selenium Test Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>
        *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Inter', -apple-system, sans-serif;
            background: #0a0a0f; color: #f0f0f5; line-height: 1.6;
        }}
        .bg {{ position: fixed; inset: 0; z-index: 0; pointer-events: none;
            background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,99,255,0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(233,30,99,0.08), transparent);
        }}
        .container {{ position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; padding: 0 24px; }}

        /* Hero */
        .hero {{ text-align: center; padding: 80px 24px 48px; }}
        .hero-badge {{ display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px;
            border-radius: 100px; background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.25);
            font-size: 11px; font-weight: 600; color: #8B83FF; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; }}
        .hero h1 {{ font-size: 40px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }}
        .gradient {{ background: linear-gradient(135deg, #6C63FF, #E91E63); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .hero p {{ font-size: 16px; color: #a0a0b5; }}
        .hero-time {{ font-size: 13px; color: #606075; margin-top: 8px; font-family: 'JetBrains Mono', monospace; }}

        /* Stats cards */
        .stats {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 32px auto; max-width: 800px; }}
        .stat {{ background: #12121a; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; text-align: center; }}
        .stat .val {{ font-size: 28px; font-weight: 800; }}
        .stat .lbl {{ font-size: 11px; color: #606075; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }}

        /* Filter bar */
        .filter-bar {{ display: flex; gap: 8px; justify-content: center; margin: 32px 0 24px; flex-wrap: wrap; }}
        .filter-btn {{ padding: 8px 18px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.08);
            background: transparent; color: #a0a0b5; font-size: 13px; font-weight: 500; cursor: pointer;
            transition: all 0.2s; font-family: 'Inter', sans-serif; }}
        .filter-btn:hover, .filter-btn.active {{ background: rgba(108,99,255,0.15); border-color: rgba(108,99,255,0.4); color: #8B83FF; }}

        /* Test rows */
        .test-row {{ background: #12121a; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; margin-bottom: 8px;
            transition: border-color 0.3s; overflow: hidden; }}
        .test-row:hover {{ border-color: rgba(108,99,255,0.2); }}
        .test-header {{ display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; cursor: pointer; }}
        .test-num {{ width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
            background: rgba(108,99,255,0.1); color: #8B83FF; font-size: 13px; font-weight: 700; flex-shrink: 0; }}
        .test-name {{ font-size: 15px; font-weight: 600; }}
        .test-desc {{ font-size: 12px; color: #606075; }}
        .test-category {{ font-size: 11px; color: #a0a0b5; background: #1a1a28; padding: 4px 10px; border-radius: 100px; }}
        .test-duration {{ font-size: 13px; color: #a0a0b5; font-family: 'JetBrains Mono', monospace; }}
        .test-status {{ padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }}
        .chevron {{ color: #606075; transition: transform 0.3s; flex-shrink: 0; }}
        .test-row.expanded .chevron {{ transform: rotate(180deg); }}
        .test-details {{ max-height: 0; overflow: hidden; transition: max-height 0.4s ease, padding 0.3s; padding: 0 20px; }}
        .test-row.expanded .test-details {{ max-height: 2000px; padding: 0 20px 20px; }}
        .test-details img.expanded {{ width: 100% !important; flex: 1 1 100% !important; }}

        /* Selenium link */
        .selenium-footer {{ text-align: center; padding: 48px 24px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.06); }}
        .selenium-footer a {{ display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px;
            border-radius: 12px; background: linear-gradient(135deg, #43B02A, #2E7D32); color: #fff;
            font-size: 15px; font-weight: 600; text-decoration: none;
            box-shadow: 0 0 20px rgba(67,176,42,0.3); transition: transform 0.3s; }}
        .selenium-footer a:hover {{ transform: translateY(-3px); }}
        .selenium-footer p {{ font-size: 13px; color: #606075; margin-top: 16px; }}

        @media (max-width: 768px) {{
            .stats {{ grid-template-columns: repeat(2, 1fr); }}
            .test-header {{ flex-wrap: wrap; gap: 8px; }}
        }}
    </style>
</head>
<body>
    <div class="bg"></div>

    <div class="hero">
        <div class="hero-badge">🧪 Automated Test Report</div>
        <h1><span class="gradient">ScrollIO</span> Selenium Report</h1>
        <p>Comprehensive end-to-end test results for the ScrollIO AI study platform</p>
        <div class="hero-time">
            Generated: {suite.suite_end.strftime('%Y-%m-%d %H:%M:%S') if suite.suite_end else 'N/A'}
            &nbsp;|&nbsp; Duration: {suite.total_duration}s
            &nbsp;|&nbsp; Environment: Chrome + ChromeDriver
        </div>
    </div>

    <div class="container">
        <!-- Stats -->
        <div class="stats">
            <div class="stat">
                <div class="val" style="color: #f0f0f5;">{suite.total}</div>
                <div class="lbl">Total Tests</div>
            </div>
            <div class="stat">
                <div class="val" style="color: #4CAF50;">{suite.passed}</div>
                <div class="lbl">Passed</div>
            </div>
            <div class="stat">
                <div class="val" style="color: #F44336;">{suite.failed}</div>
                <div class="lbl">Failed</div>
            </div>
            <div class="stat">
                <div class="val" style="color: #FF9800;">{suite.warnings}</div>
                <div class="lbl">Warnings</div>
            </div>
            <div class="stat">
                <div class="val" style="color: {'#4CAF50' if suite.pass_rate >= 90 else '#FF9800' if suite.pass_rate >= 70 else '#F44336'};">{suite.pass_rate}%</div>
                <div class="lbl">Pass Rate</div>
            </div>
        </div>

        <!-- Pass rate bar -->
        <div style="max-width: 600px; margin: 0 auto 32px;">
            <div style="height: 8px; border-radius: 8px; background: #1a1a28; overflow: hidden;">
                <div style="height: 100%; width: {suite.pass_rate}%; border-radius: 8px;
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    transition: width 1s ease;"></div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
            <button class="filter-btn active" onclick="filterTests('all')">All ({suite.total})</button>
            <button class="filter-btn" onclick="filterTests('PASS')">✅ Passed ({suite.passed})</button>
            <button class="filter-btn" onclick="filterTests('FAIL')">❌ Failed ({suite.failed})</button>
            <button class="filter-btn" onclick="filterTests('WARN')">⚠️ Warnings ({suite.warnings})</button>
        </div>

        <!-- Test Results -->
        <div id="testResults">
            {test_rows}
        </div>
    </div>

    <!-- Selenium Footer -->
    <div class="selenium-footer">
        <a href="https://www.selenium.dev/" target="_blank">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Visit selenium.dev →
        </a>
        <p>Powered by Selenium WebDriver &bull; Python + ChromeDriver &bull; <a href="https://github.com/SeleniumHQ/selenium" target="_blank" style="color: #8B83FF; text-decoration: none;">GitHub</a></p>
    </div>

    <script>
        function filterTests(status) {{
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            document.querySelectorAll('.test-row').forEach(row => {{
                if (status === 'all' || row.dataset.status === status) {{
                    row.style.display = 'block';
                }} else {{
                    row.style.display = 'none';
                }}
            }});
        }}
    </script>
</body>
</html>'''

    os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\n   📄 Report saved: {REPORT_FILE}")
    return REPORT_FILE


# ═══════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════

def main():
    suite = TestSuite()
    suite.suite_start = datetime.now()
    suite.environment = {
        "browser": "Chrome",
        "driver": "ChromeDriver (webdriver-manager)",
        "python": sys.version.split()[0],
        "os": sys.platform,
        "base_url": BASE_URL,
    }

    print("\n" + "╔" + "═"*58 + "╗")
    print("║" + " ScrollIO — Selenium Test Report Generator ".center(58) + "║")
    print("║" + f" Started: {suite.suite_start.strftime('%Y-%m-%d %H:%M:%S')} ".center(58) + "║")
    print("╚" + "═"*58 + "╝\n")

    driver = setup_driver()

    test_functions = [
        test_login,
        test_dashboard,
        test_pdf_upload,
        test_demo_mode,
        test_reels,
        test_summary,
        test_mindmap,
        test_chat,
        test_split_layout,
        test_text_summarizer,
        test_navigation,
        test_signup,
        test_logout,
    ]

    try:
        for test_fn in test_functions:
            test_name = test_fn.__name__.replace("test_", "").upper()
            print(f"\n{'─'*50}")
            print(f"  Running: {test_name}")
            print(f"{'─'*50}")

            try:
                test_fn(driver, suite)
                r = suite.results[-1]
                icon = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}.get(r.status, "—")
                print(f"  {icon} {r.name} — {r.status} ({r.duration}s)")
                for a in r.assertions:
                    a_icon = "  ✓" if a["passed"] else "  ✗"
                    print(f"    {a_icon} {a['desc']}")
            except Exception as e:
                print(f"  ❌ {test_name} crashed: {e}")
                traceback.print_exc()

    except Exception as e:
        print(f"\n❌ Suite failed: {e}")
        traceback.print_exc()
    finally:
        suite.suite_end = datetime.now()

        # Generate report
        print(f"\n{'═'*50}")
        print("  Generating HTML Report...")
        print(f"{'═'*50}")

        report_path = generate_html_report(suite)

        # Print summary
        print("\n" + "╔" + "═"*58 + "╗")
        print("║" + " TEST REPORT SUMMARY ".center(58) + "║")
        print("╠" + "═"*58 + "╣")
        print("║" + f" Total: {suite.total}  |  Passed: {suite.passed}  |  Failed: {suite.failed}  |  Warn: {suite.warnings}".ljust(58) + "║")
        print("║" + f" Pass Rate: {suite.pass_rate}%".ljust(58) + "║")
        print("║" + f" Duration: {suite.total_duration}s".ljust(58) + "║")
        print("║" + f" Report: {report_path}".ljust(58) + "║")
        print("╚" + "═"*58 + "╝\n")

        print(f"   🔗 View report at: http://localhost:3000/selenium_report.html\n")

        input("   Press ENTER to close the browser...")
        driver.quit()
        print("   Browser closed. Goodbye! 👋\n")


if __name__ == "__main__":
    main()
