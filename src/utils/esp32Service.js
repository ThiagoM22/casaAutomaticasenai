// Configuração do MQTT - seguindo o padrão do ESP32
const MQTT_BROKER = 'broker.hivemq.com'
const MQTT_PORT = 8000 // Porta WebSocket
const TOPIC_PREFIX = 'casaAutomatica' // Prefixo para todos os tópicos

// Cliente MQTT
let client = null
let isConnected = false
let connectionPromise = null

// Lista de tópicos para se inscrever (baseado no seu código)
const topicos = [
  "casaAutomatica/garagem/status",
  "casaAutomatica/sala/sensor",
  "casaAutomatica/garagem/portao_social",
  "casaAutomatica/garagem/portao_basculante", 
  "casaAutomatica/garagem/luz",
  "casaAutomatica/sala/luz",
  "casaAutomatica/sala/ac",
  "casaAutomatica/sala/umidificador",
  "casaAutomatica/quarto/luz",
  "casaAutomatica/quarto/tomada",
  "casaAutomatica/quarto/cortina"
]

// Callbacks para notificações
const statusCallbacks = new Map()
const sensorCallbacks = new Map()

// Aguardar o Paho MQTT carregar - versão melhorada
const waitForPaho = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 50 // 5 segundos
    
    const checkPaho = () => {
      // Verificar múltiplas formas de acesso ao Paho
      const pahoAvailable = 
        (typeof window.Paho !== 'undefined' && typeof window.Paho.MQTT !== 'undefined') ||
        (typeof window.Paho !== 'undefined' && typeof window.Paho.Client !== 'undefined') ||
        (typeof Paho !== 'undefined' && typeof Paho.MQTT !== 'undefined') ||
        (typeof Paho !== 'undefined' && typeof Paho.Client !== 'undefined')

      if (pahoAvailable) {
        console.log('✅ Paho MQTT detectado e carregado')
        
        // Normalizar acesso ao Paho
        if (typeof window.Paho === 'undefined' && typeof Paho !== 'undefined') {
          window.Paho = Paho
        }
        if (typeof window.Paho.MQTT === 'undefined' && typeof window.Paho.Client !== 'undefined') {
          window.Paho.MQTT = { Client: window.Paho.Client, Message: window.Paho.Message }
        }
        
        resolve(true)
      } else if (attempts >= maxAttempts) {
        console.error('❌ Timeout: Paho MQTT não carregou')
        console.log('Verifique sua conexão com a internet e o CDN do Paho MQTT')
        reject(new Error('Timeout aguardando Paho MQTT carregar'))
      } else {
        attempts++
        console.log(`⏳ Aguardando Paho MQTT... (${attempts}/${maxAttempts})`)
        setTimeout(checkPaho, 100)
      }
    }
    
    checkPaho()
  })
}

// Detectar o objeto Paho correto
const getPahoClient = () => {
  if (typeof window.Paho !== 'undefined') {
    if (typeof window.Paho.MQTT !== 'undefined' && typeof window.Paho.MQTT.Client !== 'undefined') {
      return window.Paho.MQTT.Client
    }
    if (typeof window.Paho.Client !== 'undefined') {
      return window.Paho.Client
    }
  }
  
  if (typeof Paho !== 'undefined') {
    if (typeof Paho.MQTT !== 'undefined' && typeof Paho.MQTT.Client !== 'undefined') {
      return Paho.MQTT.Client
    }
    if (typeof Paho.Client !== 'undefined') {
      return Paho.Client
    }
  }
  
  throw new Error('Paho Client não encontrado')
}

// Detectar o objeto Message correto
const getPahoMessage = () => {
  if (typeof window.Paho !== 'undefined') {
    if (typeof window.Paho.MQTT !== 'undefined' && typeof window.Paho.MQTT.Message !== 'undefined') {
      return window.Paho.MQTT.Message
    }
    if (typeof window.Paho.Message !== 'undefined') {
      return window.Paho.Message
    }
  }
  
  if (typeof Paho !== 'undefined') {
    if (typeof Paho.MQTT !== 'undefined' && typeof Paho.MQTT.Message !== 'undefined') {
      return Paho.MQTT.Message
    }
    if (typeof Paho.Message !== 'undefined') {
      return Paho.Message
    }
  }
  
  throw new Error('Paho Message não encontrado')
}

// Conectar ao broker MQTT usando Paho - versão melhorada
export const connectMQTT = async () => {
  // Se já há uma tentativa de conexão em andamento, aguardar ela
  if (connectionPromise) {
    return connectionPromise
  }

  // Se já está conectado, retornar sucesso
  if (isConnected && client) {
    return Promise.resolve(true)
  }

  connectionPromise = (async () => {
    try {
      // Aguardar o Paho MQTT carregar
      await waitForPaho()
      
      // Obter o cliente Paho correto
      const PahoClient = getPahoClient()
      
      // Criar cliente MQTT
      const clientId = "cliente_" + Math.random().toString(16).substr(2, 8)
      client = new PahoClient(MQTT_BROKER, MQTT_PORT, clientId)

      console.log(`🔗 Cliente criado: ${clientId}`)
      console.log(`🌐 Conectando a: ${MQTT_BROKER}:${MQTT_PORT}`)

      // Configurar callbacks
      client.onConnectionLost = onConnectionLost
      client.onMessageArrived = onMessageArrived

      // Retornar Promise para a conexão
      return new Promise((resolve, reject) => {
        // Timeout para a conexão
        const connectionTimeout = setTimeout(() => {
          reject(new Error('Timeout na conexão MQTT'))
        }, 15000)

        // Conectar
        client.connect({
          onSuccess: function() {
            clearTimeout(connectionTimeout)
            console.log("✅ Conectado ao broker MQTT")
            isConnected = true
            
            // Se inscrever em todos os tópicos
            topicos.forEach(topico => {
              try {
                client.subscribe(topico)
                console.log("📡 Inscrito no tópico:", topico)
              } catch (subError) {
                console.error("❌ Erro ao inscrever no tópico:", topico, subError)
              }
            })
            
            connectionPromise = null
            resolve(true)
          },
          onFailure: function(error) {
            clearTimeout(connectionTimeout)
            console.error('❌ Erro ao conectar MQTT:', error)
            console.log('Verifique se o broker está acessível:', MQTT_BROKER)
            isConnected = false
            connectionPromise = null
            reject(error)
          },
          useSSL: false,
          timeout: 10,
          keepAliveInterval: 30,
          cleanSession: true
        })

      })

    } catch (error) {
      console.error('❌ Erro ao criar cliente MQTT:', error)
      connectionPromise = null
      throw error
    }
  })()

  return connectionPromise
}

// Callback para conexão perdida - baseado no seu código
const onConnectionLost = (responseObject) => {
  if (responseObject.errorCode !== 0) {
    console.log("❌ Conexão perdida:", responseObject.errorMessage)
    isConnected = false
    connectionPromise = null
    
    // Tentar reconectar após 5 segundos
    setTimeout(() => {
      if (!isConnected) {
        console.log('🔄 Tentando reconectar...')
        connectMQTT().catch(error => {
          console.error('Erro na reconexão:', error)
        })
      }
    }, 5000)
  }
}

// Callback para mensagens recebidas - baseado no seu código
const onMessageArrived = (message) => {
  console.log(`📩 [${message.destinationName}] ${message.payloadString}`)
  handleIncomingMessage(message.destinationName, message.payloadString)
}

// Processar mensagens recebidas
const handleIncomingMessage = (topic, message) => {
  try {
    // Parse da mensagem (pode ser JSON ou texto simples)
    let data
    try {
      data = JSON.parse(message)
    } catch {
      data = { value: message }
    }

    // Determinar tipo de mensagem baseado nos tópicos
    if (topic === 'casaAutomatica/sala/sensor') {
      // Dados de sensores da sala
      const callback = sensorCallbacks.get('sala/sensores')
      if (callback) {
        callback(data)
      }
    } else if (topic === 'casaAutomatica/garagem/status') {
      // Status geral da garagem
      const callback = statusCallbacks.get('garagem/status')
      if (callback) {
        callback(data.value || data.status || message)
      }
    } else {
      // Status específico de dispositivos
      const deviceTopic = topic.replace(`${TOPIC_PREFIX}/`, '')
      const callback = statusCallbacks.get(deviceTopic)
      if (callback) {
        callback(data.value || data.status || message)
      }
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
  }
}

// Desconectar do MQTT
export const disconnectMQTT = () => {
  if (client && isConnected) {
    try {
      client.disconnect()
      console.log('🔌 Desconectado do broker MQTT')
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    }
  }
  client = null
  isConnected = false
  connectionPromise = null
}

// Verificar se está conectado
export const isConnectedMQTT = () => isConnected

// Função para publicar mensagens - versão melhorada
const enviarMensagem = (topico, mensagem) => {
  if (!client || !isConnected) {
    throw new Error('MQTT não conectado')
  }

  try {
    const PahoMessage = getPahoMessage()
    const msg = new PahoMessage(mensagem)
    msg.destinationName = topico
    client.send(msg)
    console.log(`📤 Mensagem enviada para ${topico}: ${mensagem}`)
  } catch (error) {
    console.error('❌ Erro ao criar/enviar mensagem:', error)
    throw error
  }
}

// Enviar comando via MQTT - adaptado para usar sua função
export const sendCommand = async (topic, command) => {
  // Se não estiver conectado, tentar conectar primeiro
  if (!client || !isConnected) {
    console.log('MQTT não conectado, tentando reconectar...')
    try {
      await connectMQTT()
    } catch (error) {
      throw new Error(`Falha ao conectar MQTT: ${error.message}`)
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const fullTopic = `${TOPIC_PREFIX}/${topic}`
      enviarMensagem(fullTopic, command)
      resolve({ success: true, message: `Comando ${command} enviado para ${fullTopic}` })
    } catch (error) {
      console.error('Erro ao enviar comando MQTT:', error)
      reject(error)
    }
  })
}

// Subscrever a atualizações de status de dispositivo
export const subscribeToDeviceStatus = (topic, callback) => {
  statusCallbacks.set(topic, callback)
  console.log(`👂 Callback registrado para: ${topic}`)
}

// Subscrever a dados de sensores
export const subscribeToSensorData = (topic, callback) => {
  // Mapear para o tópico correto do sensor
  if (topic === 'sala/sensores') {
    sensorCallbacks.set(topic, callback)
    console.log(`👂 Callback registrado para sensores da sala`)
  }
}

// Desinscrever de um tópico
export const unsubscribeFromTopic = (topic) => {
  statusCallbacks.delete(topic)
  sensorCallbacks.delete(topic)
  
  if (client && isConnected) {
    const fullTopic = `${TOPIC_PREFIX}/${topic}`
    try {
      client.unsubscribe(fullTopic)
      console.log(`❌ Desinscrito de: ${fullTopic}`)
    } catch (error) {
      console.error(`Erro ao desinscrever de ${fullTopic}:`, error)
    }
  }
}

// Função de compatibilidade (mantida para não quebrar código existente)
export const getSensorData = async () => {
  // Esta função agora é baseada em callback via MQTT
  // Retorna dados simulados como fallback
  return {
    temperature: 25.0 + (Math.random() - 0.5) * 10,
    humidity: 60.0 + (Math.random() - 0.5) * 20
  }
}