// Header scroll state
const hdr = document.getElementById("hdr");
addEventListener("scroll", () =>
  hdr.classList.toggle("scrolled", scrollY > 20),
);

// Mobile menu
const burger = document.getElementById("burger"),
  menu = document.getElementById("mobileMenu"),
  overlay = document.getElementById("overlay");
function toggleMenu(open) {
  burger.classList.toggle("open", open);
  menu.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", () =>
  toggleMenu(!menu.classList.contains("open")),
);
overlay.addEventListener("click", () => toggleMenu(false));
document
  .getElementById("menuClose")
  .addEventListener("click", () => toggleMenu(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("open")) toggleMenu(false);
});
menu
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.06 + "s";
  io.observe(el);
});

// Reviews carousel
(function () {
  const track = document.getElementById("revTrack"),
    prev = document.getElementById("revPrev"),
    next = document.getElementById("revNext"),
    dotsWrap = document.getElementById("revDots"),
    cards = Array.from(track.children);
  let index = 0,
    timer = null;

  function perView() {
    if (matchMedia("(max-width:640px)").matches) return 1;
    if (matchMedia("(max-width:1024px)").matches) return 2;
    return 3;
  }
  function maxIndex() {
    return Math.max(0, cards.length - perView());
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIndex(); i++) {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Слайд " + (i + 1));
      b.addEventListener("click", () => {
        index = i;
        update();
        reset();
      });
      dotsWrap.appendChild(b);
    }
  }
  function update() {
    index = Math.min(index, maxIndex());
    const card = cards[0].getBoundingClientRect().width;
    const gap = 24;
    track.style.transform = "translateX(" + -(card + gap) * index + "px)";
    Array.from(dotsWrap.children).forEach((d, i) =>
      d.classList.toggle("active", i === index),
    );
  }
  function go(dir) {
    index += dir;
    if (index > maxIndex()) index = 0;
    if (index < 0) index = maxIndex();
    update();
  }
  function reset() {
    clearInterval(timer);
    timer = setInterval(() => go(1), 5500);
  }

  prev.addEventListener("click", () => {
    go(-1);
    reset();
  });
  next.addEventListener("click", () => {
    go(1);
    reset();
  });

  // swipe
  let startX = 0,
    touching = false;
  track.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      touching = true;
    },
    { passive: true },
  );
  track.addEventListener(
    "touchend",
    (e) => {
      if (!touching) return;
      touching = false;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) {
        go(dx < 0 ? 1 : -1);
        reset();
      }
    },
    { passive: true },
  );

  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      buildDots();
      update();
    }, 150);
  });

  buildDots();
  update();
  reset();
})();

// ============================================================
//  Кастомний випадаючий список (заміна системного <select>)
// ============================================================
document.querySelectorAll(".select").forEach(function (sel) {
  const trigger = sel.querySelector(".select-trigger");
  const valueEl = sel.querySelector(".select-value");
  const hidden = sel.querySelector("input[type=hidden]");
  const options = Array.from(sel.querySelectorAll(".select-option"));

  function setActive(opt) {
    options.forEach((o) => o.classList.remove("active"));
    if (opt) {
      opt.classList.add("active");
      opt.scrollIntoView({ block: "nearest" });
    }
  }
  function openMenu() {
    sel.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    setActive(
      options.find((o) => o.classList.contains("selected")) || options[0],
    );
  }
  function closeMenu() {
    sel.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }
  function choose(opt) {
    options.forEach((o) => {
      o.classList.remove("selected");
      o.setAttribute("aria-selected", "false");
    });
    opt.classList.add("selected");
    opt.setAttribute("aria-selected", "true");
    valueEl.textContent = opt.dataset.value;
    hidden.value = opt.dataset.value;
    closeMenu();
  }

  trigger.addEventListener("click", () =>
    sel.classList.contains("open") ? closeMenu() : openMenu(),
  );
  options.forEach((o) =>
    o.addEventListener("click", () => {
      choose(o);
      trigger.focus();
    }),
  );
  document.addEventListener("click", (e) => {
    if (!sel.contains(e.target)) closeMenu();
  });
  sel.addEventListener("keydown", (e) => {
    if (
      ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key) &&
      !sel.classList.contains("open")
    ) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (!sel.classList.contains("open")) return;
    const act =
      options.find((o) => o.classList.contains("active")) || options[0];
    const i = options.indexOf(act);
    if (e.key === "Escape") {
      closeMenu();
      trigger.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(options[Math.min(i + 1, options.length - 1)]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(options[Math.max(i - 1, 0)]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(act);
      trigger.focus();
    }
  });

  // для скидання форми (повертає перший пункт)
  sel._reset = () => choose(options[0]);
});

// ============================================================
//  Booking form — ДЕМО-режим (без бекенда)
//  Заявка нікуди не надсилається. Після заповнення форми
//  показуємо екран подяки — щоб лендинг можна було показувати
//  людям «як живий». Реальне відправлення вмикається разом
//  із бекендом (там окрема версія main.js із fetch).
// ============================================================
(function () {
  const form = document.getElementById("bookForm");
  if (!form) return;
  const card = form.closest(".booking-card");
  const successPanel = document.getElementById("formSuccess");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitText = submitBtn ? submitBtn.textContent : "";
  const isDesktop = () => window.matchMedia("(min-width:1025px)").matches;

  // Фіксуємо висоту картки (desktop), щоб картка й фото не «стрибали»
  function lockHeight() {
    if (!card) return;
    if (!isDesktop()) {
      card.style.minHeight = "";
      return;
    }
    if (card.classList.contains("is-locked")) return;
    card.style.minHeight = "";
    card.style.minHeight = card.offsetHeight + "px";
  }
  window.addEventListener("load", lockHeight);
  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(lockHeight, 150);
  });

  function showSuccess() {
    if (card && isDesktop()) {
      card.style.minHeight = card.offsetHeight + "px";
      card.classList.add("is-locked");
    }
    form.style.display = "none";
    const cardForm = form.closest(".booking-form");
    if (cardForm) cardForm.classList.add("is-sent");
    if (successPanel) successPanel.classList.add("show");
  }

  // Поля name/phone мають атрибут required — браузер сам не дасть
  // надіслати порожню форму. Тож тут лишається тільки показати подяку.
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Надсилаємо…";
    // невелика затримка, щоб виглядало «як справжнє»
    setTimeout(showSuccess, 600);
  });

  // «Надіслати ще одну заявку» — повертає форму
  const again = document.getElementById("formAgain");
  if (again) {
    again.addEventListener("click", () => {
      if (successPanel) successPanel.classList.remove("show");
      const cardForm = form.closest(".booking-form");
      if (cardForm) cardForm.classList.remove("is-sent");
      form.style.display = "";
      form.reset();
      document
        .querySelectorAll(".select")
        .forEach((s) => s._reset && s._reset());
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;
      if (card) card.classList.remove("is-locked");
      lockHeight();
    });
  }
})();

// Modals / popups
(function () {
  const overlay = document.getElementById("modalOverlay"),
    modals = overlay.querySelectorAll(".modal"),
    triggers = document.querySelectorAll("[data-modal]");
  let lastFocus = null;

  function open(id) {
    lastFocus = document.activeElement;
    modals.forEach((m) => (m.hidden = m.id !== "modal-" + id));
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    const close = overlay.querySelector(".modal:not([hidden]) .modal-close");
    if (close) close.focus();
  }
  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  triggers.forEach((t) => {
    t.addEventListener("click", () => open(t.dataset.modal));
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(t.dataset.modal);
      }
    });
  });
  overlay
    .querySelectorAll(".modal-close")
    .forEach((b) => b.addEventListener("click", close));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
  overlay
    .querySelectorAll("[data-modal-cta]")
    .forEach((a) => a.addEventListener("click", close));
})();