import os
import json
import gc
import joblib
import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import (
    ExtraTreesRegressor,
    RandomForestRegressor,
    HistGradientBoostingRegressor,
)

DATA_PATH = "data/continuous_dataset.csv"
MODELS_DIR = "models"
DOCS_DIR = "docs"

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

print("Carregando dataset EnergyAI V5...")

df = pd.read_csv(DATA_PATH, low_memory=False)

df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
df.dropna(subset=["datetime", "nat_demand"], inplace=True)
df = df.sort_values("datetime").reset_index(drop=True)

for col in df.columns:
    if col != "datetime":
        df[col] = pd.to_numeric(df[col], errors="coerce")

print("Criando variáveis inteligentes V5...")

df["hour"] = df["datetime"].dt.hour
df["day_of_week"] = df["datetime"].dt.dayofweek
df["month"] = df["datetime"].dt.month
df["day"] = df["datetime"].dt.day
df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

lags = [1, 2, 3, 6, 12, 24, 48, 72, 96, 120, 144, 168, 336, 504, 672]

for lag in lags:
    df[f"lag_{lag}h"] = df["nat_demand"].shift(lag)

janelas = [3, 6, 12, 24, 48, 72, 168, 336, 672]
base_passado = df["nat_demand"].shift(1)

for janela in janelas:
    df[f"media_{janela}h"] = base_passado.rolling(janela).mean()
    df[f"std_{janela}h"] = base_passado.rolling(janela).std()
    df[f"max_{janela}h"] = base_passado.rolling(janela).max()
    df[f"min_{janela}h"] = base_passado.rolling(janela).min()

df["ratio_24h"] = df["lag_1h"] / (df["media_24h"] + 1e-5)
df["ratio_168h"] = df["lag_1h"] / (df["media_168h"] + 1e-5)

df["diff_1h"] = df["lag_1h"] - df["lag_2h"]
df["diff_6h"] = df["lag_1h"] - df["lag_6h"]
df["diff_12h"] = df["lag_1h"] - df["lag_12h"]
df["diff_24h"] = df["lag_1h"] - df["lag_24h"]
df["diff_168h"] = df["lag_1h"] - df["lag_168h"]

weather_features = [
    "T2M_toc", "QV2M_toc", "TQL_toc", "W2M_toc",
    "T2M_san", "QV2M_san", "TQL_san", "W2M_san",
    "T2M_dav", "QV2M_dav", "TQL_dav", "W2M_dav",
]

calendar_features = [
    "Holiday_ID",
    "holiday",
    "school",
    "hour",
    "day_of_week",
    "month",
    "day",
    "is_weekend",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
    "month_sin",
    "month_cos",
]

lag_features = [f"lag_{lag}h" for lag in lags]

rolling_features = []
for janela in janelas:
    rolling_features += [
        f"media_{janela}h",
        f"std_{janela}h",
        f"max_{janela}h",
        f"min_{janela}h",
    ]

diff_features = [
    "diff_1h",
    "diff_6h",
    "diff_12h",
    "diff_24h",
    "diff_168h",
]

extra_features = [
    "ratio_24h",
    "ratio_168h",
]

features = (
    weather_features
    + calendar_features
    + lag_features
    + rolling_features
    + diff_features
    + extra_features
)

features = [col for col in features if col in df.columns]

horizontes = {
    "1_hora": 1,
    "6_horas": 6,
    "12_horas": 12,
    "24_horas": 24,
}

modelos_base = {
    "ExtraTrees": ExtraTreesRegressor(
        n_estimators=130,
        max_depth=28,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    ),
    "RandomForest": RandomForestRegressor(
        n_estimators=110,
        max_depth=25,
        min_samples_leaf=3,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    ),
    "HistGradientBoosting": HistGradientBoostingRegressor(
        max_iter=1200,
        learning_rate=0.02,
        max_leaf_nodes=63,
        l2_regularization=0.001,
        min_samples_leaf=10,
        random_state=42,
    ),
}


def calcular_mape(y_real, y_previsto):
    y_real = np.array(y_real)
    y_previsto = np.array(y_previsto)

    mascara = y_real > 0

    if mascara.sum() == 0:
        return 0

    return (
        np.mean(np.abs((y_real[mascara] - y_previsto[mascara]) / y_real[mascara]))
        * 100
    )


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


def calcular_metricas(y_test, y_pred):
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    mape = calcular_mape(y_test.values, y_pred)
    smape = calcular_smape(y_test.values, y_pred)

    acuracia_r2 = max(0, min(100, r2 * 100))
    acuracia_mape = max(0, min(100, 100 - mape))
    acuracia = (acuracia_r2 + acuracia_mape) / 2

    return mae, rmse, r2, mape, smape, acuracia


def escolher_modelos_por_horizonte(passos):
    if passos == 1:
        return {
            "ExtraTrees": modelos_base["ExtraTrees"],
            "RandomForest": modelos_base["RandomForest"],
            "HistGradientBoosting": modelos_base["HistGradientBoosting"],
        }

    if passos in [6, 12, 24]:
        return {
            "ExtraTrees": modelos_base["ExtraTrees"],
            "HistGradientBoosting": modelos_base["HistGradientBoosting"],
        }

    return modelos_base


resultados_gerais = []
previsoes_gerais = []

for nome_horizonte, passos in horizontes.items():
    print("\n==============================")
    print(f"TREINANDO HORIZONTE: {nome_horizonte}")
    print("==============================")

    df_h = df[["datetime", "nat_demand"] + features].copy()

    df_h[f"lag_horizonte_{passos}h"] = df_h["nat_demand"].shift(passos)
    df_h[f"diff_horizonte_{passos}h"] = (
        df_h["lag_1h"] - df_h[f"lag_horizonte_{passos}h"]
    )

    features_h = features + [
        f"lag_horizonte_{passos}h",
        f"diff_horizonte_{passos}h",
    ]

    df_h["demanda_futura"] = df_h["nat_demand"].shift(-passos)
    df_h.dropna(subset=features_h + ["demanda_futura"], inplace=True)

    X = df_h[features_h]
    y = df_h["demanda_futura"]

    split_index = int(len(df_h) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    datas_test = df_h["datetime"].iloc[split_index:].reset_index(drop=True)

    modelos = escolher_modelos_por_horizonte(passos)

    best_model = None
    best_result = None
    best_rmse = float("inf")
    modelos_treinados = {}

    for nome_modelo, model in modelos.items():
        print(f"\nTreinando {nome_modelo} para {nome_horizonte}...")

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_pred = np.maximum(y_pred, 0)

        mae, rmse, r2, mape, smape, acuracia = calcular_metricas(y_test, y_pred)

        print(f"MAE: {mae:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"R²: {r2:.4f}")
        print(f"MAPE: {mape:.2f}%")
        print(f"sMAPE: {smape:.2f}%")
        print(f"Acurácia combinada: {acuracia:.2f}%")

        resultados_gerais.append(
            {
                "modelo": nome_modelo,
                "horizonte": nome_horizonte,
                "passos": passos,
                "mae": mae,
                "rmse": rmse,
                "r2": r2,
                "mape": mape,
                "smape": smape,
                "acuracia": acuracia,
            }
        )

        modelos_treinados[nome_modelo] = {
            "model": model,
            "pred": y_pred,
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "mape": mape,
            "smape": smape,
            "acuracia": acuracia,
        }

        previsoes_gerais.append(
            pd.DataFrame(
                {
                    "datetime": datas_test,
                    "hora": datas_test.dt.strftime("%H:%M"),
                    "horizonte": nome_horizonte,
                    "modelo": nome_modelo,
                    "real": y_test.values,
                    "previsto": y_pred,
                    "erro_abs": np.abs(y_test.values - y_pred),
                }
            )
        )

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
                "y_pred": y_pred,
            }

    print(f"\nCalculando Ensemble V5 para {nome_horizonte}...")

    pesos = []
    predicoes = []

    for item in modelos_treinados.values():
        peso = 1 / ((item["rmse"] * (1 + item["mape"] / 100)) + 1e-5)
        pesos.append(peso)
        predicoes.append(item["pred"])

    pesos = np.array(pesos)
    pesos = pesos / pesos.sum()

    y_pred_ensemble = np.average(predicoes, axis=0, weights=pesos)
    y_pred_ensemble = np.maximum(y_pred_ensemble, 0)

    mae, rmse, r2, mape, smape, acuracia = calcular_metricas(
        y_test,
        y_pred_ensemble,
    )

    print(f"MAE Ensemble: {mae:.4f}")
    print(f"RMSE Ensemble: {rmse:.4f}")
    print(f"R² Ensemble: {r2:.4f}")
    print(f"MAPE Ensemble: {mape:.2f}%")
    print(f"sMAPE Ensemble: {smape:.2f}%")
    print(f"Acurácia Ensemble: {acuracia:.2f}%")

    resultados_gerais.append(
        {
            "modelo": "Ensemble",
            "horizonte": nome_horizonte,
            "passos": passos,
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "mape": mape,
            "smape": smape,
            "acuracia": acuracia,
        }
    )

    previsoes_gerais.append(
        pd.DataFrame(
            {
                "datetime": datas_test,
                "hora": datas_test.dt.strftime("%H:%M"),
                "horizonte": nome_horizonte,
                "modelo": "Ensemble",
                "real": y_test.values,
                "previsto": y_pred_ensemble,
                "erro_abs": np.abs(y_test.values - y_pred_ensemble),
            }
        )
    )

    if rmse < best_rmse:
        best_rmse = rmse
        best_model = None
        best_result = {
            "modelo": "Ensemble",
            "horizonte": nome_horizonte,
            "passos": passos,
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "mape": mape,
            "smape": smape,
            "acuracia": acuracia,
            "y_test": y_test,
            "y_pred": y_pred_ensemble,
        }

    if best_model is not None and best_result["modelo"] == "HistGradientBoosting":
        joblib.dump(
            best_model,
            f"{MODELS_DIR}/best_model_{nome_horizonte}_v5.pkl",
            compress=3,
        )
    else:
        print("Modelo não salvo para evitar arquivo .pkl gigante.")

    joblib.dump(
        features_h,
        f"{MODELS_DIR}/features_{nome_horizonte}_v5.pkl",
        compress=3,
    )

    plt.figure(figsize=(12, 6))
    plt.plot(best_result["y_test"].values[:300], label="Demanda real")
    plt.plot(
        best_result["y_pred"][:300],
        label=f"Previsão {best_result['modelo']}",
        linestyle="--",
    )
    plt.title(f"EnergyAI V5 - Previsão de Demanda - {nome_horizonte}")
    plt.xlabel("Amostras")
    plt.ylabel("Demanda elétrica")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(f"{DOCS_DIR}/grafico_energyai_v5_{nome_horizonte}.png", dpi=200)
    plt.close()

    del df_h, X, y, X_train, X_test, y_train, y_test
    gc.collect()


resultados_df = pd.DataFrame(resultados_gerais)
resultados_df = resultados_df.sort_values(["horizonte", "rmse"])

previsoes_df_final = pd.concat(previsoes_gerais, ignore_index=True)

resultados_df.to_csv(f"{DOCS_DIR}/metricas_modelos.csv", index=False)
previsoes_df_final.to_csv(f"{DOCS_DIR}/previsoes_modelos.csv", index=False)

melhor_geral = resultados_df.sort_values("rmse").iloc[0]

previsoes_dashboard = previsoes_df_final[
    (previsoes_df_final["horizonte"] == melhor_geral["horizonte"])
    & (previsoes_df_final["modelo"] == melhor_geral["modelo"])
].copy()

ultimos = previsoes_dashboard.tail(24).reset_index(drop=True)

dashboard_data = {
    "consumo_atual": round(float(ultimos["real"].iloc[-1]), 2),
    "previsao_24h": round(float(ultimos["previsto"].sum()), 2),
    "economia_estimada": round(
        float(abs(ultimos["real"].sum() - ultimos["previsto"].sum()) * 0.95),
        2,
    ),
    "status_modelo": "Online",
    "melhor_modelo": str(melhor_geral["modelo"]),
    "horizonte": str(melhor_geral["horizonte"]),
    "mae": round(float(melhor_geral["mae"]), 4),
    "rmse": round(float(melhor_geral["rmse"]), 4),
    "r2": round(float(melhor_geral["r2"]), 4),
    "mape": round(float(melhor_geral["mape"]), 2),
    "smape": round(float(melhor_geral["smape"]), 2),
    "acuracia": round(float(melhor_geral["acuracia"]), 2),
}

chart_data = []

for _, row in ultimos.iterrows():
    chart_data.append(
        {
            "hora": str(row["hora"]),
            "real": round(float(row["real"]), 2),
            "previsto": round(float(row["previsto"]), 2),
        }
    )

with open(f"{DOCS_DIR}/dashboard_data.json", "w", encoding="utf-8") as f:
    json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

with open(f"{DOCS_DIR}/chart_data.json", "w", encoding="utf-8") as f:
    json.dump(chart_data, f, ensure_ascii=False, indent=2)

with open(f"{DOCS_DIR}/metricas.txt", "w", encoding="utf-8") as file:
    file.write("MÉTRICAS DOS MODELOS ENERGYAI V5\n")
    file.write("================================\n\n")

    for _, resultado in resultados_df.sort_values("rmse").iterrows():
        file.write(f"Modelo: {resultado['modelo']}\n")
        file.write(f"Horizonte: {resultado['horizonte']}\n")
        file.write(f"MAE: {resultado['mae']:.4f}\n")
        file.write(f"RMSE: {resultado['rmse']:.4f}\n")
        file.write(f"R²: {resultado['r2']:.4f}\n")
        file.write(f"MAPE: {resultado['mape']:.2f}%\n")
        file.write(f"sMAPE: {resultado['smape']:.2f}%\n")
        file.write(f"Acurácia combinada: {resultado['acuracia']:.2f}%\n")
        file.write("--------------------------------\n")

print("\n===== RESUMO FINAL ENERGYAI V5 =====")
print(resultados_df.sort_values("rmse"))

print("\n===== MELHOR RESULTADO GERAL =====")
print(f"Modelo: {melhor_geral['modelo']}")
print(f"Horizonte: {melhor_geral['horizonte']}")
print(f"MAE: {melhor_geral['mae']:.4f}")
print(f"RMSE: {melhor_geral['rmse']:.4f}")
print(f"R²: {melhor_geral['r2']:.4f}")
print(f"MAPE: {melhor_geral['mape']:.2f}%")
print(f"sMAPE: {melhor_geral['smape']:.2f}%")
print(f"Acurácia combinada: {melhor_geral['acuracia']:.2f}%")

print("\nArquivos salvos:")
print("docs/metricas_modelos.csv")
print("docs/previsoes_modelos.csv")
print("docs/dashboard_data.json")
print("docs/chart_data.json")
print("docs/metricas.txt")