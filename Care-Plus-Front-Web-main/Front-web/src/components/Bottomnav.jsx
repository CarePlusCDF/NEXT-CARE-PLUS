import { useNavigate } from 'react-router-dom'
import { FiHome, FiUsers, FiDollarSign, FiCheckSquare, FiMenu } from 'react-icons/fi'

const Bottomnav = ({ activePage = 'home' }) => {

  const navigate = useNavigate()
  const navItems = [
    { id: 'home', label: 'Home', icon: FiHome, path: localStorage.getItem('token') ? '/inicial' : '/' },
    { id: 'rede', label: 'Rede', icon: FiUsers },
    { id: 'reembolsos', label: 'Reembolsos', icon: FiDollarSign },
    { id: 'autorizacoes', label: 'Autorizações', icon: FiCheckSquare },
    { id: 'mais', label: 'Mais', icon: FiMenu, path: '/perfil' },
  ]

  return (
    <nav className="flex justify-around items-center bg-white border-t border-brand-gray py-2 fixed bottom-0 left-0 right-0 z-50">
      {navItems.map(({ id, label, icon: Icon, path }) => (
        <button
          type="button"
          onClick={() => path && navigate(path)}
          disabled={!path}
          title={!path ? "Serviço ilustrativo, sem integração" : label}
          aria-label={!path ? `${label} (ilustrativo)` : label}
          key={id}
          className="flex flex-col items-center min-w-[44px]"
          style={{ color: activePage === id ? '#1c9770' : '#9BA3AE' }}
        >
          <Icon size={22} />
          <span className="text-[11px] mt-[2px]">{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default Bottomnav
