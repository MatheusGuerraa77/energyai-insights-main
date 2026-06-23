import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor, HistGradientBoostingRegressor

DATA_PATH = "data/household_power_consumption.csv"
MODELS_DIR = "models"
DOCS_DIR = "docs"

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

print("Carregando dataset...")

df = pd.read_csv(DATA_PATH, low_memory=False)

df["datetime"] = pd.to_datetime(
    df["Date"] + " " + df["Time"],
    format="%d/%m/%y %H:%M:%S",
    errors="coerce"
)

cols = [
    "Global_active_power",
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3"
]

for col in cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df.dropna(subset=["datetime"] + cols, inplace=True)
df = df.sort_values("datetime").set_index("datetime")

print("Agrupando dados por hora...")

df_hora = df.resample("1h").agg({
    "Global_active_power": "mean",
    "Global_reactive_power": "mean",
    "Voltage": "mean",
    "Global_intensity": "mean",
    "Sub_metering_1": "sum",
    "Sub_metering_2": "sum",
    "Sub_metering_3": "sum"
}).dropna()

df_hora = df_hora.reset_index()

print("Criando features para previsão de 1 hora...")

df_hora["hour"] = df_hora["datetime"].dt.hour
df_hora["day_of_week"] = df_hora["datetime"].dt.dayofweek
df_hora["month"] = df_hora["datetime"].dt.month
df_hora["is_weekend"] = df_hora["day_of_week"].isin([5, 6]).astype(int)

df_hora["hour_sin"] = np.sin(2 * np.pi * df_hora["hour"] / 24)
df_hora["hour_cos"] = np.cos(2 * np.pi * df_hora["hour"] / 24)
df_hora["day_sin"] = np.sin(2 * np.pi * df_hora["day_of_week"] / 7)
df_hora["day_cos"] = np.cos(2 * np.pi * df_hora["day_of_week"] / 7)
df_hora["month_sin"] = np.sin(2 * np.pi * df_hora["month"] / 12)
df_hora["month_cos"] = np.cos(2 * np.pi * df_hora["month"] / 12)

for lag in [1, 2, 3, 6, 12, 24, 48, 72, 168]:
    df_hora[f"lag_{lag}h"] = df_hora["Global_active_power"].shift(lag)

for janela in [3, 6, 12, 24, 48, 168]:
    df_hora[f"media_{janela}h"] = df_hora["Global_active_power"].rolling(janela).mean()
    df_hora[f"std_{janela}h"] = df_hora["Global_active_power"].rolling(janela).std()

df_hora["max_24h"] = df_hora["Global_active_power"].rolling(24).max()
df_hora["min_24h"] = df_hora["Global_active_power"].rolling(24).min()
df_hora["diff_1h"] = df_hora["Global_active_power"].diff(1)
df_hora["diff_24h"] = df_hora["Global_active_power"].diff(24)

df_hora["consumo_futuro"] = df_hora["Global_active_power"].shift(-1)
df_hora.dropna(inplace=True)

features = [
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3",

    "hour",
    "day_of_week",
    "month",
    "is_weekend",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
    "month_sin",
    "month_cos",

    "lag_1h",
    "lag_2h",
    "lag_3h",
    "lag_6h",
    "lag_12h",
    "lag_24h",
    "lag_48h",
    "lag_72h",
    "lag_168h",

    "media_3h",
    "media_6h",
    "media_12h",
    "media_24h",
    "media_48h",
    "media_168h",

    "std_3h",
    "std_6h",
    "std_12h",
    "std_24h",
    "std_48h",
    "std_168h",

    "max_24h",
    "min_24h",
    "diff_1h",
    "diff_24h"
]

X = df_hora[features]
y = df_hora["consumo_futuro"]

split_index = int(len(df_hora) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]

modelos = {
    "ExtraTrees_1Hora": ExtraTreesRegressor(
        n_estimators=300,
        max_depth=40,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    ),

    "RandomForest_1Hora": RandomForestRegressor(
        n_estimators=250,
        max_depth=35,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    ),

    "HistGradientBoosting_1Hora": HistGradientBoostingRegressor(
        max_iter=900,
        learning_rate=0.02,
        max_leaf_nodes=63,
        l2_regularization=0.001,
        min_samples_leaf=10,
        random_state=42
    )
}


def calcular_mape(y_real, y_previsto):
    y_real = np.array(y_real)
    y_previsto = np.array(y_previsto)

    mascara = y_real > 0.2

    if mascara.sum() == 0:
        return 0

    return np.mean(np.abs((y_real[mascara] - y_previsto[mascara]) / y_real[mascara])) * 100


def calcular_smape(y_real, y_previsto):
    y_real = np.array(y_real)
    y_previsto = np.array(y_previsto)

    denominador = (np.abs(y_real) + np.abs(y_previsto)) / 2
    mascara = denominador > 0

    if mascara.sum() == 0:
        return 0

    return np.mean(np.abs(y_real[mascara] - y_previsto[mascara]) / denominador[mascara]) * 100


resultados = []
previsoes = []

best_model = None
best_result = None
best_rmse = float("inf")

print("Treinando modelos específicos para 1 hora...")

for nome_modelo, model in modelos.items():
    print(f"\nTreinando {nome_modelo}...")

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_pred = np.maximum(y_pred, 0)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    mape = calcular_mape(y_test.values, y_pred)
    smape = calcular_smape(y_test.values, y_pred)
    acuracia = max(0, min(100, r2 * 100))

    print(f"MAE: {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R²: {r2:.4f}")
    print(f"MAPE: {mape:.2f}%")
    print(f"sMAPE: {smape:.2f}%")
    print(f"Acurácia por R²: {acuracia:.2f}%")

    resultados.append({
        "modelo": nome_modelo,
        "horizonte": "1_hora_agregado",
        "passos": 1,
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "mape": mape,
        "smape": smape,
        "acuracia": acuracia
    })

    if rmse < best_rmse:
        best_rmse = rmse
        best_model = model
        best_result = {
            "modelo": nome_modelo,
            "horizonte": "1_hora_agregado",
            "passos": 1,
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "mape": mape,
            "smape": smape,
            "acuracia": acuracia,
            "y_test": y_test,
            "y_pred": y_pred
        }

resultados_df = pd.DataFrame(resultados)

previsoes_df = pd.DataFrame({
    "horizonte": "1_hora_agregado",
    "modelo": best_result["modelo"],
    "real": best_result["y_test"].values,
    "previsto": best_result["y_pred"]
})

joblib.dump(best_model, f"{MODELS_DIR}/best_model_1_hora_agregado.pkl")
joblib.dump(features, f"{MODELS_DIR}/features_1_hora_agregado.pkl")

resultados_df.to_csv(f"{DOCS_DIR}/metricas_1hora_agregado.csv", index=False)
previsoes_df.to_csv(f"{DOCS_DIR}/previsoes_1hora_agregado.csv", index=False)

ultimos = previsoes_df.tail(24).reset_index(drop=True)

dashboard_1hora = {
    "consumo_atual": round(float(ultimos["real"].iloc[-1]), 2),
    "previsao_24h": round(float(ultimos["previsto"].sum()), 2),
    "economia_estimada": round(float(abs(ultimos["real"].sum() - ultimos["previsto"].sum()) * 0.95), 2),
    "status_modelo": "Online",
    "melhor_modelo": str(best_result["modelo"]),
    "horizonte": "1_hora_agregado",
    "mae": round(float(best_result["mae"]), 4),
    "rmse": round(float(best_result["rmse"]), 4),
    "r2": round(float(best_result["r2"]), 4),
    "mape": round(float(best_result["mape"]), 2),
    "smape": round(float(best_result["smape"]), 2),
    "acuracia": round(float(best_result["acuracia"]), 2)
}

chart_1hora = []

for i, row in ultimos.iterrows():
    chart_1hora.append({
        "hora": f"{i:02d}:00",
        "real": round(float(row["real"]), 2),
        "previsto": round(float(row["previsto"]), 2)
    })

with open(f"{DOCS_DIR}/dashboard_1hora_agregado.json", "w", encoding="utf-8") as f:
    json.dump(dashboard_1hora, f, ensure_ascii=False, indent=2)

with open(f"{DOCS_DIR}/chart_1hora_agregado.json", "w", encoding="utf-8") as f:
    json.dump(chart_1hora, f, ensure_ascii=False, indent=2)

print("\n===== MELHOR RESULTADO 1 HORA AGREGADO =====")
print(f"Modelo: {best_result['modelo']}")
print(f"MAE: {best_result['mae']:.4f}")
print(f"RMSE: {best_result['rmse']:.4f}")
print(f"R²: {best_result['r2']:.4f}")
print(f"MAPE: {best_result['mape']:.2f}%")
print(f"sMAPE: {best_result['smape']:.2f}%")
print(f"Acurácia por R²: {best_result['acuracia']:.2f}%")

print("\nArquivos salvos:")
print("docs/metricas_1hora_agregado.csv")
print("docs/previsoes_1hora_agregado.csv")
print("docs/dashboard_1hora_agregado.json")
print("docs/chart_1hora_agregado.json")