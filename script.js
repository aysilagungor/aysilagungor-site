const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav");
const languageButton = document.querySelector(".language-toggle");
const cursorOrb = document.querySelector(".cursor-orb");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

let currentLanguage = "tr";
function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll("[data-tr][data-en]").forEach((element) => {
    const value = element.dataset[language];
    if (value !== undefined) element.innerHTML = value;
  });
  document.querySelector(".lang-tr")?.classList.toggle("active", language === "tr");
  document.querySelector(".lang-en")?.classList.toggle("active", language === "en");
  if (languageButton) {
    languageButton.setAttribute("aria-label", language === "tr" ? "Switch to English" : "Türkçeye geç");
  }
  document.querySelector("#site-nav")?.setAttribute("aria-label", language === "tr" ? "Ana navigasyon" : "Main navigation");
}
languageButton?.addEventListener("click", () => setLanguage(currentLanguage === "tr" ? "en" : "tr"));

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const revealTargets = document.querySelectorAll(".intro-copy, .focus-heading, .focus-card, .work-heading, .work-card, .manifesto p, .contact-main");
revealTargets.forEach((item, index) => {
  item.classList.add("reveal");
  if (item.classList.contains("focus-card")) item.style.transitionDelay = `${(index % 3) * 90}ms`;
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((item) => observer.observe(item));
} else {
  revealTargets.forEach((item) => item.classList.add("is-visible"));
}

// Experimental cursor detail on desktop only.
if (cursorOrb && window.matchMedia("(pointer:fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("mousemove", (event) => {
    cursorOrb.classList.add("is-active");
    cursorOrb.style.left = `${event.clientX}px`;
    cursorOrb.style.top = `${event.clientY}px`;
  }, { passive: true });
  document.querySelectorAll("a, button, .focus-card").forEach((item) => {
    item.addEventListener("mouseenter", () => cursorOrb.classList.add("is-hover"));
    item.addEventListener("mouseleave", () => cursorOrb.classList.remove("is-hover"));
  });
}

const leadForm = document.querySelector("#lead-form");
leadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!leadForm.reportValidity()) return;
  const name = document.querySelector("#lead-name").value.trim();
  const business = document.querySelector("#lead-business").value.trim();
  const message = document.querySelector("#lead-message").value.trim();
  const text = `Merhaba, web sitenizden ulaşıyorum.\nAd: ${name}\nİşletme: ${business || "Belirtilmedi"}\nİhtiyaç: ${message}`;
  window.open("https://wa.me/905414140489?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
});

// Message composer: opens a user-confirmed WhatsApp draft; no backend or auto-send.
document.querySelectorAll(".chat-widget").forEach((widget) => {
  const launch = widget.querySelector(".chat-launcher");
  const panel = widget.querySelector(".chat-panel");
  const close = widget.querySelector(".chat-close");
  const form = widget.querySelector(".chat-compose");
  const field = widget.querySelector("textarea");
  const setOpen = (open) => {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) field.focus();
    else launch.focus();
  };
  launch.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = field.value.trim();
    if (!message) return;
    window.open("https://wa.me/905414140489?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
  });
});

// Close the sitemap menu when clicking outside it or pressing Escape.
document.addEventListener("click", (event) => {
  if (menuButton && nav && !menuButton.contains(event.target) && !nav.contains(event.target)) {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton && nav) {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

// Consent preferences are local to the browser. No third-party tags are loaded.
(function () {
  const panel = document.querySelector("#privacy-consent");
  const settings = document.querySelector(".privacy-settings");
  if (!panel || !settings) return;
  const key = "aysila-consent-v1";
  let preference = null;
  try { preference = localStorage.getItem(key); } catch (_) {}
  panel.hidden = preference === "accept" || preference === "deny";
  settings.addEventListener("click", () => { panel.hidden = false; });
  panel.querySelectorAll("[data-consent]").forEach(button => {
    button.addEventListener("click", () => {
      const choice = button.dataset.consent;
      try { localStorage.setItem(key, choice); } catch (_) {}
      panel.hidden = true;
      window.dispatchEvent(new CustomEvent("site:consent-change", { detail: { choice } }));
    });
  });
})();
// Google Ads/GA4 event integration is deliberately NOT enabled without
// measurement IDs, verified configuration and consent requirements.

// SIG: local, fast FAQ assistant. No AI requests, chat service or tracking.
(() => {
  const widget = document.getElementById("sig-assistant");
  if (!widget) return;
  const avatar = widget.querySelector(".sig-avatar");
  const dialog = widget.querySelector(".sig-dialog");
  const close = widget.querySelector(".sig-close");
  const hide = widget.querySelector(".sig-hide");
  const tooltip = widget.querySelector(".sig-tooltip");
  const choices = widget.querySelector(".sig-choices");
  const answer = widget.querySelector(".sig-answer");
  const back = widget.querySelector(".sig-back");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, val) { try { sessionStorage.setItem(key, val); } catch {} }
  };
  if (store.get("sig-hidden") === "1") { widget.remove(); return; }

  const content = {
    tr: {
      new: ["Yeni reklam vermek istiyorum", "Önce işletmenizin hedefini, hizmet bölgesini ve yaklaşık reklam bütçesini belirleriz. Ardından anahtar kelime ve kampanya planını oluşturabiliriz. Reklam harcaması Google’a ödenir."],
      improve: ["Reklamlarımı iyileştirmek istiyorum", "Mevcut kampanyalarda arama terimlerini, tıklama maliyetini, hedeflemeyi ve ölçüm kurulumunu inceleriz. Gereksiz harcama ihtimallerini belirleyip test edilebilecek iyileştirmeleri planlarız."],
      info: ["Google Ads nedir?", "Google Ads, işletmenizin reklamlarını ilgili aramalarda göstermenizi sağlar. Bütçe, hedefleme ve reklam metinleri kontrol edilebilir. Tıklama sayısı tek başına satış garantisi değildir."],
      other: ["Nasıl yardımcı olabilirim?", "Kampanya kurulumu, anahtar kelime araştırması, reklam performansı ve bütçe planlaması hakkında sorularınızı konuşabiliriz. Daha ayrıntılı ihtiyaçlar için iletişim sayfasını kullanabilirsiniz."]
    },
    en: {
      new: ["I want to start advertising", "We begin with your business goals, service area and approximate ad budget. Then we can plan keywords and campaigns. Ad spend is paid to Google."],
      improve: ["I want to improve my ads", "We review search terms, cost per click, targeting and measurement setup. Then we identify potential wasted spend and test improvements."],
      info: ["What is Google Ads?", "Google Ads lets businesses show ads for relevant searches. You can control budgets, targeting and ad messages. Clicks alone do not guarantee sales."],
      other: ["How can I help?", "We can discuss campaign setup, keyword research, performance and budget planning. For more detailed needs, please use the contact page."]
    }
  };
  const lang = () => document.documentElement.lang === "en" ? "en" : "tr";
  function resetAnswer() {
    choices.hidden = false;
    answer.hidden = true;
  }
  function setOpen(open, focus = false) {
    dialog.hidden = !open;
    avatar.setAttribute("aria-expanded", String(open));
    widget.classList.toggle("sig-open", open);
    tooltip.hidden = open;
    if (open) resetAnswer();
    if (focus) (open ? close : avatar).focus();
  }
  avatar.addEventListener("click", () => setOpen(dialog.hidden, true));
  close.addEventListener("click", () => setOpen(false, true));
  hide.addEventListener("click", () => { store.set("sig-hidden", "1"); widget.remove(); });
  back.addEventListener("click", resetAnswer);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !dialog.hidden) setOpen(false, true);
  });
  choices.querySelectorAll("[data-sig-topic]").forEach(button => {
    button.addEventListener("click", () => {
      const [title, body] = content[lang()][button.dataset.sigTopic];
      answer.querySelector(".sig-answer-title").textContent = title;
      answer.querySelector(".sig-answer-body").textContent = body;
      choices.hidden = true;
      answer.hidden = false;
    });
  });
  // Mascot stays stationary; no flight animation.\n  widget.classList.add("sig-arrived");\n  // Once per tab, desktop-only greeting; no intrusive auto-open on phones.
  if (!reduced && window.matchMedia("(min-width: 768px)").matches &&
      store.get("sig-greeted") !== "1") {
    store.set("sig-greeted", "1");
    setTimeout(() => {
      if (widget.isConnected && !document.hidden) setOpen(true);
    }, 1800);
  }
})();
