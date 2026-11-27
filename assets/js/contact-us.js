const bookingForm = document.getElementById('bookingForm');
const formMessage = document.getElementById('formMessage');
const bookingStatus = document.getElementById('bookingStatus');
const successModal = document.getElementById('successModal');
const unitButtons = document.querySelectorAll('.unit-option');
const loaLabel = document.getElementById('loaLabel');
const beamLabel = document.getElementById('beamLabel');
const loaInput = document.getElementById('loa');
const beamInput = document.getElementById('beam');

const summaryFields = {
  vessel: document.getElementById('summaryVessel'),
  loa: document.getElementById('summaryLoa'),
  beam: document.getElementById('summaryBeam'),
  weight: document.getElementById('summaryWeight'),
  service: document.getElementById('summaryService'),
  date: document.getElementById('summaryDate'),
  time: document.getElementById('summaryTime'),
  durationRow: document.getElementById('summaryDurationRow'),
  duration: document.getElementById('summaryDuration')
};

const parkingDurationField = document.getElementById('parkingDurationField');
const parkingDurationInput = document.getElementById('parkingDuration');

const fieldMap = {
  vesselName: summaryFields.vessel,
  loa: summaryFields.loa,
  beam: summaryFields.beam,
  weight: summaryFields.weight,
  service: summaryFields.service,
  preferredDate: summaryFields.date,
  preferredTime: summaryFields.time
};

let activeUnit = 'ft';

function setFieldError(field, hasError) {
  if (!field) return;
  field.classList.toggle('error', hasError);
  const input = field.querySelector('input, select, textarea');
  if (input) {
    input.classList.toggle('error', hasError);
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.field').forEach((field) => {
    field.classList.remove('error');
    const input = field.querySelector('input, select, textarea');
    if (input) {
      input.classList.remove('error');
    }
  });
}

function formatDimension(value, unit) {
  if (!value) return '[length]';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '[length]';
  return unit === 'm' ? `${numericValue.toFixed(1)} m` : `${numericValue.toFixed(1)} ft`;
}

function updateSummary() {
  const vesselValue = document.getElementById('vesselName').value.trim() || '[name]';
  const loaValue = document.getElementById('loa').value;
  const beamValue = document.getElementById('beam').value;
  const weightValue = document.getElementById('weight').value.trim() || '[approx. tonnes]';
  const serviceValue = document.getElementById('service').value || 'Launch / haul-out / lift and return';
  const dateValue = document.getElementById('preferredDate').value || '[date]';
  const timeValue = document.getElementById('preferredTime').value.trim() || '[time/window]';
  const durationValue = parkingDurationInput.value.trim();
  const isLiftService = serviceValue.toLowerCase().includes('lift');

  summaryFields.vessel.textContent = vesselValue;
  summaryFields.loa.textContent = formatDimension(loaValue, activeUnit);
  summaryFields.beam.textContent = formatDimension(beamValue, activeUnit);
  summaryFields.weight.textContent = `${weightValue} t`;
  summaryFields.service.textContent = serviceValue;
  summaryFields.date.textContent = dateValue;
  summaryFields.time.textContent = timeValue;

  if (isLiftService) {
    summaryFields.durationRow.hidden = false;
    summaryFields.duration.textContent = durationValue || '[duration]';
  } else {
    summaryFields.durationRow.hidden = true;
  }

  parkingDurationField.hidden = !isLiftService;
}

function setUnit(unit) {
  activeUnit = unit;
  const isMetric = unit === 'm';
  loaLabel.innerHTML = `LOA (${isMetric ? 'm' : 'ft'}) <span class="required-mark" aria-hidden="true">*</span>`;
  beamLabel.innerHTML = `Beam (${isMetric ? 'm' : 'ft'}) <span class="required-mark" aria-hidden="true">*</span>`;
  unitButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.unit === unit);
  });
  updateSummary();
}

unitButtons.forEach((button) => {
  button.addEventListener('click', () => setUnit(button.dataset.unit));
});

['vesselName', 'loa', 'beam', 'weight', 'service', 'preferredDate', 'preferredTime', 'parkingDuration'].forEach((fieldId) => {
  const element = document.getElementById(fieldId);
  if (element) {
    element.addEventListener('input', updateSummary);
    element.addEventListener('change', updateSummary);
  }
});

if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors();

    const formData = new FormData(bookingForm);
    const values = Object.fromEntries(formData.entries());
    const requiredFields = [
      { key: 'vesselName', label: 'Vessel name', field: document.getElementById('vesselName').closest('.field') },
      { key: 'contactName', label: 'Contact name', field: document.getElementById('contactName').closest('.field') },
      { key: 'loa', label: 'LOA', field: document.getElementById('loa').closest('.field') },
      { key: 'beam', label: 'Beam', field: document.getElementById('beam').closest('.field') },
      { key: 'draft', label: 'Draft', field: document.getElementById('draft').closest('.field') },
      { key: 'weight', label: 'Approx. weight', field: document.getElementById('weight').closest('.field') },
      { key: 'service', label: 'Service', field: document.getElementById('service').closest('.field') },
      { key: 'preferredDate', label: 'Preferred date', field: document.getElementById('preferredDate').closest('.field') },
      { key: 'email', label: 'Email', field: document.getElementById('email').closest('.field') }
    ];

    if (values.service && values.service.toLowerCase().includes('lift')) {
      requiredFields.push({ key: 'parkingDuration', label: 'Expected lot duration', field: document.getElementById('parkingDuration').closest('.field') });
    }

    const missingFields = requiredFields.filter(({ key }) => {
      const rawValue = values[key];
      if (!rawValue || !String(rawValue).trim()) {
        return true;
      }
      if (key === 'loa' || key === 'beam') {
        return Number(rawValue) < 1;
      }
      if (key === 'draft') {
        return Number(rawValue) < 0.1;
      }
      return false;
    });

    if (missingFields.length) {
      missingFields.forEach(({ field }) => setFieldError(field, true));
      const firstMissing = missingFields[0].field;
      firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstMissing?.querySelector('input, select, textarea')?.focus();
      formMessage.textContent = `Please complete the missing required fields before submitting: ${missingFields.map(({ label }) => label).join(', ')}.`;
      formMessage.classList.add('error');
      bookingStatus.textContent = 'Incomplete request';
      return;
    }

    const completedSections = Object.entries(values)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([key]) => key);

    bookingStatus.textContent = 'Request ready';
    formMessage.classList.remove('error');
    formMessage.textContent = `Thanks ${values.contactName || 'there'} — your full ${values.service.toLowerCase()} enquiry for ${values.vesselName} has been prepared with vessel, timing, and compliance details for review. ${completedSections.length} fields captured.`;

    if (successModal) {
      successModal.classList.add('visible');
      successModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  });
}

function closeSuccessModal() {
  if (!successModal) return;
  successModal.classList.remove('visible');
  successModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-close-modal]').forEach((element) => {
  element.addEventListener('click', closeSuccessModal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && successModal?.classList.contains('visible')) {
    closeSuccessModal();
  }
});

setUnit(activeUnit);
updateSummary();
