import { useState, useEffect, useRef } from 'react'
import { sendCommand, subscribeToDeviceStatus } from '../utils/esp32Service'

function Quarto() {
  const [cortina, setCortina] = useState('fechada')
  const [luzQuarto, setLuzQuarto] = useState('desligada')
  const [tomada, setTomada] = useState('desligada')
  const [isExpanded, setIsExpanded] = useState(false)

  const callbacksRegistered = useRef(false)

  useEffect(() => {
    if (callbacksRegistered.current) return

    console.log('🔗 Registrando callbacks do Quarto (ÚNICA VEZ)...')

    // Callbacks que NÃO interferem com estado local
    const handleCortinaStatus = (status) => {
      console.log('📨 Status cortina via MQTT (IGNORADO - usando local):', status)
    }

    const handleLuzQuartoStatus = (status) => {
      console.log('📨 Status luz quarto via MQTT (IGNORADO - usando local):', status)
    }

    const handleTomadaStatus = (status) => {
      console.log('📨 Status tomada via MQTT (IGNORADO - usando local):', status)
    }

    subscribeToDeviceStatus('quarto/cortina', handleCortinaStatus)
    subscribeToDeviceStatus('quarto/luz', handleLuzQuartoStatus)
    subscribeToDeviceStatus('quarto/tomada', handleTomadaStatus)

    callbacksRegistered.current = true
  }, [])

  const abrirCortina = async () => {
    try {
      console.log('🎯 Abrindo cortina...')
      setCortina('aberta')
      await sendCommand('quarto/cortina', 'abrir')
      console.log('✅ Cortina aberta com sucesso')
    } catch (error) {
      console.error('❌ Erro ao abrir cortina:', error)
      setCortina('fechada')
    }
  }

  const fecharCortina = async () => {
    try {
      console.log('🎯 Fechando cortina...')
      setCortina('fechada')
      await sendCommand('quarto/cortina', 'fechar')
      console.log('✅ Cortina fechada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao fechar cortina:', error)
      setCortina('aberta')
    }
  }

  const ligarLuzQuarto = async () => {
    try {
      console.log('🎯 Ligando luz do quarto...')
      setLuzQuarto('ligada')
      await sendCommand('quarto/luz', 'ligar')
      console.log('✅ Luz do quarto ligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao ligar luz do quarto:', error)
      setLuzQuarto('desligada')
    }
  }

  const desligarLuzQuarto = async () => {
    try {
      console.log('🎯 Desligando luz do quarto...')
      setLuzQuarto('desligada')
      await sendCommand('quarto/luz', 'desligar')
      console.log('✅ Luz do quarto desligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desligar luz do quarto:', error)
      setLuzQuarto('ligada')
    }
  }

  const ligarTomada = async () => {
    try {
      console.log('🎯 Ligando tomada...')
      setTomada('ligada')
      await sendCommand('quarto/tomada', 'ligar')
      console.log('✅ Tomada ligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao ligar tomada:', error)
      setTomada('desligada')
    }
  }

  const desligarTomada = async () => {
    try {
      console.log('🎯 Desligando tomada...')
      setTomada('desligada')
      await sendCommand('quarto/tomada', 'desligar')
      console.log('✅ Tomada desligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desligar tomada:', error)
      setTomada('ligada')
    }
  }

  // Mobile toggle function
  const toggleMobileExpanded = () => {
    if (window.innerWidth <= 768) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="environment-card">
      <h2 
        className={isExpanded ? 'expanded' : ''} 
        onClick={toggleMobileExpanded}
      >
        🛏️ Quarto
      </h2>
      
      <div className={`environment-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="controls">
          <div className="control-item">
            <h3>Cortina</h3>
            <div className="button-group">
              <button 
                className="btn btn-warning"
                onClick={abrirCortina}
                disabled={cortina === 'aberta'}
              >
                🌅 Abrir
              </button>
              <button 
                className="btn btn-secondary"
                onClick={fecharCortina}
                disabled={cortina === 'fechada'}
              >
                🪟 Fechar
              </button>
            </div>
            <span className={`status ${cortina === 'aberta' ? 'status-active' : 'status-inactive'}`}>
              Status: {cortina}
            </span>
          </div>

          <div className="control-item">
            <h3>Luz do Quarto</h3>
            <div className="button-group">
              <button 
                className="btn btn-warning"
                onClick={ligarLuzQuarto}
                disabled={luzQuarto === 'ligada'}
              >
                🔆 Ligar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={desligarLuzQuarto}
                disabled={luzQuarto === 'desligada'}
              >
                💡 Desligar
              </button>
            </div>
            <span className={`status ${luzQuarto === 'ligada' ? 'status-active' : 'status-inactive'}`}>
              Status: {luzQuarto}
            </span>
          </div>

          <div className="control-item">
            <h3>Tomada</h3>
            <div className="button-group">
              <button 
                className="btn btn-success"
                onClick={ligarTomada}
                disabled={tomada === 'ligada'}
              >
                ⚡ Ligar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={desligarTomada}
                disabled={tomada === 'desligada'}
              >
                🔌 Desligar
              </button>
            </div>
            <span className={`status ${tomada === 'ligada' ? 'status-active' : 'status-inactive'}`}>
              Status: {tomada}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quarto
