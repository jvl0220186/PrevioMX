import React, { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import StatCard from '../components/dashboard/StatCard'
import DashboardTable from '../components/dashboard/DashboardTable'
import CustomDropdown from '../components/common/CustomDropdown'
import LoadingSpinner from '../components/common/LoadingSpinner'
import previoService from '../services/previo.service'
import '../styles/oc-components.css'

const DashboardView = () => {
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filteredData, setFilteredData] = useState([])
  const [selectedClients, setSelectedClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await previoService.getPendientes()

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
            client: item.cliente,
            provider: item.proveedor,
            date: dateStr,
            bundles: item.bultos,
            status: item.estatus,
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
    { label: 'SIN DOCUMENTOS', count: sinDocumentosCount, variant: 'oc-light-card' },
    { label: 'PROCESANDO DOCUMENTOS', count: procesandoCount, variant: 'oc-light-card' },
    { label: 'DOCUMENTO LISTO', count: documentoListoCount, variant: 'oc-light-card' },
    { label: 'TOTAL', count: totalCount, variant: 'oc-light-card', border: true },
  ]

  const uniqueClients = [...new Set(tableData.map(item => item.client))]

  useEffect(() => {
    applyFilters(selectedClients, searchTerm)
  }, [tableData, selectedClients, searchTerm])


  const applyFilters = (clients, search) => {
    let data = tableData

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
          </div>
        </div>

        <div className="flex-grow-1 overflow-hidden">
          <DashboardTable data={filteredData} />
        </div>
      </main>
    </div>
  )
}

export default DashboardView
