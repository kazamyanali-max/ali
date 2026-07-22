const navbar = document.querySelector('[data-navbar]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const servicesList = document.querySelector('[data-services-list]');
const serviceSelect = document.querySelector('[data-service-select]');
const contactForm = document.querySelector('[data-contact-form]');
const submitButton = document.querySelector('[data-submit-button]');
const formStatus = document.querySelector('[data-form-status]');
const modal = document.querySelector('[data-service-modal]');
const modalTitle = document.querySelector('[data-modal-title]');
const modalCategory = document.querySelector('[data-modal-category]');
const modalDetails = document.querySelector('[data-modal-details]');
const modalFeatures = document.querySelector('[data-modal-features]');
const modalRequest = document.querySelector('[data-modal-request]');
let activeServiceId = '';

const services = window.siteConfig?.services ?? [];
const contact = window.siteConfig?.contact ?? {};

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const applyContactConfig = () => {
  document.querySelectorAll('[data-config-phone-link]').forEach((link) => {
    link.href = `tel:${contact.phone}`;
  });
  document.querySelectorAll('[data-config-email-link]').forEach((link) => {
    link.href = `mailto:${contact.email}`;
  });
  setText('[data-config-phone-text]', contact.phoneLabel);
  setText('[data-config-email-text]', contact.email);
  setText('[data-config-address]', contact.address);
  setText('[data-config-hours]', contact.workingHours);
};

const createServiceCard = (service, index) => {
  const article = document.createElement('article');
  article.className = `service-card reveal${index === 0 ? ' featured' : ''}`;
  article.innerHTML = `
    <span class="icon">${service.icon}</span>
    <small>${service.category}</small>
    <h3>${service.title}</h3>
    <p>${service.summary}</p>
    <button class="service-link" type="button" data-service-id="${service.id}">جزئیات خدمت</button>
  `;
  return article;
};

const renderServices = () => {
  if (!servicesList) return;
  servicesList.replaceWith(...services.map(createServiceCard));

  services.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.title;
    serviceSelect?.appendChild(option);
  });
};

const openServiceModal = (serviceId) => {
  const service = services.find((item) => item.id === serviceId);
  if (!service || !modal) return;

  activeServiceId = service.id;
  modalTitle.textContent = service.title;
  modalCategory.textContent = service.category;
  modalDetails.textContent = service.details;
  modalFeatures.innerHTML = service.features.map((feature) => `<li>${feature}</li>`).join('');
  modalRequest.dataset.serviceShortcut = service.id;

  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
  }
};

const closeServiceModal = () => modal?.close?.() ?? modal?.removeAttribute('open');

const selectServiceAndFocusForm = (serviceId) => {
  if (serviceId && serviceSelect) {
    serviceSelect.value = serviceId;
    activeServiceId = serviceId;
  }
  closeServiceModal();
  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => contactForm?.querySelector('[name="name"]')?.focus(), 450);
};

menuToggle?.addEventListener('click', () => {
  const isOpen = navbar.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-links a, .nav-cta').forEach((link) => {
  link.addEventListener('click', () => {
    navbar.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', (event) => {
  const serviceButton = event.target.closest('[data-service-id]');
  if (serviceButton) openServiceModal(serviceButton.dataset.serviceId);

  const shortcut = event.target.closest('[data-service-shortcut]');
  if (shortcut) selectServiceAndFocusForm(shortcut.dataset.serviceShortcut || activeServiceId);

  if (event.target.matches('[data-modal-close], [data-modal-close-secondary]')) closeServiceModal();
});

modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeServiceModal();
});

const setFieldError = (name, message = '') => {
  const field = contactForm?.elements[name];
  const error = document.querySelector(`[data-error-for="${name}"]`);
  field?.classList.toggle('has-error', Boolean(message));
  if (error) error.textContent = message;
};

const validateForm = () => {
  const data = Object.fromEntries(new FormData(contactForm));
  const errors = {};
  const phonePattern = /^(\+98|0)?9\d{9}$/;

  if (!data.name?.trim() || data.name.trim().length < 2) errors.name = 'لطفاً نام را حداقل با ۲ حرف وارد کنید.';
  if (!phonePattern.test(String(data.phone).trim())) errors.phone = 'شماره تماس معتبر نیست. نمونه: 09123456789';
  if (!data.service) errors.service = 'لطفاً نوع خدمت را انتخاب کنید.';
  if (!data.message?.trim() || data.message.trim().length < 10) errors.message = 'توضیحات باید حداقل ۱۰ کاراکتر باشد.';

  ['name', 'phone', 'service', 'message'].forEach((name) => setFieldError(name, errors[name]));
  return { isValid: Object.keys(errors).length === 0, data };
};

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const { isValid } = validateForm();
  formStatus.className = 'form-status';

  if (!isValid) {
    formStatus.textContent = 'لطفاً خطاهای فرم را بررسی کنید.';
    formStatus.classList.add('is-error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'در حال ارسال...';
  formStatus.textContent = 'درخواست شما در حال ثبت است.';
  formStatus.classList.add('is-loading');

  window.setTimeout(() => {
    submitButton.disabled = false;
    submitButton.textContent = 'ارسال درخواست';
    formStatus.className = 'form-status is-success';
    formStatus.textContent = 'درخواست شما با موفقیت ثبت شد. برای اتصال به بک‌اند واقعی، فقط endpoint ارسال فرم را اضافه کنید.';
    contactForm.reset();
  }, 900);
});

contactForm?.addEventListener('input', (event) => {
  if (event.target.name) setFieldError(event.target.name);
  formStatus.textContent = '';
  formStatus.className = 'form-status';
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

renderServices();
applyContactConfig();
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
