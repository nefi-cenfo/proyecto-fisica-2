import tkinter as tk
from tkinter import ttk
import numpy as np
import matplotlib.pyplot as plt

# --- Lógica para simulaciones ---
def simular():
    tipo = tipo_circuito.get()
    modo = modo_simulacion.get()
    try:
        R = float(entry_R.get())
        L = float(entry_L.get()) * 1e-3
        C = float(entry_C.get()) * 1e-9
        V = float(entry_V.get())
    except ValueError:
        print("Por favor ingresa valores numéricos válidos.")
        return

    if modo == "Frecuencia":
        respuesta_en_frecuencia(tipo, R, L, C, V)
    elif modo == "Tiempo":
        respuesta_en_tiempo(tipo, R, L, C, V)

def respuesta_en_frecuencia(tipo, R, L, C, V):
    f_min = 100
    f_max = 50000
    num_puntos = 500
    frecuencias = np.logspace(np.log10(f_min), np.log10(f_max), num_puntos)

    amplitudes_corriente = []
    Z_min = float("inf")
    I_max = 0
    f_res_teorica = None

    for f in frecuencias:
        X_L = 2 * np.pi * f * L if "L" in tipo else 0
        X_C = 1 / (2 * np.pi * f * C) if "C" in tipo else 0

        if tipo == "R":
            Z = R
        elif tipo == "RL":
            Z = np.sqrt(R**2 + X_L**2)
        elif tipo == "RC":
            Z = np.sqrt(R**2 + X_C**2)
        elif tipo == "RLC":
            Z = np.sqrt(R**2 + (X_L - X_C)**2)
        else:
            return

        I = V / Z
        amplitudes_corriente.append(I)

        if Z < Z_min:
            Z_min = Z
            I_max = I
            if tipo == "RLC":
                f_res_teorica = f

    plt.figure(figsize=(10, 6))
    plt.plot(frecuencias, amplitudes_corriente, label='Amplitud de Corriente (A)')
    if tipo == "RLC" and f_res_teorica:
        plt.axvline(f_res_teorica, color='r', linestyle='--', label=f'Resonancia ≈ {f_res_teorica:.2f} Hz')

    plt.xscale('log')
    plt.xlabel('Frecuencia (Hz)')
    plt.ylabel('Corriente (A)')
    plt.title(f'Respuesta en Frecuencia ({tipo})\nR={R}Ω, L={L*1000:.1f}mH, C={C*1e9:.1f}nF, V={V}V')
    plt.grid(True, which="both", ls="--", c='0.7')
    plt.legend()
    plt.tight_layout()
    plt.show()

def respuesta_en_tiempo(tipo, R, L, C, V):
    if tipo == "RC":
        tau = R * C
        t = np.linspace(0, 5 * tau, 500)
        V_carga = V * (1 - np.exp(-t / tau))
        V_descarga = V * np.exp(-t / tau)

        plt.figure()
        plt.plot(t * 1000, V_carga, label='Carga del capacitor', color='green')
        plt.plot(t * 1000, V_descarga, label='Descarga del capacitor', color='orange')
        plt.xlabel('Tiempo (ms)')
        plt.ylabel('Voltaje del capacitor (V)')
        plt.title(f'Ciclo RC\nR={R}Ω, C={C*1e9:.0f}nF, τ={tau*1000:.2f} ms')
        plt.grid(True)
        plt.legend()
        plt.tight_layout()
        plt.show()

    elif tipo == "RL":
        tau = L / R
        t = np.linspace(0, 5 * tau, 500)
        I_carga = V / R * (1 - np.exp(-t / tau))
        I_descarga = I_carga[-1] * np.exp(-t / tau)

        plt.figure()
        plt.plot(t * 1000, I_carga, label='Crecimiento de corriente', color='blue')
        plt.plot(t * 1000, I_descarga, label='Decaimiento de corriente', color='red')
        plt.xlabel('Tiempo (ms)')
        plt.ylabel('Corriente (A)')
        plt.title(f'Ciclo RL\nR={R}Ω, L={L*1000:.1f}mH, τ={tau*1000:.2f} ms')
        plt.grid(True)
        plt.legend()
        plt.tight_layout()
        plt.show()

    elif tipo == "RLC":
        alpha = R / (2 * L)
        omega_0 = 1 / np.sqrt(L * C)
        t = np.linspace(0, 0.01, 1000)

        if alpha > omega_0:
            s1 = -alpha + np.sqrt(alpha**2 - omega_0**2)
            s2 = -alpha - np.sqrt(alpha**2 - omega_0**2)
            A1, A2 = 5, -5
            V_t = A1 * np.exp(s1 * t) + A2 * np.exp(s2 * t)
            label = "Sobreamortiguado"
        elif alpha == omega_0:
            A, B = 5, 5
            V_t = (A + B * t) * np.exp(-alpha * t)
            label = "Críticamente amortiguado"
        else:
            omega_d = np.sqrt(omega_0**2 - alpha**2)
            A, B = 5, 0
            V_t = np.exp(-alpha * t) * (A * np.cos(omega_d * t) + B * np.sin(omega_d * t))
            label = "Subamortiguado"

        plt.figure()
        plt.plot(t * 1000, V_t, label=label)
        plt.xlabel("Tiempo (ms)")
        plt.ylabel("Voltaje (V)")
        plt.title(f"Respuesta RLC\nR={R}Ω, L={L*1000:.1f}mH, C={C*1e9:.0f}nF")
        plt.grid(True)
        plt.legend()
        plt.tight_layout()
        plt.show()
    else:
        print("Solo RC, RL o RLC tienen comportamiento en el tiempo.")

# --- Interfaz Gráfica con Tkinter ---
root = tk.Tk()
root.title("Simulador de Circuitos R, RL, RC, RLC")

frame = ttk.Frame(root, padding=20)
frame.grid()

# Menú de selección
ttk.Label(frame, text="Tipo de Circuito:").grid(row=0, column=0, sticky="w")
tipo_circuito = ttk.Combobox(frame, values=["R", "RC", "RL", "RLC"])
tipo_circuito.grid(row=0, column=1)
tipo_circuito.set("RC")

ttk.Label(frame, text="Modo de Simulación:").grid(row=1, column=0, sticky="w")
modo_simulacion = ttk.Combobox(frame, values=["Frecuencia", "Tiempo"])
modo_simulacion.grid(row=1, column=1)
modo_simulacion.set("Frecuencia")

# Entradas numéricas
ttk.Label(frame, text="R (Ω):").grid(row=2, column=0, sticky="w")
entry_R = ttk.Entry(frame)
entry_R.grid(row=2, column=1)
entry_R.insert(0, "1000")

ttk.Label(frame, text="L (mH):").grid(row=3, column=0, sticky="w")
entry_L = ttk.Entry(frame)
entry_L.grid(row=3, column=1)
entry_L.insert(0, "0")

ttk.Label(frame, text="C (nF):").grid(row=4, column=0, sticky="w")
entry_C = ttk.Entry(frame)
entry_C.grid(row=4, column=1)
entry_C.insert(0, "100")

ttk.Label(frame, text="Voltaje (V):").grid(row=5, column=0, sticky="w")
entry_V = ttk.Entry(frame)
entry_V.grid(row=5, column=1)
entry_V.insert(0, "5")

# Botón de simulación
ttk.Button(frame, text="Simular", command=simular).grid(row=6, column=0, columnspan=2, pady=10)

root.mainloop()
