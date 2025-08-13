import { useState, useEffect, useRef } from 'react'
import { sendCommand, subscribeToDeviceStatus } from '../utils/esp32Service'

function Garagem() {
  const [portaoSocial, setPortaoSocial] = useState('fechado')
  const [portaoBasculante, setPortaoBasculante] = useState('fechado')
  const [luzGaragem, setLuzGaragem] = useState('desligada')

  const callbacksRegistered = useRef(false)

  // Subscrever APENAS uma vez quando componente monta
  useEffect(() => {
    if (callbacksRegistered.current) return

    console.log('🔗 Registrando callbacks da Garagem (ÚNICA VEZ)...')

    // Callbacks que NÃO interferem com estado local
    const handlePortaoSocialStatus = (status) => {
      console.log('📨 Status portão social via MQTT (IGNORADO - usando local):', status)
      // COMENTADO para não interferir com controle local
      // setPortaoSocial(...)
    }

    const handlePortaoBasculanteStatus = (status) => {
      console.log('📨 Status portão basculante via MQTT (IGNORADO - usando local):', status)
      // COMENTADO para não interferir com controle local
      // setPortaoBasculante(...)
    }

    const handleLuzGaragemStatus = (status) => {
      console.log('📨 Status luz garagem via MQTT (IGNORADO - usando local):', status)
      // COMENTADO para não interferir com controle local
      // setLuzGaragem(...)
    }

    subscribeToDeviceStatus('garagem/portao_social', handlePortaoSocialStatus)
    subscribeToDeviceStatus('garagem/portao_basculante', handlePortaoBasculanteStatus)
    subscribeToDeviceStatus('garagem/luz', handleLuzGaragemStatus)

    callbacksRegistered.current = true
  }, [])

  // Função para controlar luz automaticamente baseado nos portões (APENAS localmente)
  const controlarLuzAutomatica = (statusSocial, statusBasculante) => {
    // Se qualquer portão estiver aberto, ligar a luz
    if (statusSocial === 'aberto' || statusBasculante === 'aberto') {
      console.log('💡 Ligando luz automaticamente (portão aberto)')
      setLuzGaragem('ligada')
      // Enviar comando para ESP32 também
      sendCommand('garagem/luz', 'ligar').catch(console.error)
    } 
    // Se ambos portões estiverem fechados, desligar a luz
    else if (statusSocial === 'fechado' && statusBasculante === 'fechado') {
      console.log('💡 Desligando luz automaticamente (portões fechados)')
      setLuzGaragem('desligada')
      // Enviar comando para ESP32 também
      sendCommand('garagem/luz', 'desligar').catch(console.error)
    }
  }

  const abrirPortaoSocial = async () => {
    try {
      console.log('🎯 Abrindo portão social...')
      
      // Atualizar status localmente imediatamente
      setPortaoSocial('aberto')
      
      // Controlar luz automaticamente usando os estados atuais
      controlarLuzAutomatica('aberto', portaoBasculante)
      
      await sendCommand('garagem/portao_social', 'abrir')
      console.log('✅ Portão social aberto com sucesso')
    } catch (error) {
      console.error('❌ Erro ao abrir portão social:', error)
      // Reverter em caso de erro
      setPortaoSocial('fechado')
      controlarLuzAutomatica('fechado', portaoBasculante)
    }
  }

  const fecharPortaoSocial = async () => {
    try {
      console.log('🎯 Fechando portão social...')
      
      // Atualizar status localmente imediatamente
      setPortaoSocial('fechado')
      
      // Controlar luz automaticamente usando os estados atuais
      controlarLuzAutomatica('fechado', portaoBasculante)
      
      await sendCommand('garagem/portao_social', 'fechar')
      console.log('✅ Portão social fechado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao fechar portão social:', error)
      // Reverter em caso de erro
      setPortaoSocial('aberto')
      controlarLuzAutomatica('aberto', portaoBasculante)
    }
  }

  const abrirPortaoBasculante = async () => {
    try {
      console.log('🎯 Abrindo portão basculante...')
      
      // Atualizar status localmente imediatamente
      setPortaoBasculante('aberto')
      
      // Controlar luz automaticamente usando os estados atuais
      controlarLuzAutomatica(portaoSocial, 'aberto')
      
      await sendCommand('garagem/portao_basculante', 'abrir')
      console.log('✅ Portão basculante aberto com sucesso')
    } catch (error) {
      console.error('❌ Erro ao abrir portão basculante:', error)
      // Reverter em caso de erro
      setPortaoBasculante('fechado')
      controlarLuzAutomatica(portaoSocial, 'fechado')
    }
  }

  const fecharPortaoBasculante = async () => {
    try {
      console.log('🎯 Fechando portão basculante...')
      
      // Atualizar status localmente imediatamente
      setPortaoBasculante('fechado')
      
      // Controlar luz automaticamente usando os estados atuais
      controlarLuzAutomatica(portaoSocial, 'fechado')
      
      await sendCommand('garagem/portao_basculante', 'fechar')
      console.log('✅ Portão basculante fechado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao fechar portão basculante:', error)
      // Reverter em caso de erro
      setPortaoBasculante('aberto')
      controlarLuzAutomatica(portaoSocial, 'aberto')
    }
  }

  const ligarLuzGaragem = async () => {
    try {
      console.log('🎯 Ligando luz da garagem...')
      
      // Atualizar status localmente imediatamente
      setLuzGaragem('ligada')
      
      await sendCommand('garagem/luz', 'ligar')
      console.log('✅ Luz da garagem ligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao ligar luz da garagem:', error)
      // Reverter em caso de erro
      setLuzGaragem('desligada')
    }
  }

  const desligarLuzGaragem = async () => {
    try {
      console.log('🎯 Desligando luz da garagem...')
      
      // Atualizar status localmente imediatamente
      setLuzGaragem('desligada')
      
      await sendCommand('garagem/luz', 'desligar')
      console.log('✅ Luz da garagem desligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desligar luz da garagem:', error)
      // Reverter em caso de erro
      setLuzGaragem('ligada')
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
              disabled={portaoSocial === 'aberto'}
            >
              🔒 Abrir
            </button>
            <button 
              className="btn btn-danger"
              onClick={fecharPortaoSocial}
              disabled={portaoSocial === 'fechado'}
            >
              🔓 Fechar
            </button>
          </div>
          <span className={`status ${portaoSocial === 'aberto' ? 'status-active' : 'status-inactive'}`}>
            Status: {portaoSocial}
          </span>
        </div>

        <div className="control-item">
          <h3>Portão Basculante</h3>
          <div className="button-group">
            <button 
              className="btn btn-success"
              onClick={abrirPortaoBasculante}
              disabled={portaoBasculante === 'aberto'}
            >
              ⬆️ Abrir
            </button>
            <button 
              className="btn btn-danger"
              onClick={fecharPortaoBasculante}
              disabled={portaoBasculante === 'fechado'}
            >
              ⬇️ Fechar
            </button>
          </div>
          <span className={`status ${portaoBasculante === 'aberto' ? 'status-active' : 'status-inactive'}`}>
            Status: {portaoBasculante}
          </span>
        </div>

        <div className="control-item">
          <h3>Luz da Garagem</h3>
          <div className="button-group">
            <button 
              className="btn btn-warning"
              onClick={ligarLuzGaragem}
              disabled={luzGaragem === 'ligada'}
            >
              🔆 Ligar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={desligarLuzGaragem}
              disabled={luzGaragem === 'desligada'}
            >
              💡 Desligar
            </button>
          </div>
          <span className={`status ${luzGaragem === 'ligada' ? 'status-active' : 'status-inactive'}`}>
            Status: {luzGaragem} {(portaoSocial === 'aberto' || portaoBasculante === 'aberto') ? '(Auto)' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Garagem
