import os
import json
import joblib
import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

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

colunas_numericas = [
    "Global_active_power",
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3"
]

for col in colunas_numericas:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df.dropna(subset=["datetime"] + colunas_numericas, inplace=True)
df = df.sort_values("datetime").reset_index(drop=True)

# Use mais dados para melhorar a acurácia
df = df.tail(500000).reset_index(drop=True)

print("Criando variáveis inteligentes...")

df["hour"] = df["datetime"].dt.hour
df["day_of_week"] = df["datetime"].dt.dayofweek
df["month"] = df["datetime"].dt.month
df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

lags = [
    1, 2, 3, 5, 10, 15, 30, 60,
    120, 180, 360, 720, 1440, 2880, 10080
]

for lag in lags:
    df[f"lag_{lag}"] = df["Global_active_power"].shift(lag)

janelas = [5, 15, 30, 60, 120, 180, 360, 720, 1440]

for janela in janelas:
    df[f"media_{janela}"] = df["Global_active_power"].rolling(janela).mean()
    df[f"std_{janela}"] = df["Global_active_power"].rolling(janela).std()

df["max_60"] = df["Global_active_power"].rolling(60).max()
df["min_60"] = df["Global_active_power"].rolling(60).min()
df["max_360"] = df["Global_active_power"].rolling(360).max()
df["min_360"] = df["Global_active_power"].rolling(360).min()
df["max_1440"] = df["Global_active_power"].rolling(1440).max()
df["min_1440"] = df["Global_active_power"].rolling(1440).min()

df["diff_1"] = df["Global_active_power"].diff(1)
df["diff_5"] = df["Global_active_power"].diff(5)
df["diff_15"] = df["Global_active_power"].diff(15)
df["diff_60"] = df["Global_active_power"].diff(60)
df["diff_1440"] = df["Global_active_power"].diff(1440)

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

    "lag_1",
    "lag_2",
    "lag_3",
    "lag_5",
    "lag_10",
    "lag_15",
    "lag_30",
    "lag_60",
    "lag_120",
    "lag_180",
    "lag_360",
    "lag_720",
    "lag_1440",
    "lag_2880",
    "lag_10080",

    "media_5",
    "media_15",
    "media_30",
    "media_60",
    "media_120",
    "media_180",
    "media_360",
    "media_720",
    "media_1440",

    "std_5",
    "std_15",
    "std_30",
    "std_60",
    "std_120",
    "std_180",
    "std_360",
    "std_720",
    "std_1440",

    "max_60",
    "min_60",
    "max_360",
    "min_360",
    "max_1440",
    "min_1440",

    "diff_1",
    "diff_5",
    "diff_15",
    "diff_60",
    "diff_1440"
]

horizontes = {
    "1_minuto": 1,
    "5_minutos": 5,
    "15_minutos": 15,
    "1_hora": 60
}

modelos = {
    "ExtraTrees": ExtraTreesRegressor(
        n_estimators=180,
        max_depth=35,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    ),

    "RandomForest": RandomForestRegressor(
        n_estimators=140,
        max_depth=30,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    ),

    "HistGradientBoosting": HistGradientBoostingRegressor(
        max_iter=700,
        learning_rate=0.025,
        max_leaf_nodes=63,
        l2_regularization=0.001,
        min_samples_leaf=15,
        random_state=42
    )
}


def calcular_mape(y_real, y_previsto):
    y_real = np.array(y_real)
    y_previsto = np.array(y_previsto)

    mascara = y_real > 0.2

    if mascara.sum() == 0:
        return 0

    return np.mean(
        np.abs((y_real[mascara] - y_previsto[mascara]) / y_real[mascara])
    ) * 100


def calcular_smape(y_real, y_previsto):
    y_real = np.array(y_real)
    y_previsto = np.array(y_previsto)

    denominador = (np.abs(y_real) + np.abs(y_previsto)) / 2
    mascara = denominador > 0

    if mascara.sum() == 0:
        return 0

    return np.mean(
        np.abs(y_real[mascara] - y_previsto[mascara]) / denominador[mascara]
    ) * 100


resultados_gerais = []
previsoes_gerais = []

for nome_horizonte, passos in horizontes.items():
    print("\n==============================")
    print(f"TREINANDO HORIZONTE: {nome_horizonte}")
    print("==============================")

    df_h = df.copy()
    df_h["consumo_futuro"] = df_h["Global_active_power"].shift(-passos)
    df_h.dropna(inplace=True)

    X = df_h[features]
    y = df_h["consumo_futuro"]

    split_index = int(len(df_h) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    best_model = None
    best_result = None
    best_rmse = float("inf")

    for nome_modelo, model in modelos.items():
        print(f"\nTreinando {nome_modelo} para {nome_horizonte}...")

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_pred = np.maximum(y_pred, 0)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        mape = calcular_mape(y_test.values, y_pred)
        smape = calcular_smape(y_test.values, y_pred)

        # Acurácia correta para regressão baseada em R²
        acuracia = max(0, min(100, r2 * 100))

        print(f"MAE: {mae:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"R²: {r2:.4f}")
        print(f"MAPE ajustado: {mape:.2f}%")
        print(f"sMAPE: {smape:.2f}%")
        print(f"Acurácia por R²: {acuracia:.2f}%")

        resultados_gerais.append({
            "modelo": nome_modelo,
            "horizonte": nome_horizonte,
            "passos": passos,
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
                "horizonte": nome_horizonte,
                "passos": passos,
                "mae": mae,
                "rmse": rmse,
                "r2": r2,
                "mape": mape,
                "smape": smape,
                "acuracia": acuracia,
                "y_test": y_test,
                "y_pred": y_pred
            }

    joblib.dump(best_model, f"{MODELS_DIR}/best_model_{nome_horizonte}.pkl")
    joblib.dump(features, f"{MODELS_DIR}/features_{nome_horizonte}.pkl")

    plt.figure(figsize=(12, 6))
    plt.plot(best_result["y_test"].values[:300], label="Consumo real")
    plt.plot(best_result["y_pred"][:300], label=f"Previsão {best_result['modelo']}")
    plt.title(f"Previsão de Consumo - {nome_horizonte}")
    plt.xlabel("Amostras")
    plt.ylabel("Global active power")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(f"{DOCS_DIR}/grafico_{nome_horizonte}.png", dpi=300)
    plt.close()

    previsoes_df = pd.DataFrame({
        "horizonte": nome_horizonte,
        "modelo": best_result["modelo"],
        "real": best_result["y_test"].values,
        "previsto": best_result["y_pred"]
    })

    previsoes_gerais.append(previsoes_df)

resultados_df = pd.DataFrame(resultados_gerais)
resultados_df.to_csv(f"{DOCS_DIR}/metricas_modelos.csv", index=False)

previsoes_df_final = pd.concat(previsoes_gerais, ignore_index=True)
previsoes_df_final.to_csv(f"{DOCS_DIR}/previsoes_modelos.csv", index=False)

melhor_geral = resultados_df.sort_values("rmse").iloc[0]

previsoes_dashboard = previsoes_df_final[
    previsoes_df_final["horizonte"] == melhor_geral["horizonte"]
].copy()

ultimos = previsoes_dashboard.tail(24).reset_index(drop=True)

dashboard_data = {
    "consumo_atual": round(float(ultimos["real"].iloc[-1]), 2),
    "previsao_24h": round(float(ultimos["previsto"].sum()), 2),
    "economia_estimada": round(float(abs(ultimos["real"].sum() - ultimos["previsto"].sum()) * 0.95), 2),
    "status_modelo": "Online",
    "melhor_modelo": str(melhor_geral["modelo"]),
    "horizonte": str(melhor_geral["horizonte"]),
    "mae": round(float(melhor_geral["mae"]), 4),
    "rmse": round(float(melhor_geral["rmse"]), 4),
    "r2": round(float(melhor_geral["r2"]), 4),
    "mape": round(float(melhor_geral["mape"]), 2),
    "smape": round(float(melhor_geral["smape"]), 2),
    "acuracia": round(float(melhor_geral["acuracia"]), 2)
}

chart_data = []

for i, row in ultimos.iterrows():
    chart_data.append({
        "hora": f"{i:02d}:00",
        "real": round(float(row["real"]), 2),
        "previsto": round(float(row["previsto"]), 2)
    })

with open(f"{DOCS_DIR}/dashboard_data.json", "w", encoding="utf-8") as f:
    json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

with open(f"{DOCS_DIR}/chart_data.json", "w", encoding="utf-8") as f:
    json.dump(chart_data, f, ensure_ascii=False, indent=2)

with open(f"{DOCS_DIR}/metricas.txt", "w", encoding="utf-8") as file:
    file.write("MÉTRICAS DOS MODELOS DE PREVISÃO\n")
    file.write("================================\n\n")

    for _, resultado in resultados_df.sort_values("rmse").iterrows():
        file.write(f"Modelo: {resultado['modelo']}\n")
        file.write(f"Horizonte: {resultado['horizonte']}\n")
        file.write(f"MAE: {resultado['mae']:.4f}\n")
        file.write(f"RMSE: {resultado['rmse']:.4f}\n")
        file.write(f"R²: {resultado['r2']:.4f}\n")
        file.write(f"MAPE ajustado: {resultado['mape']:.2f}%\n")
        file.write(f"sMAPE: {resultado['smape']:.2f}%\n")
        file.write(f"Acurácia por R²: {resultado['acuracia']:.2f}%\n")
        file.write("--------------------------------\n")

print("\n===== RESUMO FINAL ORDENADO POR RMSE =====")
print(resultados_df.sort_values("rmse"))

print("\n===== MELHOR RESULTADO GERAL =====")
print(f"Modelo: {melhor_geral['modelo']}")
print(f"Horizonte: {melhor_geral['horizonte']}")
print(f"MAE: {melhor_geral['mae']:.4f}")
print(f"RMSE: {melhor_geral['rmse']:.4f}")
print(f"R²: {melhor_geral['r2']:.4f}")
print(f"MAPE ajustado: {melhor_geral['mape']:.2f}%")
print(f"sMAPE: {melhor_geral['smape']:.2f}%")
print(f"Acurácia por R²: {melhor_geral['acuracia']:.2f}%")

print("\nArquivos salvos:")
print("docs/metricas_modelos.csv")
print("docs/previsoes_modelos.csv")
print("docs/dashboard_data.json")
print("docs/chart_data.json")
print("docs/metricas.txt")