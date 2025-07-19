import numpy as np
import matplotlib.pyplot as plt

# --- 1. Definir los parámetros del circuito ---
# Puedes cambiar estos valores para experimentar
R = 80       # Resistencia en Ohmios (Ω)
L = 10e-3    # Inductancia en Henrios (H) (ej. 10 mH)
C = 150e-9   # Capacitancia en Faradios (F) (ej. 100 nF)
V_fuente = 50 # Amplitud del voltaje de la fuente en Voltios (V)

# --- 2. Definir el rango de frecuencias a simular ---
# np.logspace es útil para rangos de frecuencia logarítmicos
f_min = 100   # Frecuencia mínima en Hz
f_max = 50000 # Frecuencia máxima en Hz (50 kHz)
num_puntos = 500 # Número de puntos para la gráfica, más puntos = curva más suave

frecuencias = np.logspace(np.log10(f_min), np.log10(f_max), num_puntos)

# --- 3. Calcular la frecuencia de resonancia teórica (opcional, pero útil para referencia) ---
# Esta es la frecuencia donde XL y XC se cancelan
f_res_teorica = 1 / (2 * np.pi * np.sqrt(L * C))
print(f"Frecuencia de resonancia teórica: {f_res_teorica:.2f} Hz")

# --- 4. Calcular la corriente para cada frecuencia ---
amplitudes_corriente = []
for f in frecuencias:
    # Reactancia Inductiva
    X_L = 2 * np.pi * f * L
    # Reactancia Capacitiva
    X_C = 1 / (2 * np.pi * f * C)
    
    # Impedancia total del circuito RLC serie
    Z = np.sqrt(R**2 + (X_L - X_C)**2)
    
    # Amplitud de la corriente (Ley de Ohm para AC)
    I = V_fuente / Z
    amplitudes_corriente.append(I)

# Convertir la lista a un arreglo de numpy para facilitar el manejo
amplitudes_corriente = np.array(amplitudes_corriente)

# --- 5. Graficar los resultados ---
plt.figure(figsize=(10, 6))
plt.plot(frecuencias, amplitudes_corriente, label='Amplitud de Corriente')

# Marcar la frecuencia de resonancia teórica con una línea discontinua roja
plt.axvline(f_res_teorica, color='r', linestyle='--', label=f'Resonancia teórica: {f_res_teorica:.2f} Hz') 

# Configuración de los ejes y título
plt.xscale('log') # Escala logarítmica para el eje X (frecuencia) es ideal aquí
plt.xlabel('Frecuencia (Hz)')
plt.ylabel('Amplitud de Corriente (A)')
plt.title(f'Respuesta en Frecuencia de un Circuito RLC Serie\nR={R}Ω, L={L*1000}mH, C={C*1e9}nF, V={V_fuente}V') # Título con parámetros

# Añadir rejilla y leyenda
plt.grid(True, which="both", ls="--", c='0.7') # Rejilla para mejor lectura, tanto mayor como menor
plt.legend()
plt.tight_layout() # Ajusta el diseño para que no se superpongan los elementos
plt.show()