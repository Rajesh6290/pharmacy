const warnedLegacyEnvVars = new Set<string>();

function warnLegacyEnvVar(legacyName: string, preferredName: string) {
  if (warnedLegacyEnvVars.has(legacyName)) return;
  warnedLegacyEnvVars.add(legacyName);
  console.warn(
    `Using legacy env var ${legacyName}. Please migrate to ${preferredName}.`
  );
}

export function getOptionalServerEnv(
  preferredName: string,
  legacyPublicName?: string
): string | undefined {
  const preferredValue = process.env[preferredName];
  if (preferredValue) return preferredValue;

  if (legacyPublicName) {
    const legacyValue = process.env[legacyPublicName];
    if (legacyValue) {
      warnLegacyEnvVar(legacyPublicName, preferredName);
      return legacyValue;
    }
  }

  return undefined;
}

export function getRequiredServerEnv(
  preferredName: string,
  legacyPublicName?: string
): string {
  const value = getOptionalServerEnv(preferredName, legacyPublicName);
  if (!value) {
    throw new Error(`Missing required environment variable: ${preferredName}`);
  }
  return value;
}

export function getJwtSecret(): string {
  return getRequiredServerEnv("JWT_SECRET", "NEXT_PUBLIC_JWT_SECRET");
}

export function getMongoUri(): string {
  return getRequiredServerEnv("MONGODB_URI", "NEXT_PUBLIC_MONGODB_URI");
}

export function getCloudinaryConfig() {
  return {
    cloud_name: getRequiredServerEnv(
      "CLOUDINARY_CLOUD_NAME",
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
    ),
    api_key: getRequiredServerEnv(
      "CLOUDINARY_API_KEY",
      "NEXT_PUBLIC_CLOUDINARY_API_KEY"
    ),
    api_secret: getRequiredServerEnv(
      "CLOUDINARY_API_SECRET",
      "NEXT_PUBLIC_CLOUDINARY_API_SECRET"
    ),
  };
}

export function getSmtpConfig() {
  return {
    host:
      getOptionalServerEnv("SMTP_HOST", "NEXT_PUBLIC_SMTP_HOST") ||
      "smtp.gmail.com",
    port: parseInt(
      getOptionalServerEnv("SMTP_PORT", "NEXT_PUBLIC_SMTP_PORT") || "587",
      10
    ),
    secure:
      getOptionalServerEnv("SMTP_SECURE", "NEXT_PUBLIC_SMTP_SECURE") === "true",
    user: getOptionalServerEnv("SMTP_USER", "NEXT_PUBLIC_SMTP_USER"),
    pass: getOptionalServerEnv("SMTP_PASS", "NEXT_PUBLIC_SMTP_PASS"),
  };
}

export function getRazorpayKeyId(): string {
  return getRequiredServerEnv("RAZORPAY_KEY_ID", "NEXT_PUBLIC_RAZORPAY_KEY_ID");
}

export function getRazorpayKeySecret(): string {
  return getRequiredServerEnv(
    "RAZORPAY_KEY_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_SECRET"
  );
}

export function getRazorpayWebhookSecret(): string {
  return getRequiredServerEnv(
    "RAZORPAY_WEBHOOK_SECRET",
    "NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET"
  );
}
