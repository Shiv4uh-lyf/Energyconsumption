"""
EnerSight AI — Analytics Service
Pattern analysis, insights generation from real data.
"""

import numpy as np
import pandas as pd
from typing import Optional


def compute_patterns(df: pd.DataFrame, target: str = "consumption_kwh") -> dict:
    """
    Analyze temporal patterns in consumption data.
    All values computed from actual data — never hardcoded.
    """
    ts = pd.to_datetime(df["timestamp"])
    values = df[target]
    
    # Hourly profile
    hourly_mean = df.groupby(ts.dt.hour)[target].mean().round(4)
    hourly_std = df.groupby(ts.dt.hour)[target].std().round(4)
    
    # Daily profile
    daily_mean = df.groupby(ts.dt.dayofweek)[target].mean().round(4)
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Monthly profile
    monthly_mean = df.groupby(ts.dt.month)[target].mean().round(4)
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Peak demand analysis
    peak_hour = int(hourly_mean.idxmax())
    trough_hour = int(hourly_mean.idxmin())
    peak_day = day_names[int(daily_mean.idxmax())]
    low_day = day_names[int(daily_mean.idxmin())]
    
    # Weekend vs weekday
    is_weekend = ts.dt.dayofweek >= 5
    weekday_mean = float(values[~is_weekend].mean())
    weekend_mean = float(values[is_weekend].mean())
    weekend_diff_pct = round((weekend_mean - weekday_mean) / weekday_mean * 100, 1)
    
    # Trend: linear slope over time
    t = np.arange(len(values))
    slope = float(np.polyfit(t, values.values, 1)[0])
    trend_direction = "increasing" if slope > 0.0001 else ("decreasing" if slope < -0.0001 else "stable")
    
    # Recent vs historical baseline (last 7 days vs previous period)
    if len(df) >= 14 * 24:
        recent = values.iloc[-7 * 24:].mean()
        historical = values.iloc[-14 * 24:-7 * 24].mean()
        baseline_diff_pct = round((float(recent) - float(historical)) / float(historical) * 100, 1)
    else:
        baseline_diff_pct = 0.0
    
    # Heatmap calendar data (day × hour grid)
    df_copy = df.copy()
    df_copy["hour"] = ts.dt.hour
    df_copy["date"] = ts.dt.date
    df_copy["dow"] = ts.dt.dayofweek
    
    # Rolling 7-day data for heatmap
    heatmap = []
    daily_totals = df_copy.groupby("date")[target].sum()
    for date, total in daily_totals.tail(365).items():
        heatmap.append({"date": str(date), "value": round(float(total), 3)})
    
    return {
        "hourly_profile": [
            {"hour": int(h), "mean": float(m), "std": float(s)}
            for h, m, s in zip(hourly_mean.index, hourly_mean.values, hourly_std.values)
        ],
        "daily_profile": [
            {"day": day_names[int(d)], "day_num": int(d), "mean": float(m)}
            for d, m in zip(daily_mean.index, daily_mean.values)
        ],
        "monthly_profile": [
            {"month": month_names[int(mo) - 1], "month_num": int(mo), "mean": float(m)}
            for mo, m in zip(monthly_mean.index, monthly_mean.values)
        ],
        "peak_hour": peak_hour,
        "trough_hour": trough_hour,
        "peak_day": peak_day,
        "low_day": low_day,
        "weekday_mean": round(weekday_mean, 4),
        "weekend_mean": round(weekend_mean, 4),
        "weekend_vs_weekday_pct": weekend_diff_pct,
        "trend_direction": trend_direction,
        "trend_slope_per_hour": round(slope, 6),
        "baseline_diff_pct": baseline_diff_pct,
        "heatmap_data": heatmap,
    }


def generate_ai_insights(
    df: pd.DataFrame,
    patterns: dict,
    anomaly_summary: Optional[dict] = None,
    forecast: Optional[list[dict]] = None,
    target: str = "consumption_kwh",
) -> list[dict]:
    """
    Generate deterministic AI insights from computed data.
    Every statement is backed by an actual calculated value.
    No hallucinated or hardcoded claims.
    """
    insights = []
    values = df[target]
    
    # Insight 1: Peak demand
    ph = patterns.get("peak_hour", 0)
    insights.append({
        "id": "peak_hour",
        "category": "Peak Demand",
        "icon": "zap",
        "severity": "info",
        "title": f"Daily peak demand typically occurs at {ph:02d}:00",
        "detail": (
            f"Historical analysis shows average consumption peaks at {ph:02d}:00 "
            f"({patterns['hourly_profile'][ph]['mean']:.3f} kWh/h). "
            f"Lowest consumption is at {patterns['trough_hour']:02d}:00."
        ),
        "value": patterns['hourly_profile'][ph]['mean'],
        "unit": "kWh/h",
    })
    
    # Insight 2: Weekend pattern
    wdiff = patterns.get("weekend_vs_weekday_pct", 0)
    direction = "lower" if wdiff < 0 else "higher"
    insights.append({
        "id": "weekend_pattern",
        "category": "Weekly Pattern",
        "icon": "calendar",
        "severity": "info",
        "title": f"Weekend consumption is {abs(wdiff):.1f}% {direction} than weekdays",
        "detail": (
            f"Weekday average: {patterns['weekday_mean']:.3f} kWh/h. "
            f"Weekend average: {patterns['weekend_mean']:.3f} kWh/h. "
            f"Highest demand day: {patterns['peak_day']}."
        ),
        "value": wdiff,
        "unit": "%",
    })
    
    # Insight 3: Trend
    trend = patterns.get("trend_direction", "stable")
    trend_emoji = {"increasing": "↗", "decreasing": "↘", "stable": "→"}[trend]
    insights.append({
        "id": "trend",
        "category": "Consumption Trend",
        "icon": "trending-up",
        "severity": "warning" if trend == "increasing" else "success" if trend == "decreasing" else "info",
        "title": f"Overall consumption trend is {trend} {trend_emoji}",
        "detail": (
            f"Long-term slope: {patterns['trend_slope_per_hour']:.6f} kWh/h per hour. "
            f"Recent 7-day consumption is {abs(patterns['baseline_diff_pct']):.1f}% "
            f"{'above' if patterns['baseline_diff_pct'] > 0 else 'below'} the previous 7-day baseline."
        ),
        "value": patterns["baseline_diff_pct"],
        "unit": "%",
    })
    
    # Insight 4: Anomalies
    if anomaly_summary:
        total_a = anomaly_summary.get("total", 0)
        high_a = anomaly_summary.get("high", 0)
        if total_a > 0:
            insights.append({
                "id": "anomalies",
                "category": "Anomaly Status",
                "icon": "alert-triangle",
                "severity": "warning" if high_a > 0 else "info",
                "title": f"{total_a} unusual consumption events detected",
                "detail": (
                    f"{high_a} high-severity and {total_a - high_a} moderate anomalies found. "
                    f"These represent significant deviations from expected patterns. "
                    f"Review the Anomaly Monitor for details."
                ),
                "value": total_a,
                "unit": "events",
            })
        else:
            insights.append({
                "id": "anomalies",
                "category": "Anomaly Status",
                "icon": "check-circle",
                "severity": "success",
                "title": "No significant anomalies detected in recent data",
                "detail": "Consumption patterns appear consistent with historical baselines.",
                "value": 0,
                "unit": "events",
            })
    
    # Insight 5: Forecast peak (if available)
    if forecast and len(forecast) > 0:
        fc_values = [f.get("predicted", 0) for f in forecast]
        fc_ts = [f.get("timestamp", "") for f in forecast]
        if fc_values:
            max_idx = int(np.argmax(fc_values))
            insights.append({
                "id": "forecast_peak",
                "category": "Forecast Intelligence",
                "icon": "activity",
                "severity": "info",
                "title": f"Forecast peak: {max(fc_values):.3f} kWh/h at {fc_ts[max_idx][:16] if fc_ts else 'unknown'}",
                "detail": (
                    f"The selected model predicts peak consumption of "
                    f"{max(fc_values):.3f} kWh/h during the forecast period. "
                    f"Average forecasted consumption: {sum(fc_values)/len(fc_values):.3f} kWh/h."
                ),
                "value": max(fc_values),
                "unit": "kWh/h",
            })
    
    # Insight 6: Data range
    insights.append({
        "id": "data_coverage",
        "category": "Dataset",
        "icon": "database",
        "severity": "info",
        "title": f"Analysis based on {len(df):,} hourly observations",
        "detail": (
            f"Dataset spans {df['timestamp'].iloc[0]}  to {df['timestamp'].iloc[-1]}. "
            f"Mean consumption: {float(values.mean()):.3f} kWh/h. "
            f"Peak recorded: {float(values.max()):.3f} kWh/h."
        ),
        "value": len(df),
        "unit": "observations",
    })
    
    return insights
