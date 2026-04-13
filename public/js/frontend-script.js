document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-hero-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const prevButton = carousel.querySelector('[data-hero-prev]');
    const nextButton = carousel.querySelector('[data-hero-next]');
    const autoplayMs = Number(carousel.dataset.heroAutoplay || 7000);
    let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
    let timer = null;

    if (!slides.length) return;
    if (activeIndex < 0) activeIndex = 0;

    const renderHeroSlide = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeIndex);
      });
    };

    const stopAutoplay = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (slides.length <= 1) return;
      timer = window.setInterval(() => renderHeroSlide(activeIndex + 1), autoplayMs);
    };

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        renderHeroSlide(activeIndex - 1);
        startAutoplay();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        renderHeroSlide(activeIndex + 1);
        startAutoplay();
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        renderHeroSlide(index);
        startAutoplay();
      });
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    renderHeroSlide(activeIndex);
    startAutoplay();
  });

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
  const previewPdf = document.getElementById('site-preview-pdf');
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
  const previewSecondaryLink = document.getElementById('site-preview-secondary-link');
  const previewEducation = document.getElementById('site-preview-education');
  const previewEducationRow = document.getElementById('site-preview-education-row');
  const previewSalary = document.getElementById('site-preview-salary');
  const previewSalaryRow = document.getElementById('site-preview-salary-row');
  const previewVacancies = document.getElementById('site-preview-vacancies');
  const previewVacanciesRow = document.getElementById('site-preview-vacancies-row');
  const previewSphere = document.getElementById('site-preview-sphere');
  const previewSphereRow = document.getElementById('site-preview-sphere-row');
  const previewOrganizer = document.getElementById('site-preview-organizer');
  const previewOrganizerRow = document.getElementById('site-preview-organizer-row');
  const previewAgency = document.getElementById('site-preview-agency');
  const previewAgencyRow = document.getElementById('site-preview-agency-row');
  const previewRegime = document.getElementById('site-preview-regime');
  const previewRegimeRow = document.getElementById('site-preview-regime-row');
  const previewTarget = document.getElementById('site-preview-target');
  const previewTargetRow = document.getElementById('site-preview-target-row');
  const previewLinkLabel = document.getElementById('site-preview-link-text');
  
  const adminAccessModal = document.getElementById('site-admin-access-modal');
  const adminAccessTrigger = document.getElementById('site-admin-lock-trigger');
  const adminAccessClose = document.getElementById('site-admin-access-close');

  const closePreview = () => {
    if (previewModal) {
      previewModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (previewPdf) {
      previewPdf.src = '';
      previewPdf.style.display = 'none';
    }
  };

  const openPreview = (trigger) => {
    const item = trigger.closest('[data-preview-item]');
    if (!item || !previewModal) return;

    const image = item.dataset.previewImage || '';
    const badgeText = item.dataset.previewBadge || 'Visualização';
    const isPublicSelection = /concurso|processo seletivo/i.test(badgeText);
    const previewHref = item.dataset.previewLink || '';
    const isPdfLink = /\.pdf($|\?)/i.test(previewHref);

    // Basic Info
    if (previewBadge) previewBadge.textContent = badgeText;
    if (previewTitle) previewTitle.textContent = item.dataset.previewTitle || '';
    if (previewDescription) previewDescription.textContent = item.dataset.previewDescription || '';

    // Meta / Publication Date
    if (previewMetaLabel) previewMetaLabel.textContent = (item.dataset.previewMetaLabel || 'Publicado em');
    if (previewMetaValue) previewMetaValue.textContent = item.dataset.previewMetaValue || '';

    // Registration Period
    if (item.dataset.previewPeriod && previewPeriodRow) {
      if (previewPeriodLabel) previewPeriodLabel.textContent = (item.dataset.previewPeriodLabel || 'Inscrições');
      if (previewPeriod) previewPeriod.textContent = item.dataset.previewPeriod;
      previewPeriodRow.style.display = 'flex';
    } else if (previewPeriodRow) {
      previewPeriodRow.style.display = 'none';
    }

    // Education
    if (item.dataset.previewEducation && previewEducationRow) {
      if (previewEducation) previewEducation.textContent = item.dataset.previewEducation;
      previewEducationRow.style.display = 'flex';
    } else if (previewEducationRow) {
      previewEducationRow.style.display = 'none';
    }

    // Salary
    if (item.dataset.previewSalary && previewSalaryRow) {
      if (previewSalary) previewSalary.textContent = item.dataset.previewSalary;
      previewSalaryRow.style.display = 'flex';
    } else if (previewSalaryRow) {
      previewSalaryRow.style.display = 'none';
    }

    // Vacancies
    if (item.dataset.previewVacancies && previewVacanciesRow) {
      if (previewVacancies) previewVacancies.textContent = item.dataset.previewVacancies;
      previewVacanciesRow.style.display = 'flex';
    } else if (previewVacanciesRow) {
      previewVacanciesRow.style.display = 'none';
    }

    // Sphere
    if (item.dataset.previewSphere && previewSphereRow) {
      if (previewSphere) previewSphere.textContent = item.dataset.previewSphere;
      previewSphereRow.style.display = 'flex';
    } else if (previewSphereRow) {
      previewSphereRow.style.display = 'none';
    }

    // Organizer
    if (item.dataset.previewOrganizer && previewOrganizerRow) {
      if (previewOrganizer) previewOrganizer.textContent = item.dataset.previewOrganizer;
      previewOrganizerRow.style.display = 'flex';
    } else if (previewOrganizerRow) {
      previewOrganizerRow.style.display = 'none';
    }

    // Agency
    if (item.dataset.previewAgency && previewAgencyRow) {
      if (previewAgency) previewAgency.textContent = item.dataset.previewAgency;
      previewAgencyRow.style.display = 'flex';
    } else if (previewAgencyRow) {
      previewAgencyRow.style.display = 'none';
    }

    // Regime
    if (item.dataset.previewRegime && previewRegimeRow) {
      if (previewRegime) previewRegime.textContent = item.dataset.previewRegime;
      previewRegimeRow.style.display = 'flex';
    } else if (previewRegimeRow) {
      previewRegimeRow.style.display = 'none';
    }

    // Target
    if (item.dataset.previewTarget && previewTargetRow) {
      if (previewTarget) previewTarget.textContent = item.dataset.previewTarget;
      previewTargetRow.style.display = 'flex';
    } else if (previewTargetRow) {
      previewTargetRow.style.display = 'none';
    }

    // Links
    if (previewHref && (!isPublicSelection || isPdfLink)) {
      previewLink.href = previewHref;
      if (previewLinkLabel) {
        previewLinkLabel.textContent = isPublicSelection ? 'Ver edital oficial' : (item.dataset.previewLinkLabel || 'Acessar agora');
      }
      previewLink.target = isPublicSelection ? '' : (item.dataset.previewLinkTarget || '_blank');
      previewLink.rel = previewLink.target === '_blank' ? 'noopener noreferrer' : '';
      previewLink.dataset.inlinePdf = isPublicSelection && isPdfLink ? 'true' : 'false';
      previewLink.style.display = 'inline-flex';
    } else {
      previewLink.style.display = 'none';
    }

    // Secondary Link (Site do Processo)
    if (item.dataset.previewSecondaryLink && previewSecondaryLink) {
      previewSecondaryLink.href = item.dataset.previewSecondaryLink;
      previewSecondaryLink.style.display = 'inline-flex';
    } else if (previewSecondaryLink) {
      previewSecondaryLink.style.display = 'none';
    }

    // Media Logic
    if (previewPdf) {
      previewPdf.src = '';
      previewPdf.style.display = 'none';
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
    document.body.style.overflow = 'hidden'; // Bloquear scroll do body
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

  if (previewLink) {
    previewLink.addEventListener('click', (event) => {
      if (previewLink.dataset.inlinePdf !== 'true' || !previewPdf) {
        return;
      }

      event.preventDefault();
      previewPdf.src = previewLink.href;
      previewPdf.style.display = 'block';
      previewImage.style.display = 'none';
      previewFallback.style.display = 'none';
    });
  }

  const openAdminAccess = () => {
    if (!adminAccessModal) return;
    adminAccessModal.classList.add('is-open');
  };

  const closeAdminAccess = () => {
    if (!adminAccessModal) return;
    adminAccessModal.classList.remove('is-open');
  };

  if (adminAccessTrigger) {
    adminAccessTrigger.addEventListener('click', openAdminAccess);
  }

  const accessRoot = document.querySelector('[data-access-root]');

  if (accessRoot) {
    const validViews = new Set(['login', 'register-type', 'register-candidate', 'register-company', 'forgot-request', 'forgot-verify', 'forgot-reset']);
    const viewNodes = accessRoot.querySelectorAll('[data-access-view]');
    const accessTriggers = document.querySelectorAll('[data-access-target]');
    const normalizeView = (value) => {
      if (value === 'cadastro') return 'register-type';
      if (value === 'login') return 'login';
      return validViews.has(value) ? value : 'login';
    };

    const setAccessView = (view, syncUrl = true) => {
      const nextView = normalizeView(view);
      accessRoot.dataset.currentView = nextView;

      viewNodes.forEach((node) => {
        node.hidden = node.dataset.accessView !== nextView;
      });

      if (syncUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('section', nextView);
        window.history.replaceState({}, '', url.toString());
      }
    };

    const initialView = normalizeView(accessRoot.dataset.accessInitialView || new URL(window.location.href).searchParams.get('section') || window.location.hash.replace('#', ''));
    setAccessView(initialView, false);

    accessTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        const targetView = trigger.dataset.accessTarget;
        if (!targetView) return;
        event.preventDefault();
        setAccessView(targetView, true);
      });
    });

    const resendButton = accessRoot.querySelector('[data-resend-button]');
    const resendNote = accessRoot.querySelector('[data-resend-note]');
    const resendSeconds = accessRoot.querySelector('[data-resend-seconds]');

    if (resendButton) {
      let remaining = Number(resendButton.dataset.resendWait || 0);

      const tickResend = () => {
        if (remaining <= 0) {
          resendButton.disabled = false;
          if (resendNote) {
            resendNote.textContent = 'Voce pode reenviar o codigo se necessario.';
          }
          return;
        }

        resendButton.disabled = true;
        if (resendSeconds) {
          resendSeconds.textContent = String(remaining);
        }

        remaining -= 1;
        window.setTimeout(tickResend, 1000);
      };

      if (remaining > 0) {
        tickResend();
      }
    }
  }

  document.querySelectorAll('[data-repeat-add]').forEach((button) => {
    const repeatType = button.dataset.repeatAdd;
    const container = document.querySelector('[data-repeat-list="' + repeatType + '"]');
    const template = document.querySelector('template[data-repeat-template="' + repeatType + '"]');
    const emptyState = document.querySelector('[data-repeat-empty="' + repeatType + '"]');

    if (!container || !template) {
      return;
    }

    const updateRepeatState = () => {
      const items = container.querySelectorAll('[data-repeat-item="' + repeatType + '"]');
      items.forEach((item, index) => {
        const title = item.querySelector('[data-repeat-title="' + repeatType + '"]');
        if (title) {
          title.textContent = (repeatType === 'course' ? 'Curso ' : 'Experiencia profissional ') + (index + 1);
        }

        item.querySelectorAll('[data-repeat-checkbox="' + repeatType + '"]').forEach((checkbox) => {
          checkbox.value = String(index);
        });
      });

      if (emptyState) {
        emptyState.hidden = items.length > 0;
      }
    };

    button.addEventListener('click', () => {
      const wrapper = document.createElement('div');
      const nextIndex = container.querySelectorAll('[data-repeat-item="' + repeatType + '"]').length + 1;
      wrapper.innerHTML = template.innerHTML
        .replace(/__INDEX__/g, String(nextIndex))
        .replace(/__CHECKBOX_INDEX__/g, String(Math.max(0, nextIndex - 1)));

      const nextItem = wrapper.firstElementChild;
      if (!nextItem) {
        return;
      }

      container.appendChild(nextItem);
      updateRepeatState();

      const firstInput = nextItem.querySelector('input, textarea, select');
      if (firstInput && typeof firstInput.focus === 'function') {
        firstInput.focus();
      }
    });

    container.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-repeat-remove="' + repeatType + '"]');
      if (!removeButton) {
        return;
      }

      const item = removeButton.closest('[data-repeat-item="' + repeatType + '"]');
      if (!item) {
        return;
      }

      item.remove();
      updateRepeatState();
    });

    updateRepeatState();
  });

  document.querySelectorAll('form[data-required-summary]').forEach((form) => {
    const alertBox = form.querySelector('[data-form-alert]');

    const collectMissingFields = () => {
      const missing = [];
      const fields = form.querySelectorAll('[required]');
      const radioGroups = new Set();

      fields.forEach((field) => {
        if (field.disabled || field.closest('[hidden]')) return;

        if (field.type === 'radio') {
          if (radioGroups.has(field.name)) return;
          radioGroups.add(field.name);
          const checked = form.querySelector('input[type="radio"][name="' + field.name + '"]:checked');
          if (!checked) {
            missing.push(field.dataset.requiredLabel || field.name || 'Campo obrigatorio');
          }
          return;
        }

        if (!String(field.value || '').trim()) {
          missing.push(field.dataset.requiredLabel || field.name || 'Campo obrigatorio');
        }
      });

      return [...new Set(missing)];
    };

    form.addEventListener('submit', (event) => {
      const missingFields = collectMissingFields();
      if (!missingFields.length) {
        if (alertBox) {
          alertBox.hidden = true;
          alertBox.innerHTML = '';
        }
        return;
      }

      event.preventDefault();
      if (alertBox) {
        alertBox.hidden = false;
        alertBox.className = 'site-form-alert is-error';
        alertBox.innerHTML = '<strong>Preencha os campos obrigatorios antes de continuar.</strong><span>Faltam: ' + missingFields.join(', ') + '.</span>';
      }

      const firstMissing = form.querySelector('[required]:invalid, [required][value=""]');
      if (firstMissing && typeof firstMissing.focus === 'function') {
        firstMissing.focus();
      }
    });
  });

  const documentInputs = document.querySelectorAll('[data-document-check]');

  documentInputs.forEach((input) => {
    const feedback = input.parentElement.querySelector('[data-document-feedback]');
    const profile = input.dataset.documentProfile || '';
    const minLength = Number(input.dataset.documentMinLength || 11);

    const resetFeedback = () => {
      if (!feedback) return;
      feedback.className = 'site-inline-feedback';
      feedback.innerHTML = '';
    };

    const renderFeedback = (payload) => {
      if (!feedback) return;
      if (!payload || !payload.message) {
        resetFeedback();
        return;
      }

      feedback.className = payload.exists ? 'site-inline-feedback is-error' : 'site-inline-feedback is-success';

      if (payload.exists) {
        feedback.innerHTML = '<strong>' + payload.message + '</strong><div class="site-inline-feedback-actions"><a href="/acesso-candidato?section=login" class="site-button-ghost">Entrar</a><a href="/acesso-candidato?section=login" class="site-button-secondary">Recuperar senha</a></div>'; 
        return;
      }

      feedback.textContent = payload.message;
    };

    const checkDocument = async () => {
      const documentValue = String(input.value || '').replace(/\D/g, '');
      if (!documentValue || documentValue.length < minLength) {
        resetFeedback();
        return;
      }

      try {
        const response = await fetch('/auth/check-document?profile=' + encodeURIComponent(profile) + '&document=' + encodeURIComponent(documentValue));
        if (!response.ok) {
          resetFeedback();
          return;
        }

        const payload = await response.json();
        renderFeedback(payload);
      } catch (error) {
        resetFeedback();
      }
    };

    input.addEventListener('blur', checkDocument);
    input.addEventListener('input', () => {
      const documentValue = String(input.value || '').replace(/\D/g, '');
      if (documentValue.length < minLength) {
        resetFeedback();
      }
    });
  });

  if (adminAccessClose && adminAccessModal) {
    adminAccessClose.addEventListener('click', closeAdminAccess);
    adminAccessModal.addEventListener('click', (event) => {
      if (event.target === adminAccessModal) {
        closeAdminAccess();
      }
    });
  }
});
