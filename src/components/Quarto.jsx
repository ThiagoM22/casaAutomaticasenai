import { useState, useEffect } from 'react'
import { sendCommand, subscribeToDeviceStatus } from '../utils/esp32Service'

function Quarto() {
  const [cortina, setCortina] = useState('fechada')
  const [luzQuarto, setLuzQuarto] = useState('desligada')
  const [tomada, setTomada] = useState('desligada')

  // Subscrever a status dos dispositivos via MQTT
  useEffect(() => {
    // Callbacks para status dos dispositivos
    const handleCortinaStatus = (status) => {
      setCortina(status === 'aberta' ? 'aberta' : 'fechada')
    }

    const handleLuzQuartoStatus = (status) => {
      setLuzQuarto(status === 'ligada' ? 'ligada' : 'desligada')
    }

    const handleTomadaStatus = (status) => {
      setTomada(status === 'ligada' ? 'ligada' : 'desligada')
    }

    // Subscrever aos tópicos MQTT
    subscribeToDeviceStatus('quarto/cortina', handleCortinaStatus)
    subscribeToDeviceStatus('quarto/luz', handleLuzQuartoStatus)
    subscribeToDeviceStatus('quarto/tomada', handleTomadaStatus)
  }, [])

  const toggleCortina = async () => {
    const novoStatus = cortina === 'fechada' ? 'aberta' : 'fechada'
    const comando = novoStatus === 'aberta' ? 'abrir' : 'fechar'
    
    try {
      await sendCommand('quarto/cortina', comando)
      setCortina(novoStatus)
    } catch (error) {
      console.error('Erro ao controlar cortina:', error)
    }
  }

  const toggleLuzQuarto = async () => {
    const novoStatus = luzQuarto === 'desligada' ? 'ligada' : 'desligada'
    const comando = novoStatus === 'ligada' ? 'ligar' : 'desligar'
    
    try {
      await sendCommand('quarto/luz', comando)
      setLuzQuarto(novoStatus)
    } catch (error) {
      console.error('Erro ao controlar luz do quarto:', error)
    }
  }

  const toggleTomada = async () => {
    const novoStatus = tomada === 'desligada' ? 'ligada' : 'desligada'
    const comando = novoStatus === 'ligada' ? 'ligar' : 'desligar'
    
    try {
      await sendCommand('quarto/tomada', comando)
      setTomada(novoStatus)
    } catch (error) {
      console.error('Erro ao controlar tomada:', error)
    }
  }

  return (
    <div className="environment-card">
      <h2>🛏️ Quarto</h2>
      
      <div className="controls">
        <div className="control-item">
          <h3>Cortina</h3>
          <button 
            className={`btn ${cortina === 'aberta' ? 'btn-warning' : 'btn-secondary'}`}
            onClick={toggleCortina}
          >
            {cortina === 'aberta' ? '🪟 Fechar' : '🌅 Abrir'}
          </button>
          <span className="status">Status: {cortina}</span>
        </div>

        <div className="control-item">
          <h3>Luz do Quarto</h3>
          <button 
            className={`btn ${luzQuarto === 'ligada' ? 'btn-warning' : 'btn-secondary'}`}
            onClick={toggleLuzQuarto}
          >
            {luzQuarto === 'ligada' ? '💡 Desligar' : '🔆 Ligar'}
          </button>
          <span className="status">Status: {luzQuarto}</span>
        </div>

        <div className="control-item">
          <h3>Tomada</h3>
          <button 
            className={`btn ${tomada === 'ligada' ? 'btn-success' : 'btn-secondary'}`}
            onClick={toggleTomada}
          >
            {tomada === 'ligada' ? '🔌 Desligar' : '⚡ Ligar'}
          </button>
          <span className="status">Status: {tomada}</span>
        </div>
      </div>
    </div>
  )
}

export default Quarto
