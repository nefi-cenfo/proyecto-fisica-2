const el = (id) => document.getElementById(id);
const num = (id, factor = 1) => {
  const node = el(id);
  if (!node) return 0;
  const x = parseFloat(node.value);
  return (Number.isFinite(x) ? x : 0) * factor;
};

let connected = true; // Estado batería

function logspace(a, b, n) {
  const arr = [];
  const la = Math.log10(a), lb = Math.log10(b);
  const step = (lb - la) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(10 ** (la + step * i));
  return arr;
}

// ----- Modo Frecuencia -----
function frecuencia(tipo, R, Rs, L, C, V) {
  const fmin = 100, fmax = 50000, N = 500;
  const fs = logspace(fmin, fmax, N);
  const amps = [];
  let Zmin = Infinity, fRes = null;
  const Rtot = R + Rs;

  for (const f of fs) {
    const XL = (tipo.includes('L') && L > 0) ? (2 * Math.PI * f * L) : 0;
    const XC = (tipo.includes('C') && C > 0) ? (1 / (2 * Math.PI * f * C)) : 0;
    let Z = Rtot;

    if (tipo === 'RL') Z = Math.sqrt(Rtot * Rtot + XL * XL);
    else if (tipo === 'RC') Z = Math.sqrt(Rtot * Rtot + XC * XC);
    else if (tipo === 'RLC') Z = Math.sqrt(Rtot * Rtot + (XL - XC) ** 2);

    const I = V / (Z || 1e-12);
    amps.push(I);
    if (Z < Zmin) { Zmin = Z; if (tipo === 'RLC') fRes = f; }
  }
  return { fs, amps, fRes };
}

// ----- Modo Tiempo -----
function tiempo_RC(R, Rs, C, V) {
  const tau_on = (R + Rs) * C;
  const tau_off = R * C;
  const tau = connected ? tau_on : tau_off;
  const tmax = 5 * (tau || 1e-6);
  const N = 500;
  const t = Array.from({ length: N }, (_, i) => i * (tmax / (N - 1)));
  const y = connected
    ? t.map(tt => V * (1 - Math.exp(-tt / (tau_on || 1e-12))))
    : t.map(tt => V * Math.exp(-tt / (tau_off || 1e-12)));
  return { t_ms: t.map(x => x * 1000), y, label: connected ? 'Carga Vc' : 'Descarga Vc', titleExtra: `τ_on=${(tau_on * 1000).toFixed(2)} ms, τ_off=${(tau_off * 1000).toFixed(2)} ms` };
}

function tiempo_RL(R, Rs, L, V) {
  const tau_on = L / ((R + Rs) || 1e-12);
  const tau_off = L / (R || 1e-12);
  const Iinf_on = V / ((R + Rs) || 1e-12);
  const I0_off = Iinf_on;
  const tmax = 5 * (connected ? tau_on : tau_off);
  const N = 500;
  const t = Array.from({ length: N }, (_, i) => i * (tmax / (N - 1)));
  const y = connected
    ? t.map(tt => Iinf_on * (1 - Math.exp(-tt / (tau_on || 1e-12))))
    : t.map(tt => I0_off * Math.exp(-tt / (tau_off || 1e-12)));
  return { t_ms: t.map(x => x * 1000), y, label: connected ? 'Crecimiento I' : 'Decaimiento I', titleExtra: `τ_on=${(tau_on * 1000).toFixed(2)} ms, τ_off=${(tau_off * 1000).toFixed(2)} ms` };
}

// (Función tiempo_RLC igual que la original...)

function simular() {
  const tipo = el('tipo').value;
  const modo = el('modo').value;
  const R = num('R');
  const Rs = num('Rs');
  const L = num('L', 1e-3);
  const C = num('C', 1e-9);
  const V = num('V');

  if (modo === 'Frecuencia') {
    const { fs, amps, fRes } = frecuencia(tipo, R, Rs, L, C, V);
    const trace = { x: fs, y: amps, type: 'scatter', mode: 'lines', name: '|I| (A)' };
    const shapes = [];
    if (tipo === 'RLC' && fRes) {
      shapes.push({ type: 'line', x0: fRes, x1: fRes, y0: 0, y1: Math.max(...amps), line: { dash: 'dot', width: 2, color: '#ff6b6b' } });
    }
    Plotly.newPlot('plot', [trace], {
      title: `Respuesta en Frecuencia (${tipo}) — R=${R}Ω, Rs=${Rs}Ω, L=${(L * 1000).toFixed(1)}mH, C=${(C * 1e9).toFixed(1)}nF, V=${V}V`,
      xaxis: { title: 'Frecuencia (Hz)', type: 'log' },
      yaxis: { title: 'Corriente (A)' },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      shapes
    }, { responsive: true, displaylogo: false });
    el('info').innerHTML = (tipo === 'RLC' && fRes) ? `≈ Frecuencia de resonancia: <b>${fRes.toFixed(2)} Hz</b>` : '';
  }
  // Resto de modos de tiempo igual que original...
}

// Eventos
el('simular').addEventListener('click', simular);
el('reset').addEventListener('click', () => Plotly.relayout('plot', { 'xaxis.autorange': true, 'yaxis.autorange': true }));
el('battery').addEventListener('click', () => {
  connected = !connected;
  el('battery').textContent = connected ? 'Batería: Conectada' : 'Batería: Desconectada';
  if (el('modo').value === 'Tiempo') simular();
});

// Simulación inicial
simular();
