import { useState, useEffect } from 'react'
import { connectMQTT, disconnectMQTT, isConnectedMQTT } from './utils/esp32Service'
import Garagem from './components/Garagem'
import Sala from './components/Sala'
import Quarto from './components/Quarto'
import './App.css'

function App() {
  const [esp32Status, setEsp32Status] = useState('Conectando...')
  const [mqttStatus, setMqttStatus] = useState('Desconectado')

  // Conectar ao MQTT quando o componente for montado
  useEffect(() => {
    const initializeMQTT = async () => {
      try {
        setMqttStatus('Carregando Paho MQTT...')
        
        // Aguardar mais tempo para garantir que o script Paho carregou
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        setMqttStatus('Conectando ao broker...')
        await connectMQTT()
        setMqttStatus('Conectado')
        setEsp32Status('Conectado via MQTT')
      } catch (error) {
        console.error('Erro ao conectar MQTT:', error)
        setMqttStatus('Erro de conexão')
        setEsp32Status('Falha na conexão')
        
        // Tentar novamente após 10 segundos
        setTimeout(() => {
          console.log('🔄 Tentativa de reconexão em 10 segundos...')
          initializeMQTT()
        }, 10000)
      }
    }

    initializeMQTT()

    // Verificar status da conexão periodicamente
    const statusInterval = setInterval(() => {
      const connected = isConnectedMQTT()
      if (connected && mqttStatus !== 'Conectado') {
        setMqttStatus('Conectado')
        setEsp32Status('Conectado via MQTT')
      } else if (!connected && mqttStatus === 'Conectado') {
        setMqttStatus('Desconectado')
        setEsp32Status('Desconectado')
      }
    }, 3000)

    // Cleanup na desmontagem do componente
    return () => {
      clearInterval(statusInterval)
      disconnectMQTT()
    }
  }, [])

  return (
    <div className="App">
      <header className="header">
        <h1>🏠 Casa Automática</h1>
        <div className="status-container">
          <div className={`status ${esp32Status.includes('Conectado') ? 'connected' : 'connecting'}`}>
            ESP32: {esp32Status}
          </div>
          <div className={`status ${mqttStatus === 'Conectado' ? 'connected' : 'connecting'}`}>
            MQTT: {mqttStatus}
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="environments">
          <Garagem />
          <Sala />
          <Quarto />
        </div>
      </main>
    </div>
  )
}

export default App
