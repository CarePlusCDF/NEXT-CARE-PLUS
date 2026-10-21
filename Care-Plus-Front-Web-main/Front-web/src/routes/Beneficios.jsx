import { useCare } from '../services/CareContext.jsx'
import { apiFetch } from '../services/api.js'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiGift } from 'react-icons/fi'
import { FaTrophy } from 'react-icons/fa'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import ModalConfirmacao from '../components/ModalConfirmacao.jsx'
import { API_URL, carregarBeneficiosDaSessao } from '../services/sessao.js'

// Limiares de troféus acumulados por categoria
const CATEGORIAS = [
  { nome: 'Bronze', minimo: 0,    proximo: 'Prata', maximoAtual: 500  },
  { nome: 'Prata',  minimo: 500,  proximo: 'Ouro',  maximoAtual: 1500 },
  { nome: 'Ouro',   minimo: 1500, proximo: null,    maximoAtual: null  },
]

function categoriaPorTrofeus(trofeusAcumulados) {
  // Encontra a categoria atual: a última cujo mínimo o usuário já atingiu
  const atual = [...CATEGORIAS]
    .reverse()
    .find((c) => trofeusAcumulados >= c.minimo) || CATEGORIAS[0]

  // Se for a categoria máxima, progresso fixo em 100
  if (!atual.proximo) {
    return {
      atual: atual.nome,
      proxima: 'Máximo',
      progresso: 100,
    }
  }

  // Calcula o progresso percentual dentro da faixa atual
  // Exemplo: Bronze vai de 0 a 500. Com 250 troféus → (250 - 0) / (500 - 0) = 50%
  const progresso = Math.min(
    Math.round(
      ((trofeusAcumulados - atual.minimo) / (atual.maximoAtual - atual.minimo)) * 100
    ),
    100
  )

  return {
    atual: atual.nome,
    proxima: atual.proximo,
    progresso,
  }
}

const Beneficios = () => {
  const navigate = useNavigate()
  const [beneficios, setBeneficios] = useState([])
  const care = useCare()
  const usuario = care.data?.usuario
  const [carregando, setCarregando] = useState(true)
  const [resgatandoId, setResgatandoId] = useState(null)
  const [modalBeneficio, setModalBeneficio] = useState({
    aberto: false,
    titulo: '',
    descricao: '',
  })

  useEffect(() => {
    async function carregarDados() {
      const carteirinha = localStorage.getItem('carteirinha')

      try {
        const beneficiosApi = await carregarBeneficiosDaSessao(carteirinha, 6)

        setBeneficios(beneficiosApi)

      } catch {
        abrirModalBeneficio(
          'Benefícios indisponíveis',
          'Não foi possível carregar os benefícios agora.'
        )
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [navigate])

  const trofeus = usuario?.trofeus || 0
  const trofeusAcumulados = usuario?.trofeusAcumulados ?? trofeus
  const categoria = categoriaPorTrofeus(trofeusAcumulados)
  const beneficiosAtivos = useMemo(
    () => usuario?.beneficiosResgatados || [],
    [usuario]
  )
  const beneficiosResgatadosIds = useMemo(
    () => new Set(beneficiosAtivos.map((beneficio) => beneficio.id)),
    [beneficiosAtivos]
  )

  function abrirModalBeneficio(titulo, descricao) {
    setModalBeneficio({
      aberto: true,
      titulo,
      descricao,
    })
  }

  function fecharModalBeneficio() {
    setModalBeneficio({
      aberto: false,
      titulo: '',
      descricao: '',
    })
  }

  async function resgatarBeneficio(beneficio) {
    const carteirinha = localStorage.getItem('carteirinha')

    if (!carteirinha) {
      abrirModalBeneficio(
        'Carteirinha necessária',
        'Entre com sua carteirinha para resgatar benefícios.'
      )
      return
    }

    if (trofeus < beneficio.custoTrofeus) {
      abrirModalBeneficio(
        'Troféus insuficientes',
        `Você precisa de ${beneficio.custoTrofeus.toLocaleString('pt-BR')} troféus para resgatar este benefício.`
      )
      return
    }

    setResgatandoId(beneficio.id)

    try {
      const resposta = await apiFetch(`${API_URL}/resgatar-beneficio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carteirinha,
          idBeneficio: beneficio.id,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.detail || 'Não foi possível resgatar este benefício.')
      }

      care.refresh()
      localStorage.setItem('trofeus', dados.usuario.trofeus)
      window.dispatchEvent(new Event('trofeusAtualizados'))
      abrirModalBeneficio(
        'Benefício resgatado',
        `${beneficio.titulo} foi resgatado com sucesso.`
      )
    } catch (erro) {
      abrirModalBeneficio('Resgate não realizado', erro.message)
    } finally {
      setResgatandoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar showPoints={true} />

      <main className="w-full px-4 lg:px-8 pt-4 pb-24">

        <section className="flex items-center gap-2 mb-4">
          <button
            className="bg-transparent border-0 p-0 text-[#6B7685] cursor-pointer"
            onClick={() => navigate('/inicial')}
            aria-label="Voltar"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-[20px] text-[#1A202C]">Benefícios</h1>
        </section>

        <section className="mb-4">
          <div className="bg-gradient-primary shadow-brand-primary rounded-xl p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-white opacity-75 text-[13px] mb-1">Sua categoria</p>
                <h2 className="font-bold text-white text-[24px] mb-1">{categoria.atual}</h2>
                <p className="text-white opacity-75 text-[12px]">
                  {categoria.atual === 'Ouro'
                    ? 'Categoria máxima alcançada'
                    : `Próxima categoria: ${categoria.proxima}`
                  }
                </p>
              </div>
              <div className="bg-white/25 rounded-xl px-3 py-2 flex items-center gap-2">
                <FaTrophy size={14} className="text-white" />
                <span className="font-bold text-white text-[14px]">
                  {trofeus.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-white opacity-75 text-[12px]">
                  Progresso para {categoria.proxima}
                </span>

                <span className="text-white opacity-75 text-[12px]">
                  {categoria.progresso}%
                </span>
              </div>

              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white rounded-full h-1.5"
                  style={{ width: `${categoria.progresso}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Benefícios ativos</h2>
          <div className="flex flex-col gap-2">
            {beneficiosAtivos.length === 0 && (
              <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 text-[#6B7685] text-[13px]">
                Nenhum benefício resgatado ainda.
              </div>
            )}

            {beneficiosAtivos.map(({ id, titulo, parceiro, custoTrofeus }) => (
              <div key={id} className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(28,151,112,0.1)]">
                  <FiCheckCircle size={18} color="#1c9770" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[14px] text-[#1A202C]">{titulo}</p>
                  <p className="text-[#6B7685] text-[12px]">
                    {parceiro} • {custoTrofeus.toLocaleString('pt-BR')} troféus
                  </p>
                </div>
                <span className="rounded-full text-[11px] text-white bg-[#1c9770] px-2 py-0.5 font-medium">Ativo</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Disponíveis para resgate</h2>
          </div>

          {carregando ? (
            <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 text-[#6B7685] text-[13px]">
              Carregando benefícios...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {beneficios.map((beneficio) => {
                const resgatado = beneficiosResgatadosIds.has(beneficio.id)
                const trofeusInsuficientes = trofeus < beneficio.custoTrofeus
                const disabled = resgatado || resgatandoId === beneficio.id
                const faltam = Math.max(beneficio.custoTrofeus - trofeus, 0)

                return (
                  <div key={beneficio.id} className={`bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 ${resgatado ? 'opacity-75' : ''}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(28,151,112,0.1)]">
                          <FiGift size={17} color="#1c9770" />
                        </div>
                        <span className="font-bold text-[14px] text-[#1A202C] truncate">{beneficio.parceiro}</span>
                      </div>
                      <span className="shrink-0 flex items-center gap-1 text-[#1c9770] text-[12px] font-bold">
                        <FaTrophy size={12} />
                        {beneficio.custoTrofeus.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-[#6B7685] text-[12px] min-h-10">{beneficio.titulo}</p>
                    <button
                      className={`mt-3 w-full rounded-xl px-3 py-2 text-[13px] font-bold flex items-center justify-center gap-2 ${disabled
                          ? 'bg-[#F0F2F5] text-[#9BA3AE] cursor-not-allowed'
                          : trofeusInsuficientes
                            ? 'bg-[#F0F2F5] text-[#9BA3AE] cursor-pointer'
                            : 'bg-[#1c9770] text-white cursor-pointer'
                        }`}
                      disabled={disabled}
                      onClick={() => resgatarBeneficio(beneficio)}
                    >
                      {resgatado && 'Resgatado'}
                      {!resgatado && trofeusInsuficientes && `Faltam ${faltam.toLocaleString('pt-BR')}`}
                      {!resgatado && !trofeusInsuficientes && resgatandoId !== beneficio.id && 'Resgatar'}
                      {!resgatado && !trofeusInsuficientes && resgatandoId === beneficio.id && 'Resgatando...'}
                      {!disabled && <FiArrowRight size={14} />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>

      <ModalConfirmacao
        aberto={modalBeneficio.aberto}
        titulo={modalBeneficio.titulo}
        descricao={modalBeneficio.descricao}
        textoCancelar="Entendi"
        mostrarConfirmar={false}
        onClose={fecharModalBeneficio}
      />

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Beneficios
