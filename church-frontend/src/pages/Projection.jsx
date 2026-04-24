import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WS_URL } from "../api/api";

export default function Projection() {
  const [payload, setPayload] = useState(null); // { type, data }
  const [clock, setClock] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlist, setPlaylist] = useState([]);

  useEffect(() => {
    // Reloj para standby
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (playlist.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % playlist.length);
    }, 12000); // 12 segundos

    return () => clearInterval(timer);
  }, [playlist]);

  useEffect(() => {
    // Conectar WebSocket
    let ws;
    const connect = () => {
      ws = new WebSocket(`${WS_URL}/announcements/ws`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // message esperado: { type: "announcement" | "weekly_program" | "announcement_playlist", data: object|array } o null
        setPayload(message);
        
        if (message?.type === "announcement_playlist") {
          setPlaylist(message.data || []);
          setCurrentIndex(0);
        } else {
          setPlaylist([]);
        }
      };

      ws.onclose = () => {
        // Reconexión automática si cae
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Helpers para procesar los privilegios en grilla por día
  const DAYS_ORDER = ["Martes", "Viernes", "Sábado", "Domingo"];
  
  const renderWeeklyProgram = () => {
    if (!payload || !payload.data) return null;
    const items = payload.data; // Array de asignaciones

    // Agrupar por día
    const byDay = {};
    DAYS_ORDER.forEach(d => byDay[d] = []);
    items.forEach(item => {
      if (byDay[item.day_name]) {
        byDay[item.day_name].push(item);
      }
    });

    return (
      <div style={{ width: "95vw", height: "90vh", display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontSize: "3vw", color: "#f8fafc", margin: "2vh 0", fontWeight: "800", textTransform: "uppercase", letterSpacing: "4px" }}>
          Programa Semanal de Privilegios
        </h1>
        
        <div style={{ display: "flex", flex: 1, gap: "1.5vw" }}>
          {DAYS_ORDER.map(day => (
            <div key={day} style={{ 
              flex: 1, 
              background: "rgba(255, 255, 255, 0.05)", 
              backdropFilter: "blur(12px)", 
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "2vw",
              display: "flex",
              flexDirection: "column",
              gap: "2vh"
            }}>
              <h2 style={{ fontSize: "2.5vw", color: "#facc15", borderBottom: "2px solid rgba(255,255,255,0.1)", paddingBottom: "1vh", margin: 0, fontWeight: "700" }}>
                {day}
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh", overflowY: "auto", flex: 1 }}>
                {byDay[day].length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "1.2vw", fontStyle: "italic" }}>Sin programa</p>
                ) : (
                  byDay[day].map(p => (
                    <div key={p.id} style={{ 
                      background: "rgba(0, 0, 0, 0.2)", 
                      borderRadius: "12px", 
                      padding: "1.5vh 1vw",
                      display: "flex", flexDirection: "column", gap: "0.5vh"
                    }}>
                      <span style={{ fontSize: "1vw", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", letterSpacing: "1px" }}>
                        {p.privilege}
                      </span>
                      <span style={{ fontSize: "1.8vw", color: "#fff", fontWeight: "700" }}>
                        {p.member_name || "—"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isStandby = !payload || !payload.data;
  const isAnnouncement = payload?.type === "announcement" && payload.data;
  const isWeeklyProgram = payload?.type === "weekly_program" && payload.data;

  return (
    <div style={{
      margin: 0, padding: 0, height: "100vh", width: "100vw",
      backgroundColor: "#020617", /* Fondo super oscuro y opaco */
      backgroundImage: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      overflow: "hidden",
      position: "relative"
    }}>

      {/* Decorative Orbs para el fondo glassmorphism */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "40vw", height: "40vw", background: "#3b82f6", filter: "blur(120px)", opacity: 0.15, borderRadius: "50%" }}></div>
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "40vw", height: "40vw", background: "#facc15", filter: "blur(120px)", opacity: 0.1, borderRadius: "50%" }}></div>

      {/* Anuncio Individual Animado */}
      <AnimatePresence mode="wait">
        {isAnnouncement && !playlist.length && (
          <motion.div
            key={payload.data.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            style={{ position: "absolute", width: "85%", maxWidth: "1400px", zIndex: 10 }}
          >
            <h1 style={{ fontSize: "6vw", fontWeight: "800", color: "#facc15", marginBottom: "4vh", lineHeight: "1.1" }}>
              {payload.data.title}
            </h1>
            <p style={{ fontSize: "3.5vw", fontWeight: "500", color: "#f8fafc", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
              {payload.data.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist de Anuncios Animada */}
      <AnimatePresence mode="wait">
        {playlist.length > 0 && (
          <motion.div
            key={playlist[currentIndex]?.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ position: "absolute", width: "85%", maxWidth: "1400px", zIndex: 10 }}
          >
            <h1 style={{ fontSize: "6vw", fontWeight: "800", color: "#facc15", marginBottom: "4vh", lineHeight: "1.1" }}>
              {playlist[currentIndex]?.title}
            </h1>
            <p style={{ fontSize: "3.5vw", fontWeight: "500", color: "#f8fafc", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
              {playlist[currentIndex]?.content}
            </p>
            {playlist.length > 1 && (
               <div style={{ marginTop: "5vh", display: "flex", justifyContent: "center", gap: "1vw" }}>
                 {playlist.map((_, i) => (
                   <div key={i} style={{ 
                     width: i === currentIndex ? "3vw" : "1vw", 
                     height: "6px", 
                     background: i === currentIndex ? "#facc15" : "rgba(255,255,255,0.2)",
                     borderRadius: "3px",
                     transition: "all 0.4s ease"
                   }} />
                 ))}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transición Suave Programa Semanal Glassmorphism */}
      <div style={{
        transition: "opacity 0.8s ease-in-out, transform 0.8s ease-in-out",
        opacity: isWeeklyProgram ? 1 : 0,
        transform: isWeeklyProgram ? "scale(1)" : "scale(0.98)",
        position: "absolute",
        zIndex: 10
      }}>
        {isWeeklyProgram && renderWeeklyProgram()}
      </div>

      {/* Standby View */}
      <div style={{
        transition: "opacity 0.8s ease-in-out",
        opacity: isStandby ? 1 : 0,
        position: "absolute",
        zIndex: 5
      }}>
        {isStandby && (
          <>
            <h2 style={{ fontSize: "4vw", fontWeight: "300", color: "#64748b", margin: 0, letterSpacing: "10px" }}>
              TIEMPO DE ANUNCIOS
            </h2>
            <div style={{ fontSize: "2vw", color: "#475569", marginTop: "20px", fontWeight: "700" }}>
              {clock}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
