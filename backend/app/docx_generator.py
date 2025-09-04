"""Geração de relatórios DOCX.

Este módulo contém uma função que recebe uma avaliação e produz um documento
DOCX narrativo em português. Para simplificação, a função retorna uma
string ou bytes indicando que não foi implementada.
"""

from . import models


def generate_docx_report(avaliacao: models.Evaluation) -> bytes:
    """Gera um relatório DOCX narrativo para uma avaliação.

    :param avaliacao: instância de Evaluation com domínios e julgamentos
    :returns: bytes do arquivo DOCX
    """
    # TODO: utilizar python-docx para compor o relatório com base nas respostas
    raise NotImplementedError