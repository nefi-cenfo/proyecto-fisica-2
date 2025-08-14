import React, {useState, useEffect, useCallback} from 'react'
import Plot from 'react-plotly.js'
import './App.css'

const App = () => {
  const [config, setConfig] = useState({
    tipo: 'RC',
    modo: 'Frecuencia',
    R: 1000,
    Rs: 0,
    L: 0,
    C: 100,
    V: 5,
  })

  const [connected, setConnected] = useState(true)
  const [plotData, setPlotData] = useState([])
  const [plotLayout, setPlotLayout] = useState({})
  const [info, setInfo] = useState('')

  // Helper functions
  const logspace = (a, b, n) => {
    const arr = []
    const la = Math.log10(a),
      lb = Math.log10(b)
    const step = (lb - la) / (n - 1)
    for (let i = 0; i < n; i++) arr.push(10 ** (la + step * i))
    return arr
  }

  // Frequency response simulation
  const frecuencia = useCallback((tipo, R, Rs, L, C, V) => {
    const fmin = 100,
      fmax = 50000,
      N = 500
    const fs = logspace(fmin, fmax, N)
    const amps = []
    let Zmin = Infinity,
      fRes = null
    const Rtot = R + Rs

    for (const f of fs) {
      const XL = tipo.includes('L') && L > 0 ? 2 * Math.PI * f * L : 0
      const XC = tipo.includes('C') && C > 0 ? 1 / (2 * Math.PI * f * C) : 0
      let Z = Rtot

      if (tipo === 'RL') Z = Math.sqrt(Rtot * Rtot + XL * XL)
      else if (tipo === 'RC') Z = Math.sqrt(Rtot * Rtot + XC * XC)
      else if (tipo === 'RLC') Z = Math.sqrt(Rtot * Rtot + (XL - XC) ** 2)

      const I = V / (Z || 1e-12)
      amps.push(I)
      if (Z < Zmin) {
        Zmin = Z
        if (tipo === 'RLC') fRes = f
      }
    }
    return {fs, amps, fRes}
  }, [])

  // Time response simulations
  const tiempo_RC = useCallback((R, Rs, C, V, connected) => {
    const tau_on = (R + Rs) * C
    const tau_off = R * C
    const tau = connected ? tau_on : tau_off
    const tmax = 5 * (tau || 1e-6)
    const N = 500
    const t = Array.from({length: N}, (_, i) => i * (tmax / (N - 1)))
    const y = connected
      ? t.map((tt) => V * (1 - Math.exp(-tt / (tau_on || 1e-12))))
      : t.map((tt) => V * Math.exp(-tt / (tau_off || 1e-12)))

    return {
      t_ms: t.map((x) => x * 1000),
      y,
      label: connected ? 'Carga Vc' : 'Descarga Vc',
      titleExtra: `τ_on=${(tau_on * 1000).toFixed(2)} ms, τ_off=${(
        tau_off * 1000
      ).toFixed(2)} ms`,
    }
  }, [])

  const tiempo_RL = useCallback((R, Rs, L, V, connected) => {
    const tau_on = L / (R + Rs || 1e-12)
    const tau_off = L / (R || 1e-12)
    const Iinf_on = V / (R + Rs || 1e-12)
    const I0_off = Iinf_on
    const tmax = 5 * (connected ? tau_on : tau_off)
    const N = 500
    const t = Array.from({length: N}, (_, i) => i * (tmax / (N - 1)))
    const y = connected
      ? t.map((tt) => Iinf_on * (1 - Math.exp(-tt / (tau_on || 1e-12))))
      : t.map((tt) => I0_off * Math.exp(-tt / (tau_off || 1e-12)))

    return {
      t_ms: t.map((x) => x * 1000),
      y,
      label: connected ? 'Crecimiento I' : 'Decaimiento I',
      titleExtra: `τ_on=${(tau_on * 1000).toFixed(2)} ms, τ_off=${(
        tau_off * 1000
      ).toFixed(2)} ms`,
    }
  }, [])

  const tiempo_RLC = useCallback((R, Rs, L, C, V) => {
    const alpha = (R + Rs) / (2 * L)
    const omega_0 = 1 / Math.sqrt(L * C)
    const tmax = 0.01
    const N = 1000
    const t = Array.from({length: N}, (_, i) => i * (tmax / (N - 1)))
    let y, label

    if (alpha > omega_0) {
      // Overdamped
      const r1 = -alpha + Math.sqrt(alpha * alpha - omega_0 * omega_0)
      const r2 = -alpha - Math.sqrt(alpha * alpha - omega_0 * omega_0)
      const A = V / (r1 - r2)
      const B = -A
      y = t.map((tt) => A * Math.exp(r1 * tt) + B * Math.exp(r2 * tt))
      label = 'Sobreamortiguado'
    } else if (Math.abs(alpha - omega_0) < 1e-6) {
      // Critically damped
      const A = V
      const B = alpha * V
      y = t.map((tt) => Math.exp(-alpha * tt) * (A + B * tt))
      label = 'Críticamente amortiguado'
    } else {
      // Underdamped
      const omega_d = Math.sqrt(omega_0 * omega_0 - alpha * alpha)
      const A = V
      const B = (alpha * V) / omega_d
      y = t.map(
        (tt) =>
          Math.exp(-alpha * tt) *
          (A * Math.cos(omega_d * tt) + B * Math.sin(omega_d * tt))
      )
      label = 'Subamortiguado'
    }

    return {
      t_ms: t.map((x) => x * 1000),
      y,
      label,
      titleExtra: `α=${alpha.toFixed(2)}, ω₀=${omega_0.toFixed(2)}`,
    }
  }, [])

  // Main simulation function
  const simular = useCallback(() => {
    const {tipo, modo, R, Rs, L, C, V} = config
    const L_H = L * 1e-3 // Convert mH to H
    const C_F = C * 1e-9 // Convert nF to F

    if (modo === 'Frecuencia') {
      const {fs, amps, fRes} = frecuencia(tipo, R, Rs, L_H, C_F, V)

      const trace = {
        x: fs,
        y: amps,
        type: 'scatter',
        mode: 'lines',
        name: '|I| (A)',
        line: {color: '#FE8D34'},
      }

      const shapes = []
      if (tipo === 'RLC' && fRes) {
        shapes.push({
          type: 'line',
          x0: fRes,
          x1: fRes,
          y0: 0,
          y1: Math.max(...amps),
          line: {dash: 'dot', width: 2, color: '#ff6b6b'},
        })
      }

      setPlotData([trace])
      setPlotLayout({
        title: `Respuesta en Frecuencia (${tipo}) — R=${R}Ω, Rs=${Rs}Ω, L=${L}mH, C=${C}nF, V=${V}V`,
        xaxis: {title: 'Frecuencia (Hz)', type: 'log', color: '#e6e8ef'},
        yaxis: {title: 'Corriente (A)', color: '#e6e8ef'},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {color: '#e6e8ef'},
        shapes,
      })

      setInfo(
        tipo === 'RLC' && fRes
          ? `≈ Frecuencia de resonancia: <b>${fRes.toFixed(2)} Hz</b>`
          : ''
      )
    } else if (modo === 'Tiempo') {
      let result
      let yAxisTitle = 'Voltaje (V)'

      if (tipo === 'RC') {
        result = tiempo_RC(R, Rs, C_F, V, connected)
      } else if (tipo === 'RL') {
        result = tiempo_RL(R, Rs, L_H, V, connected)
        yAxisTitle = 'Corriente (A)'
      } else if (tipo === 'RLC') {
        result = tiempo_RLC(R, Rs, L_H, C_F, V)
      }

      if (result) {
        const trace = {
          x: result.t_ms,
          y: result.y,
          type: 'scatter',
          mode: 'lines',
          name: result.label,
          line: {color: '#FE8D34'},
        }

        setPlotData([trace])
        setPlotLayout({
          title: `Respuesta en Tiempo (${tipo}) — ${result.titleExtra || ''}`,
          xaxis: {title: 'Tiempo (ms)', color: '#e6e8ef'},
          yaxis: {title: yAxisTitle, color: '#e6e8ef'},
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: {color: '#e6e8ef'},
        })

        setInfo('')
      }
    }
  }, [config, connected, frecuencia, tiempo_RC, tiempo_RL, tiempo_RLC])

  // Handle input changes
  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]:
        field === 'tipo' || field === 'modo' ? value : parseFloat(value) || 0,
    }))
  }

  // Handle battery toggle
  const toggleBattery = () => {
    setConnected((prev) => !prev)
  }

  // Reset plot zoom
  const resetZoom = () => {
    setPlotLayout((prev) => ({
      ...prev,
      'xaxis.autorange': true,
      'yaxis.autorange': true,
    }))
  }

  // Run simulation when config or battery state changes
  useEffect(() => {
    simular()
  }, [simular])

  // Initial simulation
  useEffect(() => {
    simular()
  }, [simular])

  return (
    <div className="wrap">
      <h1>Simulador de Circuitos R, RL, RC, RLC — Web</h1>
      <p className="muted">
        Puerto 1:1 del script de Python/Tkinter a web. Soporta{' '}
        <b>respuesta en frecuencia</b> y <b>respuesta en el tiempo</b> con las
        mismas fórmulas. Incluye <b>Rs</b> y botón de <b>batería</b>.
      </p>

      <div className="grid">
        <div className="card">
          <h2>Parámetros</h2>
          <div className="body">
            <div className="row">
              <div>
                <label>Tipo de circuito</label>
                <select
                  value={config.tipo}
                  onChange={(e) => handleConfigChange('tipo', e.target.value)}
                >
                  <option value="R">R</option>
                  <option value="RC">RC</option>
                  <option value="RL">RL</option>
                  <option value="RLC">RLC</option>
                </select>
              </div>
              <div>
                <label>Modo de simulación</label>
                <select
                  value={config.modo}
                  onChange={(e) => handleConfigChange('modo', e.target.value)}
                >
                  <option value="Frecuencia">Frecuencia</option>
                  <option value="Tiempo">Tiempo</option>
                </select>
              </div>
            </div>

            <div className="row" style={{marginTop: '10px'}}>
              <div>
                <label>R (Ω)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={config.R}
                  onChange={(e) => handleConfigChange('R', e.target.value)}
                />
              </div>
              <div>
                <label>L (mH)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.L}
                  onChange={(e) => handleConfigChange('L', e.target.value)}
                />
              </div>
            </div>

            <div className="row" style={{marginTop: '10px'}}>
              <div>
                <label>C (nF)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={config.C}
                  onChange={(e) => handleConfigChange('C', e.target.value)}
                />
              </div>
              <div>
                <label>Voltaje (V)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.V}
                  onChange={(e) => handleConfigChange('V', e.target.value)}
                />
              </div>
            </div>

            <div className="row" style={{marginTop: '10px'}}>
              <div>
                <label>Rs (Ω) amortiguador</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={config.Rs}
                  onChange={(e) => handleConfigChange('Rs', e.target.value)}
                />
              </div>
              <div></div>
            </div>

            <div className="stack" style={{marginTop: '14px'}}>
              <button className="btn" onClick={simular}>
                Simular
              </button>
              <button className="btn secondary" onClick={resetZoom}>
                Reset zoom
              </button>
              <button
                className="btn secondary"
                onClick={toggleBattery}
                title="Solo aplica en modo Tiempo"
              >
                Batería: {connected ? 'Conectada' : 'Desconectada'}
              </button>
            </div>

            {info && (
              <div
                className="kv"
                style={{marginTop: '10px'}}
                dangerouslySetInnerHTML={{__html: info}}
              />
            )}
          </div>
        </div>

        <div className="card">
          <h2>Gráfica</h2>
          <div className="body">
            <Plot
              data={plotData}
              layout={{
                ...plotLayout,
                autosize: true,
                margin: {l: 50, r: 20, t: 40, b: 40},
              }}
              config={{
                responsive: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
              }}
              style={{width: '100%', height: '520px'}}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
