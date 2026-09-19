"""
EnerSight AI — Demo Data Generator
Generates realistic synthetic electricity consumption data when UCI dataset is unavailable.
Clearly labeled as DEMO DATA — NOT real-world measurements.
"""

import numpy as np
import pandas as pd
from pathlib import Path
import json
from datetime import datetime, timedelta

# Deterministic seed for reproducibility
RNG = np.random.default_rng(42)


ROOT = Path(__file__).parent.parent
DEFAULT_DATA_DIR = ROOT / "backend" / "data"


def generate_demo_data(
    start: str = "2021-01-01 00:00:00",
    periods_hours: int = 8760 * 2,  # 2 years of hourly data
    output_dir: str = None,
) -> pd.DataFrame:
    """
    Generate realistic synthetic electricity consumption data.
    Uses additive decomposition: trend + seasonal + noise.
    
    Returns hourly consumption in kWh.
    """
    print("[DEMO DATA] Generating synthetic dataset — NOT real-world measurements")
    if output_dir is None:
        out_path = DEFAULT_DATA_DIR
    else:
        out_path = Path(output_dir)
    
    timestamps = pd.date_range(start=start, periods=periods_hours, freq="h")
    n = len(timestamps)
    t = np.arange(n)
    
    # --- Long-term trend (slight upward with small dip mid-period) ---
    trend = 1.5 + 0.00005 * t - 0.00000001 * (t - n / 2) ** 2
    
    # --- Annual seasonality (higher in winter/summer, lower spring/fall) ---
    annual = 0.4 * np.cos(2 * np.pi * t / (24 * 365) - np.pi)  # peaks at start/end of year
    
    # --- Weekly seasonality (lower on weekends) ---
    dow = timestamps.dayofweek.to_numpy()  # 0=Mon, 6=Sun
    weekly_profile = np.where(dow >= 5, -0.25, 0.1)  # weekends lower
    
    # --- Daily profile (realistic 24h shape) ---
   hour = timestamps.hour.to_numpy()
    # Morning ramp, midday plateau, evening peak, overnight trough
    daily = (
        0.4 * np.exp(-((hour - 18) ** 2) / 8)   # evening peak at 18:00
        + 0.25 * np.exp(-((hour - 9) ** 2) / 6)  # morning peak at 09:00
        - 0.3 * np.exp(-((hour - 3) ** 2) / 4)   # overnight trough at 03:00
    )
    
    # --- Holiday/special event dips (random days of lower consumption) ---
    holiday_mask = np.zeros(n)
    holiday_hours = RNG.choice(n, size=int(n * 0.02), replace=False)  # ~2% of hours
    holiday_mask[holiday_hours] = -0.4
    
    # --- Combine components ---
    consumption = trend + annual + weekly_profile + daily + holiday_mask
    
    # --- Add realistic noise ---
    noise = RNG.normal(0, 0.08, n)
    consumption = consumption + noise
    
    # --- Add occasional anomaly spikes (for anomaly detection demo) ---
    spike_indices = RNG.choice(n, size=25, replace=False)
    consumption[spike_indices] += RNG.uniform(1.5, 3.0, 25)  # sudden spikes
    dip_indices = RNG.choice(n, size=15, replace=False)
    consumption[dip_indices] -= RNG.uniform(0.8, 1.5, 15)  # sudden dips
    
    # Clip to realistic range (0.3 to 5 kWh per hour for a household)
    consumption = np.clip(consumption, 0.3, 5.0)
    
    df = pd.DataFrame({
        "timestamp": timestamps,
        "consumption_kwh": np.round(consumption, 4),
        "is_demo": True,
    })
    
    # Save
    out_path.mkdir(parents=True, exist_ok=True)
    csv_path = out_path / "demo_consumption.csv"
    df.to_csv(csv_path, index=False)
    
    # Save metadata
    meta = {
        "source": "SYNTHETIC DEMO DATA — NOT REAL MEASUREMENTS",
        "generated_at": datetime.now().isoformat(),
        "rows": len(df),
        "start": str(df["timestamp"].iloc[0]),
        "end": str(df["timestamp"].iloc[-1]),
        "frequency": "1H",
        "seed": 42,
        "is_demo": True,
    }
    with open(out_path / "demo_metadata.json", "w") as f:
        json.dump(meta, f, indent=2)
    
    print(f"[DEMO DATA] Saved {len(df)} rows to {csv_path}")
    return df


if __name__ == "__main__":
    generate_demo_data()
