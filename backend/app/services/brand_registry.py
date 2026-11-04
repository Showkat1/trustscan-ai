"""Brand and official-domain registry for URL impersonation checks.

Ordering is deliberate: India first, then the legacy Pakistan set this
engine shipped with, then global brands. Detection returns brand keys in
that order so that an India-relevant impersonation is surfaced before a
generic global one.

Aliases are matched on token boundaries, not as raw substrings. That is
what keeps ``sbi`` out of "subsidiary" and ``rbi`` out of "arbitrary",
which a naive ``brand in url`` check gets wrong.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

INDIA = "IN"
PAKISTAN = "PK"
GLOBAL = "GL"


@dataclass(frozen=True)
class Brand:
    key: str
    region: str
    domains: tuple[str, ...]
    aliases: tuple[str, ...]
    # Some aliases are ordinary words ("chase", "wise", "steam").
    # Match those against the hostname only to avoid flagging paths.
    host_only: bool = False


BRANDS: tuple[Brand, ...] = (
    # ---------------------------------------------------------
    # India — banking and payments
    # ---------------------------------------------------------
    Brand(
        "hdfc",
        INDIA,
        ("hdfcbank.com", "hdfc.com", "hdfclife.com", "hdfcsec.com", "hdfcergo.com"),
        ("hdfc", "hdfcbank"),
    ),
    Brand(
        "icici",
        INDIA,
        ("icicibank.com", "icicidirect.com", "icicilombard.com", "iciciprulife.com"),
        ("icici", "icicibank"),
    ),
    Brand(
        "sbi",
        INDIA,
        ("sbi.co.in", "onlinesbi.sbi", "onlinesbi.com", "sbicard.com", "sbiyono.sbi"),
        ("sbi", "onlinesbi", "sbicard"),
    ),
    Brand(
        "axis",
        INDIA,
        ("axisbank.com", "axisbank.co.in"),
        ("axisbank", "axis-bank"),
    ),
    Brand(
        "kotak",
        INDIA,
        ("kotak.com", "kotakbank.com"),
        ("kotak", "kotakbank"),
    ),
    Brand(
        "pnb",
        INDIA,
        ("pnbindia.in", "netpnb.com"),
        ("pnb", "punjabnationalbank", "netpnb"),
    ),
    Brand(
        "baroda",
        INDIA,
        ("bankofbaroda.in", "bankofbaroda.com", "bankofbaroda.co.in"),
        ("bankofbaroda", "baroda"),
    ),
    Brand(
        "canara",
        INDIA,
        ("canarabank.com", "canarabank.in"),
        ("canarabank", "canara"),
    ),
    Brand(
        "unionbank",
        INDIA,
        ("unionbankofindia.co.in", "unionbankofindia.com"),
        ("unionbankofindia", "unionbank"),
    ),
    Brand(
        "idbi",
        INDIA,
        ("idbibank.in", "idbi.com"),
        ("idbi", "idbibank"),
    ),
    Brand(
        "yesbank",
        INDIA,
        ("yesbank.in",),
        ("yesbank",),
    ),
    Brand(
        "indusind",
        INDIA,
        ("indusind.com", "indusindbank.com"),
        ("indusind", "indusindbank"),
    ),
    Brand(
        "federalbank",
        INDIA,
        ("federalbank.co.in",),
        ("federalbank",),
    ),
    Brand(
        "rbl",
        INDIA,
        ("rblbank.com",),
        ("rblbank",),
    ),
    Brand(
        "idfc",
        INDIA,
        ("idfcfirstbank.com", "idfcbank.com"),
        ("idfc", "idfcfirst"),
    ),
    Brand(
        "aubank",
        INDIA,
        ("aubank.in",),
        ("aubank",),
    ),
    Brand(
        "bandhan",
        INDIA,
        ("bandhanbank.com",),
        ("bandhan", "bandhanbank"),
    ),
    Brand(
        "paytm",
        INDIA,
        ("paytm.com", "paytmbank.com", "paytm.in"),
        ("paytm",),
    ),
    Brand(
        "phonepe",
        INDIA,
        ("phonepe.com",),
        ("phonepe",),
    ),
    Brand(
        "googlepay",
        INDIA,
        ("googlepay.com", "pay.google.com"),
        ("googlepay", "gpay"),
    ),
    Brand(
        "bhim",
        INDIA,
        ("bhimupi.org.in",),
        ("bhim",),
    ),
    Brand(
        "npci",
        INDIA,
        ("npci.org.in", "upi.npci.org.in"),
        ("npci",),
    ),
    Brand(
        "razorpay",
        INDIA,
        ("razorpay.com",),
        ("razorpay",),
    ),
    Brand(
        "cashfree",
        INDIA,
        ("cashfree.com",),
        ("cashfree",),
    ),
    Brand(
        "bharatpe",
        INDIA,
        ("bharatpe.com",),
        ("bharatpe",),
    ),
    Brand(
        "cred",
        INDIA,
        ("cred.club",),
        ("cred",),
    ),
    Brand(
        "zerodha",
        INDIA,
        ("zerodha.com",),
        ("zerodha",),
    ),
    Brand(
        "groww",
        INDIA,
        ("groww.in",),
        ("groww",),
    ),
    Brand(
        "payu",
        INDIA,
        ("payu.in", "payu.com"),
        ("payu",),
    ),
    Brand(
        "mobikwik",
        INDIA,
        ("mobikwik.com",),
        ("mobikwik",),
    ),
    # ---------------------------------------------------------
    # India — telecom
    # ---------------------------------------------------------
    Brand("airtel", INDIA, ("airtel.in", "airtel.com"), ("airtel",)),
    Brand("jio", INDIA, ("jio.com", "jiocinema.com", "jiofiber.com", "jiofinance.in"), ("jio",)),
    Brand(
        "vodafone",
        INDIA,
        ("vodafone.in", "vodafoneidea.com", "myvi.in"),
        ("vodafone", "vodafoneidea"),
    ),
    Brand("bsnl", INDIA, ("bsnl.co.in",), ("bsnl",)),
    # ---------------------------------------------------------
    # India — commerce, travel and food
    # ---------------------------------------------------------
    Brand("flipkart", INDIA, ("flipkart.com",), ("flipkart",)),
    Brand("myntra", INDIA, ("myntra.com",), ("myntra",)),
    Brand("meesho", INDIA, ("meesho.com",), ("meesho",)),
    Brand("snapdeal", INDIA, ("snapdeal.com",), ("snapdeal",)),
    Brand("nykaa", INDIA, ("nykaa.com",), ("nykaa",)),
    Brand("swiggy", INDIA, ("swiggy.com",), ("swiggy",)),
    Brand("zomato", INDIA, ("zomato.com",), ("zomato",)),
    Brand("bigbasket", INDIA, ("bigbasket.com",), ("bigbasket",)),
    Brand("irctc", INDIA, ("irctc.co.in", "irctc.com"), ("irctc",)),
    Brand("makemytrip", INDIA, ("makemytrip.com",), ("makemytrip",)),
    Brand("bookmyshow", INDIA, ("bookmyshow.com",), ("bookmyshow",)),
    Brand("ola", INDIA, ("olacabs.com", "olamoney.com"), ("ola", "olacabs"), host_only=True),
    # ---------------------------------------------------------
    # India — government and regulators
    # ---------------------------------------------------------
    Brand("incometax", INDIA, ("incometax.gov.in",), ("incometax",)),
    Brand("uidai", INDIA, ("uidai.gov.in",), ("uidai", "aadhaar")),
    Brand("epfo", INDIA, ("epfindia.gov.in",), ("epfo", "epfindia")),
    Brand("rbi", INDIA, ("rbi.org.in",), ("rbi",)),
    Brand("sebi", INDIA, ("sebi.gov.in",), ("sebi",)),
    Brand("irdai", INDIA, ("irdai.gov.in",), ("irdai",)),
    Brand("digilocker", INDIA, ("digilocker.gov.in",), ("digilocker",)),
    Brand("umang", INDIA, ("umang.gov.in",), ("umang",)),
    Brand("gst", INDIA, ("gst.gov.in",), ("gst",)),
    Brand("nsdl", INDIA, ("nsdl.co.in", "nsdl.com"), ("nsdl",)),
    Brand("cdsl", INDIA, ("cdslindia.com", "cdsl.co.in"), ("cdsl",)),
    # ---------------------------------------------------------
    # Pakistan — the set this engine originally shipped with
    # ---------------------------------------------------------
    Brand("hbl", PAKISTAN, ("hbl.com", "hbl.com.pk"), ("hbl",)),
    Brand("ubl", PAKISTAN, ("ubl.com.pk", "ubldigital.com"), ("ubl",)),
    Brand("mcb", PAKISTAN, ("mcb.com.pk",), ("mcb",)),
    Brand("meezan", PAKISTAN, ("meezanbank.com",), ("meezan",)),
    Brand("alfalah", PAKISTAN, ("bankalfalah.com",), ("alfalah",)),
    Brand("nbp", PAKISTAN, ("nbp.com.pk",), ("nbp",)),
    Brand("jazz", PAKISTAN, ("jazz.com.pk",), ("jazz",)),
    Brand("zong", PAKISTAN, ("zong.com.pk",), ("zong",)),
    Brand("telenor", PAKISTAN, ("telenor.com.pk",), ("telenor",)),
    Brand("ufone", PAKISTAN, ("ufone.com",), ("ufone",)),
    Brand("easypaisa", PAKISTAN, ("easypaisa.com.pk",), ("easypaisa",)),
    Brand("jazzcash", PAKISTAN, ("jazzcash.com.pk",), ("jazzcash",)),
    Brand("nadra", PAKISTAN, ("nadra.gov.pk",), ("nadra",)),
    Brand("sbp", PAKISTAN, ("sbp.org.pk",), ("sbp",)),
    Brand("fbr", PAKISTAN, ("fbr.gov.pk",), ("fbr",)),
    Brand("fia", PAKISTAN, ("fia.gov.pk",), ("fia",)),
    Brand("secp", PAKISTAN, ("secp.gov.pk",), ("secp",)),
    Brand("daraz", PAKISTAN, ("daraz.pk",), ("daraz",)),
    Brand("careem", PAKISTAN, ("careem.com",), ("careem",)),
    Brand("bykea", PAKISTAN, ("bykea.com",), ("bykea",)),
    Brand("foodpanda", PAKISTAN, ("foodpanda.pk",), ("foodpanda",)),
    # ---------------------------------------------------------
    # Global
    # ---------------------------------------------------------
    Brand("paypal", GLOBAL, ("paypal.com", "paypal.me"), ("paypal",)),
    Brand("apple", GLOBAL, ("apple.com", "icloud.com"), ("apple", "icloud")),
    Brand("google", GLOBAL, ("google.com", "google.co.in", "gmail.com"), ("google", "gmail")),
    Brand("microsoft", GLOBAL, ("microsoft.com", "live.com", "outlook.com"), ("microsoft", "outlook", "office365")),
    Brand("amazon", GLOBAL, ("amazon.com", "amazon.in", "amazon.co.uk"), ("amazon",)),
    Brand(
        "meta",
        GLOBAL,
        ("meta.com", "facebook.com", "instagram.com", "whatsapp.com"),
        ("facebook", "instagram", "whatsapp"),
    ),
    Brand("netflix", GLOBAL, ("netflix.com",), ("netflix",)),
    Brand("linkedin", GLOBAL, ("linkedin.com",), ("linkedin",)),
    Brand("binance", GLOBAL, ("binance.com",), ("binance",)),
    Brand("coinbase", GLOBAL, ("coinbase.com",), ("coinbase",)),
    Brand("telegram", GLOBAL, ("telegram.org",), ("telegram",)),
    Brand("discord", GLOBAL, ("discord.com", "discord.gg"), ("discord",)),
    Brand("steam", GLOBAL, ("steampowered.com", "steamcommunity.com"), ("steam", "steampowered"), host_only=True),
    Brand("stripe", GLOBAL, ("stripe.com",), ("stripe",)),
    Brand("shopify", GLOBAL, ("shopify.com",), ("shopify",)),
    Brand("ebay", GLOBAL, ("ebay.com", "ebay.in"), ("ebay",)),
    Brand("alibaba", GLOBAL, ("alibaba.com",), ("alibaba",)),
    Brand("aliexpress", GLOBAL, ("aliexpress.com",), ("aliexpress",)),
    Brand("temu", GLOBAL, ("temu.com",), ("temu",)),
    Brand("shein", GLOBAL, ("shein.com",), ("shein",)),
    Brand("tiktok", GLOBAL, ("tiktok.com",), ("tiktok",)),
    Brand("snapchat", GLOBAL, ("snapchat.com",), ("snapchat",)),
    Brand("twitter", GLOBAL, ("twitter.com", "x.com"), ("twitter",)),
    Brand("airbnb", GLOBAL, ("airbnb.com", "airbnb.co.in"), ("airbnb",)),
    Brand("uber", GLOBAL, ("uber.com",), ("uber",), host_only=True),
    Brand("wise", GLOBAL, ("wise.com",), ("wise",), host_only=True),
    Brand("revolut", GLOBAL, ("revolut.com",), ("revolut",)),
    Brand("hsbc", GLOBAL, ("hsbc.com", "hsbc.co.in"), ("hsbc",)),
    Brand("barclays", GLOBAL, ("barclays.co.uk", "barclays.com"), ("barclays",)),
    Brand("lloyds", GLOBAL, ("lloydsbank.com",), ("lloydsbank", "lloyds")),
    Brand("natwest", GLOBAL, ("natwest.com",), ("natwest",)),
    Brand("santander", GLOBAL, ("santander.com", "santander.co.uk"), ("santander",)),
    Brand("chase", GLOBAL, ("chase.com",), ("chase",), host_only=True),
    Brand("wellsfargo", GLOBAL, ("wellsfargo.com",), ("wellsfargo",)),
    Brand("bankofamerica", GLOBAL, ("bankofamerica.com",), ("bankofamerica",)),
    Brand("citibank", GLOBAL, ("citibank.com", "citi.com"), ("citibank", "citi")),
    Brand("dhl", GLOBAL, ("dhl.com", "dhl.co.in"), ("dhl",)),
    Brand("fedex", GLOBAL, ("fedex.com",), ("fedex",)),
    Brand("ups", GLOBAL, ("ups.com",), ("ups",)),
    Brand("usps", GLOBAL, ("usps.com",), ("usps",)),
    Brand("visa", GLOBAL, ("visa.com", "visa.co.in"), ("visa",), host_only=True),
    Brand("mastercard", GLOBAL, ("mastercard.com",), ("mastercard",)),
    Brand("amex", GLOBAL, ("americanexpress.com",), ("amex", "americanexpress")),
)

BRANDS_BY_KEY: dict[str, Brand] = {brand.key: brand for brand in BRANDS}

_ALIAS_PATTERNS: dict[str, tuple[re.Pattern[str], ...]] = {
    brand.key: tuple(
        re.compile(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])")
        for alias in brand.aliases
    )
    for brand in BRANDS
}


def find_brands(text: str, hostname: str) -> list[str]:
    """Return brand keys mentioned in ``text``, India first."""

    haystack = text.lower()
    host = hostname.lower()

    found: list[str] = []

    for brand in BRANDS:

        target = host if brand.host_only else haystack

        if any(
            pattern.search(target)
            for pattern in _ALIAS_PATTERNS[brand.key]
        ):

            found.append(brand.key)

    return found


def official_domains(brand_key: str) -> tuple[str, ...]:
    brand = BRANDS_BY_KEY.get(brand_key)
    return brand.domains if brand else ()
