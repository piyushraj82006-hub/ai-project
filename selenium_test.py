#!/usr/bin/env python3
"""
========================================================================
  ScrollIO — Selenium Automated Working Principle Walkthrough
========================================================================
  This script demonstrates the complete working principle of ScrollIO,
  an AI-powered PDF study platform, by automating the browser through
  every major feature:

  1. Login Page          – User authentication
  2. Signup Page         – Account creation flow
  3. Dashboard           – Central hub with action cards
  4. PDF Upload Page     – Drag & drop PDF upload zone
  5. Demo Mode           – AI-generated Summary, Mind Map & Reels
  6. Tab Navigation      – Switching between Reels, Summary, Mind Map, AI Chat
  7. Text Summarizer     – Paste-and-summarize workflow
  8. Logout              – Session termination

  Each step is annotated with on-screen highlights and console logs.
========================================================================
"""

import time
import os
import sys
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
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "selenium_screenshots")
DEMO_EMAIL = "demo@scroll.io"
DEMO_PASSWORD = "password123"
SLOW_MO = 1.5  # seconds between steps for visibility

# Test signup credentials
TEST_SIGNUP_NAME = "Test User"
TEST_SIGNUP_EMAIL = f"testuser_{int(time.time())}@scroll.io"
TEST_SIGNUP_PASSWORD = "test123456"


def setup_driver():
    """Initialize Chrome WebDriver with optimal settings."""
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    # Un-comment the next line for headless mode:
    # options.add_argument("--headless=new")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(5)
    return driver


def screenshot(driver, name):
    """Take a timestamped screenshot."""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    filename = f"{name}.png"
    path = os.path.join(SCREENSHOT_DIR, filename)
    driver.save_screenshot(path)
    print(f"   📸 Screenshot saved: {filename}")
    return path


def safe_js_string(text):
    """Escape text for safe injection into JavaScript strings."""
    return text.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")


def inject_annotation(driver, text, color="#6C63FF"):
    """Inject a floating annotation banner at the top of the page."""
    safe_text = safe_js_string(text)
    script = f"""
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
    """
    try:
        driver.execute_script(script)
    except Exception as e:
        print(f"   ⚠️ Annotation warning: {e}")


def remove_annotation(driver):
    """Remove the floating annotation banner."""
    try:
        driver.execute_script("""
            const el = document.getElementById('selenium-annotation');
            if (el) el.remove();
        """)
    except:
        pass


def highlight_element(driver, element, color="#6C63FF"):
    """Add a glowing highlight border around an element."""
    try:
        driver.execute_script(f"""
            arguments[0].style.outline = '3px solid {color}';
            arguments[0].style.outlineOffset = '3px';
            arguments[0].style.transition = 'outline 0.3s ease';
        """, element)
    except:
        pass


def remove_highlight(driver, element):
    """Remove the highlight from an element."""
    try:
        driver.execute_script("""
            arguments[0].style.outline = 'none';
            arguments[0].style.outlineOffset = '0';
        """, element)
    except:
        pass


def js_click(driver, element):
    """Click an element via JavaScript to bypass overlay issues."""
    driver.execute_script("arguments[0].click();", element)


def step(driver, num, title, description=""):
    """Print a step header and inject annotation."""
    print(f"\n{'='*60}")
    print(f"  STEP {num}: {title}")
    if description:
        print(f"  → {description}")
    print(f"{'='*60}")
    inject_annotation(driver, f"Step {num}: {title}")
    time.sleep(SLOW_MO)


# ═══════════════════════════════════════════════════════════════════════
#  MAIN WALKTHROUGH
# ═══════════════════════════════════════════════════════════════════════

def run_walkthrough():
    print("\n" + "╔" + "═"*58 + "╗")
    print("║" + " ScrollIO — Automated Working Principle Demo ".center(58) + "║")
    print("║" + f" Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ".center(58) + "║")
    print("╚" + "═"*58 + "╝\n")

    driver = setup_driver()
    wait = WebDriverWait(driver, 10)

    try:
        # ─────────────────────── STEP 1: LOGIN PAGE ───────────────────────
        step(driver, 1, "LOGIN PAGE", "The entry point — Firebase-powered authentication")
        driver.get(f"{BASE_URL}/login")
        time.sleep(2)

        # Highlight the login form
        try:
            form = driver.find_element(By.CSS_SELECTOR, ".auth-card")
            highlight_element(driver, form)
        except:
            pass

        screenshot(driver, "01_login_page")

        # Show email field interaction
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        highlight_element(driver, email_input, "#4CAF50")
        email_input.click()
        for char in DEMO_EMAIL:
            email_input.send_keys(char)
            time.sleep(0.05)
        time.sleep(0.5)

        # Show password field interaction
        pw_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        highlight_element(driver, pw_input, "#FF9800")
        pw_input.click()
        for char in DEMO_PASSWORD:
            pw_input.send_keys(char)
            time.sleep(0.05)
        time.sleep(0.5)

        screenshot(driver, "02_login_filled")

        # Show password toggle
        try:
            pw_toggle = driver.find_element(By.CSS_SELECTOR, ".auth-pw-toggle")
            highlight_element(driver, pw_toggle, "#E91E63")
            js_click(driver, pw_toggle)
            time.sleep(0.5)
            inject_annotation(driver, "Step 1: Password visibility toggle feature", "#E91E63")
            screenshot(driver, "03_password_visible")
            js_click(driver, pw_toggle)
            time.sleep(0.3)
        except:
            pass

        # Submit login
        inject_annotation(driver, "Step 1: Submitting login credentials...", "#4CAF50")
        submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-btn-primary")
        highlight_element(driver, submit_btn, "#4CAF50")
        time.sleep(0.5)
        js_click(driver, submit_btn)
        time.sleep(2)

        screenshot(driver, "04_after_login")
        print("   ✅ Login successful — redirected to Dashboard")

        # ─────────────────────── STEP 2: DASHBOARD ───────────────────────
        step(driver, 2, "DASHBOARD", "Central hub — action cards, history, and navigation")
        time.sleep(1)

        # Highlight welcome section
        try:
            welcome = driver.find_element(By.CSS_SELECTOR, ".dashboard-welcome")
            highlight_element(driver, welcome, "#6C63FF")
        except:
            pass

        screenshot(driver, "05_dashboard")

        # Highlight action cards
        try:
            cards = driver.find_elements(By.CSS_SELECTOR, ".dash-card")
            card_labels = ["PDF Upload Card", "Text Summarizer Card", "Mind Maps Card"]
            card_colors = ["#6C63FF", "#FF6B6B", "#4ECDC4"]
            for i, card in enumerate(cards):
                if i < len(card_labels):
                    highlight_element(driver, card, card_colors[i])
                    inject_annotation(driver, f"Step 2: Dashboard - {card_labels[i]}", card_colors[i])
                    time.sleep(1)
                    screenshot(driver, f"06_dashboard_card_{i+1}")
                    remove_highlight(driver, card)
        except:
            pass

        # Highlight history section
        try:
            history = driver.find_element(By.CSS_SELECTOR, ".dashboard-history")
            highlight_element(driver, history, "#FF9800")
            inject_annotation(driver, "Step 2: Recent Summaries History", "#FF9800")
            time.sleep(1)
            screenshot(driver, "07_dashboard_history")
        except:
            pass

        # ─────────────────── STEP 3: PDF UPLOAD PAGE ──────────────────────
        step(driver, 3, "PDF UPLOAD PAGE", "Drag & drop zone for PDF documents")

        # Navigate to PDF page
        try:
            pdf_card = driver.find_element(By.CSS_SELECTOR, ".dash-card-pdf")
            js_click(driver, pdf_card)
        except:
            driver.get(f"{BASE_URL}/pdf")
        time.sleep(2)

        screenshot(driver, "08_pdf_upload_page")

        # Highlight hero text
        try:
            hero = driver.find_element(By.CSS_SELECTOR, ".gradient-text")
            highlight_element(driver, hero, "#6C63FF")
            inject_annotation(driver, "Step 3: AI-powered PDF Processing - Hero Section", "#6C63FF")
            time.sleep(1)
            screenshot(driver, "09_pdf_hero")
        except:
            pass

        # ─────────────────── STEP 4: DEMO MODE ──────────────────────────
        step(driver, 4, "DEMO MODE", "Loading sample output to showcase all features")

        # Click demo button
        try:
            demo_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "Demo" in btn.text or "demo" in btn.text:
                    demo_btn = btn
                    break

            if demo_btn:
                highlight_element(driver, demo_btn, "#FF6B6B")
                time.sleep(0.5)
                inject_annotation(driver, "Step 4: Clicking Try Demo button", "#FF6B6B")
                screenshot(driver, "10_demo_button")
                js_click(driver, demo_btn)
                time.sleep(2)
                print("   ✅ Demo mode activated")
            else:
                print("   ⚠️ Demo button not found")
        except Exception as e:
            print(f"   ⚠️ Demo button error: {e}")

        screenshot(driver, "11_demo_loaded")

        # ─────────────────── STEP 5: REELS VIEW ─────────────────────────
        step(driver, 5, "REELS VIEW", "Instagram-style educational content cards")
        time.sleep(1)

        # The demo loads with reels tab active
        screenshot(driver, "12_reels_view")

        # Show reels detail
        try:
            inject_annotation(driver, "Step 5: AI-generated Reels - bite-sized learning cards", "#FF6B6B")
            time.sleep(1.5)
            screenshot(driver, "13_reels_detail")
        except:
            pass

        # ─────────────────── STEP 6: SUMMARY TAB ────────────────────────
        step(driver, 6, "SUMMARY VIEW", "AI-generated structured document summary")

        # Click Summary tab
        try:
            summary_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if btn.text.strip() == "Summary":
                    summary_btn = btn
                    break

            if summary_btn:
                highlight_element(driver, summary_btn, "#4ECDC4")
                time.sleep(0.5)
                js_click(driver, summary_btn)
                time.sleep(2)
                print("   ✅ Switched to Summary tab")
        except Exception as e:
            print(f"   ⚠️ Summary tab error: {e}")

        screenshot(driver, "14_summary_view")

        # Scroll down to show more content
        try:
            summary_panel = driver.find_elements(By.CSS_SELECTOR, "[style*='overflow']")
            if summary_panel:
                driver.execute_script("arguments[0].scrollTop = 300", summary_panel[-1])
                time.sleep(1)
                inject_annotation(driver, "Step 6: Structured summary with headings, key concepts, and insights", "#4ECDC4")
                screenshot(driver, "15_summary_scrolled")
                driver.execute_script("arguments[0].scrollTop = 600", summary_panel[-1])
                time.sleep(1)
                screenshot(driver, "16_summary_more")
        except:
            pass

        # ─────────────────── STEP 7: MIND MAP TAB ───────────────────────
        step(driver, 7, "MIND MAP VIEW", "Interactive D3.js-powered knowledge visualization")

        try:
            mindmap_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "Mind Map" in btn.text:
                    mindmap_btn = btn
                    break

            if mindmap_btn:
                highlight_element(driver, mindmap_btn, "#9B59B6")
                time.sleep(0.5)
                js_click(driver, mindmap_btn)
                time.sleep(2)
                print("   ✅ Switched to Mind Map tab")
                inject_annotation(driver, "Step 7: Interactive Mind Map - D3.js radial tree visualization", "#9B59B6")
                screenshot(driver, "17_mindmap_view")
                time.sleep(1)
                screenshot(driver, "18_mindmap_detail")
            else:
                print("   ⚠️ Mind Map tab not found (may need summary data)")
        except Exception as e:
            print(f"   ⚠️ Mind Map error: {e}")

        # ─────────────────── STEP 8: AI CHAT TAB ────────────────────────
        step(driver, 8, "AI CHAT", "Context-aware chatbot powered by Gemini + Groq")

        try:
            chat_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "AI Chat" in btn.text or "Chat" in btn.text:
                    chat_btn = btn
                    break

            if chat_btn:
                highlight_element(driver, chat_btn, "#E74C3C")
                time.sleep(0.5)
                js_click(driver, chat_btn)
                time.sleep(2)
                print("   ✅ Switched to AI Chat tab")
                inject_annotation(driver, "Step 8: AI Chatbot - Ask questions about your document", "#E74C3C")
                screenshot(driver, "19_chat_view")
            else:
                print("   ⚠️ AI Chat tab not available (needs summary)")
        except Exception as e:
            print(f"   ⚠️ Chat error: {e}")

        # ─────────────────── STEP 9: PDF VIEWER ─────────────────────────
        step(driver, 9, "SPLIT LAYOUT", "PDF Viewer on the left, AI output on the right")

        inject_annotation(driver, "Step 9: Split-screen - PDF preview + AI analysis side by side", "#2196F3")
        time.sleep(1)
        screenshot(driver, "20_split_layout")

        # ─────────────── STEP 10: TEXT SUMMARIZER ────────────────────────
        step(driver, 10, "TEXT SUMMARIZER", "Paste any text and get AI-structured notes")

        # Navigate to text summarizer
        try:
            # Try nav button first
            nav_btns = driver.find_elements(By.TAG_NAME, "button")
            summarize_btn = None
            for btn in nav_btns:
                if "Summarize" in btn.text:
                    summarize_btn = btn
                    break

            if summarize_btn:
                js_click(driver, summarize_btn)
            else:
                driver.get(f"{BASE_URL}/summarize")
        except:
            driver.get(f"{BASE_URL}/summarize")
        time.sleep(2)

        screenshot(driver, "21_text_summarizer")

        # Type sample text
        try:
            textarea = driver.find_element(By.CSS_SELECTOR, ".summarizer-textarea, textarea")
            highlight_element(driver, textarea, "#FF9800")

            sample_text = (
                "Software engineering is a systematic, disciplined, and quantifiable approach "
                "to the development, operation, and maintenance of software. It applies engineering "
                "principles to software creation to ensure reliability, efficiency, and scalability. "
                "Key practices include requirements analysis, system design, coding, testing, and "
                "maintenance. Modern approaches like Agile and DevOps emphasize iterative development, "
                "continuous integration, and rapid delivery of working software."
            )
            textarea.click()
            # Type in chunks for visual effect
            chunks = sample_text.split(". ")
            for i, chunk in enumerate(chunks):
                textarea.send_keys(chunk + (". " if i < len(chunks) - 1 else ""))
                time.sleep(0.2)

            time.sleep(1)
            inject_annotation(driver, "Step 10: Text pasted - ready for AI summarization", "#FF9800")
            screenshot(driver, "22_text_input")

            # Show char count
            try:
                char_count = driver.find_element(By.CSS_SELECTOR, ".char-count")
                highlight_element(driver, char_count, "#4CAF50")
                time.sleep(0.5)
            except:
                pass

            # Highlight generate button (don't actually click to avoid API call)
            gen_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                btn_text = btn.text.strip()
                if "Generate" in btn_text and "Summary" in btn_text:
                    gen_btn = btn
                    break
            if gen_btn:
                highlight_element(driver, gen_btn, "#6C63FF")
                inject_annotation(driver, "Step 10: Generate Summary triggers Gemini AI processing", "#6C63FF")
                time.sleep(1)
                screenshot(driver, "23_generate_button")

        except Exception as e:
            print(f"   ⚠️ Text summarizer error: {e}")

        # ─────────────── STEP 11: NAVIGATION & HEADER ───────────────────
        step(driver, 11, "NAVIGATION", "Header navigation between all sections")

        try:
            # Show header nav
            header = driver.find_element(By.TAG_NAME, "header")
            highlight_element(driver, header, "#6C63FF")
            inject_annotation(driver, "Step 11: Persistent header with logo, navigation, and AI badge", "#6C63FF")
            time.sleep(1)
            screenshot(driver, "24_header_nav")
        except:
            pass

        # Navigate back to dashboard
        try:
            dash_btns = driver.find_elements(By.TAG_NAME, "button")
            clicked = False
            for btn in dash_btns:
                if "Dashboard" in btn.text:
                    js_click(driver, btn)
                    clicked = True
                    break
            if not clicked:
                driver.get(BASE_URL)
        except:
            driver.get(BASE_URL)
        time.sleep(2)

        screenshot(driver, "25_back_to_dashboard")

        # ─────────────────── STEP 12: SIGNUP FLOW ────────────────────────
        step(driver, 12, "SIGNUP PAGE", "New user registration workflow")

        # First log out so we can access signup
        remove_annotation(driver)
        try:
            logout_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "Logout" in btn.text or "Log out" in btn.text:
                    logout_btn = btn
                    break
            if logout_btn:
                js_click(driver, logout_btn)
                time.sleep(1)
        except:
            pass

        driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        screenshot(driver, "26_signup_page")

        # Fill signup form
        try:
            name_input = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
            email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            pw_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")

            # Type name
            highlight_element(driver, name_input, "#4CAF50")
            name_input.click()
            for char in TEST_SIGNUP_NAME:
                name_input.send_keys(char)
                time.sleep(0.04)
            time.sleep(0.3)

            # Type email
            highlight_element(driver, email_input, "#2196F3")
            email_input.click()
            for char in TEST_SIGNUP_EMAIL:
                email_input.send_keys(char)
                time.sleep(0.04)
            time.sleep(0.3)

            # Type passwords
            if len(pw_inputs) >= 2:
                highlight_element(driver, pw_inputs[0], "#FF9800")
                pw_inputs[0].click()
                for char in TEST_SIGNUP_PASSWORD:
                    pw_inputs[0].send_keys(char)
                    time.sleep(0.04)
                time.sleep(0.3)

                highlight_element(driver, pw_inputs[1], "#E91E63")
                pw_inputs[1].click()
                for char in TEST_SIGNUP_PASSWORD:
                    pw_inputs[1].send_keys(char)
                    time.sleep(0.04)

            inject_annotation(driver, "Step 12: Signup form with name, email and password validation", "#4CAF50")
            time.sleep(1)
            screenshot(driver, "27_signup_filled")

        except Exception as e:
            print(f"   ⚠️ Signup form error: {e}")

        # ─────────────────── STEP 13: LOGOUT ─────────────────────────────
        step(driver, 13, "LOGOUT", "Secure session termination")

        # Log back in first to demo logout
        driver.get(f"{BASE_URL}/login")
        time.sleep(1)

        try:
            email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            pw_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            email_input.send_keys(DEMO_EMAIL)
            pw_input.send_keys(DEMO_PASSWORD)
            submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-btn-primary")
            js_click(driver, submit_btn)
            time.sleep(2)
        except:
            driver.get(BASE_URL)
            time.sleep(2)

        # Now click logout
        remove_annotation(driver)
        time.sleep(0.3)

        try:
            logout_btn = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "Logout" in btn.text or "Log out" in btn.text:
                    logout_btn = btn
                    break

            if logout_btn:
                highlight_element(driver, logout_btn, "#F44336")
                inject_annotation(driver, "Step 13: Secure logout - clears session and redirects to login", "#F44336")
                time.sleep(1)
                screenshot(driver, "28_logout_button")
                js_click(driver, logout_btn)
                time.sleep(2)
                screenshot(driver, "29_logged_out")
                print("   ✅ Logged out successfully")
        except Exception as e:
            print(f"   ⚠️ Logout error: {e}")

        # ─────────────────── FINAL SUMMARY ───────────────────────────────
        remove_annotation(driver)
        time.sleep(0.5)

        # Inject final summary overlay
        driver.execute_script("""
            const overlay = document.createElement('div');
            overlay.style.cssText =
                'position: fixed; inset: 0; z-index: 99999;' +
                'background: rgba(10, 10, 15, 0.95);' +
                'display: flex; flex-direction: column;' +
                'align-items: center; justify-content: center;' +
                'font-family: Inter, sans-serif; color: #fff;' +
                'backdrop-filter: blur(20px);';
            overlay.innerHTML =
                '<div style="text-align: center; max-width: 600px; padding: 40px;">' +
                '<h1 style="font-size: 32px; margin-bottom: 16px;' +
                'background: linear-gradient(135deg, #6C63FF, #E91E63);' +
                '-webkit-background-clip: text; -webkit-text-fill-color: transparent;">' +
                'ScrollIO Working Principle Demo Complete</h1>' +
                '<p style="font-size: 16px; color: #aaa; line-height: 1.6; margin-bottom: 24px;">' +
                'This automated walkthrough demonstrated all key features:</p>' +
                '<div style="text-align: left; display: inline-block; font-size: 14px; color: #ccc; line-height: 2;">' +
                '1. Firebase Authentication (Login and Signup)<br>' +
                '2. Dashboard with Action Cards and History<br>' +
                '3. PDF Upload with Drag and Drop<br>' +
                '4. AI Demo Mode (Summary + Reels)<br>' +
                '5. Reels - Bite-sized Learning Cards<br>' +
                '6. Structured Summary with Key Concepts<br>' +
                '7. Interactive D3.js Mind Map<br>' +
                '8. AI Chat (Gemini + Groq)<br>' +
                '9. Split-screen PDF + Analysis Layout<br>' +
                '10. Text Summarizer<br>' +
                '11. Navigation and Header System<br>' +
                '12. Signup Flow<br>' +
                '13. Secure Logout</div>' +
                '<p style="font-size: 12px; color: #666; margin-top: 24px;">' +
                'Powered by Selenium WebDriver</p></div>';
            document.body.appendChild(overlay);
        """)
        time.sleep(2)
        screenshot(driver, "30_walkthrough_complete")

        # ─────────────────── PRINT REPORT ────────────────────────────────
        screenshots_count = len([f for f in os.listdir(SCREENSHOT_DIR) if f.endswith('.png')])
        print("\n" + "╔" + "═"*58 + "╗")
        print("║" + " WALKTHROUGH COMPLETE ".center(58) + "║")
        print("╠" + "═"*58 + "╣")
        print("║" + f" Screenshots: {SCREENSHOT_DIR}".ljust(58) + "║")
        print("║" + f" Total Screenshots: {screenshots_count}".ljust(58) + "║")
        print("║" + f" Total Steps: 13".ljust(58) + "║")
        print("║" + f" Finished: {datetime.now().strftime('%H:%M:%S')}".ljust(58) + "║")
        print("╚" + "═"*58 + "╝")

        # Keep browser open for review
        input("\n   Press ENTER to close the browser...")

    except Exception as e:
        print(f"\n   ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        screenshot(driver, "error_state")
        input("\n   Press ENTER to close the browser...")

    finally:
        driver.quit()
        print("\n   Browser closed. Goodbye! 👋\n")


if __name__ == "__main__":
    run_walkthrough()
