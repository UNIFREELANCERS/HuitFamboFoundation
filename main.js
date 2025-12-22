document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const hamburger = document.querySelector('.hamburger');
  const navDrawer = document.querySelector('.nav-drawer');

  if (hamburger && navDrawer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navDrawer.classList.toggle('active');
    });

    navDrawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navDrawer.classList.remove('active');
    }));
  }
});
