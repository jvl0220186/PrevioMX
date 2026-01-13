import React, { useState, useEffect, useRef } from 'react'
import SingleSelectDropdown from '../common/SingleSelectDropdown'
import CustomDropdown from '../common/CustomDropdown'
import SpecialBtn from '../common/SpecialBtn'
import Toast from '../common/Toast'
import previoService from '../../services/previo.service'

// Función para convertir números a letras en español
const numeroALetras = (num) => {
    if (num === null || num === undefined || num === '') return ''
    
    let numero = parseInt(num)
    if (isNaN(numero)) return ''
    if (numero === 0) return 'cero'
    if (numero < 0) return 'menos ' + numeroALetras(Math.abs(numero))
    
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
    
    const convertirGrupo = (valor) => {
        let n = valor
        if (n === 0) return ''
        if (n === 100) return 'cien'
        
        let resultado = ''
        
        // Centenas
        if (n >= 100) {
            resultado += centenas[Math.floor(n / 100)] + ' '
            n = n % 100
        }
        
        // Decenas y unidades
        if (n >= 10 && n <= 19) {
            resultado += especiales[n - 10]
        } else if (n >= 20) {
            resultado += decenas[Math.floor(n / 10)]
            if (n % 10 !== 0) {
                resultado += (Math.floor(n / 10) === 2 ? 'i' : ' y ') + unidades[n % 10]
            }
        } else if (n > 0) {
            resultado += unidades[n]
        }
        
        return resultado.trim()
    }
    
    if (numero >= 1000000000000) return 'número muy grande'
    
    let resultado = ''
    
    // Miles de millones
    if (numero >= 1000000000) {
        const milesMillones = Math.floor(numero / 1000000000)
        resultado += (milesMillones === 1 ? 'mil ' : convertirGrupo(milesMillones) + ' mil ') + 'millones '
        numero %= 1000000000
    }
    
    // Millones
    if (numero >= 1000000) {
        const millones = Math.floor(numero / 1000000)
        resultado += (millones === 1 ? 'un millón ' : convertirGrupo(millones) + ' millones ')
        numero %= 1000000
    }
    
    // Miles
    if (numero >= 1000) {
        const miles = Math.floor(numero / 1000)
        resultado += (miles === 1 ? 'mil ' : convertirGrupo(miles) + ' mil ')
        numero %= 1000
    }
    
    // Resto
    if (numero > 0) {
        resultado += convertirGrupo(numero)
    }
    
    return resultado.trim().replace(/\s+/g, ' ')
}

const AddPartidasForm = ({ onCancel, onSave, onPartidaSaved, catalogUnidades = [], catalogPaises = [], bultosAvailable = [], idEntrada = '', esOpenPO = false, openPOData = [], editingPartida = null }) => {
    const [formData, setFormData] = useState({
        id: '', // ID de la partida (para edición)
        bulto: '',
        partNumber: '',
        physicalPartNumber: '', // Número de parte físico (se agrega a notas)
        description: '',
        clasificacion: '',
        quantity: '',
        unit: '',
        subCantidad: '', // Sub cantidad (requerida cuando unit === 'JGO')
        country: '',
        brand: '',
        model: '',
        series: '',
        notes: '',
        selectedPO: '',      // Para OpenPO
        ocCompra: ''         // Para OpenPO - almacena el PO seleccionado
    })
    
    // Indica si estamos en modo edición
    const isEditing = !!editingPartida

    // Standard Pack info
    const [spInfo, setSpInfo] = useState({
        isSpum: false,
        spUm: '',
        isSppo: false,
        spPo: '',
        isSpmms: false,
        spMms: ''
    })

    // Lista de series capturadas (MMS entries)
    const [mmsEntries, setMmsEntries] = useState([])

    const [isFormValid, setIsFormValid] = useState(false)
    const [loadingClasificacion, setLoadingClasificacion] = useState(false)
    const [savingPartida, setSavingPartida] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'warning' })
    const [isProductoClasificado, setIsProductoClasificado] = useState(false)
    const [marcaValida, setMarcaValida] = useState(true) // true por defecto, solo valida si hay clasificación
    const [modeloValido, setModeloValido] = useState(true) // true por defecto, solo valida si hay clasificación
    const [validandoMarca, setValidandoMarca] = useState(false)
    const [validandoModelo, setValidandoModelo] = useState(false)
    const [isBultoLocked, setIsBultoLocked] = useState(false)
    const [partidasCount, setPartidasCount] = useState(0)
    const [isMultibulto, setIsMultibulto] = useState(false) // Modo multibulto
    const [selectedBultos, setSelectedBultos] = useState([]) // Bultos seleccionados en modo multibulto
    
    // Estados para OpenPO
    const [selectedPOProducts, setSelectedPOProducts] = useState([])
    const [openPOValues, setOpenPOValues] = useState({ um: '', paisOrigen: '' }) // Valores originales del OpenPO
    const [conflictModal, setConflictModal] = useState({ 
        show: false, 
        conflicts: [], // [{field: 'um'|'country', openPOValue: '', spValue: '', label: ''}]
        pendingSpInfo: null 
    })
    const [manualPartNumberEnabled, setManualPartNumberEnabled] = useState(false) // Habilitar captura manual en OpenPO
    const [availablePOData, setAvailablePOData] = useState([]) // Copia local de openPOData que se actualiza al registrar partidas
    
    // Inicializar availablePOData cuando cambia openPOData
    useEffect(() => {
        setAvailablePOData(openPOData || [])
    }, [openPOData])

    // Cargar datos cuando hay una partida en edición
    useEffect(() => {
        if (editingPartida) {
            // Extraer NP Físico de los comentarios si existe
            let physicalPartNumber = ''
            let cleanNotes = editingPartida.comentarios || ''
            const npFisicoMatch = cleanNotes.match(/\[NP Físico: ([^\]]+)\]/)
            if (npFisicoMatch) {
                physicalPartNumber = npFisicoMatch[1]
                cleanNotes = cleanNotes.replace(/\[NP Físico: [^\]]+\]\s*/, '').trim()
            }

            // Parsear MMS si existe: marca1|modelo1|serie1~marca2|modelo2|serie2
            let parsedMmsEntries = []
            if (editingPartida.mms && editingPartida.mms.trim() !== '') {
                const mmsGroups = editingPartida.mms.split('~')
                parsedMmsEntries = mmsGroups.map(group => {
                    const parts = group.split('|')
                    return {
                        brand: parts[0] || '',
                        model: parts[1] || '',
                        series: parts[2] || ''
                    }
                }).filter(entry => entry.series) // Solo incluir si tiene serie
            }

            setFormData({
                id: editingPartida.id || '',
                bulto: editingPartida.idBulto || '',
                partNumber: editingPartida.idProducto || '',
                physicalPartNumber: physicalPartNumber,
                description: editingPartida.descripcionClas || editingPartida.descripcion || '',
                clasificacion: editingPartida.clasificacion || '',
                quantity: editingPartida.cantidad || '',
                unit: editingPartida.um || '',
                subCantidad: editingPartida.subCantidad || '',
                country: editingPartida.paisOrigen || '',
                brand: '',
                model: '',
                series: '',
                notes: cleanNotes,
                selectedPO: editingPartida.ocCompra || '',
                ocCompra: editingPartida.ocCompra || ''
            })
            
            // Cargar entradas de MMS
            setMmsEntries(parsedMmsEntries)
            
            // Si tiene MMS, activar el flag de isSpmms
            if (parsedMmsEntries.length > 0) {
                setSpInfo(prev => ({
                    ...prev,
                    isSpmms: true
                }))
            }
            
            // Bloquear bulto en modo edición
            setIsBultoLocked(true)
            
            // Si tiene clasificación de 10 dígitos, marcar como clasificado
            if (editingPartida.clasificacion && /^\d{10}$/.test(editingPartida.clasificacion)) {
                setIsProductoClasificado(true)
            }
            
            // Resetear validaciones al cargar partida en edición
            setMarcaValida(true)
            setModeloValido(true)
        }
    }, [editingPartida])

    // Refs para navegación con Enter
    const partNumberRef = useRef(null)
    const quantityRef = useRef(null)
    const brandRef = useRef(null)
    const modelRef = useRef(null)
    const seriesRef = useRef(null)

    const bultosOptions = bultosAvailable.length > 0 ? bultosAvailable : []
    
    // Opciones de PO (valores únicos) - usando availablePOData
    const poOptions = esOpenPO ? [...new Set(availablePOData.map(item => item.po))] : []

    const getLabel = (value, catalog) => {
        if (!value) return ''
        const item = catalog.find(c => c.cValue === String(value))
        return item ? item.cText : value
    }

    const getValue = (label, catalog) => {
        const item = catalog.find(c => c.cText === label)
        return item ? item.cValue : label
    }

    const unitOptions = catalogUnidades.map(c => c.cText)
    const countryOptions = catalogPaises.map(c => c.cText)

    // Validación del formulario
    useEffect(() => {
        const requiredFields = ['partNumber', 'description', 'quantity', 'unit', 'country']
        const basicFieldsValid = requiredFields.every(field => formData[field] && String(formData[field]).trim() !== '')
        
        // Validar bulto según modo
        const bultoValid = isMultibulto 
            ? selectedBultos.length > 0 
            : formData.bulto && String(formData.bulto).trim() !== ''
        
        // Validar subCantidad si la unidad es JGO
        const isJGO = formData.unit === 'JGO'
        const subCantidadValid = isJGO 
            ? formData.subCantidad && String(formData.subCantidad).trim() !== ''
            : true
        
        const basicValid = basicFieldsValid && bultoValid && subCantidadValid
        
        // Si requiere MMS, validar que cantidad === número de series
        let mmsValid = true
        if (spInfo.isSpmms && basicValid) {
            const qty = parseInt(formData.quantity) || 0
            mmsValid = qty > 0 && mmsEntries.length === qty
        }
        
        // Validar que marca y modelo sean válidos si el producto tiene clasificación
        const validacionesValidas = marcaValida && modeloValido
        
        setIsFormValid(basicValid && mmsValid && validacionesValidas)
    }, [formData, spInfo.isSpmms, mmsEntries, isMultibulto, selectedBultos, marcaValida, modeloValido])

    const handleChange = (field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            }
            // Si se cambia la unidad y no es JGO, limpiar subCantidad
            if (field === 'unit' && value !== 'JGO') {
                newData.subCantidad = ''
            }
            return newData
        })
    }

    // Manejar selección de PO (OpenPO)
    const handlePOSelect = (po) => {
        setFormData(prev => ({
            ...prev,
            selectedPO: po,
            ocCompra: po,
            // Limpiar producto seleccionado al cambiar PO
            partNumber: '',
            description: '',
            quantity: '',
            unit: '',
            subCantidad: '',
            country: ''
        }))
        setIsProductoClasificado(false)
        resetSpInfo()
        
        // Filtrar productos del PO seleccionado (usando availablePOData)
        const products = availablePOData.filter(item => item.po === po)
        setSelectedPOProducts(products)
    }

    // Manejar selección de Producto desde PO (OpenPO)
    const handlePOProductSelect = (idProducto) => {
        const product = selectedPOProducts.find(p => p.idProducto === idProducto)
        if (product) {
            // Guardar valores originales del OpenPO para comparación posterior
            setOpenPOValues({
                um: product.um || '',
                paisOrigen: product.paisOrigen || ''
            })
            
            // Precargar los datos del producto
            setFormData(prev => ({
                ...prev,
                partNumber: product.idProducto,
                description: product.descripcion || '',
                quantity: String(product.cantidad || ''),
                unit: product.um || '',
                country: product.paisOrigen || ''
            }))
            
            // Limpiar SP info temporalmente (se actualizará después de validar)
            resetSpInfo()
            setIsProductoClasificado(false)
            
            // Validar clasificación del producto (con comparación OpenPO vs SP)
            setTimeout(() => validatePartNumberForOpenPO(product.idProducto, product.um, product.paisOrigen), 100)
        }
    }
    
    // Validar número de parte para OpenPO con comparación de conflictos
    const validatePartNumberForOpenPO = async (partNumber, openPOUm, openPOPais) => {
        if (!partNumber || !idEntrada) return
        
        try {
            setLoadingClasificacion(true)
            const result = await previoService.getClasificacion(idEntrada, partNumber)
            
            // Verificar si la respuesta tiene información útil
            const hasClasificacion = result.clasificacion && result.clasificacion.trim() !== ''
            const hasDescripcion = result.descripcion && result.descripcion.trim() !== ''
            const hasSpInfo = result.isSpum || result.isSppo || result.isSpmms
            const isEmptyResponse = !hasClasificacion && !hasDescripcion && !hasSpInfo
            
            // Si la respuesta está vacía, usar valores del OpenPO
            if (isEmptyResponse) {
                setSpInfo({
                    isSpum: !!openPOUm,
                    spUm: openPOUm,
                    isSppo: !!openPOPais,
                    spPo: openPOPais,
                    isSpmms: false,
                    spMms: ''
                })
                setToast({
                    show: true,
                    message: '⚠️ Producto nuevo detectado. Se usarán los valores del OpenPO.',
                    type: 'warning'
                })
                return
            }
            
            // Actualizar descripción y clasificación
            setFormData(prev => ({
                ...prev,
                description: result.descripcion || prev.description,
                clasificacion: result.clasificacion || ''
            }))
            
            // Detectar conflictos entre OpenPO y Standard Pack
            const conflicts = []
            
            // Conflicto de UM
            if (result.isSpum && result.spUm && openPOUm && result.spUm !== openPOUm) {
                conflicts.push({
                    field: 'unit',
                    label: 'Unidad de Medida',
                    openPOValue: openPOUm,
                    spValue: result.spUm
                })
            }
            
            // Conflicto de País de Origen
            if (result.isSppo && result.spPo && openPOPais && result.spPo !== openPOPais) {
                conflicts.push({
                    field: 'country',
                    label: 'País de Origen',
                    openPOValue: openPOPais,
                    spValue: result.spPo
                })
            }
            
            // Si hay conflictos, mostrar modal
            if (conflicts.length > 0) {
                setConflictModal({
                    show: true,
                    conflicts: conflicts,
                    pendingSpInfo: {
                        isSpum: result.isSpum || false,
                        spUm: result.spUm || '',
                        isSppo: result.isSppo || false,
                        spPo: result.spPo || '',
                        isSpmms: result.isSpmms || false,
                        spMms: result.spMms || ''
                    }
                })
            } else {
                // Sin conflictos, aplicar SP normalmente
                const finalUm = result.isSpum && result.spUm ? result.spUm : openPOUm
                const finalPais = result.isSppo && result.spPo ? result.spPo : openPOPais
                
                setFormData(prev => ({
                    ...prev,
                    unit: finalUm,
                    country: finalPais
                }))
                
                setSpInfo({
                    isSpum: result.isSpum || !!openPOUm,
                    spUm: result.spUm || openPOUm,
                    isSppo: result.isSppo || !!openPOPais,
                    spPo: result.spPo || openPOPais,
                    isSpmms: result.isSpmms || false,
                    spMms: result.spMms || ''
                })
            }
            
            // Validar clasificación
            const isValidClasificacion = result.clasificacion && /^\d{10}$/.test(result.clasificacion)
            setIsProductoClasificado(isValidClasificacion)
            
            if (!isValidClasificacion) {
                setMarcaValida(true) // Resetear validaciones cuando no hay clasificación
                setModeloValido(true)
                setToast({
                    show: true,
                    message: '⚠️ Producto nuevo detectado. Este producto requerirá fotografías.',
                    type: 'warning'
                })
            }
            
            // Alertar si requiere MMS
            if (result.isSpmms) {
                setTimeout(() => {
                    setToast({
                        show: true,
                        message: '📋 Este producto requiere captura de Marca, Modelo y Serie.',
                        type: 'info'
                    })
                }, 2000)
            }
            
        } catch (error) {
            console.error('Error al obtener clasificación:', error)
            // En caso de error, usar valores del OpenPO
            setSpInfo({
                isSpum: !!openPOUm,
                spUm: openPOUm,
                isSppo: !!openPOPais,
                spPo: openPOPais,
                isSpmms: false,
                spMms: ''
            })
        } finally {
            setLoadingClasificacion(false)
            setTimeout(() => quantityRef.current?.focus(), 100)
        }
    }
    
    // Resolver conflicto eligiendo OpenPO o Standard Pack
    const resolveConflict = (useOpenPO) => {
        const { conflicts, pendingSpInfo } = conflictModal
        
        let newUnit = formData.unit
        let newCountry = formData.country
        let newSpInfo = { ...pendingSpInfo }
        
        conflicts.forEach(conflict => {
            if (conflict.field === 'unit') {
                newUnit = useOpenPO ? conflict.openPOValue : conflict.spValue
                if (useOpenPO) {
                    newSpInfo.spUm = conflict.openPOValue
                }
            }
            if (conflict.field === 'country') {
                newCountry = useOpenPO ? conflict.openPOValue : conflict.spValue
                if (useOpenPO) {
                    newSpInfo.spPo = conflict.openPOValue
                }
            }
        })
        
        setFormData(prev => ({
            ...prev,
            unit: newUnit,
            country: newCountry
        }))
        
        setSpInfo(newSpInfo)
        setConflictModal({ show: false, conflicts: [], pendingSpInfo: null })
        
        setToast({
            show: true,
            message: useOpenPO ? '✅ Se usaron los valores del OpenPO' : '✅ Se usaron los valores del Standard Pack',
            type: 'success'
        })
    }

    const validatePartNumber = async () => {
        const partNumber = formData.partNumber.trim()
        
        if (!partNumber) {
            setIsProductoClasificado(false)
            resetSpInfo()
            return
        }

        if (!idEntrada) {
            console.warn('idEntrada no disponible para validar clasificación')
            return
        }

        try {
            setLoadingClasificacion(true)
            setIsProductoClasificado(false)
            resetSpInfo()
            
            const result = await previoService.getClasificacion(idEntrada, partNumber)
            
            // Verificar si la respuesta tiene información útil
            const hasClasificacion = result.clasificacion && result.clasificacion.trim() !== ''
            const hasDescripcion = result.descripcion && result.descripcion.trim() !== ''
            const hasSpInfo = result.isSpum || result.isSppo || result.isSpmms
            const isEmptyResponse = !hasClasificacion && !hasDescripcion && !hasSpInfo

            // Si la respuesta está vacía, limpiar todo
            if (isEmptyResponse) {
                setFormData(prev => ({
                    ...prev,
                    description: '',
                    clasificacion: '',
                    unit: '',
                    subCantidad: '',
                    country: ''
                }))
                resetSpInfo()
                setIsProductoClasificado(false)
                setMarcaValida(true) // Resetear validaciones cuando no hay clasificación
                setModeloValido(true)
                setToast({
                    show: true,
                    message: '⚠️ Producto nuevo detectado. Este producto requerirá fotografías para su clasificación.',
                    type: 'warning'
                })
                return
            }
            
            // Actualizar descripción y clasificación
            setFormData(prev => ({
                ...prev,
                description: result.descripcion || prev.description,
                clasificacion: result.clasificacion || '',
                // Precargar UM si isSpum, si no limpiar
                unit: result.isSpum && result.spUm ? result.spUm : (hasSpInfo ? '' : prev.unit),
                // Precargar País si isSppo, si no limpiar
                country: result.isSppo && result.spPo ? result.spPo : (hasSpInfo ? '' : prev.country)
            }))

            // Guardar info de Standard Pack
            setSpInfo({
                isSpum: result.isSpum || false,
                spUm: result.spUm || '',
                isSppo: result.isSppo || false,
                spPo: result.spPo || '',
                isSpmms: result.isSpmms || false,
                spMms: result.spMms || ''
            })

            // Validar clasificación
            const isValidClasificacion = result.clasificacion && /^\d{10}$/.test(result.clasificacion)
            
            if (isValidClasificacion) {
                setIsProductoClasificado(true)
            } else {
                setIsProductoClasificado(false)
                setToast({
                    show: true,
                    message: '⚠️ Producto nuevo detectado. Este producto requerirá fotografías para su clasificación.',
                    type: 'warning'
                })
            }

            // Alertar si requiere MMS
            if (result.isSpmms) {
                setTimeout(() => {
                    setToast({
                        show: true,
                        message: '📋 Este producto requiere captura de Marca, Modelo y Serie. La cantidad debe coincidir con el número de series.',
                        type: 'info'
                    })
                }, isValidClasificacion ? 0 : 3000)
            }

        } catch (error) {
            console.error('Error al obtener clasificación:', error)
            setIsProductoClasificado(false)
            resetSpInfo()
            setMarcaValida(true) // Resetear validaciones cuando hay error
            setModeloValido(true)
            setToast({
                show: true,
                message: '⚠️ Producto nuevo detectado. Este producto requerirá fotografías para su clasificación.',
                type: 'warning'
            })
        } finally {
            setLoadingClasificacion(false)
            // Mover foco al campo de cantidad después de validar
            setTimeout(() => quantityRef.current?.focus(), 100)
        }
    }

    const resetSpInfo = () => {
        setSpInfo({
            isSpum: false,
            spUm: '',
            isSppo: false,
            spPo: '',
            isSpmms: false,
            spMms: ''
        })
        setMmsEntries([])
    }

    const handlePartNumberBlur = () => {
        validatePartNumber()
    }

    const handlePartNumberKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            validatePartNumber()
        }
    }

    // Handlers para MMS con Enter
    const handleBrandKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            modelRef.current?.focus()
        }
    }

    const handleModelKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            seriesRef.current?.focus()
        }
    }

    const handleSeriesKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addMmsEntry()
        }
    }

    // Validar marca al perder el foco
    const handleBrandBlur = async () => {
        // Solo validar si el producto tiene clasificación y hay marca capturada
        if (!isProductoClasificado || !formData.brand || !formData.brand.trim() || !idEntrada || !formData.partNumber) {
            setMarcaValida(true) // Resetear a válido si no se debe validar
            return
        }

        try {
            setValidandoMarca(true)
            const response = await previoService.validarMarca(
                idEntrada,
                formData.partNumber,
                formData.brand.trim()
            )
            
            // Verificar si la validación falló (valido en minúsculas según respuesta del API)
            const esValido = response.valido === true || response.Valido === true
            
            if (!esValido) {
                setMarcaValida(false)
                setToast({
                    show: true,
                    message: '⚠️ La marca capturada no coincide con la marca registrada en el catálogo',
                    type: 'error'
                })
            } else {
                setMarcaValida(true)
            }
        } catch (error) {
            console.error('Error al validar marca:', error)
            // En caso de error, no bloquear (asumir válido)
            setMarcaValida(true)
        } finally {
            setValidandoMarca(false)
        }
    }

    // Validar modelo al perder el foco
    const handleModelBlur = async () => {
        // Solo validar si el producto tiene clasificación y hay modelo capturado
        if (!isProductoClasificado || !formData.model || !formData.model.trim() || !idEntrada || !formData.partNumber) {
            setModeloValido(true) // Resetear a válido si no se debe validar
            return
        }

        try {
            setValidandoModelo(true)
            const response = await previoService.validarModelo(
                idEntrada,
                formData.partNumber,
                formData.model.trim()
            )
            
            // Verificar si la validación falló (valido en minúsculas según respuesta del API)
            const esValido = response.valido === true || response.Valido === true
            
            if (!esValido) {
                setModeloValido(false)
                setToast({
                    show: true,
                    message: '⚠️ El modelo capturado no coincide con el modelo registrado en el catálogo',
                    type: 'error'
                })
            } else {
                setModeloValido(true)
            }
        } catch (error) {
            console.error('Error al validar modelo:', error)
            // En caso de error, no bloquear (asumir válido)
            setModeloValido(true)
        } finally {
            setValidandoModelo(false)
        }
    }

    const addMmsEntry = () => {
        const series = formData.series.trim()
        const brand = formData.brand.trim()
        const model = formData.model.trim()
        const qty = parseInt(formData.quantity) || 0

        if (!series) {
            setToast({
                show: true,
                message: '⚠️ Ingrese un número de serie.',
                type: 'warning'
            })
            return
        }

        // Validar que no exceda la cantidad
        if (qty > 0 && mmsEntries.length >= qty) {
            setToast({
                show: true,
                message: `⚠️ Ya se capturaron ${qty} serie(s). No puede agregar más series que la cantidad indicada.`,
                type: 'error'
            })
            return
        }

        // Validar que la serie no esté repetida
        const isDuplicate = mmsEntries.some(entry => entry.series.toLowerCase() === series.toLowerCase())
        if (isDuplicate) {
            setToast({
                show: true,
                message: '⚠️ Esta serie ya fue capturada. Las series no se pueden repetir.',
                type: 'error'
            })
            return
        }

        // Agregar entrada
        setMmsEntries(prev => [...prev, {
            brand: brand,
            model: model,
            series: series
        }])

        // Limpiar solo la serie y mantener foco
        setFormData(prev => ({
            ...prev,
            series: ''
        }))
        
        // Mantener foco en serie
        setTimeout(() => seriesRef.current?.focus(), 0)

        setToast({
            show: true,
            message: `✓ Serie "${series}" agregada (${mmsEntries.length + 1} de ${formData.quantity || '?'})`,
            type: 'success'
        })
    }

    const clearMmsFields = () => {
        setFormData(prev => ({
            ...prev,
            brand: '',
            model: '',
            series: ''
        }))
        setTimeout(() => brandRef.current?.focus(), 0)
    }

    const removeMmsEntry = (index) => {
        setMmsEntries(prev => prev.filter((_, i) => i !== index))
    }

    const closeToast = () => {
        setToast(prev => ({ ...prev, show: false }))
    }

    // Resetea el formulario manteniendo el bulto
    const resetFormForNewPartida = () => {
        setFormData(prev => ({
            bulto: prev.bulto,
            partNumber: '',
            physicalPartNumber: '',
            description: '',
            clasificacion: '',
            quantity: '',
            unit: '',
            subCantidad: '',
            country: '',
            brand: '',
            model: '',
            series: '',
            notes: '',
            selectedPO: prev.selectedPO,  // Mantener PO seleccionado en OpenPO
            ocCompra: prev.ocCompra       // Mantener ocCompra en OpenPO
        }))
        setIsProductoClasificado(false)
        resetSpInfo()
        setMmsEntries([])
        setManualPartNumberEnabled(false) // Resetear modo manual en OpenPO
        setMarcaValida(true) // Resetear validaciones
        setModeloValido(true)
        // En OpenPO no hacemos focus en partNumber ya que se selecciona del dropdown
        if (!esOpenPO) {
            setTimeout(() => partNumberRef.current?.focus(), 100)
        }
    }

    // Desbloquea el combo de bulto para permitir cambio
    const unlockBulto = () => {
        setIsBultoLocked(false)
        setIsMultibulto(false)
        setSelectedBultos([])
        handleChange('bulto', '')
    }
    
    // Construye el campo de comentarios incluyendo el número de parte físico si existe
    const buildComentarios = () => {
        const parts = []
        
        if (formData.physicalPartNumber && formData.physicalPartNumber.trim()) {
            parts.push(`[NP Físico: ${formData.physicalPartNumber.trim()}]`)
        }
        
        if (formData.notes && formData.notes.trim()) {
            parts.push(formData.notes.trim())
        }
        
        return parts.join(' ')
    }

    // Construir string MMS en formato: marca1|modelo1|serie1~marca2|modelo2|serie2
    const buildMmsString = () => {
        if (mmsEntries.length === 0) return ''
        
        return mmsEntries
            .map(entry => `${entry.brand || ''}|${entry.model || ''}|${entry.series || ''}`)
            .join('~')
    }

    const handleSubmit = async () => {
        // Validación adicional para MMS
        if (spInfo.isSpmms) {
            const qty = parseInt(formData.quantity) || 0
            if (mmsEntries.length !== qty) {
                setToast({
                    show: true,
                    message: `⚠️ La cantidad (${qty}) debe ser igual al número de series capturadas (${mmsEntries.length}).`,
                    type: 'error'
                })
                return
            }
        }

        if (!isFormValid) return

        try {
            setSavingPartida(true)

            // Obtener usuario del localStorage
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : {}
            const usuario = user.idUsuario || user.usuario || 'unknown'

            // Si estamos editando, usar el endpoint de actualización
            if (isEditing) {
                const updateRequest = {
                    id: parseInt(formData.id) || 0, // El API espera un número
                    idBulto: formData.bulto,
                    referencia: idEntrada,
                    idProducto: formData.partNumber,
                    um: formData.unit,
                    cantidad: String(formData.quantity),
                    subCantidad: formData.unit === 'JGO' ? String(formData.subCantidad || '') : '',
                    paisOrigen: formData.country,
                    comentarios: buildComentarios(),
                    usuario: usuario,
                    ocCompra: formData.ocCompra || '',
                    mms: buildMmsString()
                }

                try {
                    const response = await previoService.actualizarPartida(updateRequest)
                    if (response.estatus) {
                        setToast({
                            show: true,
                            message: `✅ ${response.msg || 'Partida actualizada correctamente'}`,
                            type: 'success'
                        })
                        
                        // Notificar al padre para actualizar la lista y cerrar el formulario
                        if (onPartidaSaved) {
                            onPartidaSaved()
                        }
                        
                        // Cerrar el formulario después de actualizar exitosamente
                        setTimeout(() => {
                            if (onCancel) {
                                onCancel()
                            }
                        }, 500) // Pequeño delay para que el usuario vea el toast
                    } else {
                        setToast({
                            show: true,
                            message: `❌ ${response.msg || 'Error al actualizar la partida'}`,
                            type: 'error'
                        })
                    }
                } catch (err) {
                    setToast({
                        show: true,
                        message: `❌ Error al actualizar: ${err.message || err}`,
                        type: 'error'
                    })
                }
                
                setSavingPartida(false)
                return
            }

            // Modo creación normal
            // Determinar los bultos a procesar
            const bultosToProcess = isMultibulto ? selectedBultos : [formData.bulto]
            
            let successCount = 0
            let errorMessages = []

            // Registrar partida en cada bulto
            for (const bulto of bultosToProcess) {
                // Preparar el request para el API
                const request = {
                    idBulto: bulto,
                    referencia: idEntrada,
                    idProducto: formData.partNumber,
                    um: formData.unit,
                    cantidad: String(formData.quantity),
                    subCantidad: formData.unit === 'JGO' ? String(formData.subCantidad || '') : '',
                    paisOrigen: formData.country,
                    comentarios: buildComentarios(),
                    usuario: usuario,
                    ocCompra: formData.ocCompra || '',
                    mms: buildMmsString() // marca1|modelo1|serie1~marca2|modelo2|serie2
                }

                try {
                    const response = await previoService.registrarPartida(request)
                    if (response.estatus) {
                        successCount++
                    } else {
                        errorMessages.push(`Bulto ${bulto}: ${response.msg || 'Error'}`)
                    }
                } catch (err) {
                    errorMessages.push(`Bulto ${bulto}: ${err.message || 'Error de conexión'}`)
                }
            }

            // Mostrar resultados
            if (successCount === bultosToProcess.length) {
                // Todos exitosos
                setPartidasCount(prev => prev + successCount)
                
                const message = isMultibulto 
                    ? `✅ Partida registrada en ${successCount} bulto${successCount !== 1 ? 's' : ''}`
                    : '✅ Partida guardada correctamente'
                
                setToast({
                    show: true,
                    message: message,
                    type: 'success'
                })
                
                // Si es OpenPO y no es captura manual, descontar el producto del listado
                if (esOpenPO && !manualPartNumberEnabled && formData.partNumber) {
                    const savedPartNumber = formData.partNumber
                    const savedPO = formData.selectedPO
                    
                    // Eliminar el producto de availablePOData
                    setAvailablePOData(prev => {
                        const updated = prev.filter(p => p.idProducto !== savedPartNumber)
                        
                        // Verificar si el PO aún tiene productos
                        const remainingProductsInPO = updated.filter(p => p.po === savedPO)
                        
                        // Si el PO ya no tiene productos, limpiar la selección
                        if (remainingProductsInPO.length === 0) {
                            setFormData(f => ({ ...f, selectedPO: '', ocCompra: '' }))
                            setSelectedPOProducts([])
                        } else {
                            // Actualizar la lista de productos del PO seleccionado
                            setSelectedPOProducts(remainingProductsInPO)
                        }
                        
                        return updated
                    })
                }

                // Limpiar formulario y poner foco en número de parte
                resetFormForNewPartida()
                
                // Notificar al padre para actualizar la lista de partidas
                if (onPartidaSaved) {
                    onPartidaSaved()
                }
            } else if (successCount > 0) {
                // Algunos exitosos, algunos fallidos
                setPartidasCount(prev => prev + successCount)
                setToast({
                    show: true,
                    message: `⚠️ ${successCount} de ${bultosToProcess.length} registrados. Errores: ${errorMessages.join(', ')}`,
                    type: 'warning'
                })
                resetFormForNewPartida()
                if (onPartidaSaved) {
                    onPartidaSaved()
                }
            } else {
                // Todos fallidos
                setToast({
                    show: true,
                    message: `❌ ${errorMessages.join(', ')}`,
                    type: 'error'
                })
            }
        } catch (error) {
            console.error('Error al registrar partida:', error)
            setToast({
                show: true,
                message: `❌ Error al guardar: ${error.message || error}`,
                type: 'error'
            })
        } finally {
            setSavingPartida(false)
        }
    }

    // Estilos para campos con Standard Pack sugerido
    const getSuccessStyle = (isActive) => isActive ? {
        borderColor: '#198754',
        boxShadow: '0 0 0 0.2rem rgba(25, 135, 84, 0.15)',
        backgroundColor: '#f8fff8'
    } : {}

    return (
        <div className="card oc-light-card h-100 d-flex flex-column p-4" style={{ border: 'none', boxShadow: 'none' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold m-0">
                        {isEditing ? 'Editar Partida' : 'Agregar partidas'}
                    </h4>
                    {isEditing && (
                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-pencil me-1"></i>
                            ID: {formData.id}
                        </span>
                    )}
                </div>
                <button className="btn btn-link text-dark p-0" onClick={onCancel} style={{ cursor: 'pointer' }}>
                    <i className="bi bi-x-lg" style={{ fontSize: '1.2rem' }}></i>
                </button>
            </div>

            <div className="flex-grow-1 overflow-y-auto overflow-x-hidden pe-2 custom-scrollbar">
                {/* Checkbox Multibulto */}
                {!isBultoLocked && (
                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="multibultoCheck"
                                checked={isMultibulto}
                                onChange={(e) => {
                                    setIsMultibulto(e.target.checked)
                                    // Limpiar selecciones al cambiar modo
                                    if (e.target.checked) {
                                        handleChange('bulto', '')
                                        setSelectedBultos([])
                                    } else {
                                        setSelectedBultos([])
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label" htmlFor="multibultoCheck" style={{ cursor: 'pointer' }}>
                                <i className="bi bi-boxes me-1"></i>
                                Multibulto
                                <span className="text-muted ms-1" style={{ fontSize: '0.8rem' }}>
                                    (aplicar a varios bultos)
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <label className="form-label fw-bold">
                        {isMultibulto ? 'Bultos *' : 'Bulto *'}
                        {isBultoLocked && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-lock-fill me-1"></i>Bloqueado
                            </span>
                        )}
                        {isMultibulto && selectedBultos.length > 0 && (
                            <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                                {selectedBultos.length} seleccionado{selectedBultos.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </label>
                    <div className="d-flex gap-2">
                        <div className="flex-grow-1">
                            {isMultibulto ? (
                                <CustomDropdown
                                    options={bultosOptions}
                                    label="Seleccione bultos"
                                    searchPlaceholder="Buscar bulto..."
                                    onSelect={(vals) => {
                                        setSelectedBultos(vals)
                                        // Usar el primer bulto como valor principal
                                        handleChange('bulto', vals.length > 0 ? vals[0] : '')
                                        if (vals.length > 0) {
                                            setIsBultoLocked(true)
                                            setPartidasCount(0)
                                            setTimeout(() => partNumberRef.current?.focus(), 100)
                                        }
                                    }}
                                    initialSelection={selectedBultos}
                                    fullWidth={true}
                                    disabled={isBultoLocked}
                                />
                            ) : (
                                <SingleSelectDropdown
                                    options={bultosOptions}
                                    label="Seleccione un bulto"
                                    onSelect={(val) => {
                                        handleChange('bulto', val)
                                        setIsBultoLocked(true)
                                        setPartidasCount(0)
                                        // Mover foco al número de parte después de seleccionar bulto
                                        setTimeout(() => partNumberRef.current?.focus(), 100)
                                    }}
                                    initialSelection={formData.bulto}
                                    disabled={isBultoLocked}
                                />
                            )}
                        </div>
                        {isBultoLocked && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={unlockBulto}
                                title="Cambiar bulto"
                                style={{ cursor: 'pointer', height: '45px', width: '45px', borderRadius: '12px' }}
                            >
                                <i className="bi bi-arrow-repeat"></i>
                            </button>
                        )}
                    </div>
                    {!isMultibulto && formData.bulto && (
                        <div className="form-text text-muted mt-1">
                            {partidasCount} partida{partidasCount !== 1 ? 's' : ''} agregada{partidasCount !== 1 ? 's' : ''} a este bulto
                        </div>
                    )}
                    {isMultibulto && selectedBultos.length > 0 && (
                        <div className="form-text text-info mt-1">
                            <i className="bi bi-info-circle me-1"></i>
                            La partida se registrará en {selectedBultos.length} bulto{selectedBultos.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {isBultoLocked && (
                    <>
                        {/* Selectores de OpenPO - solo si hay POs disponibles */}
                        {esOpenPO && poOptions.length > 0 && (
                            <>
                                {/* Selector de PO */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-file-text me-1"></i>
                                        Orden de Compra (PO) *
                                        <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                                            OpenPO
                                        </span>
                                    </label>
                                    <SingleSelectDropdown
                                        options={poOptions}
                                        label="Seleccione un PO"
                                        onSelect={handlePOSelect}
                                        initialSelection={formData.selectedPO}
                                    />
                                </div>

                                {/* Selector de Producto del PO */}
                                {formData.selectedPO && selectedPOProducts.length > 0 && !manualPartNumberEnabled && (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="bi bi-box-seam me-1"></i>
                                            Producto del PO *
                                        </label>
                                        <div className="d-flex gap-2">
                                            <div className="flex-grow-1">
                                                <SingleSelectDropdown
                                                    options={selectedPOProducts.map(p => `${p.idProducto} - ${p.descripcion?.substring(0, 30) || ''}...`)}
                                                    label="Seleccione un producto"
                                                    onSelect={(val) => {
                                                        // Extraer idProducto del valor seleccionado
                                                        const idProducto = val.split(' - ')[0]
                                                        handlePOProductSelect(idProducto)
                                                    }}
                                                    initialSelection={formData.partNumber ? `${formData.partNumber} - ${formData.description?.substring(0, 30) || ''}...` : ''}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => {
                                                    setManualPartNumberEnabled(true)
                                                    setFormData(prev => ({ ...prev, partNumber: '', description: '' }))
                                                    resetSpInfo()
                                                    setIsProductoClasificado(false)
                                                    setTimeout(() => partNumberRef.current?.focus(), 100)
                                                }}
                                                title="Capturar número de parte manualmente"
                                                style={{ cursor: 'pointer', height: '45px', width: '45px', borderRadius: '12px' }}
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                        </div>
                                        <div className="form-text text-muted mt-1">
                                            <i className="bi bi-info-circle me-1"></i>
                                            {selectedPOProducts.length} producto(s) disponible(s) en este PO
                                        </div>
                                    </div>
                                )}
                                
                                {/* Mensaje cuando captura manual está habilitada */}
                                {formData.selectedPO && manualPartNumberEnabled && (
                                    <div className="alert alert-info py-2 px-3 mb-3 d-flex justify-content-between align-items-center" style={{ fontSize: '0.85rem' }}>
                                        <span>
                                            <i className="bi bi-pencil me-1"></i>
                                            Modo de captura manual habilitado
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => {
                                                setManualPartNumberEnabled(false)
                                                setFormData(prev => ({ ...prev, partNumber: '', description: '', quantity: '', unit: '', subCantidad: '', country: '' }))
                                                resetSpInfo()
                                                setIsProductoClasificado(false)
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <i className="bi bi-arrow-left me-1"></i>
                                            Volver a lista
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Mensaje cuando es OpenPO pero ya no hay POs disponibles */}
                        {esOpenPO && poOptions.length === 0 && (
                            <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>
                                <i className="bi bi-check-circle me-1"></i>
                                Todos los productos del OpenPO han sido capturados. Puede continuar con captura manual.
                            </div>
                        )}

                        {/* Número de Parte */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">Número de Parte *</label>
                            <div className="position-relative">
                            <input
                                    ref={partNumberRef}
                                type="text"
                                    className={`form-control oc-input ${isProductoClasificado ? 'is-valid' : ''}`}
                                value={formData.partNumber}
                                    onChange={(e) => {
                                        handleChange('partNumber', e.target.value.toUpperCase())
                                        setIsProductoClasificado(false)
                                        resetSpInfo()
                                        setMarcaValida(true) // Resetear validaciones
                                        setModeloValido(true)
                                    }}
                                    onBlur={handlePartNumberBlur}
                                    onKeyDown={handlePartNumberKeyDown}
                                    disabled={loadingClasificacion || (esOpenPO && poOptions.length > 0 && !manualPartNumberEnabled && formData.partNumber)}
                                    style={isProductoClasificado ? getSuccessStyle(true) : {}}
                                />
                                {loadingClasificacion && (
                                    <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                        <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                            <span className="visually-hidden">Validando...</span>
                                        </div>
                                    </div>
                                )}
                                {isProductoClasificado && !loadingClasificacion && (
                                    <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '18px' }}></i>
                                    </div>
                                )}
                            </div>
                            {formData.clasificacion && (
                                <div className={`form-text mt-1 ${isProductoClasificado ? 'text-success' : 'text-muted'}`}>
                                    {isProductoClasificado && <i className="bi bi-check-circle-fill me-1"></i>}
                                    Clasificación: {formData.clasificacion}
                                    {isProductoClasificado && <span className="ms-2 badge bg-success">Producto Clasificado</span>}
                                </div>
                            )}
                        </div>

                        {/* Número de Parte Físico */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">
                                Número de Parte Físico
                                <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.8rem' }}>(opcional)</span>
                            </label>
                            <input
                                type="text"
                                className="form-control oc-input"
                                placeholder="Si difiere del número de parte del sistema"
                                value={formData.physicalPartNumber}
                                onChange={(e) => handleChange('physicalPartNumber', e.target.value.toUpperCase())}
                            />
                            {formData.physicalPartNumber && (
                                <div className="form-text text-info mt-1">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Este valor se agregará a las notas internas
                                </div>
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">Descripción *</label>
                            <textarea
                                className="form-control oc-input"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value.toUpperCase())}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        {/* Cantidad y Unidad */}
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Cantidad Recibida *</label>
                                <input
                                    ref={quantityRef}
                                    type="number"
                                    className="form-control oc-input"
                                    value={formData.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                />
                                {formData.quantity && (
                                    <div className="form-text text-muted mt-1 fw-bold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        <i className="bi bi-chat-quote me-1"></i>
                                        {numeroALetras(formData.quantity)}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">
                                    Unidad *
                                    {spInfo.isSpum && (
                                        <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                            <i className="bi bi-box-seam me-1"></i>SP
                                        </span>
                                    )}
                                </label>
                                <div style={getSuccessStyle(spInfo.isSpum)}>
                                <SingleSelectDropdown
                                    options={unitOptions}
                                    label="Seleccione una unidad"
                                    onSelect={(val) => handleChange('unit', getValue(val, catalogUnidades))}
                                    initialSelection={getLabel(formData.unit, catalogUnidades)}
                                />
                                </div>
                                {spInfo.isSpum && (
                                    <div className="form-text text-success mt-1">
                                        <i className="bi bi-check-circle me-1"></i>UM sugerida por Standard Pack
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sub Cantidad - Solo visible cuando la unidad es JGO */}
                        {formData.unit === 'JGO' && (
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Sub Cantidad *</label>
                                    <input
                                        type="number"
                                        className="form-control oc-input"
                                        value={formData.subCantidad}
                                        onChange={(e) => handleChange('subCantidad', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* País de Origen */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">
                                País de Origen *
                                {spInfo.isSppo && (
                                    <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                        <i className="bi bi-globe me-1"></i>SP
                                    </span>
                                )}
                            </label>
                            <div style={getSuccessStyle(spInfo.isSppo)}>
                            <SingleSelectDropdown
                                options={countryOptions}
                                label="Seleccione un país"
                                onSelect={(val) => handleChange('country', getValue(val, catalogPaises))}
                                initialSelection={getLabel(formData.country, catalogPaises)}
                            />
                            </div>
                            {spInfo.isSppo && (
                                <div className="form-text text-success mt-1">
                                    <i className="bi bi-check-circle me-1"></i>País sugerido por Standard Pack
                                </div>
                            )}
                        </div>

                        {/* Marca, Modelo y Serie */}
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="form-label fw-bold mb-0">
                                        Marca, Modelo y Serie
                                        {spInfo.isSpmms && (
                                            <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                                                <i className="bi bi-exclamation-triangle me-1"></i>Requerido
                                            </span>
                                        )}
                                    </label>
                                    {spInfo.isSpmms && formData.quantity && (
                                        <span className={`badge ${mmsEntries.length === parseInt(formData.quantity) ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.8rem' }}>
                                            <i className={`bi ${mmsEntries.length === parseInt(formData.quantity) ? 'bi-check-circle' : 'bi-list-ol'} me-1`}></i>
                                            {mmsEntries.length} / {formData.quantity}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={clearMmsFields}
                                    title="Limpiar campos"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className="bi bi-eraser"></i>
                                </button>
                            </div>

                            {spInfo.isSpmms && (
                                <div className="alert alert-warning py-2 mb-2" style={{ fontSize: '0.85rem' }}>
                                    <i className="bi bi-info-circle me-2"></i>
                                    Este producto requiere MMS. Capture {formData.quantity || '?'} serie(s).
                                    <br />
                                    <small className="text-muted">Marca → Enter → Modelo → Enter → Serie → Enter (guarda)</small>
                                </div>
                            )}

                            <div className="row g-2">
                                <div className="col-md-12">
                                    <div className="position-relative">
                                        <input
                                            ref={brandRef}
                                            type="text"
                                            className={`form-control oc-input mb-2 ${isProductoClasificado && !marcaValida ? 'is-invalid' : ''} ${isProductoClasificado && marcaValida && formData.brand ? 'is-valid' : ''}`}
                                            placeholder="Marca"
                                            value={formData.brand}
                                            onChange={(e) => {
                                                handleChange('brand', e.target.value.toUpperCase())
                                                // Resetear validación al cambiar
                                                if (!marcaValida) {
                                                    setMarcaValida(true)
                                                }
                                            }}
                                            onBlur={handleBrandBlur}
                                            onKeyDown={handleBrandKeyDown}
                                            disabled={validandoMarca}
                                        />
                                        {validandoMarca && (
                                            <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                                    <span className="visually-hidden">Validando...</span>
                                                </div>
                                            </div>
                                        )}
                                        {isProductoClasificado && marcaValida && formData.brand && !validandoMarca && (
                                            <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '18px' }}></i>
                                            </div>
                                        )}
                                        {isProductoClasificado && !marcaValida && !validandoMarca && (
                                            <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '18px' }}></i>
                                            </div>
                                        )}
                                    </div>
                                    {isProductoClasificado && !marcaValida && formData.brand && (
                                        <div className="form-text text-danger mt-1">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            La marca capturada no coincide con la marca registrada en el catálogo
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <div className="position-relative">
                                        <input
                                            ref={modelRef}
                                            type="text"
                                            className={`form-control oc-input ${isProductoClasificado && !modeloValido ? 'is-invalid' : ''} ${isProductoClasificado && modeloValido && formData.model ? 'is-valid' : ''}`}
                                            placeholder="Modelo"
                                            value={formData.model}
                                            onChange={(e) => {
                                                handleChange('model', e.target.value.toUpperCase())
                                                // Resetear validación al cambiar
                                                if (!modeloValido) {
                                                    setModeloValido(true)
                                                }
                                            }}
                                            onBlur={handleModelBlur}
                                            onKeyDown={handleModelKeyDown}
                                            disabled={validandoModelo}
                                        />
                                        {validandoModelo && (
                                            <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                                    <span className="visually-hidden">Validando...</span>
                                                </div>
                                            </div>
                                        )}
                                        {isProductoClasificado && modeloValido && formData.model && !validandoModelo && (
                                            <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '18px' }}></i>
                                            </div>
                                        )}
                                        {isProductoClasificado && !modeloValido && !validandoModelo && (
                                            <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '18px' }}></i>
                                            </div>
                                        )}
                                    </div>
                                    {isProductoClasificado && !modeloValido && formData.model && (
                                        <div className="form-text text-danger mt-1">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            El modelo capturado no coincide con el modelo registrado en el catálogo
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    {(() => {
                                        const qty = parseInt(formData.quantity) || 0
                                        const isMaxReached = qty > 0 && mmsEntries.length >= qty
                                        return (
                                            <div className="input-group">
                                                <input
                                                    ref={seriesRef}
                                                    type="text"
                                                    className={`form-control oc-input ${isMaxReached ? 'bg-light' : ''}`}
                                                    placeholder={isMaxReached ? 'Máximo alcanzado' : 'Serie'}
                                                    value={formData.series}
                                                    onChange={(e) => handleChange('series', e.target.value.toUpperCase())}
                                                    onKeyDown={handleSeriesKeyDown}
                                                    disabled={isMaxReached}
                                                />
                                                <button
                                                    type="button"
                                                    className={`btn ${isMaxReached ? 'btn-secondary' : 'btn-outline-success'}`}
                                                    onClick={addMmsEntry}
                                                    title={isMaxReached ? 'Máximo de series alcanzado' : 'Agregar serie (Enter)'}
                                                    style={{ cursor: isMaxReached ? 'not-allowed' : 'pointer' }}
                                                    disabled={isMaxReached}
                                                >
                                                    <i className={`bi ${isMaxReached ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                                                </button>
                                            </div>
                                        )
                                    })()}
                            </div>
                        </div>

                            {/* Lista de series capturadas */}
                            {mmsEntries.length > 0 && (
                                <div className="mt-3">
                                    <small className="text-muted fw-bold">Series capturadas ({mmsEntries.length}):</small>
                                    <div className="mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        {mmsEntries.map((entry, index) => (
                                            <div 
                                                key={index} 
                                                className="d-flex justify-content-between align-items-center p-2 mb-1 rounded"
                                                style={{ backgroundColor: '#f8f9fa', fontSize: '0.85rem' }}
                                            >
                                                <div>
                                                    <span className="badge bg-secondary me-2">{index + 1}</span>
                                                    {entry.brand && <span className="me-2"><strong>M:</strong> {entry.brand}</span>}
                                                    {entry.model && <span className="me-2"><strong>Mod:</strong> {entry.model}</span>}
                                                    <span><strong>S:</strong> {entry.series}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger p-0 px-1"
                                                    onClick={() => removeMmsEntry(index)}
                                                    title="Eliminar"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <i className="bi bi-x"></i>
                            </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notas Internas */}
                        <div className="mb-4">
                            <label className="form-label fw-bold">Notas Internas</label>
                            <textarea
                                className="form-control oc-input"
                                rows="3"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value.toUpperCase())}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>
                    </>
                )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                {isBultoLocked && (
                    <>
                        <button
                            className="btn btn-outline-primary"
                            onClick={onCancel}
                            disabled={savingPartida}
                            style={{
                                borderColor: '#E9E8E2',
                                color: '#292929',
                                backgroundColor: '#F8F7F5',
                                border: '1px solid #E9E8E2',
                                cursor: savingPartida ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <SpecialBtn
                            onClick={handleSubmit}
                            disabled={!isFormValid || savingPartida}
                            label={savingPartida ? 'Guardando...' : (isEditing ? 'Actualizar Partida' : 'Guardar y Agregar Otra')}
                        />
                    </>
                )}
            </div>

            <Toast 
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />
            
            {/* Modal de conflicto OpenPO vs Standard Pack */}
            {conflictModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                                    Conflicto de Valores
                                </h5>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">
                                    Se detectaron diferencias entre los valores del <strong>OpenPO</strong> y el <strong>Standard Pack</strong>. 
                                    Seleccione cuál desea usar:
                                </p>
                                
                                {conflictModal.conflicts.map((conflict, index) => (
                                    <div key={index} className="card mb-2" style={{ backgroundColor: '#f8f9fa' }}>
                                        <div className="card-body py-2 px-3">
                                            <div className="fw-bold mb-2">{conflict.label}</div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="text-center flex-fill">
                                                    <small className="text-muted d-block">OpenPO</small>
                                                    <span className="badge bg-info" style={{ fontSize: '0.9rem' }}>
                                                        {conflict.openPOValue}
                                                    </span>
                                                </div>
                                                <div className="px-2">
                                                    <i className="bi bi-arrow-left-right text-muted"></i>
                                                </div>
                                                <div className="text-center flex-fill">
                                                    <small className="text-muted d-block">Standard Pack</small>
                                                    <span className="badge bg-success" style={{ fontSize: '0.9rem' }}>
                                                        {conflict.spValue}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-info"
                                    onClick={() => resolveConflict(true)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className="bi bi-file-text me-1"></i>
                                    Usar OpenPO
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={() => resolveConflict(false)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className="bi bi-box-seam me-1"></i>
                                    Usar Standard Pack
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AddPartidasForm
