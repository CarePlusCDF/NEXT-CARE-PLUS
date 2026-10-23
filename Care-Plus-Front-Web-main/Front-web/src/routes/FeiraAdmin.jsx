import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiActivity, FiSun } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import { API_URL, apiFetch, post } from '../services/api.js'

export default function FeiraAdmin() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [carteirinha, setCarteirinha] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const response = await apiFetch(`${API_URL}/fair/admin`)
    const result = await response.json()
    if (!response.ok) throw new Error(result.detail || 'Não foi possível consultar a demonstração.')
    setStatus(result)
  }

  useEffect(() => {
    const initial = setTimeout(() => load().catch(err => setError(err.message)), 0)
    const timer = setInterval(() => load().catch(err => setError(err.message)), 5000)
    return () => { clearTimeout(initial); clearInterval(timer) }
  }, [])

  async function submit(path, values) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await post(path, values)
      await load()
      setCarteirinha('')
      setMessage(path.endsWith('/start') ? 'Vez iniciada. Aguarde os dois aparelhos sincronizarem antes do teste.' : 'Vez encerrada. A próxima pessoa pode começar com a própria conta.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="min-h-screen bg-[#F4F6F8]">
    <TopBar showPoints={false} />
    <main className="mx-auto max-w-2xl px-4 py-8">
      <button className="mb-5 flex items-center gap-2 font-semibold text-[#126C51]" onClick={() => navigate('/connect')}><FiArrowLeft /> Voltar ao Connect+</button>
      <div className="rounded-2xl bg-[#126C51] p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-white/75">Controle da feira</p>
        <h1 className="mt-1 text-3xl font-bold">Uma pessoa por vez</h1>
        <p className="mt-2 text-sm text-white/85">Cada participante usa sua própria conta. Os aparelhos são transferidos somente ao iniciar uma nova vez.</p>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 font-medium text-red-800">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl border border-green-300 bg-green-50 p-4 font-medium text-green-900">{message}</p>}

      {status && <div className="mt-5 rounded-2xl border border-[#C4EBD9] bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#567368]">Participante atual</p>
        <h2 className="mt-1 text-xl font-bold text-[#1A202C]">{status.activeAccount ? `${status.activeName} (${status.activeAccount})` : 'Nenhum participante em teste'}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {status.devices.map(device => <div key={device.id} className="flex items-center gap-3 rounded-xl bg-[#F0FBF6] p-3">
            <span className="rounded-lg bg-white p-2 text-[#126C51]">{device.kind === 'band' ? <FiActivity size={22} /> : <FiSun size={22} />}</span>
            <div><p className="font-bold">{device.kind === 'band' ? 'Pulseira' : 'Luminária'}</p><p className="text-xs text-[#4A5568]">{device.status === 'online' ? 'Online' : 'Offline'} · {device.synchronized ? 'Pronto para teste' : 'Aguardando sincronização'}</p></div>
          </div>)}
        </div>
        {status.activeAccount ? <button disabled={busy} onClick={() => submit('/fair/admin/end', {})} className="mt-5 w-full rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition-colors hover:bg-red-800 disabled:opacity-50">Encerrar a vez</button> : <div className="mt-5">
          <label htmlFor="fair-account" className="mb-2 block font-bold">Carteirinha da próxima pessoa</label>
          <input id="fair-account" value={carteirinha} onChange={event => setCarteirinha(event.target.value)} className="w-full rounded-xl border border-[#B7DDCD] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#147C5C]" placeholder="Digite a carteirinha já cadastrada" />
          <button disabled={busy || !carteirinha.trim()} onClick={() => submit('/fair/admin/start', { carteirinha: carteirinha.trim() })} className="mt-3 w-full rounded-xl bg-[#126C51] px-5 py-3 font-bold text-white transition-colors hover:bg-[#0F6249] disabled:opacity-50">Iniciar demonstração</button>
        </div>}
      </div>}
    </main>
  </div>
}
