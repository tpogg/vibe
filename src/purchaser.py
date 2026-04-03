"""Domain purchase integration for GoDaddy and Dynadot registrars."""

import requests
from dataclasses import dataclass
from src.config import Config


@dataclass
class PurchaseResult:
    domain: str
    success: bool
    registrar: str
    price: float = 0.0
    message: str = ""
    order_id: str = ""


class GoDaddyClient:
    """GoDaddy API client for availability checks and domain registration."""

    BASE_URL = "https://api.godaddy.com/v1"

    def __init__(self):
        self.session = requests.Session()
        if Config.GODADDY_API_KEY and Config.GODADDY_API_SECRET:
            self.session.headers["Authorization"] = (
                f"sso-key {Config.GODADDY_API_KEY}:{Config.GODADDY_API_SECRET}"
            )
        self.enabled = bool(Config.GODADDY_API_KEY and Config.GODADDY_API_SECRET)

    def check_availability(self, domain: str) -> dict:
        """Check if a domain is available for registration."""
        if not self.enabled:
            return {"available": False, "error": "GoDaddy API not configured"}
        try:
            resp = self.session.get(
                f"{self.BASE_URL}/domains/available",
                params={"domain": domain},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "available": data.get("available", False),
                    "price": data.get("price", 0) / 1_000_000,  # GoDaddy returns micros
                    "currency": data.get("currency", "USD"),
                }
            return {"available": False, "error": f"HTTP {resp.status_code}"}
        except requests.RequestException as e:
            return {"available": False, "error": str(e)}

    def purchase(self, domain: str, contact_info: dict) -> PurchaseResult:
        """Purchase a domain through GoDaddy.

        contact_info should contain: firstName, lastName, email, phone,
        address1, city, state, postalCode, country
        """
        if not self.enabled:
            return PurchaseResult(domain=domain, success=False, registrar="godaddy",
                                 message="GoDaddy API not configured")

        # First check availability and price
        avail = self.check_availability(domain)
        if not avail.get("available"):
            return PurchaseResult(domain=domain, success=False, registrar="godaddy",
                                 message=f"Not available: {avail.get('error', 'taken')}")

        price = avail.get("price", 0)
        if price > Config.MAX_PRICE_USD:
            return PurchaseResult(domain=domain, success=False, registrar="godaddy",
                                 price=price,
                                 message=f"Price ${price} exceeds max ${Config.MAX_PRICE_USD}")

        body = {
            "domain": domain,
            "consent": {"agreementKeys": ["DNRA"], "agreedBy": contact_info.get("email", ""), "agreedAt": ""},
            "contactAdmin": contact_info,
            "contactBilling": contact_info,
            "contactRegistrant": contact_info,
            "contactTech": contact_info,
            "period": 1,
            "renewAuto": False,
        }

        try:
            resp = self.session.post(
                f"{self.BASE_URL}/domains/purchase",
                json=body,
                timeout=30,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return PurchaseResult(
                    domain=domain, success=True, registrar="godaddy",
                    price=price, order_id=str(data.get("orderId", "")),
                    message="Purchase successful",
                )
            return PurchaseResult(
                domain=domain, success=False, registrar="godaddy",
                price=price, message=f"HTTP {resp.status_code}: {resp.text[:200]}",
            )
        except requests.RequestException as e:
            return PurchaseResult(domain=domain, success=False, registrar="godaddy",
                                 message=str(e))


class DynadotClient:
    """Dynadot API client for availability, registration, and backorders."""

    BASE_URL = "https://api.dynadot.com/api3.json"

    def __init__(self):
        self.session = requests.Session()
        self.enabled = bool(Config.DYNADOT_API_KEY)

    def _call(self, params: dict) -> dict:
        params["key"] = Config.DYNADOT_API_KEY
        try:
            resp = self.session.get(self.BASE_URL, params=params, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            return {"error": f"HTTP {resp.status_code}"}
        except requests.RequestException as e:
            return {"error": str(e)}

    def check_availability(self, domain: str) -> dict:
        if not self.enabled:
            return {"available": False, "error": "Dynadot API not configured"}
        data = self._call({"command": "search", "domain0": domain})
        results = data.get("SearchResponse", {}).get("SearchResults", [])
        if results:
            return {
                "available": results[0].get("Available", "") == "yes",
                "price": results[0].get("Price", 0),
            }
        return {"available": False, "error": "No results"}

    def purchase(self, domain: str) -> PurchaseResult:
        if not self.enabled:
            return PurchaseResult(domain=domain, success=False, registrar="dynadot",
                                 message="Dynadot API not configured")

        avail = self.check_availability(domain)
        if not avail.get("available"):
            return PurchaseResult(domain=domain, success=False, registrar="dynadot",
                                 message="Not available")

        price = avail.get("price", 0)
        if price > Config.MAX_PRICE_USD:
            return PurchaseResult(domain=domain, success=False, registrar="dynadot",
                                 price=price,
                                 message=f"Price ${price} exceeds max ${Config.MAX_PRICE_USD}")

        data = self._call({"command": "register", "domain": domain, "duration": 1})
        success = data.get("RegisterResponse", {}).get("Status") == "success"
        return PurchaseResult(
            domain=domain, success=success, registrar="dynadot", price=price,
            message="Purchase successful" if success else data.get("error", "Registration failed"),
        )

    def backorder(self, domain: str) -> PurchaseResult:
        """Place a backorder for a domain that's about to expire."""
        if not self.enabled:
            return PurchaseResult(domain=domain, success=False, registrar="dynadot",
                                 message="Dynadot API not configured")
        data = self._call({"command": "backorder", "domain": domain})
        success = "error" not in data
        return PurchaseResult(
            domain=domain, success=success, registrar="dynadot",
            message="Backorder placed" if success else data.get("error", "Backorder failed"),
        )


class DomainPurchaser:
    """Unified purchaser that tries available registrars."""

    def __init__(self):
        self.godaddy = GoDaddyClient()
        self.dynadot = DynadotClient()

    def check_availability(self, domain: str) -> list[dict]:
        """Check availability across all configured registrars."""
        results = []
        if self.godaddy.enabled:
            result = self.godaddy.check_availability(domain)
            result["registrar"] = "godaddy"
            results.append(result)
        if self.dynadot.enabled:
            result = self.dynadot.check_availability(domain)
            result["registrar"] = "dynadot"
            results.append(result)
        return results

    def purchase_cheapest(self, domain: str, contact_info: dict | None = None) -> PurchaseResult:
        """Try to purchase from the cheapest available registrar."""
        availability = self.check_availability(domain)
        available = [a for a in availability if a.get("available")]

        if not available:
            return PurchaseResult(domain=domain, success=False, registrar="none",
                                 message="Domain not available at any registrar")

        # Sort by price, pick cheapest
        available.sort(key=lambda a: a.get("price", float("inf")))
        best = available[0]

        if best["registrar"] == "godaddy" and contact_info:
            return self.godaddy.purchase(domain, contact_info)
        elif best["registrar"] == "dynadot":
            return self.dynadot.purchase(domain)

        return PurchaseResult(domain=domain, success=False, registrar=best["registrar"],
                              message="Registrar not fully configured for purchase")

    def backorder(self, domain: str) -> PurchaseResult:
        """Place a backorder (Dynadot only for now)."""
        return self.dynadot.backorder(domain)
