import { CareProvider } from './services/CareContext.jsx'
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import Home from './routes/Home'
import LGPD from './routes/LGPD'
import Onboarding from './routes/Onboarding'
import Cadastro from './routes/Cadastro'
import Login from './routes/Login'
import Inicial from './routes/Inicial'
import Missoes from './routes/Missoes'
import Ranking from './routes/Ranking'
import Impulso from './routes/Impulso'
import Beneficios from './routes/Beneficios'
import Mind from './routes/Mind'
import Connect from './routes/Connect'
import Scan from './routes/Scan'
import Noticias from './routes/Noticias'
import Perfil from './routes/Perfil'
import FeiraAdmin from './routes/FeiraAdmin'

const RequireAuth = ({ children }) => {
  const carteirinha = localStorage.getItem('carteirinha')

  if (!carteirinha || !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />
  }

  return children
}

const App = () => {
  return (
    <CareProvider><Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lgpd" element={<LGPD />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inicial" element={<RequireAuth><Inicial /></RequireAuth>} />
        <Route path="/missoes" element={<RequireAuth><Missoes /></RequireAuth>} />
        <Route path="/ranking" element={<RequireAuth><Ranking /></RequireAuth>} />
        <Route path="/impulso" element={<RequireAuth><Impulso /></RequireAuth>} />
        <Route path="/beneficios" element={<RequireAuth><Beneficios /></RequireAuth>} />
        <Route path="/mind" element={<RequireAuth><Mind /></RequireAuth>} />
        <Route path="/connect" element={<RequireAuth><Connect /></RequireAuth>} />
        <Route path="/feira" element={<RequireAuth><FeiraAdmin /></RequireAuth>} />
        <Route path="/scan" element={<RequireAuth><Scan /></RequireAuth>} />
        <Route path="/noticias" element={<RequireAuth><Noticias /></RequireAuth>} />
        <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />

      </Routes>
    </Router></CareProvider>
  )
}

export default App
