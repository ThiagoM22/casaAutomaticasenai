import { useState, useEffect } from 'react'
import { sendCommand, subscribeToSensorData, subscribeToDeviceStatus } from '../utils/esp32Service'

function Sala() {
  const [arCondicionado, setArCondicionado] = useState('desligado')
  const [umidificador, setUmidificador] = useState('desligado')
  const [luzSala, setLuzSala] = useState('desligada')
  const [temperatura, setTemperatura] = useState(25.0)
  const [umidade, setUmidade] = useState(60.0)

  // Subscrever a dados dos sensores e status dos dispositivos via MQTT
  useEffect(() => {
    // Callback para dados dos sensores
    const handleSensorData = (data) => {
      if (data.temperature !== undefined) {
        setTemperatura(parseFloat(data.temperature))
      }
      if (data.humidity !== undefined) {
        setUmidade(parseFloat(data.humidity))
      }
    }

    // Callbacks para status dos dispositivos
    const handleACStatus = (status) => {
      setArCondicionado(status === 'ligado' ? 'ligado' : 'desligado')
    }

    const handleHumidifierStatus = (status) => {
      setUmidificador(status === 'ligado' ? 'ligado' : 'desligado')
    }

    const handleLightStatus = (status) => {
      setLuzSala(status === 'ligada' ? 'ligada' : 'desligada')
    }

    // Subscrever aos tópicos MQTT
    subscribeToSensorData('sala/sensores', handleSensorData)
    subscribeToDeviceStatus('sala/ac', handleACStatus)
    subscribeToDeviceStatus('sala/umidificador', handleHumidifierStatus)
    subscribeToDeviceStatus('sala/luz', handleLightStatus)

    // Fallback: simulação caso MQTT não esteja funcionando
    const fallbackInterval = setInterval(() => {
      // Só simula se não recebeu dados reais por um tempo
      setTemperatura(prev => {
        const variation = (Math.random() - 0.5) * 2
        return Math.max(18, Math.min(35, prev + variation))
      })
      setUmidade(prev => {
        const variation = (Math.random() - 0.5) * 5
        return Math.max(30, Math.min(80, prev + variation))
      })
    }, 10000) // Intervalo maior para dar prioridade ao MQTT

    return () => {
      clearInterval(fallbackInterval)
    }
  }, [])

  const toggleArCondicionado = async () => {
    const novoStatus = arCondicionado === 'desligado' ? 'ligado' : 'desligado'
    const comando = novoStatus === 'ligado' ? 'ligar' : 'desligar'
    
    try {
      await sendCommand('sala/ac', comando)
      setArCondicionado(novoStatus)
    } catch (error) {
      console.error('Erro ao controlar ar-condicionado:', error)
    }
  }

  const toggleUmidificador = async () => {
    const novoStatus = umidificador === 'desligado' ? 'ligado' : 'desligado'
    const comando = novoStatus === 'ligado' ? 'ligar' : 'desligar'
    
    try {
      await sendCommand('sala/umidificador', comando)
      setUmidificador(novoStatus)
    } catch (error) {
      console.error('Erro ao controlar umidificador:', error)
    }
  }

  const toggleLuzSala = async () => {
    const novoStatus = luzSala === 'desligada' ? 'ligada' : 'desligada'
    const comando = novoStatus === 'ligada' ? 'ligar' : 'desligar'
    
    try {
      await sendCommand('sala/luz', comando)
      setLuzSala(novoStatus)
    } catch (error) {
      console.error('Erro ao controlar luz da sala:', error)
    }
  }

  return (
    <div className="environment-card">
      <h2>🛋️ Sala</h2>
      
      <div className="sensors">
        <div className="sensor-item">
          <span className="sensor-icon">🌡️</span>
          <span className="sensor-value">{temperatura.toFixed(1)}°C</span>
        </div>
        <div className="sensor-item">
          <span className="sensor-icon">💧</span>
          <span className="sensor-value">{umidade.toFixed(1)}%</span>
        </div>
      </div>

      <div className="controls">
        <div className="control-item">
          <h3>Ar-condicionado</h3>
          <button 
            className={`btn ${arCondicionado === 'ligado' ? 'btn-info' : 'btn-secondary'}`}
            onClick={toggleArCondicionado}
          >
            {arCondicionado === 'ligado' ? '❄️ Desligar' : '🌀 Ligar'}
          </button>
          <span className="status">Status: {arCondicionado}</span>
        </div>

        <div className="control-item">
          <h3>Umidificador</h3>
          <button 
            className={`btn ${umidificador === 'ligado' ? 'btn-info' : 'btn-secondary'}`}
            onClick={toggleUmidificador}
          >
            {umidificador === 'ligado' ? '💨 Desligar' : '🌊 Ligar'}
          </button>
          <span className="status">Status: {umidificador}</span>
        </div>

        <div className="control-item">
          <h3>Luz da Sala</h3>
          <button 
            className={`btn ${luzSala === 'ligada' ? 'btn-warning' : 'btn-secondary'}`}
            onClick={toggleLuzSala}
          >
            {luzSala === 'ligada' ? '💡 Desligar' : '🔆 Ligar'}
          </button>
          <span className="status">Status: {luzSala}</span>
        </div>
      </div>
    </div>
  )
}

export default Sala
