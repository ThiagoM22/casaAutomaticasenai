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
      console.log('📨 Dados dos sensores recebidos:', data)
      if (data.temperature !== undefined) {
        setTemperatura(parseFloat(data.temperature))
      }
      if (data.humidity !== undefined) {
        setUmidade(parseFloat(data.humidity))
      }
    }

    // Callbacks para status dos dispositivos
    const handleACStatus = (status) => {
      console.log('📨 Status AC recebido:', status)
      setArCondicionado(status === 'ligado' ? 'ligado' : 'desligado')
    }

    const handleHumidifierStatus = (status) => {
      console.log('📨 Status umidificador recebido:', status)
      setUmidificador(status === 'ligado' ? 'ligado' : 'desligado')
    }

    const handleLightStatus = (status) => {
      console.log('📨 Status luz sala recebido:', status)
      setLuzSala(status === 'ligada' ? 'ligada' : 'desligada')
    }

    // Subscrever aos tópicos MQTT
    subscribeToSensorData('sala/sensores', handleSensorData)
    subscribeToDeviceStatus('sala/ac', handleACStatus)
    subscribeToDeviceStatus('sala/umidificador', handleHumidifierStatus)
    subscribeToDeviceStatus('sala/luz', handleLightStatus)

    // Fallback: simulação caso MQTT não esteja funcionando
    const fallbackInterval = setInterval(() => {
      setTemperatura(prev => {
        const variation = (Math.random() - 0.5) * 2
        return Math.max(18, Math.min(35, prev + variation))
      })
      setUmidade(prev => {
        const variation = (Math.random() - 0.5) * 5
        return Math.max(30, Math.min(80, prev + variation))
      })
    }, 10000)

    return () => {
      clearInterval(fallbackInterval)
    }
  }, [])

  const ligarArCondicionado = async () => {
    try {
      console.log('🎯 Enviando comando: ligar para ar-condicionado')
      await sendCommand('sala/ac', 'ligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao ligar ar-condicionado:', error)
    }
  }

  const desligarArCondicionado = async () => {
    try {
      console.log('🎯 Enviando comando: desligar para ar-condicionado')
      await sendCommand('sala/ac', 'desligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao desligar ar-condicionado:', error)
    }
  }

  const ligarUmidificador = async () => {
    try {
      console.log('🎯 Enviando comando: ligar para umidificador')
      await sendCommand('sala/umidificador', 'ligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao ligar umidificador:', error)
    }
  }

  const desligarUmidificador = async () => {
    try {
      console.log('🎯 Enviando comando: desligar para umidificador')
      await sendCommand('sala/umidificador', 'desligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao desligar umidificador:', error)
    }
  }

  const ligarLuzSala = async () => {
    try {
      console.log('🎯 Enviando comando: ligar para luz da sala')
      await sendCommand('sala/luz', 'ligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao ligar luz da sala:', error)
    }
  }

  const desligarLuzSala = async () => {
    try {
      console.log('🎯 Enviando comando: desligar para luz da sala')
      await sendCommand('sala/luz', 'desligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao desligar luz da sala:', error)
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
          <div className="button-group">
            <button 
              className="btn btn-info"
              onClick={ligarArCondicionado}
            >
              🌀 Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarArCondicionado}
            >
              ❄️ Desligar
            </button>
          </div>
          <span className="status">Status: {arCondicionado}</span>
        </div>

        <div className="control-item">
          <h3>Umidificador</h3>
          <div className="button-group">
            <button 
              className="btn btn-info"
              onClick={ligarUmidificador}
            >
              🌊 Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarUmidificador}
            >
              💨 Desligar
            </button>
          </div>
          <span className="status">Status: {umidificador}</span>
        </div>

        <div className="control-item">
          <h3>Luz da Sala</h3>
          <div className="button-group">
            <button 
              className="btn btn-warning"
              onClick={ligarLuzSala}
            >
              🔆 Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarLuzSala}
            >
              💡 Desligar
            </button>
          </div>
          <span className="status">Status: {luzSala}</span>
        </div>
      </div>
    </div>
  )
}

export default Sala
