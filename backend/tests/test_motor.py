import pytest
from backend.app import rule_engine


def test_MotorDom1_deve_retornar_Baixo_quando_ocultacao_ok_sem_desequilibrio():
    respostas = {"1.1": "Y", "1.2": "PY", "1.3": "N"}
    julgamento, justificativa = rule_engine.evaluate_domain(1, respostas)
    assert julgamento == "Baixo"


def test_MotorGlobal_deve_retornar_Alto_se_algum_dominio_Alto():
    # Simula julgamentos dos domínios [Baixo, Alto, Baixo, Baixo, Baixo]
    julgamentos = ["Baixo", "Alto", "Baixo", "Baixo", "Baixo"]
    global_j = rule_engine.evaluate_global(julgamentos)
    assert global_j == "Alto"