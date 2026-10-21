import { useCare } from '../services/CareContext.jsx'
import { post } from '../services/api.js'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiUser, FiAward, FiLogOut } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import { limparSessaoUsuario } from '../services/sessao.js'

function formatarDataLocal(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

const Perfil = () => {
  const { data } = useCare()
  const usuario = data?.usuario
  const nome = usuario?.nome || ''
  const navigate = useNavigate()
  const missoesHoje = usuario?.missoesConcluidasHoje || 0
  const missoesPorDia = usuario?.missoesPorDia || {}
  const total = usuario?.trofeusAcumulados || 0
  const nivel = total >= 1500 ? 'Ouro' : total >= 500 ? 'Prata' : 'Bronze'

  async function sairDaConta() {
    try { await post('/logout') }
    catch (error) { console.warn(error.message) }
    finally { limparSessaoUsuario(); navigate('/login') }
  }



  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

  const dataHoje = new Date(`${data?.day || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}T12:00:00`)
  const chaveHoje = formatarDataLocal(dataHoje)
  const inicioSemana = new Date(dataHoje)
  inicioSemana.setDate(dataHoje.getDate() - dataHoje.getDay())

  const missoesDiarias = dias.map((dia, index) => {
    const data = new Date(inicioSemana)
    data.setDate(inicioSemana.getDate() + index)
    const chave = formatarDataLocal(data)

    return {
      dia,
      quantidade: missoesPorDia[chave] || (chave === chaveHoje ? missoesHoje : 0)
    }
  })

  const maxMissoes = Math.max(
    10,
    ...missoesDiarias.map(({ quantidade }) => quantidade)
  )


  const trofeus = usuario?.conquistas || []

  const nivelLabel = (campo, valor) => {

    const map = {

      atividadeFisica: {
        "0": "Nenhum dia",
        "1_2": "1 a 2 dias",
        "3_4": "3 a 4 dias",
        "5_7": "5 a 7 dias"
      },

      tempoSentado: {
        "menos_2h": "Menos de 2h",
        "2_5h": "2 a 5h",
        "5_8h": "5 a 8h",
        "mais_8h": "Mais de 8h"
      },

      distanciaDia: {
        "menos_1": "Menos de 1km",
        "1_3": "1 a 3km",
        "3_6": "3 a 6km",
        "mais_6": "Mais de 6km"
      },

      agua: {
        "menos_1": "Menos de 1L",
        "1_2": "1 a 2L",
        "2_3": "2 a 3L",
        "mais_3": "Mais de 3L"
      },

      sono: {
        "menos_5": "Menos de 5h",
        "5_7": "5 a 7h",
        "7_9": "7 a 9h",
        "mais_9": "Mais de 9h"
      },

      celular: {
        "menos_2": "Menos de 2h",
        "2_5": "2 a 5h",
        "5_8": "5 a 8h",
        "mais_8": "Mais de 8h"
      },

      pausas: {
        "0": "Nenhuma",
        "1_3": "1 a 3",
        "4_6": "4 a 6",
        "mais_6": "Mais de 6"
      },

      cafeina: {
        "0": "Nenhuma",
        "1_2": "1 a 2 copos",
        "3_5": "3 a 5 copos",
        "mais_5": "Mais de 5"
      },

      arLivre: {
        "0_15": "0 a 15 min",
        "15_30": "15 a 30 min",
        "30_60": "30 a 60 min",
        "mais_60": "Mais de 60 min"
      },

      refeicoes: {
        "1_2": "1 a 2 refeições",
        "3": "3 refeições",
        "4_5": "4 a 5 refeições",
        "mais_5": "Mais de 5 refeições"
      }
    }

    return map[campo]?.[valor] || '-'
  }

  const informacoesPessoais = [
    { label: 'Nome', valor: usuario?.nome || nome || '-' },
    { label: 'Carteirinha', valor: usuario?.carteirinha || '-' },
    { label: 'Peso', valor: usuario?.peso ? `${usuario.peso} kg` : '-' },
    { label: 'Altura', valor: usuario?.altura ? `${usuario.altura} cm` : '-' },
    { label: 'Atividade física', valor: nivelLabel('atividadeFisica', usuario?.atividadeFisica) },
    { label: 'Tempo sentado', valor: nivelLabel('tempoSentado', usuario?.tempoSentado) },
    { label: 'Distância por dia', valor: nivelLabel('distanciaDia', usuario?.distanciaDia) },
    { label: 'Consumo de água', valor: nivelLabel('agua', usuario?.agua) },
    { label: 'Qualidade do sono', valor: nivelLabel('sono', usuario?.sono) },
    { label: 'Tempo no celular', valor: nivelLabel('celular', usuario?.celular) },
    { label: 'Pausas no dia', valor: nivelLabel('pausas', usuario?.pausas) },
    { label: 'Consumo de cafeína', valor: nivelLabel('cafeina', usuario?.cafeina) },
    { label: 'Tempo ao ar livre', valor: nivelLabel('arLivre', usuario?.arLivre) },
    { label: 'Refeições por dia', valor: nivelLabel('refeicoes', usuario?.refeicoes) },
  ]


  const mostrarDadosLegados = false

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
          <h1 className="font-bold text-[20px] text-[#1A202C]">Perfil</h1>
        </section>

        <section className="mb-4">
          <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[rgba(28,151,112,0.1)] flex items-center justify-center shrink-0">
              <FiUser size={24} color="#1c9770" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[16px] text-[#1A202C]">{nome}</h2>
              <span className="inline-block rounded-full bg-[#1c9770] text-white px-2 py-0.5 text-[11px] font-medium">{nivel}</span>
            </div>
            <div className="bg-[rgba(28,151,112,0.1)] rounded-xl px-3 py-2">
              <span className="font-bold text-[#1c9770] text-[14px]">{usuario?.trofeus?.toLocaleString('pt-BR') || 0} Troféus</span>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <button
            className="w-full rounded-xl py-3 font-bold text-[14px] text-[#6B7685] bg-white border-2 border-[#E4E7EB] flex items-center justify-center gap-2 cursor-pointer"
            onClick={sairDaConta}
          >
            <FiLogOut size={16} />
            Sair da conta
          </button>
        </section>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Missões diárias</h2>
          <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3">
            <div className="flex justify-between items-end gap-2">
              {missoesDiarias.map(({ dia, quantidade }) => (
                <div key={dia} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[#1c9770] font-bold text-[12px]">{quantidade}</span>
                  <div
                    className="w-full rounded bg-[#1c9770]"
                    id="qs0g1c"
                    style={{
                      height: `${Math.max(
                        (quantidade / maxMissoes) * 120,
                        quantidade > 0 ? 12 : 4
                      )}px`
                    }}

                  />
                  <span className="text-[#6B7685] text-[12px]">{dia}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Conquistas</h2>
            <button
              className="bg-transparent border-0 p-0 text-[#1c9770] flex items-center gap-1 text-[14px] cursor-pointer"
              onClick={() => navigate('/connect')}
            >
              Ver todos <FiArrowRight size={13} color="#1c9770" />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {trofeus.map(({ id, title, desc, conquistado }) => (
              <div
                key={id}
                className={`bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 text-center ${!conquistado ? 'opacity-50' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${conquistado ? 'bg-[#1c9770]' : 'bg-[rgba(28,151,112,0.1)]'}`}>
                  <FiAward size={18} color={conquistado ? '#fff' : '#1c9770'} />
                </div>
                <p className="font-bold text-[12px] text-[#1A202C] mb-1">{title}</p>
                <p className="text-[#6B7685] text-[12px]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Informações pessoais</h2>
            <button
              className="bg-transparent border-0 p-0 text-[#1c9770] text-[14px] cursor-pointer"
              onClick={() => navigate('/cadastro?editar=1')}
            >
              Alterar
            </button>
          </div>
          <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3">
            <div className="flex flex-col gap-3">
              {informacoesPessoais.map(({ label, valor }, index) => (
                <div key={label}>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[#6B7685] text-[14px]">{label}</span>
                    <span className="font-bold text-[14px] text-[#1A202C] text-right">
                      {valor}
                    </span>
                  </div>

                  {index < informacoesPessoais.length - 1 && (
                    <hr className="border-[#E4E7EB] m-0 mt-3" />
                  )}
                </div>
              ))}
              {mostrarDadosLegados && (<>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7685] text-[14px]">Peso</span>
                <span className="font-bold text-[14px] text-[#1A202C]">
                  {usuario?.peso ? `${usuario?.peso} kg` : '-'}
                </span>
              </div>
              <hr className="border-[#E4E7EB] m-0" />
              <div className="flex justify-between items-center">
                <span className="text-[#6B7685] text-[14px]">Altura</span>
                <span className="font-bold text-[14px] text-[#1A202C]">
                  {usuario?.altura ? `${usuario?.altura} cm` : '-'}
                </span>
              </div>
              <hr className="border-[#E4E7EB] m-0" />

              <div className="flex justify-between items-center">
                <span className="text-[#6B7685] text-[14px]">
                  Atividade física
                </span>

                <span className="font-bold text-[14px] text-[#1A202C]">
                  {nivelLabel('atividadeFisica', usuario?.atividadeFisica)}
                </span>
              </div>

              <hr className="border-[#E4E7EB] m-0" />

              <div className="flex justify-between items-center">
                <span className="text-[#6B7685] text-[14px]">
                  Consumo de água
                </span>

                <span className="font-bold text-[14px] text-[#1A202C]">
                  {nivelLabel('agua', usuario?.agua)}
                </span>
              </div>

              <hr className="border-[#E4E7EB] m-0" />

              <div className="flex justify-between items-center">
                <span className="text-[#6B7685] text-[14px]">
                  Qualidade do sono
                </span>

                <span className="font-bold text-[14px] text-[#1A202C]">
                  {nivelLabel('sono', usuario?.sono)}
                </span>
              </div>
              </>)}


            </div>
          </div>
        </section>

      </main>

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Perfil
