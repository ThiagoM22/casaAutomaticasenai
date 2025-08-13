import { useState, useEffect } from "react";
import {
  connectMQTT,
  disconnectMQTT,
  isConnectedMQTT,
} from "./utils/esp32Service";
import Garagem from "./components/Garagem";
import Sala from "./components/Sala";
import Quarto from "./components/Quarto";
import "./App.css";
import Log from "./components/Log";

function App() {
  const [esp32Status, setEsp32Status] = useState("Conectando...");
  const [mqttStatus, setMqttStatus] = useState("Desconectado");
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    // Apply theme to document root
    if (newTheme) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  // Initialize theme on component mount
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Conectar ao MQTT quando o componente for montado
  useEffect(() => {
    const initializeMQTT = async () => {
      try {
        setMqttStatus("Carregando Paho MQTT...");

        // Aguardar mais tempo para garantir que o script Paho carregou
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setMqttStatus("Conectando ao broker...");
        await connectMQTT();
        setMqttStatus("Conectado");
        setEsp32Status("Conectado via MQTT");
      } catch (error) {
        console.error("Erro ao conectar MQTT:", error);
        setMqttStatus("Erro de conexão");
        setEsp32Status("Falha na conexão");

        // Tentar novamente após 10 segundos
        setTimeout(() => {
          console.log("🔄 Tentativa de reconexão em 10 segundos...");
          initializeMQTT();
        }, 10000);
      }
    };

    initializeMQTT();

    // Verificar status da conexão periodicamente
    const statusInterval = setInterval(() => {
      const connected = isConnectedMQTT();
      if (connected && mqttStatus !== "Conectado") {
        setMqttStatus("Conectado");
        setEsp32Status("Conectado via MQTT");
      } else if (!connected && mqttStatus === "Conectado") {
        setMqttStatus("Desconectado");
        setEsp32Status("Desconectado");
      }
    }, 3000);

    // Cleanup na desmontagem do componente
    return () => {
      clearInterval(statusInterval);
      disconnectMQTT();
    };
  }, []);

  return (
    <div className="App">
      <header className="header">
        <h1>🏠 Casa Automática</h1>
        <div className="status-container">
          <div
            className={`status ${
              esp32Status.includes("Conectado") ? "connected" : "connecting"
            }`}
          >
            ESP32: {esp32Status}
          </div>
          <div
            className={`status ${
              mqttStatus === "Conectado" ? "connected" : "connecting"
            }`}
          >
            MQTT: {mqttStatus}
          </div>
          <label className="theme-toggle">
            <input 
              type="checkbox" 
              checked={!isDarkTheme} 
              onChange={toggleTheme}
            />
            <span className="theme-slider">
              <span className="theme-icon moon">🌙</span>
              <span className="theme-icon sun">☀️</span>
            </span>
          </label>
        </div>
      </header>

      <main className="main-content">
        <div className="environments">
          <Garagem />
          <Sala />
          <Quarto />
        </div>
        <Log />
      </main>
    </div>
  );
}

export default App;
