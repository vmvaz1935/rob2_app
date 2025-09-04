"""Motor de regras para avaliação do risco de viés.

Este módulo carrega as regras de decisão a partir de arquivos JSON localizados
na pasta `domain/` e provê funções para calcular o julgamento de cada
domínio e o julgamento global de uma avaliação.

As regras são representadas como árvores de decisão simples, onde cada
regra contém condições (campo `quando`) que mapeiam IDs de perguntas
para listas de respostas permitidas. A primeira regra cujas condições
forem satisfeitas define o julgamento. Caso nenhuma regra seja satisfeita,
aplica‑se a regra marcada como `default`.
"""

import json
from pathlib import Path
from typing import Dict, Tuple, List

ROOT_DIR = Path(__file__).resolve().parents[2]  # raiz do repositório
REGRAS_PATH = ROOT_DIR / "domain" / "regras.json"
REGRA_GLOBAL_PATH = ROOT_DIR / "domain" / "regra_global.json"

_RULES_CACHE = None
_GLOBAL_RULE_CACHE = None


def _load_rules():
    global _RULES_CACHE
    if _RULES_CACHE is None:
        with open(REGRAS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Converter lista para dicionário indexado por domínio
        rules_dict = {}
        for item in data.get("dominios", []):
            rules_dict[int(item["dominio"])] = item["avaliacao"]
        _RULES_CACHE = rules_dict
    return _RULES_CACHE


def _load_global_rules():
    global _GLOBAL_RULE_CACHE
    if _GLOBAL_RULE_CACHE is None:
        with open(REGRA_GLOBAL_PATH, "r", encoding="utf-8") as f:
            _GLOBAL_RULE_CACHE = json.load(f).get("global", {})
    return _GLOBAL_RULE_CACHE


def evaluate_domain(domain_type: int, respostas: Dict[str, str]) -> Tuple[str, str]:
    """Calcula o julgamento e a justificativa para um domínio específico.

    :param domain_type: número do domínio (1–5)
    :param respostas: dicionário de respostas, mapeando ID da pergunta para abreviação (Y/PY/PN/N/NI/NA)
    :returns: tupla `(julgamento, justificativa)`
    """
    regras = _load_rules()
    domain_rules = regras.get(domain_type, [])
    default_rule = None
    for rule in domain_rules:
        if rule.get("default"):
            default_rule = rule
            continue
        condicoes = rule.get("quando", {})
        match = True
        for pergunta_id, cond in condicoes.items():
            valores_validos = cond.get("in", [])
            valor = respostas.get(pergunta_id)
            if valor not in valores_validos:
                match = False
                break
        if match:
            return rule["resultado"], rule.get("justificativa", "")
    # Nenhuma regra específica se aplicou
    if default_rule:
        return default_rule["resultado"], default_rule.get("justificativa", "")
    # fallback
    return "Algumas preocupações", "Regra não definida para este domínio."


def evaluate_global(julgamentos: List[str]) -> str:
    """Determina o julgamento global a partir dos julgamentos dos domínios.

    A lógica aplicada é:
    * Se qualquer domínio for "Alto", o global é "Alto".
    * Caso contrário, se qualquer domínio for "Algumas preocupações", o global é "Algumas preocupações".
    * Se todos os domínios forem "Baixo", o global é "Baixo".

    :param julgamentos: lista com os julgamentos de cada domínio (tamanho 1–5)
    :returns: julgamento global
    """
    rules = _load_global_rules()
    # Verificar condição de alto risco
    for cond in rules.get("altoSe", []):
        if cond.get("qualquerDominio"):
            target = cond["qualquerDominio"]
            if target in julgamentos:
                return "Alto"
    # Verificar condição de algumas preocupações
    for cond in rules.get("algumasPreocupacoesSe", []):
        if cond.get("qualquerDominio"):
            target = cond["qualquerDominio"]
            if target in julgamentos:
                return "Algumas preocupações"
    # Verificar condição de baixo risco
    for cond in rules.get("baixoSe", []):
        if cond.get("todosDominios"):
            target = cond["todosDominios"]
            if all(j == target for j in julgamentos):
                return "Baixo"
    # Fallback
    return "Algumas preocupações"


if __name__ == "__main__":
    # Teste rápido do motor com respostas de exemplo
    example_answers = {"1.1": "Y", "1.2": "PY", "1.3": "N"}
    judgment, justif = evaluate_domain(1, example_answers)
    print(f"Julgamento Domínio 1: {judgment} (motivo: {justif})")
    global_j = evaluate_global([judgment])
    print(f"Julgamento global: {global_j}")