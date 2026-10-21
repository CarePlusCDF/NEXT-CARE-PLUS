import { post } from '../services/api.js'
import { useCare } from '../services/CareContext.jsx'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiCamera,
  FiCheck,
  FiClock,
  FiGift,
  FiShield,
  FiSkipForward,
  FiX,
  FiZap,
} from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'

function IconeRecompensa({ tipo, size = 34, color = '#1c9770' }) {
  if (tipo === 'escudo') return <FiShield size={size} color={color} />
  if (tipo === 'multiplicador') return <FiClock size={size} color={color} />
  if (tipo === 'skip') return <FiSkipForward size={size} color={color} />
  if (tipo === 'trofeus') return <FiZap size={size} color={color} />

  return <FiGift size={size} color={color} />
}

const Scan = () => {
  const navigate = useNavigate()
  const care = useCare()
  const [localScan, setLocalScan] = useState(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [abrindoCaixa, setAbrindoCaixa] = useState(false)
  const [erroRecompensa, setErroRecompensa] = useState('')
  const activeLocal = localScan?.generation === care.data?.generation && localScan?.day === care.data?.day
  const recompensa = care.data?.scanReward || (activeLocal ? localScan?.recompensa : null)
  const scanFeito = Boolean(recompensa || activeLocal)
  const mostrarRecompensa = scanFeito
  const caixaAberta = Boolean(recompensa)
  const handleScan = () => {
    if (!care.data) return
    setLocalScan({ generation: care.data.generation, day: care.data.day })
  }
  const abrirCaixaSurpresa = async () => {
    if (recompensa) { setModalAberto(true); return }
    if (abrindoCaixa || !care.data) return
    setAbrindoCaixa(true)
    setErroRecompensa('')
    const generation = care.data.generation
    try {
      const result = await post('/recompensa-scan', { generation })
      setLocalScan({ generation, day: care.data.day, recompensa: result.recompensa })
      care.refresh()
      setModalAberto(true)
    } catch (err) { setErroRecompensa(err.message) }
    finally { setAbrindoCaixa(false) }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar showPoints={true} />

      <main className="w-full px-4 lg:px-8 pt-4 pb-24">

        <section className="flex items-center gap-2 mb-4">
          <button
            className="bg-transparent border-0 p-0 text-[#6B7685] cursor-pointer"
            onClick={() => navigate('/inicial')}
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-[20px] text-[#1A202C]">Scan Diário · demonstração</h1>
        </section>

        {!scanFeito && (
          <>
            <section className="mb-4">
              <div className="bg-gradient-primary shadow-brand-primary rounded-xl p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mx-auto mb-3">
                  <FiCamera size={32} color="#fff" />
                </div>
                <h2 className="font-bold text-white text-[20px] mb-1">Realize seu Scan diário</h2>
                <p className="text-white opacity-75 text-[13px]">
                  Ganhe uma caixa surpresa ao completar o scan de hoje.
                </p>
              </div>
            </section>

            <section className="mb-4">
              <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3">
                <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Como funciona a caixa surpresa?</h2>
                <p className="text-[#6B7685] text-[14px]">
                  Esta tela demonstra a interação diária do Boost Care. Não usa câmera nem realiza análise facial ou consulta médica. A recompensa diária de 20 troféus é validada e registrada no servidor.
                </p>
              </div>
            </section>

            <section>
              <button
                className="w-full rounded-xl py-3 font-bold text-[14px] text-white bg-gradient-primary shadow-brand-primary flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleScan}
              >
                <FiCamera size={18} color="#fff" /> Realizar Scan
              </button>
            </section>
          </>
        )}

        {scanFeito && !mostrarRecompensa && (
          <section className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[rgba(28,151,112,0.1)] flex items-center justify-center mx-auto mb-3">
              <FiCamera size={32} color="#1c9770" />
            </div>
            <p className="font-bold text-[16px] text-[#1A202C] mb-1">Analisando...</p>
            <p className="text-[#6B7685] text-[14px]">Aguarde enquanto processamos seu scan.</p>
          </section>
        )}

        {mostrarRecompensa && (
          <>
            <section className="mb-4">
              <div className="bg-gradient-primary shadow-brand-primary rounded-xl p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mx-auto mb-3">
                  <FiCheck size={32} color="#fff" />
                </div>
                <h2 className="font-bold text-white text-[20px] mb-1">Scan realizado!</h2>
                <p className="text-white opacity-75 text-[13px]">
                  Sua caixa surpresa diária já está liberada.
                </p>
              </div>
            </section>

            <section className="mb-4">
              <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[rgba(28,151,112,0.1)] flex items-center justify-center mx-auto mb-3">
                  <FiGift size={32} color="#1c9770" />
                </div>
                <h2 className="font-bold text-[16px] text-[#1A202C] mb-1">Sua recompensa</h2>
                <p className="text-[#6B7685] text-[14px] mb-3">
                  A caixa concede 20 troféus uma única vez por dia nesta sessão. Resgates demonstrativos não geram benefícios externos.
                </p>
                {erroRecompensa && (
                  <p className="text-[#C53030] text-[13px] mb-3">
                    {erroRecompensa}
                  </p>
                )}
                <button
                  className={`rounded-xl py-2 px-4 font-bold text-[14px] text-white shadow-brand-primary inline-flex items-center gap-2 ${
                    caixaAberta
                      ? 'bg-[#93CB52] cursor-pointer'
                      : 'bg-[#1c9770] cursor-pointer'
                  }`}
                  onClick={abrirCaixaSurpresa}
                  disabled={abrindoCaixa}
                >
                  <FiGift size={16} color="#fff" />
                  {abrindoCaixa
                    ? 'Abrindo...'
                    : caixaAberta
                      ? 'Ver prêmio de hoje'
                      : 'Abrir caixa surpresa'}
                </button>
              </div>
            </section>

            <section>
              <button
                className="w-full rounded-xl py-3 font-bold text-[14px] text-[#1c9770] border border-[rgba(28,151,112,0.2)] bg-white cursor-pointer"
                onClick={() => navigate('/inicial')}
              >
                Voltar para o início
              </button>
            </section>
          </>
        )}

      </main>

      {modalAberto && recompensa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 text-center shadow-[0_18px_45px_rgba(26,32,44,0.18)]">
            <button
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#F4F6F8] text-[#6B7685] flex items-center justify-center"
              onClick={() => setModalAberto(false)}
            >
              <FiX size={18} />
            </button>

            <div className="w-20 h-20 rounded-full bg-[rgba(28,151,112,0.1)] flex items-center justify-center mx-auto mb-4">
              <IconeRecompensa tipo={recompensa.tipo} size={38} />
            </div>

            <p className="uppercase tracking-[1px] text-[#6B7685] text-[11px] font-bold mb-1">
              Caixa surpresa
            </p>
            <h2 className="font-bold text-[20px] text-[#1A202C] mb-2">
              {recompensa.titulo}
            </h2>
            <p className="inline-block rounded-full bg-[#1c9770] px-4 py-1.5 text-white text-[15px] font-bold mb-3">
              {recompensa.destaque}
            </p>
            <p className="text-[#6B7685] text-[14px] mb-5">
              {recompensa.descricao}
            </p>

            <button
              className="w-full rounded-xl py-3 font-bold text-[14px] text-white bg-gradient-primary shadow-brand-primary"
              onClick={() => setModalAberto(false)}
            >
              Guardar prêmio
            </button>
          </div>
        </div>
      )}

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Scan
