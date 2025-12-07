import math

# Interest rates (example slab logic)
DEFAULT_RATES = {
    3: 0.13,
    6: 0.14,
    9: 0.15,
    12: 0.16
}

GST_RATE = 0.18  # 18% GST


def calculate_emi(amount: float, tenure: int) -> dict:
    """
    Returns EMI, interest, total cost using the standard EMI formula.
    EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    """

    if tenure not in DEFAULT_RATES:
        rate = DEFAULT_RATES[6]   # fallback
    else:
        rate = DEFAULT_RATES[tenure]

    monthly_rate = rate / 12

    # EMI formula
    emi = amount * monthly_rate * (1 + monthly_rate)**tenure / ((1 + monthly_rate)**tenure - 1)

    total_amount = emi * tenure
    interest_amount = total_amount - amount
    gst = interest_amount * GST_RATE
    final_cost = amount + interest_amount + gst

    return {
        "tenure": tenure,
        "rate": rate,
        "emi": round(emi, 2),
        "interest": round(interest_amount, 2),
        "gst": round(gst, 2),
        "total_cost": round(final_cost, 2)
    }


def get_emi_options(amount: float) -> list:
    tenures = [3, 6, 9, 12]

    results = []
    for t in tenures:
        results.append(calculate_emi(amount, t))

    return results
