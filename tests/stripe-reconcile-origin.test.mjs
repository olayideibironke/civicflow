import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../src/app/api/stripe/reconcile/route.ts", import.meta.url), "utf8");

function allowed(configuredOrigin, requestOrigin, requestUrl) {
  const canonical = new URL(configuredOrigin);
  const apexHost = canonical.hostname.startsWith("www.") ? canonical.hostname.slice(4) : canonical.hostname;
  const trustedOrigins = new Set([
    canonical.origin,
    `${canonical.protocol}//${apexHost}${canonical.port ? ":" + canonical.port : ""}`,
    `${canonical.protocol}//www.${apexHost}${canonical.port ? ":" + canonical.port : ""}`,
  ]);
  return !!requestOrigin && trustedOrigins.has(requestOrigin) && trustedOrigins.has(new URL(requestUrl).origin);
}

test("reconcile endpoint uses strict origin allowlist", () => {
  assert.match(source, /trustedOrigins\.has\(requestOrigin\)/);
  assert.match(source, /trustedOrigins\.has\(new URL\(request\.url\)\.origin\)/);
});
test("accepts CivicFlow apex and www", () => {
  for (const host of ["civicflowapp.org", "www.civicflowapp.org"]) {
    assert.equal(allowed("https://civicflowapp.org", `https://${host}`, `https://${host}/api/stripe/reconcile`), true);
  }
});
test("rejects foreign origin and cross-origin request", () => {
  assert.equal(allowed("https://civicflowapp.org", "https://evil.example", "https://civicflowapp.org/api/stripe/reconcile"), false);
  assert.equal(allowed("https://civicflowapp.org", "https://civicflowapp.org", "https://evil.example/api/stripe/reconcile"), false);
  assert.equal(allowed("https://civicflowapp.org", null, "https://civicflowapp.org/api/stripe/reconcile"), false);
});
