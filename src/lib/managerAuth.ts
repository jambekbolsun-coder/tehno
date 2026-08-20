const MANAGER_AUTH_DOMAIN = "tehno-six.vercel.app";

export const normalizeManagerPhone = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `996${digits.slice(1)}`;
  if (digits.length === 9) digits = `996${digits}`;
  return {
    digits,
    e164: digits ? `+${digits}` : "",
  };
};

export const getManagerAuthEmail = (phone: string) => {
  const { digits } = normalizeManagerPhone(phone);
  if (digits.length < 11 || digits.length > 15)
    throw new Error("Введите корректный номер телефона");
  return `manager.${digits}@${MANAGER_AUTH_DOMAIN}`;
};
