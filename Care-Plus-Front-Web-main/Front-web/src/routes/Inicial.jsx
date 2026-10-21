import { apiFetch } from '../services/api.js'
import { useEffect, useState } from 'react'
import { useCare } from '../services/CareContext.jsx'
import { useNavigate } from 'react-router-dom'
import {
  FiActivity, FiArrowRight, FiDroplet, FiFileText, FiGift,
  FiHeart, FiRefreshCw, FiSun, FiTarget, FiUser, FiWifi
} from 'react-icons/fi'
import { FaFire, FaTrophy } from 'react-icons/fa'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import ModalConfirmacao from '../components/ModalConfirmacao.jsx'
import mockupMobile from '../assets/mucupe.webp'
import mockupDesktop from '../assets/mucupePC.webp'
import flux from '../assets/flux.png'
import { API_URL, carregarBeneficiosDaSessao } from '../services/sessao.js'

const DIAS_SEMANA_CALENDARIO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DIAS_FLUX_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const FOTO_UNSPLASH_BASE = '?auto=format&fit=crop&w=900&q=80'
const BENEFICIO_FOTOS = {
  1: `https://images.unsplash.com/photo-1503376780353-7e6692767b70${FOTO_UNSPLASH_BASE}`,
  2: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e${FOTO_UNSPLASH_BASE}`,
  3: `https://images.unsplash.com/photo-1498837167922-ddd27525d352${FOTO_UNSPLASH_BASE}`,
  4: `https://images.unsplash.com/photo-1584515933487-779824d29309${FOTO_UNSPLASH_BASE}`,
  5: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd${FOTO_UNSPLASH_BASE}`,
  6: `https://images.unsplash.com/photo-1577805947697-89e18249d767${FOTO_UNSPLASH_BASE}`,
  7: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${FOTO_UNSPLASH_BASE}`,
  8: `https://images.unsplash.com/photo-1523362628745-0c100150b504${FOTO_UNSPLASH_BASE}`,
  9: `https://images.unsplash.com/photo-1494522855154-9297ac14b55f${FOTO_UNSPLASH_BASE}`,
  10: `https://images.unsplash.com/photo-1506126613408-eca07ce68773${FOTO_UNSPLASH_BASE}`,
  11: `https://images.unsplash.com/photo-1599599810769-bcde5a160d32${FOTO_UNSPLASH_BASE}`,
  12: `https://images.unsplash.com/photo-1542291026-7eec264c27ff${FOTO_UNSPLASH_BASE}`,
  13: `https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46${FOTO_UNSPLASH_BASE}`,
  14: `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae${FOTO_UNSPLASH_BASE}`,
  15: `https://images.unsplash.com/photo-1540555700478-4be289fbecef${FOTO_UNSPLASH_BASE}`,
  16: `https://images.unsplash.com/photo-1471864190281-a93a3070b6de${FOTO_UNSPLASH_BASE}`,
  17: `https://images.unsplash.com/photo-1490645935967-10de6ba17061${FOTO_UNSPLASH_BASE}`,
  18: `https://images.unsplash.com/photo-1523398002811-999ca8dec234${FOTO_UNSPLASH_BASE}`,
  19: `https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da${FOTO_UNSPLASH_BASE}`,
  20: `https://images.unsplash.com/photo-1571902943202-507ec2618e8f${FOTO_UNSPLASH_BASE}`,
}

const BENEFICIO_FOTOS_FALLBACK = [
  { palavras: ['uber', '99', 'corrida', 'carro'], foto: BENEFICIO_FOTOS[1] },
  { palavras: ['spotify', 'musica', 'fone'], foto: BENEFICIO_FOTOS[2] },
  { palavras: ['proteina', 'shake', 'growth', 'max titanium'], foto: BENEFICIO_FOTOS[6] },
  { palavras: ['consulta', 'medico', 'saude'], foto: BENEFICIO_FOTOS[4] },
  { palavras: ['ifood', 'comida', 'meal'], foto: BENEFICIO_FOTOS[5] },
  { palavras: ['academia', 'smart fit', 'gympass'], foto: BENEFICIO_FOTOS[7] },
  { palavras: ['garrafa', 'termica', 'agua'], foto: BENEFICIO_FOTOS[8] },
  { palavras: ['headspace', 'meditacao', 'wellness', 'massagem'], foto: BENEFICIO_FOTOS[10] },
  { palavras: ['snack', 'nuts', 'barra'], foto: BENEFICIO_FOTOS[11] },
  { palavras: ['decathlon', 'esportiva', 'dry-fit', 'camiseta'], foto: BENEFICIO_FOTOS[12] },
  { palavras: ['drogasil', 'farmacia', 'multivitaminico'], foto: BENEFICIO_FOTOS[14] },
  { palavras: ['amazon', 'voucher'], foto: BENEFICIO_FOTOS[19] },
]

function formatarDataCalendario(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function normalizarTextoBeneficio(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function buscarFotoBeneficio({ id, titulo, parceiro }) {
  if (BENEFICIO_FOTOS[id]) {
    return BENEFICIO_FOTOS[id]
  }

  const texto = normalizarTextoBeneficio(`${titulo} ${parceiro}`)
  const fallback = BENEFICIO_FOTOS_FALLBACK.find(({ palavras }) =>
    palavras.some((palavra) => texto.includes(palavra))
  )

  return fallback?.foto || BENEFICIO_FOTOS[5]
}

const Inicial = () => {
  const navigate = useNavigate()
  const care = useCare()
  const nome = care.data?.usuario?.nome || ''
  const [beneficios, setBeneficios] = useState([])
  const beneficiosResgatados = care.data?.usuario?.beneficiosResgatados || []
  const streakDias = care.data?.usuario?.streak || 0
  const streakDiasAcendidos = care.data?.usuario?.streakDiasAcendidos || []
  const [menuComFundo, setMenuComFundo] = useState(false)
  const [resgatandoBeneficioId, setResgatandoBeneficioId] = useState(null)
  const [modalBeneficio, setModalBeneficio] = useState({
    aberto: false,
    titulo: '',
    descricao: '',
  })
  const pedometro = care.data?.pedometro
  const luminaria = care.data?.luminaria || { label: 'Apagada', hex: '#9BA3AE', nivel: 0 }
  const missoesConnect = care.data?.missoes || []
  const aguaMl = care.data?.aguaMl || 0
  const copoAguaMl = care.data?.copoAguaMl || 220
  const carregandoPedometro = care.loading
  const erroPedometro = care.error
  const pedometroAtualizadoEm = care.updatedAt
  const carregarPedometro = care.refresh

  useEffect(() => {
    async function carregarBeneficiosSorteados() {
      const carteirinha = localStorage.getItem('carteirinha')

      try {
        if (!carteirinha) return

        const dados = await carregarBeneficiosDaSessao(carteirinha, 6)
        setBeneficios(dados.slice(0, 3))
      } catch {
        setBeneficios([])
      }
    }

    carregarBeneficiosSorteados()
  }, [])

  useEffect(() => {
    function atualizarFundoMenu() {
      setMenuComFundo(window.scrollY > 8)
    }

    atualizarFundoMenu()
    window.addEventListener('scroll', atualizarFundoMenu, { passive: true })

    return () => {
      window.removeEventListener('scroll', atualizarFundoMenu)
    }
  }, [])

  const quickMenuItems = [
    { id: 'missoes', label: 'Missões', icon: FiTarget, path: '/missoes', iconColor: '#1c9770', bgColor: 'bg-[rgba(28,151,112,0.1)]' },
    { id: 'mind', label: 'Mind+', icon: FiHeart, path: '/mind', iconColor: '#7AD180', bgColor: 'bg-[rgba(122,209,128,0.15)]' },
    { id: 'connect', label: 'Connect+', icon: FiWifi, path: '/connect', iconColor: '#7AD1C3', bgColor: 'bg-[rgba(122,209,195,0.15)]' },
    { id: 'noticias', label: 'Notícias', icon: FiFileText, path: '/noticias', iconColor: '#93CB52', bgColor: 'bg-[rgba(147,203,82,0.15)]' },
    { id: 'perfil', label: 'Perfil', icon: FiUser, path: '/perfil', iconColor: '#1c9770', bgColor: 'bg-[rgba(28,151,112,0.1)]' },
  ]

  const dataCalendario = new Date(`${care.data?.day || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}T12:00:00`)
  const anoCalendario = dataCalendario.getFullYear()
  const mesCalendario = dataCalendario.getMonth()
  const diaHoje = dataCalendario.getDate()
  const primeiroDiaMes = new Date(anoCalendario, mesCalendario, 1).getDay()
  const diasNoMes = new Date(anoCalendario, mesCalendario + 1, 0).getDate()
  const nomeMes = dataCalendario.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  const datasComFogo = new Set(streakDiasAcendidos)
  const indiceDiaAtual = dataCalendario.getDay() === 0
    ? 6
    : dataCalendario.getDay() - 1
  const diasProtegidos = Math.min(streakDias, 7)
  const diasCalendario = [
    ...Array.from({ length: primeiroDiaMes }, () => null),
    ...Array.from({ length: diasNoMes }, (_, index) => {
      const dia = index + 1

      return {
        dia,
        data: formatarDataCalendario(anoCalendario, mesCalendario, dia),
      }
    }),
  ]
  const passosPedometro = pedometro?.steps ?? 0
  const mediaPassosPedometro = pedometro?.dailyStepsAverage ?? 0
  const ultimoEventoBotao = pedometro?.buttonEvent || 'Sem evento'
  const statusPedometro = erroPedometro ? 'offline' : pedometro?.status || 'aguardando'
  const textoFonteLuminaria = luminaria.confirmada && !care.error ? 'cor confirmada pelo aparelho' : 'cor solicitada; aguardando confirmação'
  const textoResetLuminaria = luminaria.resetEm?.label
    ? `Reseta em ${luminaria.resetEm.label}`
    : ''
  const textoAtualizacaoPedometro = pedometroAtualizadoEm
    ? `Atualizado ${pedometroAtualizadoEm.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`
    : 'Aguardando leitura'

  function formatarValorMissaoConnect(missao) {
    if (missao.tipo === 'manual') return `${missao.atual} / ${missao.meta} missões`
    if (missao.tipo === 'water') {
      return `${Number(missao.atual || 0).toLocaleString('pt-BR')}ml / ${Number(missao.meta || 0).toLocaleString('pt-BR')}ml`
    }

    if (missao.tipo === 'steps_per_minute' || missao.tipo === 'daily_steps_average') {
      return `${Number(missao.atual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / ${Number(missao.meta || 0).toLocaleString('pt-BR')} passos/min`
    }

    return `${Number(missao.atual || 0).toLocaleString('pt-BR')} / ${Number(missao.meta || 0).toLocaleString('pt-BR')} passos`
  }

  function escolherIconeMissaoConnect(tipo) {
    if (tipo === 'water') return FiDroplet
    if (tipo === 'steps_per_minute' || tipo === 'daily_steps_average') return FiTarget

    return FiActivity
  }

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

    setResgatandoBeneficioId(beneficio.id)

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
      setResgatandoBeneficioId(null)
    }
  }

  return (
    
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar showPoints={true} />
      
      <section
        className={`sticky top-0 z-40 px-4 p-3 transition-all duration-300 ${
          menuComFundo
            ? 'bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_8px_24px_rgba(26,32,44,0.08)]'
            : 'bg-transparent border-b border-transparent shadow-none'
        }`}
      >
          <div className="grid grid-cols-5 gap-3 justify-center">
            {quickMenuItems.map(({ id, label, icon: Icon, path, iconColor, bgColor }) => (
              <div
                key={id}
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => navigate(path)}
              >
                <div className={`w-12 h-12 rounded-md flex items-center justify-center ${bgColor}`}>
                  <Icon size={40} color={iconColor} />
                </div>
                <span className="text-[#6B7685] text-[12px] font-medium text-center">{label}</span>
              </div>
            ))}
          </div>
        </section>
    
      <div className="relative px-4 lg:px-8 " >
        <img src={mockupMobile} alt="" className=" block lg:hidden rounded-md" />
        <img src={mockupDesktop} alt="" className="hidden lg:block rounded-md " />

        <div className="absolute bottom-[10%] left-4 lg:left-8 z-10 mb-2">
          <p className="text-white text-sm md:text-[23px] leading-none mb-1 mx-4 lg:mx-9">Olá,</p>
          <h1 className="font-bold text-[20px] md:text-[29px] lg:text-[32px] mx-3 text-white leading-none lg:mx-8">{nome}!</h1>
          <p className="text-white text-[15px] md:text-[21px] lg:text-[25px] mx-3 mt-1 leading-tight lg:mx-8">
            Continue sua jornada de bem-estar hoje.
          </p>
        </div>
      </div>

      <main className="w-full px-4 lg:px-8 pt-4 pb-24">

        <section className="mb-4">
          <div
            className="relative overflow-hidden rounded-md border border-[rgba(28,151,112,0.18)] bg-white shadow-brand-card p-4 lg:p-8 text-center lg:text-left cursor-pointer"
            onClick={() => navigate('/impulso')}
          >
            <div className="absolute inset-x-0 top-0 h-24 lg:h-full lg:w-[42%] bg-[linear-gradient(180deg,rgba(28,151,112,0.12),rgba(28,151,112,0))] lg:bg-[linear-gradient(90deg,rgba(28,151,112,0.14),rgba(28,151,112,0))]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[240px_minmax(260px,1fr)_320px] xl:grid-cols-[300px_minmax(320px,1fr)_360px] items-center gap-5 lg:gap-8 xl:gap-10">
              <div className="flex items-center justify-center gap-4 lg:flex-col lg:items-center">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="mb-2 lg:mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(28,151,112,0.1)] px-3 py-1 lg:px-4 lg:py-1.5 text-[#1c9770] text-[12px] lg:text-[13px] font-bold">
                    
                    Flux ativo
                  </span>
                  </div>

                  <div className="mx-auto w-20 h-20 lg:w-56 lg:h-56 xl:w-64 xl:h-64 rounded-full bg-[rgba(28,151,112,0.08)] border border-[rgba(28,151,112,0.14)] flex items-center justify-center">
                    <img
                      src={flux}
                      alt="Flux"
                      className="w-18 h-18 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-contain"
                    />
                  </div>
                </div>

                <div className="lg:hidden min-w-0 text-left p-4">
                  <div className="flex items-baseline pt-6 gap-2 mb-1">
                    <h2 className="text-[#1c9770] text-[42px] leading-none font-bold">
                      {streakDias}
                    </h2>
                    <p className="uppercase tracking-[0.8px] text-[#1A202C] text-[11px] font-bold">
                      dias consecutivos
                    </p>
                  </div>
                  <p className="text-[#6B7685] text-[12px] leading-snug">
                    Não deixe o Flux apagar hoje!
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#E4E7EB] bg-white px-3 py-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        color: luminaria.hex,
                        backgroundColor: `${luminaria.hex}18`,
                        boxShadow: luminaria.nivel > 0 ? `0 0 18px ${luminaria.hex}80` : 'none',
                      }}
                    >
                      <FiSun size={18} />
                    </span>
                    <div>
                      <p className="text-[#6B7685] text-[10px] uppercase font-bold tracking-[0.8px]">
                        Luminária
                      </p>
                      <p className="text-[#1A202C] text-[12px] font-bold">
                        {luminaria.label}
                      </p>
                      {textoResetLuminaria && (
                        <p className="text-[#6B7685] text-[10px]">
                          {textoResetLuminaria}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-center lg:items-start lg:max-w-xl lg:mx-auto">
                <h2 className="text-[#1c9770] text-[48px] lg:text-[76px] xl:text-[88px] leading-none font-bold">
                  {streakDias}
                </h2>
                <p className="uppercase tracking-[1.4px] text-[#1A202C] text-[12px] lg:text-[14px] font-bold mb-2 lg:mb-3">
                  dias consecutivos
                </p>
                <p className="text-[#6B7685] text-[13px] lg:text-[16px] mb-3 lg:mb-6 lg:max-w-xl">
                  Não deixe o Flux apagar hoje!
                </p>
                <div className="flex items-center gap-3 rounded-md border border-[#E4E7EB] bg-white/85 p-3 shadow-brand-card">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      color: luminaria.hex,
                      backgroundColor: `${luminaria.hex}18`,
                      boxShadow: luminaria.nivel > 0 ? `0 0 24px ${luminaria.hex}80` : 'none',
                    }}
                  >
                    <FiSun size={24} />
                  </span>
                  <div>
                    <p className="text-[#6B7685] text-[11px] uppercase font-bold tracking-[1px]">
                      Estado da luminária
                    </p>
                    <p className="text-[#1A202C] text-[16px] font-bold">
                      {luminaria.label}
                    </p>
                    <p className="text-[#6B7685] text-[12px]">
                      {textoFonteLuminaria}
                    </p>
                    {textoResetLuminaria && (
                      <p className="text-[#6B7685] text-[12px]">
                        {textoResetLuminaria}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-center md:hidden">
                <div className="flex justify-center gap-2">
                  {DIAS_FLUX_SEMANA.map((dia, index) => {
                    const ativo = streakDias > 0 &&
                      index <= indiceDiaAtual &&
                      index > indiceDiaAtual - diasProtegidos

                    return (
                      <span
                        key={`${dia}-${index}`}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${ativo
                          ? 'bg-[#1c9770] text-white shadow-brand-primary'
                          : 'bg-[#F0F2F5] text-[#9BA3AE]'
                          }`}
                      >
                        {dia}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="hidden md:block w-full rounded-md border border-[#E4E7EB] bg-[#F8FAFB] p-3 lg:p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[#6B7685] text-[11px] uppercase font-bold tracking-[1px]">
                      Calendário do Flux
                    </p>
                    <h3 className="text-[#1A202C] text-[14px] lg:text-[16px] font-bold capitalize">
                      {nomeMes}
                    </h3>
                  </div>
                  <span className="w-9 h-9 rounded-full bg-[rgba(28,151,112,0.1)] text-[#1c9770] flex items-center justify-center">
                    <FaFire size={15} />
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {DIAS_SEMANA_CALENDARIO.map((dia, index) => (
                    <span
                      key={`${dia}-${index}`}
                      className="text-center text-[11px] font-bold text-[#9BA3AE]"
                    >
                      {dia}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {diasCalendario.map((diaCalendario, index) => {
                    if (!diaCalendario) {
                      return <span key={`vazio-${index}`} className="h-8 lg:h-9" />
                    }

                    const fogoAceso = datasComFogo.has(diaCalendario.data)
                    const hoje = diaCalendario.dia === diaHoje

                    return (
                      <span
                        key={diaCalendario.data}
                        className={`h-8 lg:h-9 rounded-lg flex items-center justify-center text-[12px] lg:text-[13px] font-bold border ${fogoAceso
                          ? 'bg-[#1c9770] border-[#1c9770] text-white shadow-brand-primary'
                          : hoje
                            ? 'bg-white border-[rgba(28,151,112,0.35)] text-[#1c9770]'
                            : 'bg-white border-[#E4E7EB] text-[#6B7685]'
                          }`}
                      >
                        {fogoAceso ? <FaFire size={12} /> : diaCalendario.dia}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        

        <section className="mb-4">
          <div
            className="rounded-md p-3 flex items-center justify-between bg-gradient-primary shadow-brand-primary cursor-pointer"
            onClick={() => navigate('/scan')}
          >
            <div>
              <p className="font-bold text-white text-[14px]">Scan Diário</p>
              <p className="text-white opacity-75 text-[12px]">
                Realize o scan e ganhe uma caixa surpresa
              </p>
            </div>
            <div className="w-11 h-11 flex items-center justify-center rounded-md bg-white/25">
              <FiArrowRight size={20} color="#fff" />
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div className="flex justify-between items-center gap-3 mb-3">
            <div>
              <p className="text-[#6B7685] text-[11px] uppercase font-bold tracking-[1px]">
                Pulseira conectada
              </p>
              <h2 className="font-bold text-[16px] text-[#1A202C]">step001 em tempo real</h2>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[13px] text-[#1c9770] bg-white border border-[rgba(28,151,112,0.2)] rounded-md px-3 py-2 cursor-pointer disabled:opacity-70"
              onClick={() => carregarPedometro(true)}
              disabled={carregandoPedometro}
            >
              <FiRefreshCw
                size={13}
                color="#1c9770"
                className={carregandoPedometro ? 'animate-spin' : ''}
              />
              Atualizar
            </button>
          </div>

          {erroPedometro && (
            <div className="mb-3 rounded-md border border-[#F6AD55]/40 bg-[#F6AD55]/10 px-3 py-2">
              <p className="text-[#6B7685] text-[12px]">
                Não foi possível atualizar a API agora. {erroPedometro}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded-md p-4 border border-[#E4E7EB] shadow-brand-card">
              <p className="text-[#6B7685] text-[12px] mb-1">Passos hoje</p>
              <p className="font-bold text-[28px] text-[#1A202C] leading-none">
                {carregandoPedometro && !pedometro
                  ? 'Carregando...'
                  : passosPedometro.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="bg-white rounded-md p-4 border border-[#E4E7EB] shadow-brand-card">
              <p className="text-[#6B7685] text-[12px] mb-1">Água confirmada</p>
              <p className="font-bold text-[28px] text-[#1A202C] leading-none">
                {aguaMl.toLocaleString('pt-BR')}ml
              </p>
              <p className="text-[#6B7685] text-[12px] mt-1">
                {copoAguaMl}ml por toque
              </p>
            </div>

            <div className="bg-white rounded-md p-4 border border-[#E4E7EB] shadow-brand-card">
              <p className="text-[#6B7685] text-[12px] mb-1">Média diária de passos/min</p>
              <p className="font-bold text-[28px] text-[#1A202C] leading-none">
                {mediaPassosPedometro.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              </p>
              <p className="text-[#6B7685] text-[12px] mt-1">
                Último botão: {ultimoEventoBotao}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {missoesConnect.map((missao) => {
              const Icon = escolherIconeMissaoConnect(missao.tipo)

              return (
                <div
                  key={missao.id}
                  className={`bg-white rounded-md p-3 flex flex-col gap-3 border shadow-brand-card ${
                    missao.concluida
                      ? 'border-[rgba(28,151,112,0.35)] bg-[rgba(28,151,112,0.03)]'
                      : 'border-[#E4E7EB]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
                      missao.concluida ? 'bg-[#1c9770]' : 'bg-[rgba(28,151,112,0.1)]'
                    }`}>
                      <Icon size={18} color={missao.concluida ? '#fff' : '#1c9770'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[14px] text-[#1A202C] leading-snug">
                          {missao.titulo}
                        </p>
                        <span className="text-[#1c9770] text-[12px] font-bold shrink-0">
                          {missao.trofeus} troféus
                        </span>
                      </div>
                      <p className="text-[#6B7685] text-[12px] mt-1">
                        {formatarValorMissaoConnect(missao)}
                      </p>
                      {missao.concluida && missao.resetEm?.label && (
                        <p className="text-[#1c9770] text-[12px] font-bold mt-1">
                          Reseta em {missao.resetEm.label}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="rounded-full bg-[#E4E7EB] h-2 overflow-hidden">
                      <div
                        className={`rounded-full h-2 ${missao.concluida ? 'bg-[#93CB52]' : 'bg-[#1c9770]'}`}
                        style={{ width: `${missao.progresso}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-[#1c9770] text-[12px]">
                        {missao.progresso}%
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        missao.concluida
                          ? 'bg-[rgba(147,203,82,0.18)] text-[#167a5a]'
                          : 'bg-[#F0F2F5] text-[#6B7685]'
                      }`}>
                        {missao.concluida ? 'Concluída' : 'Em progresso'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 bg-white rounded-md p-3 border border-[#E4E7EB] shadow-brand-card flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[#6B7685] text-[12px] mb-1">Pulseira vinculada</p>
              <p className="font-bold text-[13px] text-[#1A202C] break-all">
                {pedometro?.deviceId || 'Aguardando configuração'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                statusPedometro === 'online'
                  ? 'bg-[rgba(28,151,112,0.1)] text-[#1c9770]'
                  : 'bg-[#F0F2F5] text-[#6B7685]'
              }`}>
                {statusPedometro}
              </span>
              <span className="text-[#6B7685] text-[12px]">{textoAtualizacaoPedometro}</span>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Benefícios</h2>
            <button
              className="flex items-center gap-1 text-[13px] text-[#1c9770] bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => navigate('/beneficios')}
            >
              Ver todos <FiArrowRight size={13} color="#1c9770" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {beneficios.map(({ id, titulo, parceiro, custoTrofeus }) => {
              const resgatado = beneficiosResgatados.some((beneficio) => beneficio.id === id)
              const resgatando = resgatandoBeneficioId === id
              const fotoBeneficio = buscarFotoBeneficio({ id, titulo, parceiro })

              return (
                <button
                  key={id}
                  className={`beneficio-card relative overflow-hidden text-left rounded-md p-3 min-h-[162px] border border-white/20 shadow-brand-tile ${
                    resgatado || resgatando ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  style={{
                    '--beneficio-bg-image': `url(${fotoBeneficio})`,
                  }}
                  disabled={resgatado || resgatando}
                  onClick={() => resgatarBeneficio({ id, titulo, parceiro, custoTrofeus })}
                >
                  <div className="relative z-10 flex h-full min-h-[138px] flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-9 h-9 rounded-md bg-white/20 text-white backdrop-blur-sm flex items-center justify-center">
                        <FiGift size={17} />
                      </div>
                      <p className="font-bold text-[12px] flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[#1c9770] shadow-sm">
                        <FaTrophy size={11} />
                        {custoTrofeus.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/75 text-[12px] mb-1 font-medium">{parceiro}</p>
                      <p className="font-bold text-[15px] text-white leading-snug mb-2">{titulo}</p>
                      <p className="text-white/80 text-[12px]">
                        {resgatado && 'Resgatado'}
                        {!resgatado && resgatando && 'Resgatando...'}
                        {!resgatado && !resgatando && 'Clique para resgatar'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-4">
          <div
            className="rounded-md p-3 flex items-center justify-between bg-gradient-accent1 shadow-brand-primary cursor-pointer"
            onClick={() => navigate('/mind')}
          >
            <div>
              <p className="font-bold text-white text-[14px]">Mind+</p>
              <p className="text-white opacity-75 text-[12px]">
                Apoio psicológico a qualquer hora e lugar
              </p>
            </div>
            <div className="w-11 h-11 flex items-center justify-center rounded-md bg-white/25">
              <FiHeart size={20} color="#fff" />
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div
            className="rounded-md p-3 flex items-center justify-between bg-gradient-accent2 shadow-brand-primary cursor-pointer"
            onClick={() => navigate('/connect')}
          >
            <div>
              <p className="font-bold text-white text-[14px]">Connect+</p>
              <p className="text-white opacity-75 text-[12px]">
                Sono, batimentos e metas num só lugar
              </p>
            </div>
            <div className="w-11 h-11 flex items-center justify-center rounded-md bg-white/25">
              <FiWifi size={20} color="#fff" />
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Notícias</h2>
            <button
              className="flex items-center gap-1 text-[13px] text-[#1c9770] bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => navigate('/noticias')}
            >
              Ver mais <FiArrowRight size={13} color="#1c9770" />
            </button>
          </div>

          <div
            className="bg-white rounded-md p-3 border border-[#E4E7EB] shadow-brand-card cursor-pointer"
            onClick={() => navigate('/noticias')}
          >
            <p className="font-bold text-[14px] text-[#1A202C] mb-1">
              Saúde mental: afastamentos dobram em dez anos e chegam a 440 mil
            </p>
            <p className="text-[#6B7685] text-[12px] mb-2">
              Em 2014, quase 203 mil brasileiros foram afastados do trabalho em razão de episódios depressivos e transtornos de ansiedade.
            </p>
            <span className="text-[#1c9770] font-bold text-[12px]">Ver matéria completa</span>
          </div>
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

export default Inicial
