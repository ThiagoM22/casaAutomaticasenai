import { useEffect, useState } from "react";
import {
  subscribeToDeviceStatus,
  subscribeToSensorData,
} from "../utils/esp32Service";

function Log() {
  const [logs, setLogs] = useState([]);
  const maxLogs = 20;

  // Função para adicionar log mantendo o máximo de linhas
  const addLog = (topic, message) => {
    setLogs((prev) => {
      const novo = [{ time: new Date(), topic, message }, ...prev];
      return novo.slice(0, maxLogs);
    });
  };

  // Subscreve a todos os tópicos relevantes
  useEffect(() => {
    // Lista dos tópicos que deseja monitorar
    const topics = [
      "garagem/portao_social",
      "garagem/portao_basculante",
      "garagem/luz",
      "sala/luz",
      "sala/ac",
      "sala/umidificador",
      "quarto/luz",
      "quarto/tomada",
      "quarto/cortina",
      "garagem/status",
    ];

    topics.forEach((topic) => {
      subscribeToDeviceStatus(topic, (msg) => addLog(topic, msg));
    });

    // Sensores da sala
    subscribeToSensorData("sala/sensores", (msg) =>
      addLog("sala/sensores", JSON.stringify(msg))
    );
  }, []);

  return (
    <div className="environment-card">
      <h2>📝 Histórico de Mensagens MQTT</h2>
      <ul>
        {logs.length === 0 && <li>Nenhuma mensagem recebida ainda.</li>}
        {logs.map((log, idx) => (
          <li key={idx}>
            <span>{log.time.toLocaleTimeString()}</span>
            {" | "}
            <span>{log.topic}</span>
            {" : "}
            <span>{log.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Log;
