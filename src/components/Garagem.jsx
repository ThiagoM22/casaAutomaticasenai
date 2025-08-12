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
      console.log('🔄 Estado atual portão social:', portaoSocial)
      
      // Mapear diferentes formatos de resposta possíveis
      let novoStatus = 'fechado'
      if (status === 'aberto' || status === 'open' || status === '1' || status === 1) {
        novoStatus = 'aberto'
      } else if (status === 'fechado' || status === 'closed' || status === '0' || status === 0) {
        novoStatus = 'fechado'
      }
      
      console.log('➡️ Novo status portão social:', novoStatus)
      setPortaoSocial(novoStatus)
    }

    const handlePortaoBasculanteStatus = (status) => {
      console.log('📨 Status portão basculante recebido:', status)
      console.log('🔄 Estado atual portão basculante:', portaoBasculante)
      
      let novoStatus = 'fechado'
      if (status === 'aberto' || status === 'open' || status === '1' || status === 1) {
        novoStatus = 'aberto'
      } else if (status === 'fechado' || status === 'closed' || status === '0' || status === 0) {
        novoStatus = 'fechado'
      }
      
      console.log('➡️ Novo status portão basculante:', novoStatus)
      setPortaoBasculante(novoStatus)
    }

    const handleLuzGaragemStatus = (status) => {
      console.log('📨 Status luz garagem recebido:', status)
      console.log('🔄 Estado atual luz garagem:', luzGaragem)
      
      let novoStatus = 'desligada'
      if (status === 'ligada' || status === 'on' || status === '1' || status === 1) {
        novoStatus = 'ligada'
      } else if (status === 'desligada' || status === 'off' || status === '0' || status === 0) {
        novoStatus = 'desligada'
      }
      
      console.log('➡️ Novo status luz garagem:', novoStatus)
      setLuzGaragem(novoStatus)
    }

    // Subscrever aos tópicos MQTT
    console.log('🔗 Registrando callbacks da Garagem...')
    subscribeToDeviceStatus('garagem/portao_social', handlePortaoSocialStatus)
    subscribeToDeviceStatus('garagem/portao_basculante', handlePortaoBasculanteStatus)
    subscribeToDeviceStatus('garagem/luz', handleLuzGaragemStatus)
  }, [])

  const abrirPortaoSocial = async () => {
    try {
      console.log('🎯 Enviando comando: abrir para portão social')
      await sendCommand('garagem/portao_social', 'abrir')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao abrir portão social:', error)
    }
  }

  const fecharPortaoSocial = async () => {
    try {
      console.log('🎯 Enviando comando: fechar para portão social')
      await sendCommand('garagem/portao_social', 'fechar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao fechar portão social:', error)
    }
  }

  const abrirPortaoBasculante = async () => {
    try {
      console.log('🎯 Enviando comando: abrir para portão basculante')
      await sendCommand('garagem/portao_basculante', 'abrir')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao abrir portão basculante:', error)
    }
  }

  const fecharPortaoBasculante = async () => {
    try {
      console.log('🎯 Enviando comando: fechar para portão basculante')
      await sendCommand('garagem/portao_basculante', 'fechar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao fechar portão basculante:', error)
    }
  }

  const ligarLuzGaragem = async () => {
    try {
      console.log('🎯 Enviando comando: ligar para luz da garagem')
      await sendCommand('garagem/luz', 'ligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao ligar luz da garagem:', error)
    }
  }

  const desligarLuzGaragem = async () => {
    try {
      console.log('🎯 Enviando comando: desligar para luz da garagem')
      await sendCommand('garagem/luz', 'desligar')
      console.log('✅ Comando enviado com sucesso, aguardando resposta via MQTT...')
    } catch (error) {
      console.error('❌ Erro ao desligar luz da garagem:', error)
    }
  }

  return (
    <div className="environment-card">
      <h2>🚗 Garagem</h2>
      
      <div className="controls">
        <div className="control-item">
          <h3>Portão Social</h3>
          <div className="button-group">
            <button 
              className="btn btn-success"
              onClick={abrirPortaoSocial}
            >
              🔒 Abrir
            </button>
            <button 
              className="btn btn-danger"
              onClick={fecharPortaoSocial}
            >
              🔓 Fechar
            </button>
          </div>
          <span className="status">Status: {portaoSocial}</span>
        </div>

        <div className="control-item">
          <h3>Portão Basculante</h3>
          <div className="button-group">
            <button 
              className="btn btn-success"
              onClick={abrirPortaoBasculante}
            >
              ⬆️ Abrir
            </button>
            <button 
              className="btn btn-danger"
              onClick={fecharPortaoBasculante}
            >
              ⬇️ Fechar
            </button>
          </div>
          <span className="status">Status: {portaoBasculante}</span>
        </div>

        <div className="control-item">
          <h3>Luz da Garagem</h3>
          <div className="button-group">
            <button 
              className="btn btn-warning"
              onClick={ligarLuzGaragem}
            >
              🔆 Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarLuzGaragem}
            >
              💡 Desligar
            </button>
          </div>
          <span className="status">Status: {luzGaragem}</span>
        </div>
      </div>
    </div>
  )
}

export default Garagem
