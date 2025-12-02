import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { calificacionesApi } from '../services/api';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

/**
 * Modal para que el beneficiario califique al técnico después de cerrar una incidencia
 */
export function CalificacionModal({ 
  open, 
  onClose, 
  incidencia, 
  tecnico,
  onCalificacionCreada 
}) {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🟣 CalificacionModal - Render');
  console.log('🟣 open:', open);
  console.log('🟣 incidencia:', incidencia);
  console.log('🟣 tecnico:', tecnico);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (calificacion === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await calificacionesApi.crear({
        id_incidencia: incidencia.id_incidencia,
        id_tecnico: tecnico.uid,
        calificacion,
        comentario: comentario.trim() || null
      });

      if (onCalificacionCreada) {
        onCalificacionCreada(response.data);
      }

      // Resetear formulario
      setCalificacion(0);
      setComentario('');
      onClose();
    } catch (error) {
      console.error('Error creando calificación:', error);
      setError(error.message || 'Error al enviar la calificación');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCalificacion(0);
    setComentario('');
    setError('');
    onClose();
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isSelected = i <= calificacion;
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setCalificacion(i)}
          className={`p-1 transition-colors duration-200 ${
            isSelected 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-300'
          }`}
          title={`${i} estrella${i > 1 ? 's' : ''}`}
        >
          {isSelected ? (
            <StarIcon className="w-8 h-8" />
          ) : (
            <StarOutlineIcon className="w-8 h-8" />
          )}
        </button>
      );
    }
    return stars;
  };

  const getCalificacionTexto = () => {
    switch (calificacion) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return 'Excelente';
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleCancel}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Calificar al técnico
        </h2>
        
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¿Cómo calificarías el servicio?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Técnico: <span className="font-medium">{tecnico?.nombre}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Incidencia: {incidencia?.categoria}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Calificación con estrellas */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Calificación
            </label>
            <div className="flex justify-center items-center space-x-1">
              {renderStars()}
            </div>
            {calificacion > 0 && (
              <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {getCalificacionTexto()}
              </p>
            )}
          </div>

          {/* Comentario opcional */}
          <div>
            <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              rows={4}
              className="input resize-none"
              placeholder="Comparte tu experiencia con el servicio del técnico..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comentario.length}/500 caracteres
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={loading || calificacion === 0}
            >
              {loading ? 'Enviando...' : 'Enviar calificación'}
            </button>
          </div>
        </form>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            Tu calificación ayuda a mejorar la calidad del servicio y reconoce el buen trabajo de nuestros técnicos.
          </p>
        </div>
      </div>
      </div>
    </Modal>
  );
}

export default CalificacionModal;