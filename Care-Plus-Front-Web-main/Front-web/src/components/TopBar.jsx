import { useCare } from '../services/CareContext.jsx'
import { useNavigate } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import { FaTrophy } from 'react-icons/fa';

const TopBar = ({ showPoints = true }) => {

  const { data, error } = useCare()
  const points = data?.usuario?.trofeus || 0
  const navigate = useNavigate()

  return (
    <header className="flex justify-between items-center px-3 py-2 bg-white border-b border-brand-gray">
      <div>
        {showPoints && (
          <span className="flex items-center gap-1 bg-brand-gray-100 rounded-full px-3 py-1">
            <FaTrophy size={18} className="text-brand-primary" />
            <span className="font-bold text-sm">
              {points.toLocaleString('pt-BR')}
            </span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showPoints && data?.demo && <span className="text-xs font-bold text-brand-primary">Demonstração</span>}
        {showPoints && error && <span role="status" className="text-xs text-red-700">Sem atualização</span>}
        {showPoints && data?.sos && <button onClick={() => navigate('/connect')} className="text-red-700 font-bold">SOS ativo</button>}
        <button aria-label="Aumentar texto" onClick={() => { document.documentElement.style.zoom = document.documentElement.style.zoom ? '' : '1.15' }} className="bg-transparent border-none p-0 font-bold text-brand-muted">
          A+
        </button>
        <button aria-label="Ver conexão e alertas" onClick={() => navigate(localStorage.getItem('token') ? '/connect' : '/login')} className="bg-transparent border-none p-0 text-brand-muted">
          <FiBell size={20} />
        </button>
      </div>
    </header>
  )
}

export default TopBar
