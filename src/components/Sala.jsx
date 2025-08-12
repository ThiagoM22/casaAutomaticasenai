import { useState, useEffect, useRef } from 'react'
import { sendCommand, subscribeToSensorData, subscribeToDeviceStatus } from '../utils/esp32Service'

function Sala() {
  const [arCondicionado, setArCondicionado] = useState('desligado')
  const [umidificador, setUmidificador] = useState('desligado')
  const [luzSala, setLuzSala] = useState('desligada')
  const [temperatura, setTemperatura] = useState(25.0)
  const [umidade, setUmidade] = useState(60.0)
  const [lastSensorUpdate, setLastSensorUpdate] = useState(null)
  const [dataSource, setDataSource] = useState('simulado') // 'dht22' ou 'simulado'

  // Refs para acessar valores atuais nos callbacks
  const temperaturaRef = useRef(temperatura)
  const umidadeRef = useRef(umidade)

  // Atualizar refs quando os estados mudarem
  useEffect(() => {
    temperaturaRef.current = temperatura
    console.log('🌡️ Ref temperatura atualizada para:', temperatura)
  }, [temperatura])

  useEffect(() => {
    umidadeRef.current = umidade
    console.log('💧 Ref umidade atualizada para:', umidade)
  }, [umidade])

  // Subscrever a dados dos sensores e status dos dispositivos via MQTT
  useEffect(() => {
    // Callback para dados dos sensores DHT22
    const handleSensorData = (data) => {
      console.log('🌡️💧 === PROCESSANDO DADOS DO SENSOR DHT22 ===')
      console.log('📨 Dados brutos recebidos:', data)
      console.log('📊 Tipo dos dados:', typeof data)
      console.log('📍 Estados atuais - Temp:', temperaturaRef.current, 'Umidade:', umidadeRef.current)
      
      let sensorData = data
      let temperaturaProcessada = false
      let umidadeProcessada = false
      
      // Se recebeu uma string, tentar fazer parse
      if (typeof data === 'string') {
        console.log('📝 Processando dados como string:', data)
        
        try {
          // Tentar parse JSON primeiro
          sensorData = JSON.parse(data)
          console.log('✅ Parse JSON bem-sucedido:', sensorData)
        } catch {
          console.log('🔍 String não é JSON, tentando extrair valores numericamente...')
          
          // Tentar formato "25.3,60.2"
          const numeros = data.match(/\d+\.?\d*/g)
          if (numeros && numeros.length >= 2) {
            sensorData = {
              temperature: parseFloat(numeros[0]),
              humidity: parseFloat(numeros[1])
            }
            console.log('✅ Valores extraídos do formato CSV:', sensorData)
          } else {
            // Tentar regex mais específicas
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
              return // Sair se não conseguir processar
            }
          }
        }
      }
      
      console.log('🔍 Dados finais para processamento:', sensorData)
      
      // Processar temperatura - com logs detalhados
      const tempFields = ['temperature', 'temp', 'Temperature', 'Temp', 'TEMP', 'temperatura']
      console.log('🌡️ Procurando campos de temperatura em:', Object.keys(sensorData))
      
      for (const field of tempFields) {
        if (sensorData[field] !== undefined) {
          const tempValue = sensorData[field]
          console.log(`🌡️ Campo temperatura encontrado: ${field} = ${tempValue} (tipo: ${typeof tempValue})`)
          
          const temp = parseFloat(tempValue)
          console.log(`🌡️ Valor parseado: ${temp}`)
          
          if (!isNaN(temp) && temp >= -40 && temp <= 80) {
            console.log(`🌡️ ✅ TEMPERATURA VÁLIDA! Atualizando: ${temperaturaRef.current}°C → ${temp}°C`)
            
            // Usar callback para garantir que o estado seja atualizado
            setTemperatura(prevTemp => {
              console.log(`🌡️ Callback setState - de ${prevTemp}°C para ${temp}°C`)
              return temp
            })
            
            setLastSensorUpdate(new Date())
            setDataSource('dht22')
            temperaturaProcessada = true
            
            // Verificar se realmente atualizou após um tempo
            setTimeout(() => {
              console.log(`🌡️ Verificação após setState - temperatura atual: ${temperatura}°C`)
            }, 500)
            
            break
          } else {
            console.warn(`⚠️ Temperatura fora do range válido: ${temp}°C`)
          }
        }
      }
      
      if (!temperaturaProcessada) {
        console.warn('🌡️ ❌ NENHUM CAMPO DE TEMPERATURA ENCONTRADO!')
        console.log('🔍 Campos disponíveis:', Object.keys(sensorData))
        console.log('🔍 Campos procurados:', tempFields)
      }
      
      // Processar umidade
      const humFields = ['humidity', 'hum', 'umidade', 'Humidity', 'Hum', 'HUM']
      console.log('💧 Procurando campos de umidade em:', Object.keys(sensorData))
      
      for (const field of humFields) {
        if (sensorData[field] !== undefined) {
          const humValue = sensorData[field]
          console.log(`💧 Campo umidade encontrado: ${field} = ${humValue} (tipo: ${typeof humValue})`)
          
          const hum = parseFloat(humValue)
          console.log(`💧 Valor parseado: ${hum}`)
          
          if (!isNaN(hum) && hum >= 0 && hum <= 100) {
            console.log(`💧 ✅ UMIDADE VÁLIDA! Atualizando: ${umidadeRef.current}% → ${hum}%`)
            
            setUmidade(prevHum => {
              console.log(`💧 Callback setState - de ${prevHum}% para ${hum}%`)
              return hum
            })
            
            setLastSensorUpdate(new Date())
            setDataSource('dht22')
            umidadeProcessada = true
            break
          } else {
            console.warn(`⚠️ Umidade fora do range válido: ${hum}%`)
          }
        }
      }
      
      if (!umidadeProcessada) {
        console.warn('💧 ❌ NENHUM CAMPO DE UMIDADE ENCONTRADO!')
        console.log('🔍 Campos disponíveis:', Object.keys(sensorData))
        console.log('🔍 Campos procurados:', humFields)
      }
      
      if (temperaturaProcessada || umidadeProcessada) {
        console.log('✅ === DADOS PROCESSADOS COM SUCESSO ===')
        console.log(`📊 Status processamento - Temp: ${temperaturaProcessada ? '✅' : '❌'}, Umidade: ${umidadeProcessada ? '✅' : '❌'}`)
      } else {
        console.warn('⚠️ === NENHUM DADO VÁLIDO ENCONTRADO ===')
        console.log('🔍 Formato esperado: {"temperature": 25.3, "humidity": 60.2}')
        console.log('🔍 Ou formato CSV: "25.3,60.2"')
        console.log('🔍 Dados recebidos:', data)
      }
    }

    // Callbacks para status dos dispositivos
    const handleACStatus = (status) => {
      console.log('📨 Status AC recebido:', status)
      setArCondicionado(status === 'ligado' || status === 'on' || status === '1' ? 'ligado' : 'desligado')
    }

    const handleHumidifierStatus = (status) => {
      console.log('📨 Status umidificador recebido:', status)
      setUmidificador(status === 'ligado' || status === 'on' || status === '1' ? 'ligado' : 'desligado')
    }

    const handleLightStatus = (status) => {
      console.log('📨 Status luz sala recebido:', status)
      setLuzSala(status === 'ligada' || status === 'on' || status === '1' ? 'ligada' : 'desligada')
    }

    // Subscrever aos tópicos MQTT
    console.log('🔗 Registrando callbacks da Sala...')
    subscribeToSensorData('sala/sensores', handleSensorData)
    subscribeToDeviceStatus('sala/ac', handleACStatus)
    subscribeToDeviceStatus('sala/umidificador', handleHumidifierStatus)
    subscribeToDeviceStatus('sala/luz', handleLightStatus)

    // Fallback: simulação apenas se não receber dados reais
    const fallbackInterval = setInterval(() => {
      if (dataSource === 'simulado') {
        console.log('🎲 Usando dados simulados (nenhum dado real recebido)')
        setTemperatura(prev => {
          const variation = (Math.random() - 0.5) * 2
          const newTemp = Math.max(18, Math.min(35, prev + variation))
          console.log(`🎲 Simulação temperatura: ${prev}°C → ${newTemp}°C`)
          return newTemp
        })
        setUmidade(prev => {
          const variation = (Math.random() - 0.5) * 5
          const newHum = Math.max(30, Math.min(80, prev + variation))
          console.log(`🎲 Simulação umidade: ${prev}% → ${newHum}%`)
          return newHum
        })
      } else {
        // Verificar se os dados estão muito antigos (mais de 1 minuto)
        const now = new Date()
        if (lastSensorUpdate && (now - lastSensorUpdate) > 60000) {
          console.log('⚠️ Dados do DHT22 muito antigos, voltando para simulação')
          setDataSource('simulado')
        }
      }
    }, 5000) // Verificar a cada 5 segundos

    return () => {
      clearInterval(fallbackInterval)
    }
  }, [lastSensorUpdate, dataSource])

  // Log quando temperatura muda
  useEffect(() => {
    console.log(`🌡️ Estado temperatura mudou para: ${temperatura}°C`)
  }, [temperatura])

  // Log quando umidade muda
  useEffect(() => {
    console.log(`💧 Estado umidade mudou para: ${umidade}%`)
  }, [umidade])

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

  // Função de teste manual para debug
  const testarTemperatura = () => {
    console.log('🧪 TESTE MANUAL - Forçando temperatura para 30°C')
    setTemperatura(30.0)
    setDataSource('dht22')
    setLastSensorUpdate(new Date())
  }

  return (
    <div className="environment-card">
      <h2>🛋️ Sala</h2>
      
      <div className="sensors">
        <div className="sensor-item">
          <span className="sensor-icon">🌡️</span>
          <span className="sensor-value">{temperatura.toFixed(1)}°C</span>
          <span className="sensor-source">{dataSource === 'dht22' ? 'DHT22' : 'Simulado'}</span>
        </div>
        <div className="sensor-item">
          <span className="sensor-icon">💧</span>
          <span className="sensor-value">{umidade.toFixed(1)}%</span>
          <span className="sensor-time">
            {lastSensorUpdate ? lastSensorUpdate.toLocaleTimeString() : 'Nunca'}
          </span>
        </div>
      </div>

      {/* Botão de teste - temporário para debug */}
      <div style={{ marginBottom: '1rem' }}>
        <button 
          className="btn btn-info" 
          onClick={testarTemperatura}
          style={{ fontSize: '0.8rem', padding: '0.5rem' }}
        >
          🧪 Teste Temperatura
        </button>
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
