import { useRef, useState } from 'react'
import { FiActivity, FiDroplet, FiSun } from 'react-icons/fi'
import { useCare } from '../services/CareContext.jsx'
import { post } from '../services/api.js'

const colors = [
  ['automatico', 'Automática', null],
  ['roxa', 'Roxa', '#FF00FF'],
  ['azul', 'Azul', '#0000FF'],
  ['verde', 'Verde', '#00FF00'],
  ['apagada', 'Apagar', '#9BA3AE'],
]
const outcomes = {
  accepted: 'Atividade registrada.',
  completed: 'Missão concluída!',
  cancelled: 'Seleção cancelada. Seu progresso foi preservado.',
  no_selection: 'Escolha uma missão no painel acima primeiro.',
  selection_changed: 'A seleção mudou. Atualize e tente novamente.',
  selection_expired: 'Essa seleção expirou. Escolha uma missão de hoje.',
  mission_not_active: 'Essa missão não está mais ativa.',
  already_completed: 'Essa missão já foi concluída.',
}

export default function ConnectSimulator() {
  const { data, error: connectionError, refresh } = useCare()
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [steps, setSteps] = useState('20')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  if (!data) return null
  const activeColor = data.luminaria.modo === 'manual' ? data.luminaria.cor : 'automatico'
  const disabled = busy || Boolean(connectionError)
  async function send(path, values, success) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const result = await post(path, { generation: data.generation, ...values })
      setMessage(success || outcomes[result.result] || 'Comando registrado.')
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  function emulate(type, extra = {}) {
    send('/connect/emulate', {
      id: crypto.randomUUID(), type,
      selection_token: data.selection?.token || '', ...extra,
    })
  }
  const button = 'rounded-lg border border-[#B7DDCD] bg-white px-4 py-3 text-sm font-bold text-[#126C51] hover:bg-[#E2F5EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147C5C] disabled:opacity-50 disabled:cursor-not-allowed'
  return (
    <section aria-labelledby="connect-controls-title" className="mb-4 rounded-xl border border-[#C4EBD9] bg-white p-4 shadow-brand-card md:p-6">
      <h2 id="connect-controls-title" className="text-lg font-bold text-[#1A202C]">Controle pelo site</h2>
      <p className="mt-1 text-sm text-[#6B7685]">Use a luminária e experimente a pulseira mesmo sem o aparelho.</p>
      <div className="mt-5">
        <h3 className="flex items-center gap-2 font-bold text-[#245344]"><FiSun aria-hidden="true" /> Cor da luminária</h3>
        <p className="mt-1 text-sm text-[#6B7685]">A cor escolhida vale até o fim do dia. No automático, ela acompanha suas metas.</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Cor da luminária">
          {colors.map(([color, label, hex]) => <button key={color} type="button" disabled={disabled || Boolean(data.sos)} aria-pressed={activeColor === color} className={`${button} flex items-center gap-2 ${activeColor === color ? 'ring-2 ring-[#147C5C]' : ''}`} onClick={() => send('/connect/lamp', { color }, color === 'automatico' ? 'Luminária seguindo as metas.' : 'Cor solicitada. Aguarde a sincronização da luminária.')}>
            {hex && <span aria-hidden="true" className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: hex }} />}{label}
          </button>)}
        </div>
        <p className="mt-3 text-sm text-[#6B7685]">{data.sos ? 'O SOS mantém a luz vermelha até encerrar o alerta no painel acima.' : data.luminaria.confirmada ? `Luminária confirmou: ${data.luminaria.label}.` : 'A cor só chega ao aparelho quando a luminária estiver online e sincronizar.'}</p>
      </div>
      <div className="mt-5 border-t border-[#E4E7EB] pt-5">
        <h3 className="flex items-center gap-2 font-bold text-[#245344]"><FiActivity aria-hidden="true" /> Emular pulseira</h3>
        <p className="mt-1 text-sm text-[#6B7685]">Água, passos, missões e SOS são salvos na demonstração. O status da pulseira física continua independente.</p>
        {!data.demo ? <button type="button" disabled={disabled} className={`${button} mt-3`} onClick={() => send('/demo/mode', { demo: true }, 'Demonstração ativada. Os controles já podem ser usados.')}>Ativar demonstração para emular</button> : <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" className={button} disabled={disabled} onClick={() => emulate('water')}><FiDroplet className="mr-1 inline" aria-hidden="true" /> Botão 1 · Água +{data.copoAguaMl} ml</button>
            <button type="button" className={button} disabled={disabled || !data.selection} onClick={() => emulate('confirm')}>Botão 2 · Confirmar missão</button>
            <button type="button" className={button} disabled={disabled || !data.selection} onClick={() => emulate('cancel')}>Botão 3 · Cancelar seleção</button>
            <button type="button" className={`${button} border-red-300 text-red-700 hover:bg-red-50`} disabled={disabled || Boolean(data.sos)} onClick={() => emulate('sos')}>Botão SOS · Simular alerta</button>
          </div>
          <p className="mt-2 text-xs text-[#6B7685]">Selecione a missão no painel acima para confirmar ou cancelar. O SOS sinaliza no site e na luminária; nenhum contato externo é acionado.</p>
          <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); const count = Number(steps); if (Number.isInteger(count) && count >= 1 && count <= 1000) emulate('steps', { steps: count }) }}>
            <label className="text-sm font-semibold text-[#245344]">Passos a adicionar
              <input type="number" min="1" max="1000" step="1" required value={steps} disabled={disabled} onChange={event => setSteps(event.target.value)} className="mt-1 block w-36 rounded-lg border border-[#B7DDCD] px-3 py-3 text-[#1A202C]" />
            </label>
            <button type="submit" disabled={disabled} className={button}>Adicionar passos</button>
          </form>
          <p className="mt-2 text-xs text-[#6B7685]">Para voltar às cores das metas após testar uma cor, escolha Automática.</p>
        </>}
      </div>
      <div aria-live="polite" className="mt-3 text-sm text-[#126C51]">{busy ? 'Enviando comando…' : message}</div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {connectionError && <p role="alert" className="mt-2 text-sm text-red-700">Aguarde a conexão com a API para enviar comandos.</p>}
    </section>
  )
}
