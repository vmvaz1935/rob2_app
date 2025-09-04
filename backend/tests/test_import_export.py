from backend.app import import_export


def test_Import_excel_deve_mapear_Q1_1_para_resposta_1_1():
    mapping = import_export.load_mapping()
    dominio1_cols = mapping['abas']['Dominio1']['colunas']
    assert dominio1_cols.get('Q1_1') == "Dominio[1].respostas[1.1]"


def test_Export_excel_deve_emitir_colunas_template():
    mapping = import_export.load_mapping()
    resumo = mapping['abas']['Resumo']['colunas']
    assert 'JulgamentoGlobal' in resumo
    assert resumo['JulgamentoGlobal'] == "AvaliacaoRob2.julgamentoGlobal"