import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Horario.css";

// --- CONSTANTES Y CONFIGURACIÓN ---
// La URL de la API se obtiene de las variables de entorno para Vercel.
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Se usan URLs de placeholders para las imágenes para evitar errores de compilación.
// En tu proyecto real, puedes volver a usar los imports locales.
const logoAgs = "https://placehold.co/200x80/ffffff/000000?text=Logo+Estado";
const logoDerecho = "https://placehold.co/120x120/ffffff/000000?text=Logo+Escuela";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const horas = [1, 2, 3, 4, 5, 6, 7];
const paletaColores = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", 
  "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", 
  "#ffeb3b", "#ffc107", "#ff9800", "#ff5722"
];


function Horario({ user }) {
  const [profesores, setProfesores] = useState([]);
  const [horario, setHorario] = useState({});
  const [anio, setAnio] = useState("2025-2026");
  const [mostrarPaleta, setMostrarPaleta] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState("#f44336");
  const [leyenda, setLeyenda] = useState({});
  const [modoBorrador, setModoBorrador] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const horarioTableRef = useRef(null);

  const mostrarAlerta = useCallback((mensaje, tipo = "success") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [isLoading]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API_URL}/auth/profesores`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data)) setProfesores(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingMessage("Cargando horario...");
    setIsLoading(true);
    setProgress(20);
    axios.get(`${API_URL}/horario/${anio}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setProgress(75);
        if (res.data?.datos) setHorario(res.data.datos);
        if (res.data?.leyenda) setLeyenda(res.data.leyenda);
      }).catch(error => {
        console.error("Error al cargar el horario:", error);
        mostrarAlerta("Error al cargar el horario ❌", "error");
        setProgress(100);
      }).finally(() => {
        setTimeout(() => { setIsLoading(false); setLoadingMessage(""); }, 300);
      });
  }, [anio, mostrarAlerta]);
  
  const generarHorarioVacio = useCallback(() => {
    if (isLoading) return;
    if (!window.confirm("¿Estás seguro de que quieres limpiar todo el horario? Esta acción es irreversible.")) return;

    const nuevoHorario = {};
    profesores.forEach(prof => {
      nuevoHorario[prof.nombre] = {};
      dias.forEach(d => {
        horas.forEach(h => {
          nuevoHorario[prof.nombre][`General-${d}-${h}`] = { text: "", color: "transparent" };
        });
      });
    });
    setHorario(nuevoHorario);
    setLeyenda({});
    mostrarAlerta("Horario limpiado correctamente ✅", "success");
  }, [isLoading, profesores, mostrarAlerta]);

  const handleCellChange = useCallback((profesor, asignatura, dia, hora, value) => {
    if (user.role !== "admin" || isLoading) return;
    setHorario(prev => ({ ...prev, [profesor]: { ...(prev[profesor] || {}), [`${asignatura}-${dia}-${hora}`]: { ...((prev[profesor] || {})[`${asignatura}-${dia}-${hora}`] || { text: "", color: "transparent" }), text: value } } }));
  }, [user.role, isLoading]);

  const pintarHora = useCallback((profesor, asignatura, dia, hora) => {
    if (user.role !== "admin" || isLoading || (!mostrarPaleta && !modoBorrador)) return;
    const nuevoColor = modoBorrador ? "transparent" : colorSeleccionado;
    setHorario(prev => ({ ...prev, [profesor]: { ...(prev[profesor] || {}), [`${asignatura}-${dia}-${hora}`]: { ...((prev[profesor] || {})[`${asignatura}-${dia}-${hora}`] || { text: "", color: "transparent" }), color: nuevoColor } } }));
    if (!modoBorrador && !leyenda[colorSeleccionado]) { setLeyenda(prev => ({ ...prev, [colorSeleccionado]: "" })); }
  }, [user.role, isLoading, mostrarPaleta, modoBorrador, colorSeleccionado, leyenda]);

  const handleLeyendaChange = useCallback((color, value) => {
    if (isLoading) return;
    setLeyenda(prev => ({ ...prev, [color]: value }));
  }, [isLoading]);

  const eliminarLeyenda = useCallback(color => {
    if (isLoading) return;
    setLeyenda(prev => { const copia = { ...prev }; delete copia[color]; return copia; });
    mostrarAlerta("Color eliminado de la leyenda", "info");
  }, [isLoading, mostrarAlerta]);
  
  const getBase64Image = (imgPath) => new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imgPath;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (error) => reject(error);
  });
  
  // --- Lógica de generación de PDF refactorizada en una función auxiliar ---
  const generarContenidoPDF = async (doc) => {
    doc.setFont("helvetica", "normal"); // Reset font
    const [logoAgsBase64, logoDerBase64] = await Promise.all([ getBase64Image(logoAgs), getBase64Image(logoDerecho) ]);
    doc.addImage(logoAgsBase64, "PNG", 15, 8, 40, 16);
    doc.addImage(logoDerBase64, "PNG", 255, 8, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ESCUELA SECUNDARIA GENERAL, No. 9", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text("“AMADO NERVO”", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });
    doc.setFontSize(10);
    doc.text(`HORARIO GENERAL ${anio}`, doc.internal.pageSize.getWidth() / 2, 29, { align: "center" });
    
    const tablaElement = horarioTableRef.current;
    if (!tablaElement) throw new Error("Tabla de horario no encontrada.");

    const canvas = await html2canvas(tablaElement, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = doc.internal.pageSize.getWidth() - 20;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    doc.addImage(imgData, "PNG", 10, 35, pdfWidth, pdfHeight);
    
    let leyendaY = 35 + pdfHeight + 10;
    if (leyendaY > doc.internal.pageSize.getHeight() - 20 && Object.keys(leyenda).length > 0) { doc.addPage(); leyendaY = 15; }
    
    if (Object.keys(leyenda).length > 0) { 
        doc.setFontSize(10); 
        doc.setFont("helvetica", "bold"); 
        doc.text("Leyenda:", 10, leyendaY); 
        leyendaY += 7; 
        Object.entries(leyenda).forEach(([color, desc]) => { 
            if (leyendaY + 8 > doc.internal.pageSize.getHeight() - 10) { doc.addPage(); leyendaY = 15; } 
            doc.setFillColor(color); 
            doc.rect(10, leyendaY, 6, 6, "F"); 
            doc.setTextColor(0); 
            doc.setFont("helvetica", "normal"); 
            doc.text(desc || "Sin descripción", 18, leyendaY + 5); 
            leyendaY += 8; 
        }); 
    }
  };

  const exportarPDF = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingMessage("Exportando PDF...");
    setProgress(10);
    try {
        const doc = new jsPDF("landscape");
        await generarContenidoPDF(doc);
        setProgress(95);
        doc.save(`Horario_${anio}.pdf`);
        mostrarAlerta("PDF exportado correctamente 📄✅", "success");
    } catch (error) {
        console.error("Error al exportar PDF:", error);
        mostrarAlerta("Hubo un error al generar el PDF ❌", "error");
    } finally {
        setIsLoading(false);
        setLoadingMessage("");
    }
  }, [anio, leyenda, isLoading, mostrarAlerta]);

  const enviarHorarioProfesores = useCallback(async () => {
    if (user.role !== "admin" || isLoading) return;
    const correos = profesores.map(p => p.correo).filter(Boolean);
    if (correos.length === 0) {
        return mostrarAlerta("No hay correos de profesores registrados para enviar.", "error");
    }

    setIsLoading(true);
    setLoadingMessage(`Enviando a ${correos.length} profesores...`);
    setProgress(10);
    try {
        const doc = new jsPDF("landscape");
        await generarContenidoPDF(doc);
        setProgress(85);

        const pdfDataUri = doc.output('datauristring');
        const base64Pdf = pdfDataUri.split(',')[1];
        
        const payload = {
            to: correos,
            subject: `Horario Escolar General ${anio}`,
            body: `Estimados profesores,<br><br>Se adjunta el horario general para el ciclo escolar <strong>${anio}</strong>.<br><br>Saludos cordiales,<br>Administración.`,
            pdfData: base64Pdf,
            fileName: `Horario_${anio}.pdf`
        };

        const token = localStorage.getItem("token");
        await axios.post(`${API_URL}/api/enviar-horario`, payload, { headers: { Authorization: `Bearer ${token}` } });
        
        setProgress(100);
        mostrarAlerta(`Horario enviado a ${correos.length} profesores ✅`, "success");
    } catch (error) {
        console.error("Error al enviar el horario:", error);
        mostrarAlerta("Error al enviar el horario por correo ❌", "error");
    } finally {
        setIsLoading(false);
        setLoadingMessage("");
    }
  }, [user.role, isLoading, profesores, anio, leyenda, mostrarAlerta]);
  
  const guardarHorario = useCallback(async () => {
    if (user.role !== "admin" || isLoading) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLoading(true);
    setLoadingMessage("Guardando horario...");
    setProgress(10);
    try {
        const payload = { anio, datos: horario, leyenda };
        await axios.post(`${API_URL}/horario`, payload, { 
            headers: { Authorization: `Bearer ${token}` },
            onUploadProgress: (e) => setProgress(Math.min(90, Math.round((e.loaded * 100) / (e.total || 1))))
        });
        setProgress(100);
        mostrarAlerta("Horario guardado correctamente ✅", "success");
    } catch (err) {
        console.error(err);
        mostrarAlerta("Error al guardar el horario ❌", "error");
    } finally {
        setTimeout(() => { setIsLoading(false); setLoadingMessage(""); }, 500);
    }
  }, [user.role, anio, horario, leyenda, isLoading, mostrarAlerta]);

  return (
    <div className="horario-page">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <p className="loading-message">{loadingMessage || "Cargando..."}</p>
            <div className="progress-bar-custom">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                <span className="progress-bar-text">{`${Math.round(progress)}%`}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {alerta && <div className={`alerta ${alerta.tipo}`}>{alerta.mensaje}</div>}
      
      <header className="horario-header">
        <h1>Gestión de Horarios</h1>
        <div className="titulo-anio">
            {user.role === "admin" ? ( 
                <input type="text" value={anio} onChange={e => setAnio(e.target.value)} className="anio-input" disabled={isLoading} /> 
            ) : <h2>Ciclo Escolar: {anio}</h2>}
        </div>
      </header>
      
      {user.role === "admin" && ( 
        <div className="admin-panel"> 
            <button className={`btn-admin ${modoBorrador ? "activo" : ""}`} onClick={() => setModoBorrador(!modoBorrador)} disabled={isLoading}>🧹 Borrador</button> 
            <button className="btn-admin" onClick={() => setMostrarPaleta(!mostrarPaleta)} disabled={isLoading}>🖌️ Pincel</button> 
            {mostrarPaleta && ( 
                <div className="paleta-colores"> 
                    {paletaColores.map(c => ( <div key={c} className="color-cuadro" style={{ backgroundColor: c }} onClick={() => { setColorSeleccionado(c); setModoBorrador(false); }} /> ))} 
                </div> 
            )} 
            <button onClick={generarHorarioVacio} className="btn-admin" disabled={isLoading}>🗑️ Limpiar</button> 
            <button onClick={guardarHorario} className="btn-admin" disabled={isLoading}> 💾 Guardar</button> 
            <button onClick={exportarPDF} className="btn-admin" disabled={isLoading}> 📄 Exportar PDF </button> 
            <button onClick={enviarHorarioProfesores} className="btn-admin" disabled={isLoading}> 📧 Enviar </button> 
        </div> 
      )}
      
      <div className="horario-table-container"> 
        <table className="horario-table" ref={horarioTableRef}> 
            <thead> 
                <tr> 
                    <th>Profesor</th> 
                    <th>Asignaturas</th> 
                    {dias.map(d => <th key={d}>{d}</th>)} 
                </tr> 
            </thead> 
            <tbody> 
                {profesores.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(prof => ( 
                    <tr key={prof._id}> 
                        <td>{prof.nombre}</td> 
                        <td className="asignaturas-cell">{(prof.asignaturas || ["General"]).join(", ")}</td> 
                        {dias.map(d => ( 
                            <td key={`${prof._id}-${d}`}> 
                                <div className="horas-row-horizontal"> 
                                    {horas.map(h => { 
                                        const cell = horario?.[prof.nombre]?.[`General-${d}-${h}`] || { text: "", color: "transparent" }; 
                                        return ( 
                                            <div key={`${d}-${h}`} className="hora-box-horizontal" style={{ backgroundColor: cell.color }} onClick={() => !isLoading && pintarHora(prof.nombre, "General", d, h)}> 
                                                <div className="hora-num">{h}</div> 
                                                <input type="text" maxLength={7} value={cell.text} onChange={e => handleCellChange(prof.nombre, "General", d, h, e.target.value)} disabled={isLoading || user.role !== 'admin'} /> 
                                            </div> 
                                        ); 
                                    })} 
                                </div> 
                            </td> 
                        ))} 
                    </tr> 
                ))} 
            </tbody> 
        </table> 
      </div>
      
      {user.role === "admin" && Object.keys(leyenda).length > 0 && ( 
        <div className="leyenda"> 
            <h3>Leyenda</h3> 
            <div className="leyenda-colores"> 
                {Object.entries(leyenda).map(([color, significado]) => ( 
                    <div key={color} className="leyenda-item"> 
                        <div className="color-cuadro-leyenda" style={{ backgroundColor: color }} /> 
                        <input type="text" placeholder="Significado" value={significado} onChange={e => handleLeyendaChange(color, e.target.value)} disabled={isLoading} /> 
                        <button className="btn-eliminar" onClick={() => eliminarLeyenda(color)} disabled={isLoading}>❌</button> 
                    </div> 
                ))} 
            </div> 
        </div> 
      )}
    </div>
  );
}

export default Horario;

