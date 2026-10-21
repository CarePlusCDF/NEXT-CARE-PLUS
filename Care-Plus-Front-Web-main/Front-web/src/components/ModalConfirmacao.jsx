const ModalConfirmacao = ({
    aberto,
    onClose,
    onConfirm,
    titulo,
    descricao,
    textoCancelar = "Cancelar",
    textoConfirmar = "Confirmar",
    mostrarConfirmar = true
}) => {

    if (!aberto) return null

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

            <div className="bg-white rounded-2xl w-full max-w-[340px] p-5">

                <h2 className="font-bold text-[18px] text-[#1A202C] mb-2">
                    {titulo}
                </h2>

                <p className="text-[14px] text-[#6B7685] mb-5">
                    {descricao}
                </p>

                <div className="flex gap-2">

                    <button
                        onClick={onClose}
                        className={`flex-1 h-11 rounded-xl font-medium ${
                            mostrarConfirmar
                                ? "border border-[#E4E7EB] text-[#1A202C]"
                                : "bg-[#1c9770] text-white"
                        }`}
                    >
                        {textoCancelar}
                    </button>

                    {mostrarConfirmar && (
                        <button
                            onClick={onConfirm}
                            className="flex-1 h-11 rounded-xl bg-[#1c9770] text-white font-medium"
                        >
                            {textoConfirmar}
                        </button>
                    )}

                </div>

            </div>

        </div>

    )
}

export default ModalConfirmacao
