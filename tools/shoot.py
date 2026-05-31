"""Capture screenshots of the static frontend via Playwright.

Build first, then serve the static `out/` directory and run this script:
    cd frontend && npm run build
    python -m http.server 8402 --directory frontend/out &
    python tools/shoot.py http://localhost:8402
"""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "screenshots"
SAMPLE_CSV = ROOT / "backend" / "sample_data" / "sample-sales.csv"


def main(base: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    base = base.rstrip("/")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 1000},
                                device_scale_factor=2)

        # Dashboard on the seeded sample data.
        page.goto(base + "/", wait_until="networkidle")
        page.wait_for_selector("h1", timeout=30000)
        time.sleep(1.5)  # let charts render
        page.screenshot(path=str(OUT / "dashboard.png"), full_page=True)
        print("saved dashboard.png")

        # Upload your own CSV — client-side parse re-renders the dashboard.
        try:
            page.set_input_files('input[type="file"]', str(SAMPLE_CSV))
            time.sleep(1.5)
            page.screenshot(path=str(OUT / "upload.png"), full_page=True)
            print("saved upload.png")
        except Exception as exc:  # noqa: BLE001
            print("upload.png skipped:", exc)

        browser.close()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8402")
