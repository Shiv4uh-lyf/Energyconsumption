"""
EnerSight AI — Live Deployment Smoke Test Suite
Runs end-to-end HTTP checks against a running backend deployment.

Usage:
  python scripts/smoke_test.py --base-url https://energysight-backend.onrender.com
  python scripts/smoke_test.py --base-url http://127.0.0.1:8000
"""

import sys
import time
import json
import argparse
from typing import Optional

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' library required. Install via: pip install requests")
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(description="EnerSight AI Smoke Test Suite")
    parser.add_argument(
        "--base-url",
        type=str,
        default="https://energysight-backend.onrender.com",
        help="Base URL of deployed backend (default: https://energysight-backend.onrender.com)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60,
        help="Request timeout in seconds (default: 60s for Render cold start)",
    )
    return parser.parse_args()


def run_check(name: str, method: str, url: str, expected_status: int = 200, json_payload: Optional[dict] = None, timeout: int = 60) -> dict:
    t0 = time.perf_counter()
    status_str = "FAIL"
    resp_code = 0
    err_msg = ""
    data_preview = ""

    try:
        if method == "GET":
            r = requests.get(url, timeout=timeout)
        elif method == "POST":
            r = requests.post(url, json=json_payload, timeout=timeout)
        else:
            raise ValueError(f"Unsupported method: {method}")

        elapsed_ms = (time.perf_counter() - t0) * 1000
        resp_code = r.status_code

        if r.status_code == expected_status:
            status_str = "PASS"
            try:
                data = r.json()
                if isinstance(data, dict):
                    data_preview = str({k: data[k] for k in list(data.keys())[:3]})
                elif isinstance(data, list):
                    data_preview = f"[{len(data)} items]"
            except Exception:
                data_preview = r.text[:60]
        else:
            err_msg = f"HTTP {r.status_code} (expected {expected_status}): {r.text[:100]}"

    except requests.exceptions.Timeout:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        err_msg = f"Timed out after {timeout}s (Service may be spinning up from cold sleep)"
    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        err_msg = str(e)

    return {
        "name": name,
        "method": method,
        "url": url,
        "status": status_str,
        "code": resp_code,
        "latency_ms": elapsed_ms,
        "error": err_msg,
        "preview": data_preview,
    }


def main():
    args = parse_args()
    base_url = args.base_url.rstrip("/")

    print("=" * 75)
    print("  EnerSight AI — Live Deployment Smoke Tests")
    print(f"  Target: {base_url}")
    print(f"  Timeout: {args.timeout}s")
    print("=" * 75)

    checks = [
        ("Root Route", "GET", f"{base_url}/", 200, None),
        ("Swagger Docs", "GET", f"{base_url}/docs", 200, None),
        ("Health Check", "GET", f"{base_url}/api/health", 200, None),
        ("System Status", "GET", f"{base_url}/api/system/status", 200, None),
        ("Data Summary", "GET", f"{base_url}/api/data/summary", 200, None),
        ("Recent Consumption", "GET", f"{base_url}/api/data/consumption?limit=24", 200, None),
        ("Diurnal Patterns", "GET", f"{base_url}/api/analytics/patterns", 200, None),
        ("Models List", "GET", f"{base_url}/api/models", 200, None),
        ("24h Horizon Forecast", "POST", f"{base_url}/api/forecast", 200, {
            "model": "xgboost",
            "horizon": "24h",
            "include_history": False
        }),
        ("Anomaly Monitor", "GET", f"{base_url}/api/anomalies?limit=10", 200, None),
        ("Model Explainability", "GET", f"{base_url}/api/explainability?model=xgboost", 200, None),
        ("AI Co-Pilot Telemetry Query", "POST", f"{base_url}/api/analytics/copilot", 200, {
            "query": "What is the peak energy demand?"
        }),
    ]

    results = []
    for name, method, url, code, payload in checks:
        print(f"  Testing {name:<28} ... ", end="", flush=True)
        res = run_check(name, method, url, expected_status=code, json_payload=payload, timeout=args.timeout)
        results.append(res)
        color_mark = "✓" if res["status"] == "PASS" else "✗"
        print(f"[{color_mark} {res['status']}]  ({res['latency_ms']:.0f} ms)")
        if res["error"]:
            print(f"      -> Reason: {res['error']}")

    passed = sum(1 for r in results if r["status"] == "PASS")
    total = len(results)

    print("\n" + "=" * 75)
    print(f"  Summary: {passed}/{total} checks passed ({passed/total*100:.1f}%)")
    print("=" * 75)

    if passed == total:
        print("\n  [SUCCESS] All live services are fully operational!")
        sys.exit(0)
    else:
        print(f"\n  [WARNING] {total - passed} check(s) did not complete successfully.")
        sys.exit(1)


if __name__ == "__main__":
    main()
