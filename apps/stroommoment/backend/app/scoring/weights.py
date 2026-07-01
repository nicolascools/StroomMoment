WEIGHTS_WITHOUT_PRICE: dict[str, dict[str, float]] = {
    "balanced": {
        "renewable_score": 0.45,
        "low_load_score": 0.35,
        "convenience_score": 0.20,
    },
    "renewable": {
        "renewable_score": 0.70,
        "low_load_score": 0.15,
        "convenience_score": 0.15,
    },
    "low_load": {
        "renewable_score": 0.20,
        "low_load_score": 0.65,
        "convenience_score": 0.15,
    },
    "cheapest": {
        "renewable_score": 0.45,
        "low_load_score": 0.35,
        "convenience_score": 0.20,
    },
}

WEIGHTS_WITH_PRICE: dict[str, dict[str, float]] = {
    "balanced": {
        "price_score": 0.35,
        "renewable_score": 0.25,
        "low_load_score": 0.20,
        "convenience_score": 0.20,
    },
    "renewable": {
        "renewable_score": 0.70,
        "price_score": 0.10,
        "low_load_score": 0.10,
        "convenience_score": 0.10,
    },
    "low_load": {
        "low_load_score": 0.65,
        "price_score": 0.10,
        "renewable_score": 0.10,
        "convenience_score": 0.15,
    },
    "cheapest": {
        "price_score": 0.85,
        "convenience_score": 0.15,
    },
}


def weights_for_mode(mode: str, price_available: bool) -> dict[str, float]:
    weights = WEIGHTS_WITH_PRICE if price_available else WEIGHTS_WITHOUT_PRICE
    return weights.get(mode, weights["balanced"])
