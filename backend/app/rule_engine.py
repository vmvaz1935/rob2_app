"""Rule engine responsible for computing RoB 2 judgements."""

import json
from pathlib import Path
from typing import Dict, Tuple, List

ROOT_DIR = Path(__file__).resolve().parents[2]
REGRAS_PATH = ROOT_DIR / "domain" / "regras.json"
REGRA_GLOBAL_PATH = ROOT_DIR / "domain" / "regra_global.json"

_RULES_CACHE = None
_GLOBAL_RULE_CACHE = None


def _load_rules():
    global _RULES_CACHE
    if _RULES_CACHE is None:
        with open(REGRAS_PATH, "r", encoding="utf-8") as file_obj:
            data = json.load(file_obj)
        rules_dict = {}
        for item in data.get("dominios", []):
            rules_dict[int(item["dominio"])] = item.get("avaliacao", [])
        _RULES_CACHE = rules_dict
    return _RULES_CACHE


def _load_global_rules():
    global _GLOBAL_RULE_CACHE
    if _GLOBAL_RULE_CACHE is None:
        with open(REGRA_GLOBAL_PATH, "r", encoding="utf-8") as file_obj:
            _GLOBAL_RULE_CACHE = json.load(file_obj).get("global", {})
    return _GLOBAL_RULE_CACHE


def _value_matches(condition: Dict[str, List[str]], value: str) -> bool:
    """Evaluate a single condition block against the provided value."""
    if value is None:
        # Treat missing answers as failure unless condition explicitly accepts "NI" or "NA"
        allowed_missing = set(condition.get("in", [])) & {"NI", "NA"}
        if allowed_missing:
            return True
        return False

    allowed = condition.get("in")
    if allowed is not None and value not in allowed:
        return False

    forbidden = condition.get("not_in")
    if forbidden is not None and value in forbidden:
        return False

    equals_value = condition.get("equals")
    if equals_value is not None and value != equals_value:
        return False

    not_equals_value = condition.get("not_equals")
    if not_equals_value is not None and value == not_equals_value:
        return False

    return True


def _rule_matches(rule: Dict[str, Dict[str, List[str]]], respostas: Dict[str, str]) -> bool:
    conditions = rule.get("quando", {})
    for pergunta_id, condition in conditions.items():
        if not _value_matches(condition, respostas.get(pergunta_id)):
            return False
    return True


def evaluate_domain(domain_type: int, respostas: Dict[str, str]) -> Tuple[str, str]:
    """Return the judgement and rationale for a specific domain."""
    regras = _load_rules()
    domain_rules = regras.get(domain_type, [])
    default_rule = None

    for rule in domain_rules:
        if rule.get("default"):
            default_rule = rule
            continue

        if _rule_matches(rule, respostas):
            return rule["resultado"], rule.get("justificativa", "")

    if default_rule:
        return default_rule.get("resultado", "Algumas preocupações"), default_rule.get("justificativa", "")

    return "Algumas preocupações", "Nenhuma regra foi aplicada para este domínio."


def evaluate_global(julgamentos: List[str]) -> str:
    """Determine the overall judgement from domain level results."""
    filtered = [j for j in julgamentos if j and j.upper() != "NA"]
    if not filtered:
        return "Algumas preocupações"

    rules = _load_global_rules()

    for cond in rules.get("altoSe", []):
        target = cond.get("qualquerDominio")
        if target and target in filtered:
            return "Alto"

    for cond in rules.get("algumasPreocupacoesSe", []):
        target = cond.get("qualquerDominio")
        if target and target in filtered:
            return "Algumas preocupações"

    for cond in rules.get("baixoSe", []):
        target = cond.get("todosDominios")
        if target and filtered and all(item == target for item in filtered):
            return "Baixo"

    return "Algumas preocupações"


if __name__ == "__main__":
    sample_answers = {"1.1": "Y", "1.2": "Y", "1.3": "N"}
    result, reason = evaluate_domain(1, sample_answers)
    print(f"Domínio 1: {result} ({reason})")
    print("Global:", evaluate_global([result]))
