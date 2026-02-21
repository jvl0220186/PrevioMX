import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import SpecialBtn from '../components/common/SpecialBtn'
import './CaptureView.css'
import AddPartidasForm from '../components/capture/AddPartidasForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'
import ProveedoresCombo from '../components/common/ProveedoresCombo'
import PdfOcrViewer from '../components/capture/PdfOcrViewer'
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

    // Lista de documentos: desde storage (documentos) o legacy (rutaDocumento único)
    const initialDocumentos = (() => {
        if (storedData?.documentos?.length) return storedData.documentos
        if (storedData?.rutaDocumento) return [{ documento: 'Documento', rutaDocumento: storedData.rutaDocumento }]
        return []
    })()

    const [documentInfo, setDocumentInfo] = useState({
        idCliente: storedData?.idCliente || '',
        client: storedData?.client || '',
        idProveedor: storedData?.idProveedor || '',
        provider: storedData?.provider || '',
        date: storedData?.date || ''
    })
    const [documentos, setDocumentos] = useState(initialDocumentos)
    const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0)
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
    const [partidaToDelete, setPartidaToDelete] = useState(null) // Partida seleccionada para eliminar (modal)
    const [deleting, setDeleting] = useState(false) // Cargando durante eliminación
    const [verifiedDesgloses, setVerifiedDesgloses] = useState(false) // Check "He verificado los desgloses..." para habilitar Cerrar Previo
    const [showCerrarPrevioModal, setShowCerrarPrevioModal] = useState(false)
    const [discrepanciaCheck, setDiscrepanciaCheck] = useState(false) // Valor enviado en GET validar-cierre-previo
    const [showProveedorModal, setShowProveedorModal] = useState(false)
    const [pendingProveedor, setPendingProveedor] = useState(null) // Selección temporal en modal cambiar proveedor
    const [ocrExtractedText, setOcrExtractedText] = useState('')
    const [showOcrModal, setShowOcrModal] = useState(false)
    /** Modo "OCR para número de parte": cuando el usuario pidió rellenar el input desde el PDF */
    const [ocrTarget, setOcrTarget] = useState(null) // 'partNumber' | null
    /** Texto OCR a aplicar al número de parte (el formulario lo consume y luego se limpia) */
    const [ocrPartNumberToApply, setOcrPartNumberToApply] = useState(null)

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

                // Actualizar documentInfo: prioridad localStorage, luego API (documentos se mantienen desde storage)
                setDocumentInfo(prev => ({
                    idCliente: prev.idCliente || detalle.idCliente || '',
                    client: prev.client || detalle.cliente || '',
                    idProveedor: prev.idProveedor || detalle.idProveedor || '',
                    provider: prev.provider || detalle.proveedor || '',
                    date: dateStr || ''
                }))

                const unitsRaw = Array.isArray(unitsRes) ? unitsRes : (unitsRes.items || [])
                const countriesRaw = Array.isArray(countriesRes) ? countriesRes : (countriesRes.items || [])
                
                // Transformar catálogos: concatenar "[" + cValue + "] " + cText en cText
                const units = unitsRaw.map(item => ({
                    ...item,
                    cText: (item.cValue && item.cText) ? `[${item.cValue}] ${item.cText}` : item.cText
                }))
                const countries = countriesRaw.map(item => ({
                    ...item,
                    cText: (item.cValue && item.cText) ? `[${item.cValue}] ${item.cText}` : item.cText
                }))

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
                        setOpenPOData(posItems)
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

    const handleFinalize = async (discrepancia) => {
        try {
            setFinalizing(true)
            setShowCerrarPrevioModal(false)
            const response = await previoService.validarCierrePrevio(reference, discrepancia)
            
            if (response.estatus) {
                // Éxito: mostrar toast y redireccionar de inmediato
                setToast({
                    show: true,
                    message: `✅ ${response.msg || 'Captura finalizada correctamente'}`,
                    type: 'success'
                })
                navigate('/dashboard')
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

    const openDeleteModal = (partida, e) => {
        if (e) e.stopPropagation()
        setPartidaToDelete(partida)
    }

    const closeDeleteModal = () => {
        if (!deleting) setPartidaToDelete(null)
    }

    const handleConfirmDelete = async () => {
        if (!partidaToDelete) return
        try {
            setDeleting(true)
            const response = await previoService.eliminarPartida({
                idBulto: partidaToDelete.idBulto || '',
                referencia: reference,
                idProducto: partidaToDelete.idProducto || ''
            })
            if (response?.estatus) {
                setPartidaToDelete(null)
                await refreshPartidas()
                setToast({ show: true, message: response.msg || 'Partida eliminada correctamente', type: 'success' })
            } else {
                setToast({ show: true, message: response?.msg || 'No se pudo eliminar la partida', type: 'error' })
            }
        } catch (err) {
            console.error('Error al eliminar partida:', err)
            const msg = err?.message || err?.msg || 'Error al eliminar la partida'
            setToast({ show: true, message: msg, type: 'error' })
        } finally {
            setDeleting(false)
        }
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

    const handlePOAdded = async () => {
        try {
            const posResponse = await previoService.getDetallePOs(reference)
            const posItems = Array.isArray(posResponse) ? posResponse : (posResponse.items || [])
            setOpenPOData(posItems)
        } catch (poErr) {
            console.error('Error recargando lista de POs:', poErr)
        }
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
                idCliente={documentInfo.idCliente}
                client={documentInfo.client}
                showBack={true}
                onBack={handleBack}
            />

            <div className="capture-container">
                <div className="pdf-section">
                    {documentos.length > 0 ? (
                        <>
                            {/* Barra de herramientas del PDF con selector de documento */}
                            <div 
                                className="pdf-toolbar d-flex align-items-center justify-content-between px-3 py-2"
                                style={{ 
                                    backgroundColor: '#f8f7f5', 
                                    borderBottom: '1px solid #e9e8e2',
                                    minHeight: '45px'
                                }}
                            >
                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                    <span className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        <i className="bi bi-file-pdf me-1"></i>
                                        Documento
                                    </span>
                                    <select
                                        value={selectedDocumentIndex}
                                        onChange={(e) => setSelectedDocumentIndex(Number(e.target.value))}
                                        className="form-select form-select-sm"
                                        style={{
                                            maxWidth: '100%',
                                            borderRadius: '8px',
                                            borderColor: '#e9e8e2',
                                            fontSize: '0.85rem'
                                        }}
                                        title="Seleccionar documento"
                                    >
                                        {documentos.map((doc, idx) => (
                                            <option key={idx} value={idx}>
                                                {doc.documento || `Documento ${idx + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Visor PDF con OCR por región */}
                            <div 
                                className="pdf-iframe-container"
                                style={{ 
                                    flex: 1, 
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: 0
                                }}
                            >
                                <PdfOcrViewer
                                    pdfUrl={documentos[selectedDocumentIndex]?.rutaDocumento || ''}
                                    title={documentos[selectedDocumentIndex]?.documento || 'Documento'}
                                    rotation={pdfRotation}
                                    forceSelectionMode={ocrTarget === 'partNumber'}
                                    onSelectionCancelled={() => setOcrTarget(null)}
                                    onTextExtracted={(text) => {
                                        if (ocrTarget === 'partNumber') {
                                            setOcrPartNumberToApply(text)
                                            setOcrTarget(null)
                                        } else {
                                            setOcrExtractedText(text)
                                            setShowOcrModal(true)
                                        }
                                    }}
                                    toolbarExtra={
                                        <div className="d-flex align-items-center gap-1">
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
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => window.open(documentos[selectedDocumentIndex]?.rutaDocumento, '_blank')}
                                                title="Abrir en nueva pestaña"
                                                style={{ borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                <i className="bi bi-box-arrow-up-right"></i>
                                            </button>
                                        </div>
                                    }
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
                            idProveedor={documentInfo.idProveedor}
                            esOpenPO={esOpenPO}
                            openPOData={openPOData}
                            capturedProductIds={partidasCapturadas.map(p => p.idProducto)}
                            editingPartida={editingPartida}
                            onPOAdded={handlePOAdded}
                            onRequestOcrForPartNumber={() => setOcrTarget('partNumber')}
                            ocrPartNumberToApply={ocrPartNumberToApply}
                            onConsumeOcrPartNumber={() => setOcrPartNumberToApply(null)}
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
                                    <span className="info-value">
                                        {documentInfo.idCliente && <span className="text-muted me-1">[{documentInfo.idCliente}]</span>}
                                        {documentInfo.client || '-'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Proveedor:</span>
                                    <div className="d-flex align-items-center justify-content-end gap-2" style={{ flex: 1, minWidth: 0 }}>
                                        <span className="info-value">
                                            {documentInfo.idProveedor && <span className="text-muted me-1">[{documentInfo.idProveedor}]</span>}
                                            {documentInfo.provider || '-'}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary p-1"
                                            onClick={() => {
                                                setPendingProveedor(documentInfo.idProveedor ? { cValue: documentInfo.idProveedor, cText: documentInfo.provider || documentInfo.idProveedor } : null)
                                                setShowProveedorModal(true)
                                            }}
                                            title="Cambiar proveedor"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                    </div>
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
                                                                    {partida.ocCompra && (
                                                                        <span title="Orden de compra">
                                                                            <i className="bi bi-file-text me-1"></i>
                                                                            {partida.ocCompra}
                                                                        </span>
                                                                    )}
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
                                                            <div className="d-flex align-items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={(e) => openDeleteModal(partida, e)}
                                                                    title="Eliminar partida"
                                                                    style={{ borderRadius: '8px', padding: '4px 8px' }}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
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

                                    {/* Totales por unidad de medida (discreto, sin encabezado) */}
                                    {(() => {
                                        const totalesPorUm = partidasCapturadas.reduce((acc, p) => {
                                            const um = (p.um && String(p.um).trim()) || 'Sin UM'
                                            const qty = parseFloat(String(p.cantidad || 0).replace(/,/g, '.')) || 0
                                            acc[um] = (acc[um] || 0) + qty
                                            return acc
                                        }, {})
                                        const entries = Object.entries(totalesPorUm).sort((a, b) => a[0].localeCompare(b[0]))
                                        if (entries.length === 0) return null
                                        return (
                                            <div className="mt-3 py-2 px-3 rounded text-muted" style={{ fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.04)' }}>
                                                <div className="d-flex flex-wrap gap-3">
                                                    {entries.map(([um, total]) => (
                                                        <span key={um}>
                                                            <span>{um}:</span>
                                                            <span className="fw-semibold text-dark ms-1">{Number.isInteger(total) ? total : total.toFixed(2)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )
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

                            {/* Panel Cerrar Previo */}
                            <div className="card oc-light-card document-info-card capture-close-previo-card">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="bi bi-check2-square"></i>
                                    <h5 className="m-0 fw-bold" style={{ fontSize: '16px' }}>Cerrar Previo</h5>
                                </div>
                                <div className="d-flex flex-column gap-3">
                                    <label className="d-flex align-items-start gap-2 mb-0" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={verifiedDesgloses}
                                            onChange={(e) => setVerifiedDesgloses(e.target.checked)}
                                            className="form-check-input mt-1"
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span className="form-label mb-0" style={{ fontSize: '14px', fontWeight: 500 }}>
                                            He verificado los desgloses de bultos y cantidades totales del previo
                                        </span>
                                    </label>
                                    <SpecialBtn
                                        onClick={() => setShowCerrarPrevioModal(true)}
                                        iconLeft={finalizing ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check2"></i>}
                                        label={finalizing ? "Validando..." : "Cerrar Previo"}
                                        disabled={!verifiedDesgloses || finalizing}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* Modal cambiar proveedor */}
            {showProveedorModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setShowProveedorModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title d-flex align-items-center gap-2">
                                    <i className="bi bi-building text-primary" style={{ fontSize: '1.5rem' }}></i>
                                    Cambiar proveedor
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowProveedorModal(false)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                            <div className="modal-body py-4">
                                <label className="form-label fw-bold mb-2">Seleccione el proveedor</label>
                                <ProveedoresCombo
                                    label="Seleccionar proveedor"
                                    searchPlaceholder="Buscar por código o nombre..."
                                    initialFilter={documentInfo.idProveedor || ''}
                                    initialSelection={pendingProveedor ?? (documentInfo.idProveedor ? { cValue: documentInfo.idProveedor, cText: documentInfo.provider || documentInfo.idProveedor } : null)}
                                    onSelect={(item) => setPendingProveedor(item)}
                                    pageSize={20}
                                />
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowProveedorModal(false)}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn oc-primary-btn-2"
                                    onClick={() => {
                                        if (pendingProveedor) {
                                            setDocumentInfo(prev => ({
                                                ...prev,
                                                idProveedor: pendingProveedor.cValue ?? '',
                                                provider: pendingProveedor.cText ?? ''
                                            }))
                                        }
                                        setShowProveedorModal(false)
                                        setPendingProveedor(null)
                                    }}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: 'pointer' }}
                                >
                                    <i className="bi bi-check2 me-1"></i>
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal texto extraído por OCR */}
            {showOcrModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setShowOcrModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title d-flex align-items-center gap-2">
                                    <i className="bi bi-text-paragraph text-primary" style={{ fontSize: '1.5rem' }}></i>
                                    Texto extraído (OCR)
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowOcrModal(false)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                            <div className="modal-body py-4">
                                <textarea
                                    readOnly
                                    className="form-control font-monospace"
                                    value={ocrExtractedText}
                                    rows={12}
                                    style={{ fontSize: '0.9rem', resize: 'vertical', minHeight: '200px' }}
                                />
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowOcrModal(false)}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: 'pointer' }}
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    className="btn oc-primary-btn-2"
                                    onClick={() => {
                                        if (ocrExtractedText) {
                                            navigator.clipboard.writeText(ocrExtractedText).then(() => {
                                                setToast({ show: true, message: 'Texto copiado al portapapeles', type: 'success' })
                                            }).catch(() => {
                                                setToast({ show: true, message: 'No se pudo copiar', type: 'error' })
                                            })
                                        }
                                    }}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: 'pointer' }}
                                >
                                    <i className="bi bi-clipboard me-1"></i>
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar cerrar previo */}
            {showCerrarPrevioModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !finalizing && setShowCerrarPrevioModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title d-flex align-items-center gap-2">
                                    <i className="bi bi-check2-square text-primary" style={{ fontSize: '1.5rem' }}></i>
                                    Cerrar Previo
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => !finalizing && setShowCerrarPrevioModal(false)}
                                    disabled={finalizing}
                                    style={{ cursor: finalizing ? 'not-allowed' : 'pointer' }}
                                />
                            </div>
                            <div className="modal-body py-4">
                                <p className="mb-4" style={{ fontSize: '1rem', color: '#333' }}>
                                    ¿Está seguro de cerrar el previo?
                                </p>
                                <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={discrepanciaCheck}
                                        onChange={(e) => setDiscrepanciaCheck(e.target.checked)}
                                        className="form-check-input"
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        disabled={finalizing}
                                    />
                                    <span className="form-label mb-0" style={{ fontSize: '14px', fontWeight: 500 }}>
                                        Enviar con discrepancia
                                    </span>
                                </label>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => !finalizing && setShowCerrarPrevioModal(false)}
                                    disabled={finalizing}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: finalizing ? 'not-allowed' : 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn oc-primary-btn-2"
                                    onClick={() => handleFinalize(discrepanciaCheck)}
                                    disabled={finalizing}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: finalizing ? 'not-allowed' : 'pointer' }}
                                >
                                    {finalizing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Validando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check2 me-1"></i>
                                            Cerrar Previo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar eliminar partida */}
            {partidaToDelete && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeDeleteModal}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title d-flex align-items-center gap-2">
                                    <i className="bi bi-trash text-danger" style={{ fontSize: '1.5rem' }}></i>
                                    Eliminar partida
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                    style={{ cursor: deleting ? 'not-allowed' : 'pointer' }}
                                />
                            </div>
                            <div className="modal-body py-4">
                                <p className="mb-0" style={{ fontSize: '1rem', color: '#555' }}>
                                    ¿Eliminar la partida <strong>{partidaToDelete.idProducto}</strong> del bulto <strong>{partidaToDelete.idBulto}</strong>?
                                </p>
                                <p className="mt-2 mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: deleting ? 'not-allowed' : 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                    disabled={deleting}
                                    style={{ borderRadius: '12px', padding: '8px 20px', cursor: deleting ? 'not-allowed' : 'pointer' }}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash me-1"></i>
                                            Eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
