/**
 * robots.txt checking, to RFC 9309.
 *
 * A shop's /products.json is served openly, so nothing stops us reading it.
 * robots.txt is where a site says whether it wants that — the clearest "no"
 * the web has. Ignoring it isn't illegal in most places, but in a dispute it
 * is the difference between having checked and having not bothered, and TallZ
 * is a real business asking retailers for affiliate deals. Cheap to respect.
 *
 * Deliberately small: this reads the rules a site publishes and answers one
 * question. It is not a crawler framework.
 */

import { UA } from "./shopify-source.mjs";

/** The token a site would name us by, taken from our own User-Agent string. */
export const UA_TOKEN = "tallz-product-research";

/**
 * Turns a robots.txt path pattern into a regex.
 *
 * `*` matches any run of characters, `$` at the end anchors, everything else is
 * literal — so a path containing `.` or `?` can't quietly act as a wildcard.
 */
function patternToRegExp(pattern) {
  // The anchor has to come off before escaping — otherwise the trailing "$"
  // is escaped into a literal dollar sign and stops being an anchor at all.
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;

  let source = "";
  for (const char of body) {
    if (char === "*") source += ".*";
    else source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }

  return new RegExp(`^${source}${anchored ? "$" : ""}`);
}

/**
 * Parses robots.txt into the rule groups that apply to one user agent.
 *
 * Consecutive `User-agent:` lines share the group that follows them, which is
 * why agents are collected before the first rule rather than one at a time.
 */
export function parseRobots(text, userAgentToken = UA_TOKEN) {
  const groups = [];
  let current = null;
  let expectingAgents = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator < 0) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!expectingAgents || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
        expectingAgents = true;
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if (field === "allow" || field === "disallow") {
      if (!current) continue; // rules before any user-agent line apply to nobody
      expectingAgents = false;
      current.rules.push({ allow: field === "allow", path: value });
    }
  }

  const token = userAgentToken.toLowerCase();
  const named = groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a)));
  // A group naming us wins outright; only if none does do the `*` rules apply.
  const applicable = named.length > 0 ? named : groups.filter((g) => g.agents.includes("*"));

  return applicable.flatMap((g) => g.rules);
}

/**
 * Is `path` allowed by these rules?
 *
 * Longest matching pattern wins, and Allow beats Disallow on a tie — the
 * precedence RFC 9309 defines. An empty Disallow value means "nothing is
 * disallowed" and is skipped rather than treated as matching everything.
 */
export function isPathAllowed(rules, path) {
  let best = null;

  for (const rule of rules) {
    if (rule.path === "") continue;
    if (!patternToRegExp(rule.path).test(path)) continue;

    const length = rule.path.length;
    if (!best || length > best.length || (length === best.length && rule.allow)) {
      best = { length, allow: rule.allow };
    }
  }

  return best ? best.allow : true;
}

/**
 * Fetches a site's robots.txt and reports whether it permits reading its
 * product feed.
 *
 * Status handling follows RFC 9309: a 4xx means no rules exist, so everything
 * is allowed; a 5xx or a network failure means we cannot know, and the
 * conservative reading is to stay out rather than assume consent.
 */
export async function checkRobots(baseUrl, path = "/products.json") {
  let response;
  try {
    response = await fetch(new URL("/robots.txt", baseUrl).toString(), {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
  } catch (err) {
    return { allowed: false, reason: `robots.txt unreachable — ${err.cause?.code || err.message}` };
  }

  if (response.status >= 400 && response.status < 500) {
    return { allowed: true, reason: "no robots.txt published" };
  }
  if (!response.ok) {
    return { allowed: false, reason: `robots.txt returned HTTP ${response.status}` };
  }

  const rules = parseRobots(await response.text());
  const allowed = isPathAllowed(rules, path);

  return {
    allowed,
    reason: allowed
      ? "robots.txt allows it"
      : `robots.txt disallows ${path} for our user agent`,
  };
}
