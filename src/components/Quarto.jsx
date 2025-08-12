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
      console.log('📨 Status cortina recebido:', status)
      setCortina(status === 'aberta' ? 'aberta' : 'fechada')
    }

    const handleLuzQuartoStatus = (status) => {
      console.log('📨 Status luz quarto recebido:', status)
      setLuzQuarto(status === 'ligada' ? 'ligada' : 'desligada')
    }

    const handleTomadaStatus = (status) => {
      console.log('📨 Status tomada recebido:', status)
      setTomada(status === 'ligada' ? 'ligada' : 'desligada')
    }

    // Subscrever aos tópicos MQTT
    subscribeToDeviceStatus('quarto/cortina', handleCortinaStatus)
    subscribeToDeviceStatus('quarto/luz', handleLuzQuartoStatus)
    subscribeToDeviceStatus('quarto/tomada', handleTomadaStatus)
  }, [])

  const abrirCortina = async () => {
    try {
      console.log('🎯 Enviando comando: abrir para cortina')
      await sendCommand('quarto/cortina', 'abrir')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao abrir cortina:', error)
    }
  }

  const fecharCortina = async () => {
    try {
      console.log('🎯 Enviando comando: fechar para cortina')
      await sendCommand('quarto/cortina', 'fechar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao fechar cortina:', error)
    }
  }

  const ligarLuzQuarto = async () => {
    try {
      console.log('🎯 Enviando comando: ligar para luz do quarto')
      await sendCommand('quarto/luz', 'ligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao ligar luz do quarto:', error)
    }
  }

  const desligarLuzQuarto = async () => {
    try {
      console.log('🎯 Enviando comando: desligar para luz do quarto')
      await sendCommand('quarto/luz', 'desligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao desligar luz do quarto:', error)
    }
  }

  const ligarTomada = async () => {
    try {
      console.log('🎯 Enviando comando: ligar para tomada')
      await sendCommand('quarto/tomada', 'ligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao ligar tomada:', error)
    }
  }

  const desligarTomada = async () => {
    try {
      console.log('🎯 Enviando comando: desligar para tomada')
      await sendCommand('quarto/tomada', 'desligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao desligar tomada:', error)
    }
  }

  return (
    <div className="environment-card">
      <h2>🛏️ Quarto</h2>
      
      <div className="controls">
        <div className="control-item">
          <h3>Cortina</h3>
          <div className="button-group">
            <button 
              className="btn btn-warning"
              onClick={abrirCortina}
            >
              🌅 Abrir
            </button>
            <button 
              className="btn btn-secondary"
              onClick={fecharCortina}
            >
              🪟 Fechar
            </button>
          </div>
          <span className="status">Status: {cortina}</span>
        </div>

        <div className="control-item">
          <h3>Luz do Quarto</h3>
          <div className="button-group">
            <button 
              className="btn btn-warning"
              onClick={ligarLuzQuarto}
            >
              🔆 Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarLuzQuarto}
            >
              💡 Desligar
            </button>
          </div>
          <span className="status">Status: {luzQuarto}</span>
        </div>

        <div className="control-item">
          <h3>Tomada</h3>
          <div className="button-group">
            <button 
              className="btn btn-success"
              onClick={ligarTomada}
            >
              ⚡ Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarTomada}
            >
              🔌 Desligar
            </button>
          </div>
          <span className="status">Status: {tomada}</span>
        </div>
      </div>
    </div>
  )
}

export default Quarto
