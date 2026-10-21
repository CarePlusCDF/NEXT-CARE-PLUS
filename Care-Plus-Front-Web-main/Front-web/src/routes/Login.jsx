import { apiFetch } from '../services/api.js'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiLogIn, FiUser } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import { API_URL, salvarSessaoUsuario } from '../services/sessao.js'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    senha: '',
    carteirinha: '',
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const isFormValid =
    formData.senha.length >= 8 &&
    formData.carteirinha.trim() !== ''

  function handleChange(field, value) {
    setErro('')
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!isFormValid || carregando) return

    setCarregando(true)
    setErro('')

    try {
      const resposta = await apiFetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senha: formData.senha,
          carteirinha: formData.carteirinha,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.detail || 'Não foi possível entrar.')
      }

      salvarSessaoUsuario(dados.usuario, dados.token)
      navigate('/inicial')
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar showPoints={false} />

      <main className="w-full px-4 lg:px-8 pt-4 pb-10">
        <div className="flex justify-center">
          <div className="w-full lg:max-w-lg">

            <section className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  className="bg-transparent border-0 p-0 text-[#6B7685] flex items-center cursor-pointer"
                  onClick={() => navigate('/lgpd')}
                  aria-label="Voltar"
                >
                  <FiArrowLeft size={20} />
                </button>
                <p className="text-[#6B7685] text-[14px]">Acesso existente</p>
              </div>
              <h1 className="font-bold text-[22px] text-[#1A202C] mb-1">
                Você já tem conta?
              </h1>
              <p className="text-[#6B7685] text-[14px]">
                Se já tiver cadastro, entre com sua senha e sua carteirinha. Se for novo, crie sua conta para responder ao formulário.
              </p>
            </section>

            <section className="mb-4">
              <div className="bg-gradient-primary shadow-brand-primary rounded-xl p-4">
                <div className="w-14 h-14 rounded-full bg-white/25 flex items-center justify-center mb-3">
                  <FiLogIn size={26} color="#fff" />
                </div>
                <h2 className="font-bold text-white text-[20px] mb-1">Sua conta, seu progresso</h2>
                <p className="text-white/80 text-[13px]">
                  Troféus, missões, streak e benefícios ativos voltam junto com você.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <label className="font-bold mb-2 block text-[14px] text-[#1A202C]">
                  Senha
                </label>
                <div className="relative">
                  <FiUser
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA3AE]"
                  />
                  <input
                    type="password" autoComplete="current-password"
                    className="w-full rounded-xl py-3 bg-white pl-10 pr-3 border text-[14px] border-[#E4E7EB] outline-none focus:border-[#1c9770]"
                    placeholder="Sua senha"
                    value={formData.senha}
                    onChange={e => handleChange('senha', e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="font-bold mb-2 block text-[14px] text-[#1A202C]">
                  Carteirinha
                </label>
                <div className="relative">
                  <FiCreditCard
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA3AE]"
                  />
                  <input
                    type="number"
                    className="w-full rounded-xl appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white py-3 pl-10 pr-3 border text-[14px] border-[#E4E7EB] outline-none focus:border-[#1c9770]"
                    placeholder="Ex: 000000"
                    value={formData.carteirinha}
                    onChange={e => handleChange('carteirinha', e.target.value)}
                  />
                </div>
              </div>

              {erro && (
                <div className="rounded-xl p-3 mb-3 bg-[#fff5f5] border border-[#FC8181]">
                  <p className="text-[13px] text-[#C53030]">{erro}</p>
                </div>
              )}

              <button
                className={`w-full font-bold rounded-xl py-3 flex items-center justify-center gap-2 text-white text-[14px] cursor-pointer ${isFormValid
                  ? 'bg-[#1c9770] shadow-brand-primary'
                  : 'bg-[#CDD3DA] cursor-not-allowed'
                  }`}
                onClick={handleSubmit}
                disabled={!isFormValid || carregando}
              >
                {carregando ? 'Entrando...' : 'Entrar'}
                {!carregando && <FiArrowRight size={18} color="#fff" />}
              </button>

              <button
                className="w-full mt-3 font-bold rounded-xl py-3 flex items-center justify-center gap-2 text-[14px] text-[#1c9770] bg-white border-2 border-[#E4E7EB] cursor-pointer"
                onClick={() => navigate('/lgpd')}
              >
                Ainda não tenho conta
              </button>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}

export default Login
