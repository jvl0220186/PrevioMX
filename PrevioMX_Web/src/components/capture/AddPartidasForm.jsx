import React, { useState, useEffect } from 'react'
import SingleSelectDropdown from '../common/SingleSelectDropdown'
import SpecialBtn from '../common/SpecialBtn'

const AddPartidasForm = ({ onCancel, onSave, catalogUnidades = [], catalogPaises = [], bultosAvailable = [] }) => {
    const [formData, setFormData] = useState({
        bulto: '',
        partNumber: '',
        description: '',
        quantity: '',
        unit: '',
        country: '',
        brand: '',
        model: '',
        series: '',
        notes: ''
    })

    const [isFormValid, setIsFormValid] = useState(false)

    const bultosOptions = bultosAvailable.length > 0 ? bultosAvailable : []

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

    useEffect(() => {
        const requiredFields = ['bulto', 'partNumber', 'description', 'quantity', 'unit', 'country']
        const isValid = requiredFields.every(field => formData[field] && formData[field].trim() !== '')
        setIsFormValid(isValid)
    }, [formData])

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = () => {
        if (isFormValid) {
            onSave(formData)
        }
    }

    return (
        <div className="card oc-light-card h-100 d-flex flex-column p-4" style={{ border: 'none', boxShadow: 'none' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0">Agregar partidas</h4>
                <button className="btn btn-link text-dark p-0" onClick={onCancel}>
                    <i className="bi bi-x-lg" style={{ fontSize: '1.2rem' }}></i>
                </button>
            </div>

            <div className="flex-grow-1 overflow-y-auto overflow-x-hidden pe-2 custom-scrollbar">
                <div className="mb-4">
                    <label className="form-label fw-bold">Bulto *</label>
                    <SingleSelectDropdown
                        options={bultosOptions}
                        label="Seleccione un bulto"
                        onSelect={(val) => handleChange('bulto', val)}
                        initialSelection={formData.bulto}
                    />
                    {formData.bulto && (
                        <div className="form-text text-muted mt-1">
                            0 partidas agregadas a este bulto
                        </div>
                    )}
                </div>

                {formData.bulto && (
                    <>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Número de Parte *</label>
                            <input
                                type="text"
                                className="form-control oc-input"
                                value={formData.partNumber}
                                onChange={(e) => handleChange('partNumber', e.target.value)}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold">Descripción *</label>
                            <textarea
                                className="form-control oc-input"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Cantidad Recibida *</label>
                                <input
                                    type="number"
                                    className="form-control oc-input"
                                    value={formData.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Unidad *</label>
                                <SingleSelectDropdown
                                    options={unitOptions}
                                    label="Seleccione una unidad"
                                    onSelect={(val) => handleChange('unit', getValue(val, catalogUnidades))}
                                    initialSelection={getLabel(formData.unit, catalogUnidades)}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold">País de Origen *</label>
                            <SingleSelectDropdown
                                options={countryOptions}
                                label="Seleccione un país"
                                onSelect={(val) => handleChange('country', getValue(val, catalogPaises))}
                                initialSelection={getLabel(formData.country, catalogPaises)}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold">Marca, Modelo y Serie</label>
                            <div className="row g-2">
                                <div className="col-md-12">
                                    <input
                                        type="text"
                                        className="form-control oc-input mb-2"
                                        placeholder="Marca"
                                        value={formData.brand}
                                        onChange={(e) => handleChange('brand', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <input
                                        type="text"
                                        className="form-control oc-input"
                                        placeholder="Serie"
                                        value={formData.series}
                                        onChange={(e) => handleChange('series', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <input
                                        type="text"
                                        className="form-control oc-input"
                                        placeholder="Modelo"
                                        value={formData.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <button className="btn btn-light w-100 text-start" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}>
                                + Agregar otro conjunto
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Notas Internas</label>
                            <textarea
                                className="form-control oc-input"
                                rows="3"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>
                    </>
                )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                {formData.bulto && (
                    <>
                        <button
                            className="btn btn-outline-primary"
                            onClick={onCancel}
                            style={{
                                borderColor: '#E9E8E2',
                                color: '#292929',
                                backgroundColor: '#F8F7F5',
                                border: '1px solid #E9E8E2'
                            }}
                        >
                            Cancelar
                        </button>
                        <SpecialBtn
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                            label="Guardar y Agregar Otra"
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default AddPartidasForm
