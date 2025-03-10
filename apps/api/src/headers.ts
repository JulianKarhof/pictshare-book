import Elysia from "elysia";

export const securityHeaders = new Elysia().derive(({ set }) => {
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["strict-transport-security"] =
    "max-age=15552000; includeSubDomains";
  set.headers["x-permitted-cross-domain-policies"] = "none";
  set.headers["x-dns-prefetch-control"] = "off";
  set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
  set.headers["x-powered-by"];
});
