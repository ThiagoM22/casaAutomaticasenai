import { useState, useEffect, useRef } from 'react'
import { sendCommand, subscribeToSensorData, subscribeToDeviceStatus } from '../utils/esp32Service'

function Sala() {
  const [arCondicionado, setArCondicionado] = useState('desligado')
  const [umidificador, setUmidificador] = useState('desligado')
  const [luzSala, setLuzSala] = useState('desligada')
  const [temperatura, setTemperatura] = useState(25.0)
  const [umidade, setUmidade] = useState(60.0)
  const [lastSensorUpdate, setLastSensorUpdate] = useState(null)
  const [dataSource, setDataSource] = useState('simulado')
  const [isExpanded, setIsExpanded] = useState(false)

  // Refs para prevenir re-execução desnecessária
  const callbacksRegistered = useRef(false)
  const sensorIntervalRef = useRef(null)

  // Subscrever APENAS uma vez quando componente monta
  useEffect(() => {
    if (callbacksRegistered.current) return // Prevenir dupla execução

    console.log('🔗 Registrando callbacks da Sala (ÚNICA VEZ)...')

    // Callback para dados dos sensores DHT22
    const handleSensorData = (data) => {
      console.log('🌡️💧 === PROCESSANDO DADOS DO SENSOR DHT22 ===')
      console.log('📨 Dados brutos recebidos:', data)
      
      let sensorData = data
      let temperaturaProcessada = false
      let umidadeProcessada = false
      
      // Se recebeu uma string, tentar fazer parse
      if (typeof data === 'string') {
        console.log('📝 Processando dados como string:', data)
        
        try {
          sensorData = JSON.parse(data)
          console.log('✅ Parse JSON bem-sucedido:', sensorData)
        } catch {
          console.log('🔍 String não é JSON, tentando extrair valores numericamente...')
          
          const numeros = data.match(/\d+\.?\d*/g)
          if (numeros && numeros.length >= 2) {
            sensorData = {
              temperature: parseFloat(numeros[0]),
              humidity: parseFloat(numeros[1])
            }
            console.log('✅ Valores extraídos do formato CSV:', sensorData)
          } else {
            const tempRegex = /temp[eratura]*[:\s=]*([0-9]+\.?[0-9]*)/i
            const humRegex = /hum[idade]*[:\s=]*([0-9]+\.?[0-9]*)/i
            
            const tempMatch = data.match(tempRegex)
            const humMatch = data.match(humRegex)
            
            if (tempMatch || humMatch) {
              sensorData = {}
              if (tempMatch) sensorData.temperature = parseFloat(tempMatch[1])
              if (humMatch) sensorData.humidity = parseFloat(humMatch[1])
              console.log('✅ Valores extraídos com regex específica:', sensorData)
            } else {
              console.warn('⚠️ Não foi possível extrair dados da string:', data)
              return
            }
          }
        }
      }
      
      console.log('🔍 Dados finais para processamento:', sensorData)
      
      // Processar temperatura
      const tempFields = ['temperature', 'temp', 'Temperature', 'Temp', 'TEMP', 'temperatura']
      for (const field of tempFields) {
        if (sensorData[field] !== undefined) {
          const temp = parseFloat(sensorData[field])
          if (!isNaN(temp) && temp >= -40 && temp <= 80) {
            console.log(`🌡️ ✅ Atualizando temperatura: ${temp}°C`)
            setTemperatura(temp)
            setLastSensorUpdate(new Date())
            setDataSource('dht22')
            temperaturaProcessada = true
            break
          }
        }
      }
      
      // Processar umidade
      const humFields = ['humidity', 'hum', 'umidade', 'Humidity', 'Hum', 'HUM']
      for (const field of humFields) {
        if (sensorData[field] !== undefined) {
          const hum = parseFloat(sensorData[field])
          if (!isNaN(hum) && hum >= 0 && hum <= 100) {
            console.log(`💧 ✅ Atualizando umidade: ${hum}%`)
            setUmidade(hum)
            setLastSensorUpdate(new Date())
            setDataSource('dht22')
            umidadeProcessada = true
            break
          }
        }
      }
      
      if (temperaturaProcessada || umidadeProcessada) {
        console.log('✅ === DADOS PROCESSADOS COM SUCESSO ===')
      }
    }

    // Callbacks para status dos dispositivos - SEM interferir com estado local
    const handleACStatus = (status) => {
      console.log('📨 Status AC recebido via MQTT (IGNORADO - usando local):', status)
      // COMENTADO para não interferir com controle local
      // setArCondicionado(...)
    }

    const handleHumidifierStatus = (status) => {
      console.log('📨 Status umidificador recebido via MQTT (IGNORADO - usando local):', status)
      // COMENTADO para não interferir com controle local
      // setUmidificador(...)
    }

    const handleLightStatus = (status) => {
      console.log('📨 Status luz sala recebido via MQTT (IGNORADO - usando local):', status)
      // COMENTADO para não interferir com controle local
      // setLuzSala(...)
    }

    // Registrar callbacks APENAS para sensores (não dispositivos)
    subscribeToSensorData('sala/sensores', handleSensorData)
    subscribeToDeviceStatus('sala/ac', handleACStatus)
    subscribeToDeviceStatus('sala/umidificador', handleHumidifierStatus)
    subscribeToDeviceStatus('sala/luz', handleLightStatus)

    // Simulação APENAS de sensores, sem tocar nos dispositivos
    sensorIntervalRef.current = setInterval(() => {
      if (dataSource === 'simulado') {
        setTemperatura(prev => {
          const variation = (Math.random() - 0.5) * 2
          return Math.max(18, Math.min(35, prev + variation))
        })
        setUmidade(prev => {
          const variation = (Math.random() - 0.5) * 5
          return Math.max(30, Math.min(80, prev + variation))
        })
      }
    }, 15000) // 15 segundos

    callbacksRegistered.current = true

    return () => {
      if (sensorIntervalRef.current) {
        clearInterval(sensorIntervalRef.current)
      }
    }
  }, []) // ARRAY VAZIO - executar apenas uma vez

  const ligarArCondicionado = async () => {
    try {
      console.log('🎯 Ligando ar-condicionado...')
      setArCondicionado('ligado')
      await sendCommand('sala/ac', 'ligar')
      console.log('✅ Ar-condicionado ligado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao ligar ar-condicionado:', error)
      setArCondicionado('desligado')
    }
  }

  const desligarArCondicionado = async () => {
    try {
      console.log('🎯 Desligando ar-condicionado...')
      setArCondicionado('desligado')
      await sendCommand('sala/ac', 'desligar')
      console.log('✅ Ar-condicionado desligado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desligar ar-condicionado:', error)
      setArCondicionado('ligado')
    }
  }

  const ligarUmidificador = async () => {
    try {
      console.log('🎯 Ligando umidificador...')
      setUmidificador('ligado')
      await sendCommand('sala/umidificador', 'ligar')
      console.log('✅ Umidificador ligado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao ligar umidificador:', error)
      setUmidificador('desligado')
    }
  }

  const desligarUmidificador = async () => {
    try {
      console.log('🎯 Desligando umidificador...')
      setUmidificador('desligado')
      await sendCommand('sala/umidificador', 'desligar')
      console.log('✅ Umidificador desligado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desligar umidificador:', error)
      setUmidificador('ligado')
    }
  }

  const ligarLuzSala = async () => {
    try {
      console.log('🎯 Ligando luz da sala...')
      setLuzSala('ligada')
      await sendCommand('sala/luz', 'ligar')
      console.log('✅ Luz da sala ligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao ligar luz da sala:', error)
      setLuzSala('desligada')
    }
  }

  const desligarLuzSala = async () => {
    try {
      console.log('🎯 Desligando luz da sala...')
      setLuzSala('desligada')
      await sendCommand('sala/luz', 'desligar')
      console.log('✅ Luz da sala desligada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desligar luz da sala:', error)
      setLuzSala('ligada')
    }
  }


  return (
    <div className="environment-card">
      <h2 
        className={isExpanded ? 'expanded' : ''} 
        onClick={toggleMobileExpanded}
      >
        🛋️ Sala
      </h2>
      
      <div className="sensors">
        <div className="sensor-item">
          <span className="sensor-icon">🌡️</span>
          <span className="sensor-value">{temperatura.toFixed(1)}°C</span>
        </div>
        <div className="sensor-item">
          <span className="sensor-icon">💧</span>
          <span className="sensor-value">{umidade.toFixed(1)}%</span>
          <span className="sensor-time">
            {lastSensorUpdate ? lastSensorUpdate.toLocaleTimeString() : 'Esperando Autualização...'}  
          </span>
        </div>
      </div>

        <div className="controls">
          <div className="control-item">
            <h3>Ar-condicionado</h3>
            <div className="button-group">
              <button 
                className="btn btn-info"
                onClick={ligarArCondicionado}
                disabled={arCondicionado === 'ligado'}
              >
                🌀 Ligar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={desligarArCondicionado}
                disabled={arCondicionado === 'desligado'}
              >
                ❄️ Desligar
              </button>
            </div>
            <span className={`status ${arCondicionado === 'ligado' ? 'status-active' : 'status-inactive'}`}>
              Status: {arCondicionado}
            </span>
          </div>

          <div className="control-item">
            <h3>Umidificador</h3>
            <div className="button-group">
              <button 
                className="btn btn-info"
                onClick={ligarUmidificador}
                disabled={umidificador === 'ligado'}
              >
                🌊 Ligar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={desligarUmidificador}
                disabled={umidificador === 'desligado'}
              >
                💨 Desligar
              </button>
            </div>
            <span className={`status ${umidificador === 'ligado' ? 'status-active' : 'status-inactive'}`}>
              Status: {umidificador}
            </span>
          </div>

          <div className="control-item">
            <h3>Luz da Sala</h3>
            <div className="button-group">
              <button 
                className="btn btn-warning"
                onClick={ligarLuzSala}
                disabled={luzSala === 'ligada'}
              >
                🔆 Ligar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={desligarLuzSala}
                disabled={luzSala === 'desligada'}
              >
                💡 Desligar
              </button>
            </div>
            <span className={`status ${luzSala === 'ligada' ? 'status-active' : 'status-inactive'}`}>
              Status: {luzSala}
            </span>
          </div>
        </div>
      </div>
  )
}

export default Sala
