---
name: motion-ui-craft
description: >
  Panduan dan standar Motion UI untuk membangun antarmuka web, dashboard, dan
  aplikasi yang terasa taktil, organis, responsif, dan mulus—terinspirasi dari
  arsitektur animasi studio modern (spring physics, staggered blur-in, sliding
  pill nav, pointer spotlight, dan circular theme reveal).
---

# Motion UI Craft — Skill Specification

Gunakan skill ini setiap kali merancang, membangun, atau melakukan *redesign* website/web app agar menghasilkan kualitas **Motion UI yang paten, halus, dan terasa hidup** tanpa terasa berat atau berlebihan.

---

## 1. Filosofi Gerak (Motion Principles)

1. **Tactile & Spring-Driven** — Setiap interaksi tombol, modal, dan toast memiliki respons pegas (*overshoot* halus) yang memberi kesan fisik dan responsif.
2. **Spatial Continuity** — Perpindahan halaman, tab, atau tema tidak pernah *hard-cut*. Gunakan *blur morphing*, *sliding indicator*, dan *circular clip-path reveal* untuk menjaga orientasi mata pengguna.
3. **Choreographed Entrances** — Elemen masuk secara bertahap (*staggered*) menggunakan CSS variable `--i` agar hierarki visual terbaca secara alami.
4. **GPU-First & Accessible** — Prioritaskan `transform`, `opacity`, `filter`, dan `clip-path`. Selalu hormati `prefers-reduced-motion: reduce`.

---

## 2. Sistem Kurva Easing (Physics Tokens)

Gunakan kurva *cubic-bezier* berikut secara konsisten di seluruh komponen:

| Kegunaan | Durasi | Kurva Easing | Karakteristik |
| :--- | :--- | :--- | :--- |
| **Tactile Press & Spring Pop** (Button, Modal, Toast) | `200ms–500ms` | `cubic-bezier(0.3, 1.5, 0.5, 1)` | Memantul ringan, terasa responsif |
| **Sliding Nav Pill** (Active tab indicator) | `550ms` | `cubic-bezier(0.3, 1.25, 0.4, 1)` | Meluncur mulus dengan sedikit elastisitas |
| **Card & Tile Lift** (Hover elevation) | `300ms–350ms` | `cubic-bezier(0.3, 1.4, 0.5, 1)` | Mengangkat halus saat disentuh kursor |
| **Fluid Deceleration** (Page enter, Progress bar, Stagger) | `500ms–1000ms` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Masuk cepat lalu melambat dengan elegan |
| **Theme Circular Reveal** (View Transitions API) | `750ms` | `cubic-bezier(0.6, 0, 0.2, 1)` | Ekspansi dramatis namun terkontrol |
| **JS Numeric & Chart Morph** (`requestAnimationFrame`) | `800ms–1100ms` | `1 - Math.pow(1 - p, 3)` | *Cubic ease-out* mulus untuk angka & SVG |

---

## 3. Fondasi Visual & Design Tokens

Motion UI yang mulus selalu didukung oleh kontras permukaan (*surface*) yang bersih dan geometri yang konsisten:

- **Palet Organik & Kontras Tinggi**:
  - **Light Mode**: Canvas sage/stone hangat (`#e8eae4`), card lembut (`#f4f5f1`), elemen elevasi putih (`#ffffff`), aksen solid gelap (`#0b0b0b`), teks sekunder muted (`#6d706a`).
  - **Dark Mode**: Canvas pekat (`#0a0a0a`), card (`#151515`), elemen elevasi (`#1f1f1f`), aksen solid terang (`#f2f2ee`).
- **Ambient Floor Glow**: Tambahkan radial glow halus di bagian bawah viewport (`radial-gradient(90% 45% at 50% 108%, var(--glow), transparent 70%)`) dengan `background-attachment: fixed`.
- **Geometri Pill & Squircle**:
  - `border-radius: 99px` untuk tombol, input, chip, navigasi, badge, dan toast.
  - `border-radius: 28px` untuk card utama, dan `18px–22px` untuk sub-card (*mini card*).
- **Glassmorphic Sticky Header**:
  ```css
  header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--bg) 72%, transparent);
    backdrop-filter: blur(14px);
  }
  ```
- **Tipografi Editorial**: Gunakan sans-serif geometris modern (seperti *Instrument Sans* / *Inter*) dengan `letter-spacing` ketat pada judul besar (`-1.5px` hingga `-2px`) dan `font-weight: 500`.

---

## 4. Katalog Pola Motion UI Wajib

### A. Circular Reveal Theme Switcher (View Transitions API)
Transisi Dark/Light mode menyebar secara melingkar tepat dari titik koordinat klik tombol tema.

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 2; }
```

```js
function toggleThemeWithReveal(event, applyTheme) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return applyTheme();
  }
  const x = event.clientX;
  const y = event.clientY;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  document.startViewTransition(applyTheme).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 750, easing: 'cubic-bezier(0.6, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
    );
  });
}
```

---

### B. Sliding Pill Navigation Indicator
Gunakan elemen indikator absolut (`#ind`) yang meluncur mengikuti posisi (`offsetLeft`) dan lebar (`offsetWidth`) tab aktif.

```css
.nav-pill {
  position: relative;
  display: flex;
  padding: 5px;
  border-radius: 99px;
}
.nav-indicator {
  position: absolute;
  top: 5px;
  bottom: 5px;
  border-radius: 99px;
  background: var(--k);
  transition:
    left 0.55s cubic-bezier(0.3, 1.25, 0.4, 1),
    width 0.55s cubic-bezier(0.3, 1.25, 0.4, 1);
}
```

---

### C. Blur-Out & Staggered Blur-In Page Transition
Saat berpindah halaman/tab, konten lama memudar dengan efek blur dan sedikit mengecil, lalu konten baru masuk secara berurutan (*staggered*).

```css
main {
  transition: opacity 0.22s, filter 0.22s, transform 0.22s;
}
main.out {
  opacity: 0;
  filter: blur(14px);
  transform: scale(0.985);
}

@keyframes blurIn {
  from {
    opacity: 0;
    filter: blur(10px);
    transform: translateY(18px) scale(0.98);
  }
}

.enter .stagger-item {
  animation: blurIn 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
  animation-delay: calc(var(--i, 0) * 60ms);
}
```
> **Catatan:** Batasi indeks `--i` maksimal `16` agar elemen paling bawah tidak menunggu terlalu lama. Untuk pergantian filter/sub-view yang lebih ringan, gunakan jeda `30ms`.

---

### D. Pointer-Tracking Radial Spotlight Hover
Memberi kesan material permukaan yang bereaksi terhadap cahaya kursor di setiap card.

```css
.card {
  position: relative;
  overflow: hidden;
}
.card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, -60%), #88888822, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.card:hover::after {
  opacity: 1;
}
```

```js
document.addEventListener('pointermove', (e) => {
  const card = e.target.closest?.('.card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
});
```

---

### E. Tactile Micro-Interactions (Press, Lift, Modal & Toast)
- **Button Press**:
  ```css
  button {
    transition: transform 0.2s cubic-bezier(0.3, 1.5, 0.5, 1), background-color 0.3s, box-shadow 0.3s;
  }
  button:active {
    transform: scale(0.93);
  }
  ```
- **Card Hover Lift**: `transform: translateY(-4px)` dengan durasi `0.35s cubic-bezier(0.3, 1.4, 0.5, 1)`.
- **Spring Modal**: Overlay backdrop blur fade-in (`0.25s`) + dialog `scale(0.7)` → `scale(1)` (`0.5s cubic-bezier(0.3, 1.5, 0.5, 1)`).
- **Floating Pill Toast**: Muncul dari bawah (`translateY(40px) scale(0.9)` → `none`) lengkap dengan aksi **Undo** untuk setiap mutasi data penting.

---

### F. Data Visualization & Numeric Motion
1. **Number Count-Up**: Animasikan angka KPI dari `0` ke nilai target selama `1000ms` menggunakan `requestAnimationFrame` + *cubic ease-out*.
2. **Progress Bar Fill**: Gunakan `transform-origin: left` dan animasikan `scaleX(0)` → `scaleX(1)` (`1s cubic-bezier(0.2, 0.8, 0.2, 1)`).
3. **SVG Path Draw-In**: Set `pathLength="1"`, `stroke-dasharray: 1`, lalu animasikan `stroke-dashoffset` dari `1` ke `0` untuk grafik *sparkline* dan garis konektor.
4. **Smooth Chart Morphing**: Saat mengganti metrik atau rentang waktu, interpolasikan array nilai secara langsung via `rAF` untuk membentuk kurva *Catmull-Rom cubic bezier* dan tinggi bar tanpa *flicker*.

---

### G. Direct Manipulation (Drag & Drop)
Jika terdapat elemen interaktif yang bisa digeser (seperti timeline, kanban, atau jadwal):
- Gunakan `setPointerCapture` dan `touch-action: none`.
- Berikan elevasi bayangan dramatis saat aktif ditarik (`box-shadow: 0 22px 34px -10px #000a`).
- Tampilkan *floating tooltip* dinamis di atas elemen selama drag berlangsung.
- Sediakan mekanisme **Undo Toast** begitu perubahan dilepas.

---

## 5. Guardrail Aksesibilitas (Wajib)

Selalu sertakan aturan ini di akhir stylesheet:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 6. Checklist Implementasi Cepat

Sebelum menyelesaikan pembuatan UI, pastikan seluruh poin berikut terpenuhi:
- [ ] Semua tombol memiliki *tactile active scale* (`0.93`) dengan *spring easing*.
- [ ] Navigasi tab menggunakan *sliding pill indicator*.
- [ ] Perpindahan halaman/view menggunakan *blur-out / staggered blur-in*.
- [ ] Card utama dilengkapi *pointer-tracking radial spotlight* dan *hover lift*.
- [ ] Pergantian Dark/Light mode menggunakan *Circular Reveal* (View Transitions API).
- [ ] Angka KPI, progress bar, dan grafik SVG memiliki animasi masuk/morphing yang halus.
- [ ] Notifikasi aksi menggunakan *spring toast* dengan opsi *Undo* jika relevan.
- [ ] Media query `prefers-reduced-motion: reduce` sudah terpasang.