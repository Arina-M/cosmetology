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

// Booking form
document.getElementById("bookForm").addEventListener("submit", function (e) {
  e.preventDefault();
  document.getElementById("formOk").style.display = "block";
  this.querySelector("button").textContent = "Заявку надіслано ✓";
  setTimeout(() => {
    this.reset();
  }, 400);
});

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
  // CTA inside modal: close then jump to booking
  overlay
    .querySelectorAll("[data-modal-cta]")
    .forEach((a) => a.addEventListener("click", close));
})();
