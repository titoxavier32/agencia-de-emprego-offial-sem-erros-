document.addEventListener('DOMContentLoaded', () => {
  const toggles = document.querySelectorAll('[data-mobile-toggle]');

  toggles.forEach((toggle) => {
    const targetId = toggle.getAttribute('data-mobile-toggle');
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      target.classList.toggle('is-open', !expanded);
    });
  });

  const previewModal = document.getElementById('site-preview-modal');
  const previewClose = document.getElementById('site-preview-close');
  const previewImage = document.getElementById('site-preview-image');
  const previewFallback = document.getElementById('site-preview-fallback');
  const previewBadge = document.getElementById('site-preview-badge');
  const previewTitle = document.getElementById('site-preview-title');
  const previewDescription = document.getElementById('site-preview-description');
  const previewMetaLabel = document.getElementById('site-preview-meta-label');
  const previewMetaValue = document.getElementById('site-preview-meta-value');
  const previewPeriodLabel = document.getElementById('site-preview-period-label');
  const previewPeriod = document.getElementById('site-preview-period');
  const previewPeriodRow = document.getElementById('site-preview-period-row');
  const previewLink = document.getElementById('site-preview-link');

  const closePreview = () => {
    if (previewModal) {
      previewModal.classList.remove('is-open');
    }
  };

  const openPreview = (trigger) => {
    const item = trigger.closest('[data-preview-item]');
    if (!item || !previewModal) return;

    const image = item.dataset.previewImage || '';

    previewBadge.textContent = item.dataset.previewBadge || 'Visualizacao';
    previewTitle.textContent = item.dataset.previewTitle || '';
    previewDescription.textContent = item.dataset.previewDescription || '';
    previewMetaLabel.textContent = (item.dataset.previewMetaLabel || 'Data') + ':';
      previewMetaValue.textContent = item.dataset.previewMetaValue || '';

      if (item.dataset.previewPeriod) {
        if (previewPeriodLabel) {
          previewPeriodLabel.textContent = (item.dataset.previewPeriodLabel || 'Período') + ':';
        }
        previewPeriod.textContent = item.dataset.previewPeriod;
        previewPeriodRow.style.display = 'block';
      } else {
      previewPeriod.textContent = '';
      previewPeriodRow.style.display = 'none';
    }

    if (item.dataset.previewLink) {
      previewLink.href = item.dataset.previewLink;
      previewLink.textContent = item.dataset.previewLinkLabel || 'Abrir';
      previewLink.target = item.dataset.previewLinkTarget || '';
      previewLink.rel = item.dataset.previewLinkTarget === '_blank' ? 'noopener noreferrer' : '';
      previewLink.style.display = 'inline-flex';
    } else {
      previewLink.href = '#';
      previewLink.textContent = '';
      previewLink.target = '';
      previewLink.rel = '';
      previewLink.style.display = 'none';
    }

    if (image) {
      previewImage.src = image;
      previewImage.alt = item.dataset.previewTitle || '';
      previewImage.style.display = 'block';
      previewFallback.style.display = 'none';
    } else {
      previewImage.src = '';
      previewImage.style.display = 'none';
      previewFallback.style.display = 'flex';
    }

    previewModal.classList.add('is-open');
  };

  document.querySelectorAll('[data-open-preview]').forEach((trigger) => {
    trigger.addEventListener('click', () => openPreview(trigger));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPreview(trigger);
      }
    });
  });

  if (previewClose && previewModal) {
    previewClose.addEventListener('click', closePreview);
    previewModal.addEventListener('click', (event) => {
      if (event.target === previewModal) {
        closePreview();
      }
    });
  }
});
