import { useState, useEffect } from 'react'
import { sendCommand, subscribeToDeviceStatus } from '../utils/esp32Service'

function Garagem() {
  const [portaoSocial, setPortaoSocial] = useState('fechado')
  const [portaoBasculante, setPortaoBasculante] = useState('fechado')
  const [luzGaragem, setLuzGaragem] = useState('desligada')

  // Subscrever a status dos dispositivos via MQTT
  useEffect(() => {
    // Callbacks para status dos dispositivos
    const handlePortaoSocialStatus = (status) => {
      console.log('📨 Status portão social recebido:', status)
      setPortaoSocial(status === 'aberto' ? 'aberto' : 'fechado')
    }

    const handlePortaoBasculanteStatus = (status) => {
      console.log('📨 Status portão basculante recebido:', status)
      setPortaoBasculante(status === 'aberto' ? 'aberto' : 'fechado')
    }

    const handleLuzGaragemStatus = (status) => {
      console.log('📨 Status luz garagem recebido:', status)
      setLuzGaragem(status === 'ligada' ? 'ligada' : 'desligada')
    }

    // Subscrever aos tópicos MQTT
    subscribeToDeviceStatus('garagem/portao_social', handlePortaoSocialStatus)
    subscribeToDeviceStatus('garagem/portao_basculante', handlePortaoBasculanteStatus)
    subscribeToDeviceStatus('garagem/luz', handleLuzGaragemStatus)
  }, [])

  const togglePortaoSocial = async () => {
    const comando = portaoSocial === 'fechado' ? 'abrir' : 'fechar'
    
    try {
      console.log(`🎯 Enviando comando: ${comando} para portão social`)
      await sendCommand('garagem/portao_social', comando)
      // Não atualizar o estado aqui - aguardar resposta via MQTT
    } catch (error) {
      console.error('Erro ao controlar portão social:', error)
    }
  }

  const togglePortaoBasculante = async () => {
    const comando = portaoBasculante === 'fechado' ? 'abrir' : 'fechar'
    
    try {
      console.log(`🎯 Enviando comando: ${comando} para portão basculante`)
      await sendCommand('garagem/portao_basculante', comando)
      // Não atualizar o estado aqui - aguardar resposta via MQTT
    } catch (error) {
      console.error('Erro ao controlar portão basculante:', error)
    }
  }

  const toggleLuzGaragem = async () => {
    const comando = luzGaragem === 'desligada' ? 'ligar' : 'desligar'
    
    try {
      console.log(`🎯 Enviando comando: ${comando} para luz da garagem`)
      await sendCommand('garagem/luz', comando)
      // Não atualizar o estado aqui - aguardar resposta via MQTT
    } catch (error) {
      console.error('Erro ao controlar luz da garagem:', error)
    }
  }

  return (
    <div className="environment-card">
        <div className="control-item">
          <h3>Portão Social</h3>
          <button 
            className={`btn ${portaoSocial === 'aberto' ? 'btn-success' : 'btn-danger'}`}
            onClick={togglePortaoSocial}
          >
            {portaoSocial === 'aberto' ? '🔓 Fechar' : '🔒 Abrir'}
          </button>
          <span className="status">Status: {portaoSocial}</span>
        </div>

        <div className="control-item">
          <h3>Portão Basculante</h3>
          <button 
            className={`btn ${portaoBasculante === 'aberto' ? 'btn-success' : 'btn-danger'}`}
            onClick={togglePortaoBasculante}
          >
            {portaoBasculante === 'aberto' ? '⬇️ Fechar' : '⬆️ Abrir'}
          </button>
          <span className="status">Status: {portaoBasculante}</span>
        </div>

        <div className="control-item">
          <h3>Luz da Garagem</h3>
          <button 
            className={`btn ${luzGaragem === 'ligada' ? 'btn-warning' : 'btn-secondary'}`}
            onClick={toggleLuzGaragem}
          >
            {luzGaragem === 'ligada' ? '💡 Desligar' : '🔆 Ligar'}
          </button>
          <span className="status">Status: {luzGaragem}</span>
        </div>
      </div>
    </div>
  )
}

export default Garagem
