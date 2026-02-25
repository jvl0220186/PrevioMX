import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import StatCard from '../components/dashboard/StatCard'
import DashboardTable from '../components/dashboard/DashboardTable'
import CustomDropdown from '../components/common/CustomDropdown'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Toast from '../components/common/Toast'
import previoService from '../services/previo.service'
import '../styles/oc-components.css'

const DashboardView = () => {
  const navigate = useNavigate()
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filteredData, setFilteredData] = useState([])
  const [selectedClients, setSelectedClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('TOTAL') // Filtro por KPI
  const [puedeMostrarReabrirPrevio, setPuedeMostrarReabrirPrevio] = useState(false) // true solo si existe-previo-cerrado devolvió estatus true
  const [loadingExistePrevio, setLoadingExistePrevio] = useState(false)

  const [showReabrirPrevioModal, setShowReabrirPrevioModal] = useState(false)
  const [reabrirUsuario, setReabrirUsuario] = useState('')
  const [reabrirPassword, setReabrirPassword] = useState('')
  const [validandoReabrir, setValidandoReabrir] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Obtener equipo del usuario logueado
        const userStr = localStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : {}
        const equipo = user.equipo || ''
        
        const response = await previoService.getPendientes(equipo)

        const mappedData = (response.items || []).map(item => {
          let dateStr = item.fechaEntrada
          try {
            if (dateStr) {
              const dateObj = new Date(dateStr)
              dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            }
          } catch (e) {
          }

          return {
            reference: item.idEntrada,
            idCliente: item.idCliente || '',
            client: item.cliente,
            idProveedor: item.idProveedor || '',
            provider: item.proveedor,
            tipoEnvio: item.tipoEnvio || '',
            date: dateStr,
            bundles: item.bultos,
            status: item.estatus,
            documentos: Array.isArray(item.documentos) ? item.documentos : [],
            bodega: item.bodega || '',
            ai: false
          }
        })

        setTableData(mappedData)
        setFilteredData(mappedData)

        const clients = [...new Set(mappedData.map(item => item.client))]
        setSelectedClients(clients)

      } catch (err) {
        console.error(err)
        setError('Error al cargar los datos.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const sinDocumentosCount = tableData.filter(item => item.status === 'Sin Documentos').length
  const procesandoCount = tableData.filter(item => item.status === 'Procesando Documentos').length
  const documentoListoCount = tableData.filter(item => item.status === 'Documento Listo').length
  const totalCount = tableData.length
  const pendingCount = totalCount - documentoListoCount

  const stats = [
    { label: 'SIN DOCUMENTOS', count: sinDocumentosCount, variant: 'oc-light-card', statusFilter: 'Sin Documentos' },
    { label: 'PROCESANDO DOCUMENTOS', count: procesandoCount, variant: 'oc-light-card', statusFilter: 'Procesando Documentos' },
    { label: 'DOCUMENTO LISTO', count: documentoListoCount, variant: 'oc-light-card', statusFilter: 'Documento Listo' },
    { label: 'TOTAL', count: totalCount, variant: 'oc-light-card', border: true, statusFilter: 'TOTAL' },
  ]

  const handleStatusFilter = (status) => {
    setSelectedStatus(status)
  }

  const uniqueClients = [...new Set(tableData.map(item => item.client))]

  useEffect(() => {
    applyFilters(selectedClients, searchTerm, selectedStatus)
  }, [tableData, selectedClients, searchTerm, selectedStatus])

  // Cuando la búsqueda en tiempo real deja la tabla sin resultados, validar si existe previo cerrado
  useEffect(() => {
    const term = searchTerm.trim()
    const sinResultados = term !== '' && filteredData.length === 0

    if (!sinResultados) {
      setPuedeMostrarReabrirPrevio(false)
      setLoadingExistePrevio(false)
      return
    }

    let cancelled = false
    const timeoutId = setTimeout(async () => {
      setLoadingExistePrevio(true)
      setPuedeMostrarReabrirPrevio(false)
      try {
        const response = await previoService.existePrevioCerrado(term)
        if (!cancelled) setPuedeMostrarReabrirPrevio(response?.estatus === true)
      } catch (err) {
        if (!cancelled) setPuedeMostrarReabrirPrevio(false)
      } finally {
        if (!cancelled) setLoadingExistePrevio(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [searchTerm, filteredData.length])


  const applyFilters = (clients, search, status) => {
    let data = tableData

    // Filtro por estatus (KPI)
    if (status && status !== 'TOTAL') {
      data = data.filter(item => item.status === status)
    }

    if (clients.length > 0) {
      data = data.filter(item => clients.includes(item.client))
    }

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase()
      data = data.filter(item => {
        return (
          (item.reference && item.reference.toLowerCase().includes(searchLower)) ||
          (item.client && item.client.toLowerCase().includes(searchLower)) ||
          (item.provider && item.provider.toLowerCase().includes(searchLower)) ||
          (item.date && item.date.toLowerCase().includes(searchLower)) ||
          (item.bundles && item.bundles.toString().includes(searchLower)) ||
          (item.status && item.status.toLowerCase().includes(searchLower))
        )
      })
    }

    setFilteredData(data)
  }

  const handleClientFilter = (clients) => {
    setSelectedClients(clients)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const openReabrirPrevioModal = () => {
    setReabrirUsuario('')
    setReabrirPassword('')
    setShowReabrirPrevioModal(true)
  }

  const closeReabrirPrevioModal = () => {
    setShowReabrirPrevioModal(false)
    setReabrirUsuario('')
    setReabrirPassword('')
  }

  const mapReabrePrevioToCaptureData = (item) => {
    let dateStr = item.fechaEntrada
    try {
      if (dateStr) {
        const dateObj = new Date(dateStr)
        dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      }
    } catch (e) {}
    return {
      reference: item.idEntrada,
      idCliente: item.idCliente || '',
      client: item.cliente || '',
      idProveedor: item.idProveedor || '',
      provider: item.proveedor || '',
      date: dateStr || '',
      bundles: item.bultos,
      status: item.estatus || '',
      documentos: Array.isArray(item.documentos) ? item.documentos : []
    }
  }

  const handleValidarReabrirPrevio = async () => {
    const usuario = reabrirUsuario.trim()
    const password = reabrirPassword
    const referencia = searchTerm.trim()
    if (!usuario || !referencia) return
    setShowReabrirPrevioModal(false)
    setReabrirUsuario('')
    setReabrirPassword('')
    setValidandoReabrir(true)
    try {
      const puedeResponse = await previoService.puedeReabrirPrevio({ usuario, password })
      if (puedeResponse?.puedeRegenerar === true) {
        const item = await previoService.reabrePrevio(referencia)
        const captureData = mapReabrePrevioToCaptureData(item)
        localStorage.setItem('captureData', JSON.stringify(captureData))
        navigate(`/capture/${referencia}`)
      } else {
        setToast({ show: true, message: 'No se puede reabrir el previo con las credenciales proporcionadas', type: 'error' })
      }
    } catch (err) {
      const msg = err?.message || err?.msg || 'Error al validar credenciales'
      setToast({ show: true, message: msg, type: 'error' })
    } finally {
      setValidandoReabrir(false)
    }
  }

  // Mostrar botón "Reabrir previo" solo si la tabla no tiene resultados Y el API confirmó que existe previo cerrado para la búsqueda
  const showReabrirPrevioButton = puedeMostrarReabrirPrevio && !loadingExistePrevio

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-view bg-light vh-100 d-flex flex-column">
      <Header pendingCount={pendingCount} />
      <main className="container-fluid py-4 px-5 flex-grow-1 d-flex flex-column overflow-hidden">
        <div className="row mb-5 g-4 flex-shrink-0">
          {stats.map((stat, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-3">
              <StatCard
                label={stat.label}
                count={stat.count}
                variant={stat.variant}
                border={stat.border}
                active={selectedStatus === stat.statusFilter}
                onClick={() => handleStatusFilter(stat.statusFilter)}
              />
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 flex-shrink-0">
          <h4 className="fw-bold mb-0">Referencias Pendientes de Previo</h4>

          <div className="d-flex gap-3">
            <div className="position-relative">
              <input
                type="text"
                className="oc-input ps-5"
                placeholder="Buscar"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ minWidth: '300px', borderRadius: '20px' }}
              />
              <i className="bi bi-search position-absolute text-muted" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }}></i>
            </div>

            <CustomDropdown
              options={uniqueClients}
              label="Seleccione una opción"
              searchPlaceholder="Buscar"
              onSelect={handleClientFilter}
            />

            {searchTerm.trim() !== '' && filteredData.length === 0 && loadingExistePrevio && (
              <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Verificando...
              </span>
            )}
            {showReabrirPrevioButton && (
              <button
                type="button"
                className="btn oc-primary-btn-2"
                style={{ borderRadius: '12px', padding: '8px 20px' }}
                onClick={openReabrirPrevioModal}
              >
                Reabrir previo
              </button>
            )}
          </div>
        </div>

        <div className="flex-grow-1 overflow-hidden">
          <DashboardTable data={filteredData} />
        </div>
      </main>

      {/* Modal credenciales para reabrir previo */}
      {showReabrirPrevioModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeReabrirPrevioModal}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-key text-primary" style={{ fontSize: '1.5rem' }}></i>
                  Credenciales para reabrir previo
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReabrirPrevioModal}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div className="modal-body py-4">
                <p className="text-muted small mb-3">
                  Ingrese las credenciales especiales para esta operación (no son las del login de la aplicación).
                </p>
                <div className="mb-3">
                  <label className="form-label fw-bold">Usuario</label>
                  <input
                    type="text"
                    className="form-control oc-input"
                    placeholder="Usuario"
                    value={reabrirUsuario}
                    onChange={(e) => setReabrirUsuario(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-bold">Contraseña</label>
                  <input
                    type="password"
                    className="form-control oc-input"
                    placeholder="Contraseña"
                    value={reabrirPassword}
                    onChange={(e) => setReabrirPassword(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeReabrirPrevioModal}
                  style={{ borderRadius: '12px', padding: '8px 20px', cursor: 'pointer' }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn oc-primary-btn-2"
                  disabled={!reabrirUsuario.trim() || validandoReabrir}
                  onClick={handleValidarReabrirPrevio}
                  style={{ borderRadius: '12px', padding: '8px 20px', cursor: validandoReabrir ? 'not-allowed' : 'pointer' }}
                >
                  {validandoReabrir ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      Validando...
                    </>
                  ) : (
                    'Validar'
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
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
        duration={toast.type === 'error' ? 6000 : 5000}
      />
    </div>
  )
}

export default DashboardView
