"""Geração de relatórios (PDF/DOCX).

Fornece utilitários para gerar um relatório PDF simples a partir de uma
instância de `Evaluation`. O PDF inclui identificação do estudo/resultado,
domínios, respostas, observações por item e julgamentos.
"""

from io import BytesIO
from typing import Dict

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from docx import Document

from . import models


def _answer_map() -> Dict[str, str]:
    return {
        "Y": "Sim",
        "PY": "Provavelmente sim",
        "PN": "Provavelmente não",
        "N": "Não",
        "NI": "Sem informação",
        "NA": "Não se aplica",
    }


def generate_pdf_report(avaliacao: models.Evaluation) -> bytes:
    """Gera um relatório PDF para uma avaliação.

    Inclui identificação do artigo/estudo, domínio avaliado, respostas e
    observações por item, além dos julgamentos por domínio e global.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    estudo = avaliacao.resultado.estudo
    resultado = avaliacao.resultado

    # Cabeçalho: identificação
    story.append(Paragraph("Relatório de Avaliação RoB 2", styles["Title"]))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(f"Artigo/Referência: {estudo.referencia}", styles["Normal"]))
    story.append(Paragraph(f"Domínio do estudo: {estudo.desenho or '-'}", styles["Normal"]))
    story.append(Paragraph(f"Desfecho avaliado: {resultado.desfecho}", styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    # Pre‑considerações
    if avaliacao.pre_consideracoes:
        story.append(Paragraph("Pré‑considerações", styles["Heading2"]))
        story.append(Paragraph(avaliacao.pre_consideracoes, styles["Normal"]))
        story.append(Spacer(1, 0.4*cm))

    # Tabela por domínio com observações por item
    ans_map = _answer_map()
    for dom in sorted(avaliacao.dominios, key=lambda d: d.tipo):
        story.append(Paragraph(f"Domínio {dom.tipo}", styles["Heading2"]))

        itens = []
        # Cabeçalho
        itens.append(["Item", "Resposta", "Observação"])
        obs_map = dom.observacoes_itens or {}
        for pergunta_id, resposta in dom.respostas.items():
            itens.append([
                pergunta_id,
                ans_map.get(resposta, resposta),
                (obs_map.get(pergunta_id) or "-")
            ])
        table = Table(itens, colWidths=[3*cm, 4*cm, 9*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
            ("GRID", (0,0), (-1,-1), 0.25, colors.grey),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.2*cm))
        # Julgamento do domínio
        story.append(Paragraph(f"Julgamento do domínio: {dom.julgamento or '-'}", styles["Italic"]))
        story.append(Spacer(1, 0.4*cm))

    # Julgamento global
    story.append(Paragraph("Julgamento global", styles["Heading2"]))
    story.append(Paragraph(avaliacao.julgamento_global or "-", styles["Normal"]))
    if avaliacao.justificativa_global:
        story.append(Paragraph(avaliacao.justificativa_global, styles["Normal"]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_docx_report(avaliacao: models.Evaluation) -> bytes:
    """Generate a DOCX narrative report for an evaluation."""
    buffer = BytesIO()
    document = Document()

    estudo = avaliacao.resultado.estudo
    resultado = avaliacao.resultado

    document.add_heading("Relatório de Avaliação RoB 2", level=1)
    document.add_paragraph(f"Artigo/Referência: {estudo.referencia}")
    document.add_paragraph(f"Domínio do estudo: {estudo.desenho or '-'}")
    document.add_paragraph(f"Desfecho avaliado: {resultado.desfecho}")

    if avaliacao.pre_consideracoes:
        document.add_heading("Pré-considerações", level=2)
        document.add_paragraph(avaliacao.pre_consideracoes)

    ans_map = _answer_map()
    for dom in sorted(avaliacao.dominios, key=lambda item: item.tipo):
        document.add_heading(f"Domínio {dom.tipo}", level=2)
        table = document.add_table(rows=1, cols=3)
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = "Item"
        hdr_cells[1].text = "Resposta"
        hdr_cells[2].text = "Observação"
        obs_map = dom.observacoes_itens or {}
        for pergunta_id, resposta in (dom.respostas or {}).items():
            row_cells = table.add_row().cells
            row_cells[0].text = str(pergunta_id)
            row_cells[1].text = ans_map.get(resposta, resposta or "-")
            row_cells[2].text = str(obs_map.get(pergunta_id) or "-")
        document.add_paragraph(f"Julgamento do domínio: {dom.julgamento or '-'}")
        if dom.justificativa:
            document.add_paragraph(dom.justificativa)
        document.add_paragraph("")

    document.add_heading("Julgamento global", level=2)
    document.add_paragraph(avaliacao.julgamento_global or '-')
    if avaliacao.justificativa_global:
        document.add_paragraph(avaliacao.justificativa_global)
    if avaliacao.direcao_global:
        document.add_paragraph(f"Direção do viés: {avaliacao.direcao_global.value}")

    document.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
