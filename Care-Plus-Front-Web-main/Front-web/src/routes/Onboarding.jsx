import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'

const Onboarding = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 0,
      title: 'Boost Care',
      subtitle: 'Jornada Gamificada do Cuidado Contínuo',
      description:
        'Transforme o cuidado em hábito. Na Boost Care, suas ações diárias como andar, se hidratar e descansar viram progresso real.',
      color: '#1c9770',
    },
    {
      id: 1,
      title: 'Impulso+',
      subtitle: 'Seu incentivo diário para seguir em frente',
      description:
        'Acessando o app todos os dias, você ativa o Impulso+ e recebe surpresas que mantêm sua motivação. Pequenos gestos, grandes conquistas.',
      color: '#93CB52',
    },
    {
      id: 2,
      title: 'Missões & Recompensas',
      subtitle: 'Missões personalizadas para o seu perfil',
      description:
        'Complete missões diárias, acompanhe o ranking e experimente resgates demonstrativos com seus troféus.',
      color: '#7AD1C3',
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      navigate('/cadastro')
    }
  }

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    } else {
      navigate('/lgpd')
    }
  }

  const { title, subtitle, description, color } = slides[currentSlide]

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <TopBar showPoints={false} />

      <main className="w-full px-4 lg:px-8 py-4 flex flex-col flex-1 justify-between">

        <div className="flex justify-center flex-1">
          <div className="w-full lg:max-w-lg flex flex-col justify-center">

            <div
              className="rounded-2xl p-10 text-center mb-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[320px] transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                boxShadow: `0 12px 32px ${color}40`,
              }}
            >
              <div className="absolute -top-[40px] -right-[40px] w-[180px] h-[180px] bg-white/[0.08] rounded-full" />
              <div className="absolute -bottom-[60px] -left-[20px] w-[160px] h-[160px] bg-white/[0.05] rounded-full" />

              <h1 className="font-bold text-white text-[28px] mb-2 relative z-10">{title}</h1>
              <p className="font-medium text-[14px] text-white/85 relative z-10">{subtitle}</p>
            </div>

            <p className="text-center text-[15px] text-[#4A5568] leading-[1.7] mb-4">
              {description}
            </p>

            <div className="flex justify-center gap-2 mb-4">
              {slides.map((_, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${currentSlide === index ? 'w-6 bg-[#1c9770]' : 'w-2 bg-[#CDD3DA]'}`}
                />
              ))}
            </div>

          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full lg:max-w-lg">
            <div className="flex gap-3">
              <button
                className="font-bold rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-[#6B7685] bg-white border-2 border-[#E4E7EB] cursor-pointer"
                onClick={handleBack}
                aria-label="Voltar"
              >
                <FiArrowLeft size={20} />
              </button>
              <button
                className="flex-1 font-bold rounded-xl py-3 flex items-center justify-center gap-2 text-white text-[15px] bg-[#1c9770] shadow-[0_4px_12px_rgba(28,151,112,0.3)] cursor-pointer"
                onClick={handleNext}
              >
                {currentSlide < slides.length - 1 ? (
                  <>Continuar <FiArrowRight size={18} /></>
                ) : (
                  <>Começar <FiArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default Onboarding
