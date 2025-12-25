import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import SpecialBtn from '../components/common/SpecialBtn'
import './CaptureView.css'
import AddPartidasForm from '../components/capture/AddPartidasForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'
import previoService from '../services/previo.service'

const CaptureView = () => {
    const { reference } = useParams()
    const navigate = useNavigate()
    const [showAddPartidas, setShowAddPartidas] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
    const [finalizing, setFinalizing] = useState(false)
    const [pdfRotation, setPdfRotation] = useState(0) // Rotación del PDF en grados

    // Leer datos guardados desde Dashboard (localStorage)
    const getCaptureDataFromStorage = () => {
        try {
            const stored = localStorage.getItem('captureData')
            if (stored) {
                const data = JSON.parse(stored)
                // Verificar que los datos correspondan a la referencia actual
                if (data.reference === reference) {
                    return data
                }
            }
        } catch (e) {
            console.error("Error reading captureData from localStorage", e)
        }
        return null
    }

    const storedData = getCaptureDataFromStorage()

    const [documentInfo, setDocumentInfo] = useState({
        client: storedData?.client || '',
        provider: storedData?.provider || '',
        date: storedData?.date || '',
        urlDocumento: storedData?.rutaDocumento || ''
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [catalogs, setCatalogs] = useState({
        units: [],
        countries: [],
        bultos: []
    })
    const [kpis, setKpis] = useState({
        totalBultos: 0,
        capturados: 0,
        pendientes: 0,
        lineasProductos: 0
    })
    const [partidasCapturadas, setPartidasCapturadas] = useState([])
    const [esOpenPO, setEsOpenPO] = useState(false)
    const [openPOData, setOpenPOData] = useState(null) // Datos del endpoint adicional para OpenPO
    const [editingPartida, setEditingPartida] = useState(null) // Partida en edición

    // Función para actualizar KPIs y partidas (sin recargar catálogos)
    const refreshPartidas = async () => {
        try {
            const detalle = await previoService.getDetalleEntrada(reference)
            const detalleItems = Array.isArray(detalle) ? detalle : (detalle.items || [])
            const uniqueBultos = [...new Set(detalleItems.map(item => item.idBulto).filter(id => id))]
            
            // Calcular KPIs
            const totalBultos = uniqueBultos.length
            const bultosConProducto = [...new Set(
                detalleItems
                    .filter(item => item.idBulto && item.idProducto && item.idProducto.trim() !== '')
                    .map(item => item.idBulto)
            )]
            const capturados = bultosConProducto.length
            const pendientes = totalBultos - capturados
            const lineasProductos = detalleItems.filter(item => item.idProducto && item.idProducto.trim() !== '').length

            // Actualizar bultos disponibles en catálogos
            setCatalogs(prev => ({
                ...prev,
                bultos: uniqueBultos
            }))
            
            setKpis({
                totalBultos,
                capturados,
                pendientes,
                lineasProductos
            })
            
            // Actualizar partidas capturadas
            const partidas = detalleItems.filter(item => item.idProducto && item.idProducto.trim() !== '')
            setPartidasCapturadas(partidas)
        } catch (err) {
            console.error("Error refreshing partidas", err)
        }
    }

    useEffect(() => {
        const fetchCaptureData = async () => {
            try {
                setLoading(true)
                
                // Cargar detalle del API (para urlDocumento y otros datos adicionales)
                const detallePromise = previoService.getDetalleEntrada(reference)
                const unitsPromise = previoService.getCatalogo(1)
                const countriesPromise = previoService.getCatalogo(2)

                const [detalle, unitsRes, countriesRes] = await Promise.all([
                    detallePromise,
                    unitsPromise,
                    countriesPromise
                ])

                // Formatear fecha si viene del API (fallback si no hay datos en localStorage)
                let dateStr = storedData?.date || detalle.fechaEntrada
                if (!storedData?.date && detalle.fechaEntrada) {
                    try {
                        const dateObj = new Date(detalle.fechaEntrada)
                        dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                    } catch (e) {
                        console.error("Date parse error", e)
                    }
                }

                // Actualizar documentInfo: prioridad localStorage, luego API
                setDocumentInfo(prev => ({
                    client: prev.client || detalle.cliente || '',
                    provider: prev.provider || detalle.proveedor || '',
                    date: dateStr || '',
                    urlDocumento: prev.urlDocumento || detalle.rutaDocumento || detalle.urlDocumento || ''
                }))

                const units = Array.isArray(unitsRes) ? unitsRes : (unitsRes.items || [])
                const countries = Array.isArray(countriesRes) ? countriesRes : (countriesRes.items || [])

                const detalleItems = Array.isArray(detalle) ? detalle : (detalle.items || [])
                const uniqueBultos = [...new Set(detalleItems.map(item => item.idBulto).filter(id => id))]
                
                // Calcular KPIs
                // Total bultos = count(distinct idBulto)
                const totalBultos = uniqueBultos.length
                
                // Capturados = count(distinct idBulto) donde idProducto !== ''
                const bultosConProducto = [...new Set(
                    detalleItems
                        .filter(item => item.idBulto && item.idProducto && item.idProducto.trim() !== '')
                        .map(item => item.idBulto)
                )]
                const capturados = bultosConProducto.length
                
                // Pendientes = Total - Capturados
                const pendientes = totalBultos - capturados
                
                // Líneas de productos = total de items con idProducto no vacío
                const lineasProductos = detalleItems.filter(item => item.idProducto && item.idProducto.trim() !== '').length

                setCatalogs({
                    units: units,
                    countries: countries,
                    bultos: uniqueBultos
                })
                
                setKpis({
                    totalBultos,
                    capturados,
                    pendientes,
                    lineasProductos
                })
                
                // Guardar partidas capturadas (items con idProducto no vacío)
                const partidas = detalleItems.filter(item => item.idProducto && item.idProducto.trim() !== '')
                setPartidasCapturadas(partidas)
                
                // Detectar si es OpenPO (tomar del primer item)
                const isOpenPO = detalleItems.length > 0 && detalleItems[0].esOpenPO === true
                setEsOpenPO(isOpenPO)
                
                // Si es OpenPO, consultar endpoint de detalle de POs
                if (isOpenPO) {
                    try {
                        const posResponse = await previoService.getDetallePOs(reference)
                        const posItems = Array.isArray(posResponse) ? posResponse : (posResponse.items || [])
                        
                        // Filtrar productos del OpenPO excluyendo los que ya están capturados
                        const capturedProductIds = new Set(partidas.map(p => p.idProducto))
                        const availablePOItems = posItems.filter(item => !capturedProductIds.has(item.idProducto))
                        
                        setOpenPOData(availablePOItems)
                    } catch (poErr) {
                        console.error('Error loading OpenPO data:', poErr)
                        setOpenPOData([])
                    }
                }

            } catch (err) {
                console.error("Error loading capture data", err)
                // Si hay datos de localStorage, no mostrar error para la info básica
                if (!storedData) {
                    setError("Error al cargar la información del previo.")
                }
            } finally {
                setLoading(false)
            }
        }

        if (reference) {
            fetchCaptureData()
        }
    }, [reference])


    const handleBack = () => {
        navigate('/dashboard')
    }

    const handleFinalize = async () => {
        try {
            setFinalizing(true)
            const response = await previoService.validarCierrePrevio(reference)
            
            if (response.estatus) {
                // Éxito: mostrar toast y redireccionar después de 5 segundos
                setToast({
                    show: true,
                    message: `✅ ${response.msg || 'Captura finalizada correctamente'}. Será redireccionado en 5 segundos...`,
                    type: 'success'
                })
                
                // Redireccionar después de 5 segundos
                setTimeout(() => {
                    navigate('/dashboard')
                }, 5000)
            } else {
                // Error: mostrar toast, no redireccionar
                setToast({
                    show: true,
                    message: `❌ ${response.msg || 'No se puede cerrar el previo'}`,
                    type: 'error'
                })
            }
        } catch (error) {
            console.error('Error al validar cierre:', error)
            setToast({
                show: true,
                message: `❌ Error al validar: ${error.message || error}`,
                type: 'error'
            })
        } finally {
            setFinalizing(false)
        }
    }
    
    const closeToast = () => {
        setToast(prev => ({ ...prev, show: false }))
    }

    const handleAddPartida = () => {
        setShowAddPartidas(true)
    }

    const handleCancelAdd = () => {
        setShowAddPartidas(false)
    }

    const handleSavePartida = (data) => {
        console.log('Saving partida:', data)
        setShowAddPartidas(false)
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <LoadingSpinner />
            </div>
        )
    }

    if (error) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
                <div className="alert alert-danger">{error}</div>
                <button className="btn btn-outline-primary mt-3" onClick={handleBack}>Volver al Dashboard</button>
            </div>
        )
    }

    return (
        <div className="capture-view">
            <Header
                title={reference}
                subtitle="Captura de Packing List"
                showBack={true}
                onBack={handleBack}
                actions={
                    <SpecialBtn 
                        onClick={handleFinalize} 
                        iconLeft={finalizing ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check2"></i>} 
                        label={finalizing ? "Validando..." : "Cerrar Previo"}
                        disabled={finalizing}
                    />
                }
            />

            <div className="capture-container">
                <div className="pdf-section">
                    {documentInfo.urlDocumento ? (
                        <>
                            {/* Barra de herramientas del PDF */}
                            <div 
                                className="pdf-toolbar d-flex align-items-center justify-content-between px-3 py-2"
                                style={{ 
                                    backgroundColor: '#f8f7f5', 
                                    borderBottom: '1px solid #e9e8e2',
                                    minHeight: '45px'
                                }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                        <i className="bi bi-file-pdf me-1"></i>
                                        Documento
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                    {/* Botones de rotación */}
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setPdfRotation(prev => (prev - 90) % 360)}
                                        title="Girar a la izquierda"
                                        style={{ borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setPdfRotation(prev => (prev + 90) % 360)}
                                        title="Girar a la derecha"
                                        style={{ borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </button>
                                    {pdfRotation !== 0 && (
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setPdfRotation(0)}
                                            title="Restablecer rotación"
                                            style={{ borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            <i className="bi bi-arrow-repeat"></i>
                                        </button>
                                    )}
                                    <div className="vr mx-2"></div>
                                    {/* Abrir en nueva pestaña */}
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => window.open(documentInfo.urlDocumento, '_blank')}
                                        title="Abrir en nueva pestaña"
                                        style={{ borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-box-arrow-up-right"></i>
                                    </button>
                                </div>
                            </div>
                            {/* Contenedor del iframe con rotación */}
                            <div 
                                className="pdf-iframe-container"
                                style={{ 
                                    flex: 1, 
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <iframe
                                    src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(documentInfo.urlDocumento)}#zoom=page-width`}
                                    className="pdf-iframe"
                                    title="PDF Viewer"
                                    style={{
                                        transform: `rotate(${pdfRotation}deg)`,
                                        transition: 'transform 0.3s ease',
                                        width: pdfRotation === 90 || pdfRotation === -90 || pdfRotation === 270 || pdfRotation === -270 ? '100vh' : '100%',
                                        height: pdfRotation === 90 || pdfRotation === -90 || pdfRotation === 270 || pdfRotation === -270 ? '100vw' : '100%',
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                            <i className="bi bi-file-earmark-x" style={{ fontSize: '64px' }}></i>
                            <p className="mt-3">No hay documento disponible</p>
                        </div>
                    )}
                </div>

                <div className="sidebar-section custom-scrollbar">
                    {showAddPartidas ? (
                        <AddPartidasForm
                            onCancel={() => {
                                handleCancelAdd()
                                setEditingPartida(null)
                            }}
                            onSave={handleSavePartida}
                            onPartidaSaved={() => {
                                refreshPartidas()
                                setEditingPartida(null)
                            }}
                            catalogUnidades={catalogs.units}
                            catalogPaises={catalogs.countries}
                            bultosAvailable={catalogs.bultos}
                            idEntrada={reference}
                            esOpenPO={esOpenPO}
                            openPOData={openPOData}
                            editingPartida={editingPartida}
                        />
                    ) : (
                        <>
                            <div className="card oc-light-card document-info-card">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="bi bi-file-text"></i>
                                    <h5 className="m-0 fw-bold" style={{ fontSize: '16px' }}>Información del Documento</h5>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">Cliente:</span>
                                    <span className="info-value">{documentInfo.client}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Proveedor:</span>
                                    <span className="info-value">{documentInfo.provider}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Fecha del Documento:</span>
                                    <span className="info-value">{documentInfo.date}</span>
                                </div>
                            </div>

                            <div className="stats-row">
                                <div className="card oc-light-card stat-box">
                                    <span className="stat-number">{kpis.capturados}</span>
                                    <span className="stat-label">CAPTURADOS</span>
                                </div>
                                <div className="card oc-light-card stat-box">
                                    <span className="stat-number">{kpis.pendientes}</span>
                                    <span className="stat-label">PENDIENTES</span>
                                </div>
                            </div>

                            <div className="products-header">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-list"></i>
                                    <h5 className="products-title">Lineas de Productos ( {kpis.lineasProductos} )</h5>
                                </div>
                                <SpecialBtn
                                    onClick={handleAddPartida}
                                    label="+ Agregar Partida"
                                />
                            </div>

                            {partidasCapturadas.length > 0 ? (
                                <div className="partidas-list">
                                    {/* Agrupar partidas por idBulto */}
                                    {(() => {
                                        // Crear grupos por bulto
                                        const grupos = partidasCapturadas.reduce((acc, partida) => {
                                            const bulto = partida.idBulto || 'Sin Bulto'
                                            if (!acc[bulto]) {
                                                acc[bulto] = []
                                            }
                                            acc[bulto].push(partida)
                                            return acc
                                        }, {})
                                        
                                        return Object.entries(grupos).map(([bulto, partidas]) => (
                                            <div key={bulto} className="bulto-group mb-3">
                                                {/* Encabezado del bulto */}
                                                <div 
                                                    className="bulto-header d-flex align-items-center gap-2 mb-2 p-2 rounded"
                                                    style={{ backgroundColor: '#f0f0f0', cursor: 'pointer' }}
                                                >
                                                    <i className="bi bi-box-seam text-secondary"></i>
                                                    <span className="fw-bold" style={{ fontSize: '0.9rem' }}>{bulto}</span>
                                                    <span className="badge bg-secondary ms-auto" style={{ fontSize: '0.75rem' }}>
                                                        {partidas.length} partida{partidas.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                
                                                {/* Partidas del bulto */}
                                                <div className="bulto-partidas ps-3">
                                                    {partidas.map((partida, index) => (
                                                        <div 
                                                            key={partida.id || index} 
                                                            className="partida-item d-flex justify-content-between align-items-center py-2 px-3 mb-1 rounded"
                                                            style={{ backgroundColor: '#fff', border: '1px solid #e9e8e2', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                            onClick={() => {
                                                                setEditingPartida(partida)
                                                                setShowAddPartidas(true)
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f0f7ff'
                                                                e.currentTarget.style.borderColor = '#0d6efd'
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fff'
                                                                e.currentTarget.style.borderColor = '#e9e8e2'
                                                            }}
                                                            title="Click para editar"
                                                        >
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                                        {partida.idProducto}
                                                                    </span>
                                                                    {partida.discrepancia && (
                                                                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                                                            <i className="bi bi-exclamation-triangle"></i>
                                                                        </span>
                                                                    )}
                                                                    {partida.mms && (
                                                                        <span className="badge bg-info" style={{ fontSize: '0.65rem' }} title="Tiene Marcas/Modelos/Series">
                                                                            MMS
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {partida.descripcionClas && (
                                                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                                        {partida.descripcionClas.length > 40 
                                                                            ? partida.descripcionClas.substring(0, 40) + '...' 
                                                                            : partida.descripcionClas}
                                                                    </div>
                                                                )}
                                                                <div className="d-flex flex-wrap gap-2 text-muted" style={{ fontSize: '0.8rem' }}>
                                                                    <span>
                                                                        <i className="bi bi-hash me-1"></i>
                                                                        {partida.cantidad} {partida.um}
                                                                    </span>
                                                                    <span>
                                                                        <i className="bi bi-globe me-1"></i>
                                                                        {partida.paisOrigen || '-'}
                                                                    </span>
                                                                    {partida.comentarios && (
                                                                        <span title={partida.comentarios}>
                                                                            <i className="bi bi-chat-text me-1"></i>
                                                                            {partida.comentarios.length > 20 
                                                                                ? partida.comentarios.substring(0, 20) + '...' 
                                                                                : partida.comentarios}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {partida.clasificado ? (
                                                                    <i className="bi bi-check-circle-fill text-success" title="Clasificado"></i>
                                                                ) : (
                                                                    <i className="bi bi-clock text-warning" title="Pendiente de clasificar"></i>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            ) : (
                                <div className="card oc-light-card manual-capture-container">
                                    <div className="manual-capture-icon">
                                        <i className="bi bi-pencil-square" style={{ color: '#E9E8E2', fontSize: '64px' }}></i>
                                    </div>
                                    <h3 className="manual-capture-title">Captura Manual Requerida</h3>
                                    <p className="manual-capture-text">
                                        Este documento no fue procesado con IA. Debe capturar las partidas manualmente desde el documento PDF.
                                    </p>
                                    <SpecialBtn
                                        onClick={handleAddPartida}
                                        label="+ Agregar Primera Partida"
                                    />
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
            
            <Toast 
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
                duration={toast.type === 'success' ? 6000 : 5000}
            />
        </div>
    )
}

export default CaptureView
