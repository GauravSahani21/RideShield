"""
RideShield ML Training & Evaluation Pipeline
Trains a multi-class Random Forest classifier on 6-axis IMU features:
Classes:
0: NORMAL
1: HARD_BRAKING
2: HARD_CORNERING
3: POTHOLE
4: POSSIBLE_CRASH
"""

import numpy as np
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

CLASSES = ['NORMAL', 'HARD_BRAKING', 'HARD_CORNERING', 'POTHOLE', 'POSSIBLE_CRASH']

def generate_synthetic_imu_windows(num_samples_per_class=200, window_size=30):
    """
    Generates synthetic 6-axis IMU sensor windows (30 ticks = 1.5s at 20Hz)
    Features extracted:
    - peak_accel_g
    - mean_accel_g
    - accel_variance
    - peak_gyro_rads
    - gyro_variance
    - max_jerk
    - speed_delta_kmh
    """
    X = []
    y = []

    for label_idx, label in enumerate(CLASSES):
        for _ in range(num_samples_per_class):
            if label == 'NORMAL':
                # Baseline gentle road vibration (1G vertical, low gyro, steady speed)
                peak_accel = np.random.uniform(1.0, 1.4)
                mean_accel = np.random.uniform(0.98, 1.05)
                accel_var = np.random.uniform(0.01, 0.05)
                peak_gyro = np.random.uniform(0.1, 0.8)
                gyro_var = np.random.uniform(0.01, 0.08)
                max_jerk = np.random.uniform(0.1, 0.8)
                speed_delta = np.random.uniform(0, 3)

            elif label == 'HARD_BRAKING':
                # Strong deceleration, low rotation, high speed delta
                peak_accel = np.random.uniform(1.4, 2.2)
                mean_accel = np.random.uniform(1.2, 1.6)
                accel_var = np.random.uniform(0.08, 0.25)
                peak_gyro = np.random.uniform(0.2, 1.2)
                gyro_var = np.random.uniform(0.02, 0.12)
                max_jerk = np.random.uniform(1.2, 3.0)
                speed_delta = np.random.uniform(18, 40)

            elif label == 'HARD_CORNERING':
                # High gyro yaw/roll rate, moderate acceleration, steady speed
                peak_accel = np.random.uniform(1.2, 2.0)
                mean_accel = np.random.uniform(1.1, 1.5)
                accel_var = np.random.uniform(0.05, 0.2)
                peak_gyro = np.random.uniform(2.5, 4.5)
                gyro_var = np.random.uniform(0.4, 1.2)
                max_jerk = np.random.uniform(0.8, 2.2)
                speed_delta = np.random.uniform(2, 8)

            elif label == 'POTHOLE':
                # Sharp vertical impact spike, high jerk, low rotation, speed maintained
                peak_accel = np.random.uniform(2.8, 4.2)
                mean_accel = np.random.uniform(1.1, 1.4)
                accel_var = np.random.uniform(0.3, 0.8)
                peak_gyro = np.random.uniform(0.4, 1.5)
                gyro_var = np.random.uniform(0.05, 0.25)
                max_jerk = np.random.uniform(4.5, 9.0)
                speed_delta = np.random.uniform(0, 4)

            elif label == 'POSSIBLE_CRASH':
                # Extreme impact spike (>3.8G), violent rotation (>4 rad/s), massive jerk, sudden speed halt
                peak_accel = np.random.uniform(3.8, 6.5)
                mean_accel = np.random.uniform(2.0, 3.5)
                accel_var = np.random.uniform(0.8, 2.5)
                peak_gyro = np.random.uniform(4.2, 8.0)
                gyro_var = np.random.uniform(1.5, 4.5)
                max_jerk = np.random.uniform(6.0, 15.0)
                speed_delta = np.random.uniform(25, 65)

            features = [
                peak_accel,
                mean_accel,
                accel_var,
                peak_gyro,
                gyro_var,
                max_jerk,
                speed_delta,
            ]
            X.append(features)
            y.append(label_idx)

    return np.array(X), np.array(y)

def main():
    print("=" * 60)
    print("RideShield ML: Training 6-Axis IMU Event Classifier")
    print("=" * 60)

    X, y = generate_synthetic_imu_windows(num_samples_per_class=300)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=CLASSES))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Feature Importance
    feature_names = [
        "peak_accel_g",
        "mean_accel_g",
        "accel_variance",
        "peak_gyro_rads",
        "gyro_variance",
        "max_jerk",
        "speed_delta_kmh",
    ]
    print("\nFeature Importances:")
    for name, imp in zip(feature_names, clf.feature_importances_):
        print(f"  {name:18s}: {imp:.4f}")

    # Export model configuration metadata
    model_meta = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "classes": CLASSES,
        "features": feature_names,
        "accuracy": float(np.mean(y_pred == y_test)),
    }
    with open("rideshield-ml/models/model_metadata.json", "w") as f:
        json.dump(model_meta, f, indent=2)

    print("\n✅ Trained model metadata exported to rideshield-ml/models/model_metadata.json")

if __name__ == "__main__":
    main()
