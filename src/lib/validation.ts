export function cleanPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneInput(value: string) {
  const digits = cleanPhoneDigits(value);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidTenDigitPhone(value: string) {
  return value.replace(/\D/g, "").length === 10;
}

export function validateRequiredText(value: string, label: string) {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  return "";
}

export function validateRequiredEmail(value: string, label = "Email address") {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  if (!isValidEmail(value)) {
    return `${label} must be a valid email address.`;
  }

  return "";
}

export function validateRequiredPhone(value: string, label = "Phone number") {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  if (!isValidTenDigitPhone(value)) {
    return `${label} must be exactly 10 digits.`;
  }

  return "";
}

export function getFirstValidationError(errors: string[]) {
  return errors.find(Boolean) ?? "";
}