document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('admin-lightbox');
  const lightboxImage = document.getElementById('admin-lightbox-image');
  const lightboxClose = document.getElementById('admin-lightbox-close');
  const thumbs = document.querySelectorAll('[data-lightbox-src]');
  const addButtons = document.querySelectorAll('[data-add-row]');

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (!lightbox || !lightboxImage) return;
      lightboxImage.src = thumb.getAttribute('data-lightbox-src');
      lightbox.classList.add('is-open');
    });
  });

  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', () => lightbox.classList.remove('is-open'));
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        lightbox.classList.remove('is-open');
      }
    });
  }

  addButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const template = document.getElementById(button.dataset.addRow);
      const target = document.querySelector(button.dataset.target);

      if (!template || !target) return;

      target.insertAdjacentHTML('beforeend', template.innerHTML.trim());
    });
  });

  document.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-row]');
    if (!removeButton) return;

    const row = removeButton.closest('.admin-repeat-card');
    const list = row ? row.parentElement : null;

    if (!row || !list) return;
    if (list.children.length <= 1) return;

    row.remove();
  });

  const menuPreview = document.querySelector('[data-menu-preview]');
  const menuPreviewLinks = document.querySelector('[data-menu-preview-links]');

  if (menuPreview && menuPreviewLinks) {
    const controls = {
      fontSize: document.querySelector('[data-menu-preview-control="fontSize"]'),
      gap: document.querySelector('[data-menu-preview-control="gap"]'),
      paddingX: document.querySelector('[data-menu-preview-control="paddingX"]'),
      minHeight: document.querySelector('[data-menu-preview-control="minHeight"]'),
      wrap: document.querySelector('[data-menu-preview-control="wrap"]'),
      alignment: document.querySelector('[data-menu-preview-control="alignment"]')
    };

    const renderMenuPreview = () => {
      if (controls.fontSize) {
        menuPreviewLinks.style.setProperty('--preview-font-size', `${controls.fontSize.value || 15}px`);
      }
      if (controls.gap) {
        menuPreviewLinks.style.setProperty('--preview-gap', `${controls.gap.value || 10}px`);
      }
      if (controls.paddingX) {
        menuPreviewLinks.style.setProperty('--preview-padding-x', `${controls.paddingX.value || 16}px`);
      }
      if (controls.minHeight) {
        menuPreviewLinks.style.setProperty('--preview-min-height', `${controls.minHeight.value || 44}px`);
      }
      if (controls.wrap) {
        menuPreviewLinks.style.setProperty('--preview-wrap', controls.wrap.value || 'nowrap');
      }
      if (controls.alignment) {
        const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end' };
        menuPreviewLinks.style.justifyContent = justifyMap[controls.alignment.value] || 'flex-end';
      }
    };

    Object.values(controls).forEach((control) => {
      if (!control) return;
      control.addEventListener('input', renderMenuPreview);
      control.addEventListener('change', renderMenuPreview);
    });

    renderMenuPreview();
  }
});
