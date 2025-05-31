const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

let serverStatus = {
  classic: { lastHeartbeat: 0, playerCount: 0, players: [], link: "https://www.haxball.com/play?r=DTsX4_Classic" },
  extreme: { lastHeartbeat: 0, playerCount: 0, players: [], link: "https://www.haxball.com/play?r=DTsX4_Extreme" },
};
const HEARTBEAT_TIMEOUT = 80000; // 80 segundos para considerar offline

// Endpoint para heartbeat del servidor Classic
app.post("/heartbeat-classic", (req, res) => {
  try {
    const { timestamp, playerCount, mode, players = [], link } = req.body;
    if (mode !== "classic" || !Number.isInteger(playerCount) || playerCount < 0 || playerCount > 18) {
      return res.status(400).send("Datos de heartbeat inválidos");
    }
    serverStatus.classic = { lastHeartbeat: timestamp, playerCount, players, link: link || serverStatus.classic.link };
    console.log(`[${new Date().toISOString()}] Heartbeat Classic: ${playerCount}/18 jugadores, Jugadores: ${players.join(', ')}`);
    res.status(200).send("Heartbeat Classic recibido");
  } catch (error) {
    console.error("Error en /heartbeat-classic:", error);
    res.status(500).send("Error al procesar heartbeat");
  }
});

// Endpoint para heartbeat del servidor Extreme
app.post("/heartbeat-extreme", (req, res) => {
  try {
    const { timestamp, playerCount, mode, players = [], link } = req.body;
    if (mode !== "extreme" || !Number.isInteger(playerCount) || playerCount < 0 || playerCount > 18) {
      return res.status(400).send("Datos de heartbeat inválidos");
    }
    serverStatus.extreme = { lastHeartbeat: timestamp, playerCount, players, link: link || serverStatus.extreme.link };
    console.log(`[${new Date().toISOString()}] Heartbeat Extreme: ${playerCount}/18 jugadores, Jugadores: ${players.join(', ')}`);
    res.status(200).send("Heartbeat Extreme recibido");
  } catch (error) {
    console.error("Error en /heartbeat-extreme:", error);
    res.status(500).send("Error al procesar heartbeat");
  }
});

// Endpoint para devolver el estado y cantidad de jugadores de ambos servidores
app.get("/server-status", (req, res) => {
  const now = Date.now();
  const status = {
    classic: {
      online: now - serverStatus.classic.lastHeartbeat < HEARTBEAT_TIMEOUT,
      playerCount: serverStatus.classic.playerCount,
      players: serverStatus.classic.players,
      link: serverStatus.classic.link,
      maxPlayers: 20
    },
    extreme: {
      online: now - serverStatus.extreme.lastHeartbeat < HEARTBEAT_TIMEOUT,
      playerCount: serverStatus.extreme.playerCount,
      players: serverStatus.extreme.players,
      link: serverStatus.extreme.link,
      maxPlayers: 18
    },
  };
  res.json(status);
});

// Recibe y guarda players.json (Extreme)
app.post("/update-players", async (req, res) => {
  try {
    const data = req.body;
    if (!data.players || !Array.isArray(data.players)) {
      return res.status(400).send("El cuerpo debe contener un arreglo 'players'.");
    }
    await fs.writeFile(path.join(__dirname, "public", "players.json"), JSON.stringify(data, null, 2));
    res.send("Players actualizado.");
  } catch (error) {
    console.error("Error al actualizar players.json:", error);
    res.status(500).send("Error al actualizar los datos.");
  }
});

// Recibe y guarda classic.json
app.post("/update-classic", async (req, res) => {
  try {
    const data = req.body;
    if (!data.players || !Array.isArray(data.players)) {
      return res.status(400).send("El cuerpo debe contener un arreglo 'players'.");
    }
    await fs.writeFile(path.join(__dirname, "public", "classic.json"), JSON.stringify(data, null, 2));
    res.send("Classic actualizado.");
  } catch (error) {
    console.error("Error al actualizar classic.json:", error);
    res.status(500).send("Error al actualizar los datos.");
  }
});

// Devuelve players.json
app.get("/players.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "players.json"));
});

// Devuelve classic.json
app.get("/classic.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "classic.json"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
