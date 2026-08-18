"use strict";

function isEnabled(value) {
  return ["true", "1", "yes", "on"].includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
}

const settings = {};
const chromeFlags = [];

if (isEnabled(process.env.LH_IGNORE_CERT_ERRORS)) {
  chromeFlags.push("--ignore-certificate-errors");
}

if (isEnabled(process.env.LH_NO_SANDBOX)) {
  chromeFlags.push("--no-sandbox");
  chromeFlags.push("--disable-setuid-sandbox");
}

if (chromeFlags.length > 0) {
  settings.chromeFlags = chromeFlags.join(" ");
}

if (isEnabled(process.env.SHIELD_ENABLED)) {
  const username = process.env.SHIELD_USERNAME;
  const password = process.env.SHIELD_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "SHIELD_ENABLED=true requires SHIELD_USERNAME and SHIELD_PASSWORD.",
    );
  }

  const encodedCredentials = Buffer.from(
    `${username}:${password}`,
    "utf8",
  ).toString("base64");

  settings.extraHeaders = {
    Authorization: `Basic ${encodedCredentials}`,
  };
}

module.exports = {
  ci: {
    collect: {
      settings,
    },
  },
};
