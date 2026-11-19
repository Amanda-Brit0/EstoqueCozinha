import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const VERMELHO = [123, 13, 30]
const DOURADO  = [212, 175, 55]
const CREME    = [242, 237, 228]

function header(doc, title) {
  // Fundo header
  doc.setFillColor(...VERMELHO)
  doc.rect(0, 0, 210, 22, 'F')

  // Título
  doc.setTextColor(...DOURADO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Fundação Lar de São Bento — Casa Dom Macário', 105, 10, { align: 'center' })
  doc.setFontSize(9)
  doc.text(title, 105, 17, { align: 'center' })

  // Footer
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(...VERMELHO)
  doc.rect(0, pageH - 12, 210, 12, 'F')
  doc.setTextColor(...DOURADO)
  doc.setFontSize(8)
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    105,
    pageH - 4,
    { align: 'center' }
  )
}

export function gerarRelatorioEstoque(itens) {
  const doc = new jsPDF()
  header(doc, 'Relatório de Estoque — Cozinha')

  autoTable(doc, {
    startY: 26,
    head: [['ID', 'Código', 'Nome', 'Tipo', 'Qtd', 'Data Entrada', 'Status', 'Observação']],
    body: itens.map(i => [
      i.id,
      i.codigoBarras || '—',
      i.nome,
      i.tipo,
      i.quantidade,
      i.dataEntrada ? format(new Date(i.dataEntrada), 'dd/MM/yyyy') : '—',
      i.status,
      i.observacao || '—',
    ]),
    headStyles: { fillColor: VERMELHO, textColor: DOURADO, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 10, 10] },
    alternateRowStyles: { fillColor: CREME },
    columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 32 } },
    margin: { left: 8, right: 8 },
  })

  doc.save(`estoque-cozinha-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export function gerarRelatorioHistorico(historico) {
  const doc = new jsPDF({ orientation: 'landscape' })
  header(doc, 'Histórico de Alterações — Área Administrativa')

  autoTable(doc, {
    startY: 26,
    head: [['Data/Hora', 'Tipo', 'ID', 'Campo', 'Antes', 'Depois']],
    body: historico.flatMap(h => {
      if (h.tipo === 'exclusao') {
        return [[
          format(new Date(h.dataHora), 'dd/MM/yyyy HH:mm'),
          'Exclusão',
          h.id,
          '—',
          h.antes?.nome || '—',
          'EXCLUÍDO',
        ]]
      }
      const campos = ['nome','tipo','quantidade','dataEntrada','codigoBarras','observacao']
      const linhas = campos
        .filter(c => h.antes[c] !== h.depois[c])
        .map(c => [
          format(new Date(h.dataHora), 'dd/MM/yyyy HH:mm'),
          'Edição',
          h.id,
          c,
          String(h.antes[c] ?? '—'),
          String(h.depois[c] ?? '—'),
        ])
      return linhas.length ? linhas : [[
        format(new Date(h.dataHora), 'dd/MM/yyyy HH:mm'),
        'Edição',
        h.id, '—', '—', '—',
      ]]
    }),
    headStyles: { fillColor: VERMELHO, textColor: DOURADO, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: CREME },
    margin: { left: 8, right: 8 },
  })

  doc.save(`historico-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
