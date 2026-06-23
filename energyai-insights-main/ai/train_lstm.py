import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import json
import joblib
import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau


DATA_PATH = "data/household_power_consumption.csv"
MODELS_DIR = "models"
DOCS_DIR = "docs"

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

print("Carregando dataset...")

df = pd.read_csv(DATA_PATH)

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

# Usa apenas os dados mais recentes para treinar mais rápido
df = df.tail(120000).reset_index(drop=True)

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

features = [
    "Global_active_power",
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
    "month_sin",
    "month_cos",
    "is_weekend"
]

# Para entregar rápido, treina os horizontes mais importantes
horizontes = {
    "15_minutos": 15,
    "1_hora": 60
}

SEQUENCE_SIZE = 60
EPOCHS = 12
BATCH_SIZE = 128


def calcular_mape(y_real, y_previsto):
    y_real = np.array(y_real).flatten()
    y_previsto = np.array(y_previsto).flatten()

    mascara = y_real != 0

    if mascara.sum() == 0:
        return 0

    return np.mean(np.abs((y_real[mascara] - y_previsto[mascara]) / y_real[mascara])) * 100


def criar_sequencias(dados, alvo, sequence_size):
    X = []
    y = []

    for i in range(sequence_size, len(dados)):
        X.append(dados[i - sequence_size:i])
        y.append(alvo[i])

    return np.array(X), np.array(y)


def criar_modelo(input_shape):
    model = Sequential([
        Input(shape=input_shape),

        LSTM(64, return_sequences=True),
        Dropout(0.2),

        LSTM(32),
        Dropout(0.2),

        Dense(32, activation="relu"),
        Dense(16, activation="relu"),
        Dense(1)
    ])

    model.compile(
        optimizer="adam",
        loss="mean_squared_error"
    )

    return model


resultados_lstm = []
previsoes_lstm = []

for nome_horizonte, passos in horizontes.items():
    print("\n==============================")
    print(f"TREINANDO LSTM OTIMIZADA - HORIZONTE: {nome_horizonte}")
    print("==============================")

    df_h = df.copy()
    df_h["consumo_futuro"] = df_h["Global_active_power"].shift(-passos)
    df_h.dropna(inplace=True)

    dados = df_h[features].values
    alvo = df_h[["consumo_futuro"]].values

    split_index = int(len(df_h) * 0.8)

    dados_train = dados[:split_index]
    dados_test = dados[split_index - SEQUENCE_SIZE:]

    alvo_train = alvo[:split_index]
    alvo_test = alvo[split_index - SEQUENCE_SIZE:]

    scaler_x = MinMaxScaler()
    scaler_y = MinMaxScaler()

    dados_train_scaled = scaler_x.fit_transform(dados_train)
    dados_test_scaled = scaler_x.transform(dados_test)

    alvo_train_scaled = scaler_y.fit_transform(alvo_train)
    alvo_test_scaled = scaler_y.transform(alvo_test)

    X_train, y_train = criar_sequencias(
        dados_train_scaled,
        alvo_train_scaled,
        SEQUENCE_SIZE
    )

    X_test, y_test = criar_sequencias(
        dados_test_scaled,
        alvo_test_scaled,
        SEQUENCE_SIZE
    )

    print("Formato X_train:", X_train.shape)
    print("Formato y_train:", y_train.shape)
    print("Formato X_test:", X_test.shape)
    print("Formato y_test:", y_test.shape)

    model = criar_modelo((X_train.shape[1], X_train.shape[2]))

    early_stop = EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True
    )

    reduce_lr = ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=0.00001
    )

    print("\nTreinando modelo LSTM otimizado...")

    history = model.fit(
        X_train,
        y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=0.1,
        callbacks=[early_stop, reduce_lr],
        verbose=1
    )

    y_pred_scaled = model.predict(X_test)

    y_pred = scaler_y.inverse_transform(y_pred_scaled)
    y_test_real = scaler_y.inverse_transform(y_test)

    y_pred = np.maximum(y_pred, 0)

    mae = mean_absolute_error(y_test_real, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test_real, y_pred))
    r2 = r2_score(y_test_real, y_pred)
    mape = calcular_mape(y_test_real, y_pred)

    print("\n===== MÉTRICAS LSTM OTIMIZADA =====")
    print(f"Horizonte: {nome_horizonte}")
    print(f"MAE: {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R²: {r2:.4f}")
    print(f"MAPE: {mape:.2f}%")

    model.save(f"{MODELS_DIR}/energy_lstm_otimizada_{nome_horizonte}.keras")
    joblib.dump(scaler_x, f"{MODELS_DIR}/lstm_otimizada_scaler_x_{nome_horizonte}.pkl")
    joblib.dump(scaler_y, f"{MODELS_DIR}/lstm_otimizada_scaler_y_{nome_horizonte}.pkl")
    joblib.dump(features, f"{MODELS_DIR}/lstm_otimizada_features_{nome_horizonte}.pkl")

    resultados_lstm.append({
        "modelo": "LSTM_Otimizada",
        "horizonte": nome_horizonte,
        "passos": passos,
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "mape": mape
    })

    previsoes_lstm.append(pd.DataFrame({
        "horizonte": nome_horizonte,
        "modelo": "LSTM_Otimizada",
        "real": y_test_real.flatten(),
        "previsto": y_pred.flatten()
    }))

    plt.figure(figsize=(12, 6))
    plt.plot(y_test_real[:300], label="Consumo real")
    plt.plot(y_pred[:300], label="Previsão LSTM Otimizada")
    plt.title(f"LSTM Otimizada - {nome_horizonte}")
    plt.xlabel("Amostras")
    plt.ylabel("Consumo")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(f"{DOCS_DIR}/grafico_lstm_otimizada_{nome_horizonte}.png", dpi=300)
    plt.close()

    plt.figure(figsize=(10, 5))
    plt.plot(history.history["loss"], label="Erro no treino")
    plt.plot(history.history["val_loss"], label="Erro na validação")
    plt.title(f"Treinamento LSTM Otimizada - {nome_horizonte}")
    plt.xlabel("Épocas")
    plt.ylabel("Erro")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(f"{DOCS_DIR}/grafico_treinamento_lstm_otimizada_{nome_horizonte}.png", dpi=300)
    plt.close()


resultados_df = pd.DataFrame(resultados_lstm)
resultados_df.to_csv(f"{DOCS_DIR}/metricas_lstm_otimizada.csv", index=False)

previsoes_df = pd.concat(previsoes_lstm, ignore_index=True)
previsoes_df.to_csv(f"{DOCS_DIR}/previsoes_lstm_otimizada.csv", index=False)

melhor_lstm = resultados_df.sort_values("rmse").iloc[0]

previsoes_1h = previsoes_df[
    previsoes_df["horizonte"] == "1_hora"
].copy()

ultimos = previsoes_1h.tail(24).reset_index(drop=True)

if len(ultimos) > 0:
    dashboard_data = {
        "consumo_atual": round(float(ultimos["real"].iloc[-1]), 2),
        "previsao_24h": round(float(ultimos["previsto"].sum()), 2),
        "economia_estimada": round(float(abs(ultimos["real"].sum() - ultimos["previsto"].sum()) * 0.95), 2),
        "status_modelo": "Online",
        "melhor_modelo": str(melhor_lstm["modelo"]),
        "horizonte": str(melhor_lstm["horizonte"]),
        "mae": round(float(melhor_lstm["mae"]), 4),
        "rmse": round(float(melhor_lstm["rmse"]), 4),
        "r2": round(float(melhor_lstm["r2"]), 4),
        "mape": round(float(melhor_lstm["mape"]), 2),
        "acuracia": round(float(100 - melhor_lstm["mape"]), 2)
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


print("\n===== RESUMO FINAL LSTM OTIMIZADA =====")
print(resultados_df.sort_values("rmse"))

print("\n===== MELHOR RESULTADO LSTM OTIMIZADA =====")
print(f"Horizonte: {melhor_lstm['horizonte']}")
print(f"MAE: {melhor_lstm['mae']:.4f}")
print(f"RMSE: {melhor_lstm['rmse']:.4f}")
print(f"R²: {melhor_lstm['r2']:.4f}")
print(f"MAPE: {melhor_lstm['mape']:.2f}%")

print("\nArquivos salvos:")
print("docs/metricas_lstm_otimizada.csv")
print("docs/previsoes_lstm_otimizada.csv")
print("docs/dashboard_data.json")
print("docs/chart_data.json")