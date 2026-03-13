---
ejs:
  type: journey-adr
  version: 1.1
  adr_id: 0001
  title: Standardize Android E2E Toolchain on Java 21 with Gradle 8.13 Wrapper Patch
  date: 2026-03-14
  status: accepted
  session_id: ejs-session-2026-03-14-03
  session_journey: ejs-docs/journey/2026/ejs-session-2026-03-14-03.md

actors:
  humans:
    - id: mcfuzzysquirrel
      role: project owner
  agents:
    - id: project-orchestrator
      role: implementation orchestration and delivery
    - id: qa-engineer
      role: testing and CI setup

context:
  repo: mcfuzzy-test-personal-finance-app
  branch: main
---

# Session Journey

Link to the originating session artifact:
- Session Journey: `ejs-docs/journey/2026/ejs-session-2026-03-14-03.md`

# Context

The project moved from placeholder E2E scripts to real Detox Android automation. During local/CI setup, the generated Expo Android wrapper used Gradle 9.0.0, which produced Java-toolchain compatibility failures during Detox builds. The team also chose to standardize on Java 21 for security and modern toolchain alignment.

Key constraints:
- Keep Expo-managed source flow with on-demand prebuild for Android artifacts.
- Keep local and CI E2E behavior consistent.
- Avoid pinning to older JDK lines when a secure Java 21 path is viable.

---

# Session Intent

Get Android E2E to a stable, reproducible baseline in local dev and CI without downgrading Java security posture.


# Collaboration Summary

Human requested continuing implementation and explicitly directed that Java 21 should be used. Agent workflows validated build behavior across Java/Gradle combinations, identified that Gradle wrapper version (not Java 21 itself) was the primary incompatibility, then implemented script and CI updates plus diagnostics (`e2e:doctor`) to make failures actionable.

---

# Decision Trigger / Significance

This warranted an ADR because it is a cross-cutting build/toolchain decision affecting:
- all contributors running local Android E2E,
- CI reproducibility,
- future maintenance of scripts/docs,
- security posture (Java version policy).

# Considered Options

## Option A
Use Java 17 for Android E2E to maximize historical compatibility.

## Option B
Use Java 21 and patch generated Android Gradle wrapper from 9.0.0 to 8.13 in E2E build flow.

## Option C
Use Java 21 and keep Gradle 9.0.0 as-generated.

---

# Decision

Adopt **Option B**:
- Standardize Android E2E on **Java 21** (local + CI).
- In E2E build script, patch generated Android Gradle wrapper to **8.13** for compatibility with current Expo/RN Android toolchain.
- Keep a doctor/bootstrap flow to surface prerequisites clearly (`e2e:doctor`, Java helper, Android SDK helper).

---

# Rationale

- Option C failed in practice with toolchain incompatibility.
- Option A conflicts with desired security posture and user direction.
- Option B preserved Java 21 while restoring compatibility and keeping builds reproducible.
- Wrapper patching is deterministic and can be automated in script, minimizing manual drift.

Trade-offs:
- Slight script complexity increase.
- Need to monitor Expo/RN upgrades that may remove the need for wrapper patching.

---

# Consequences

### Positive
- Java policy aligns with security preference (Java 21).
- CI and local scripts share the same toolchain expectations.
- E2E setup errors are diagnosed quickly via `npm run e2e:doctor`.
- Deterministic Android build setup for Detox.

### Negative / Trade-offs
- Build script now mutates generated wrapper configuration after prebuild.
- Local E2E still depends on Android SDK/emulator installation outside repo control.
- Future framework upgrades may require revisiting this compatibility strategy.

---

# Key Learnings

- The primary incompatibility was Gradle wrapper version in generated Android project, not Java 21 itself.
- Early, explicit environment checks (Java/SDK/adb/emulator) significantly reduce setup/debug time.
- Converting opaque Gradle failures into fast-fail script guidance improves developer experience.

---

# Agent Guidance

Instructions and signals for future agents:
- Keep Java 21 as the default E2E toolchain unless a documented regression forces reevaluation.
- Preserve Gradle wrapper patching to 8.13 in Detox build flow until upstream tooling fully supports as-generated wrapper behavior.
- Use `npm run e2e:doctor` before troubleshooting deeper Detox failures.
- Treat missing Android SDK/emulator tooling as environment blockers, not app-code defects.

---

# Reuse Signals (Optional)

```yaml
reuse:
  patterns:
    - "Use scripted environment bootstrap + doctor commands for mobile E2E prerequisites"
    - "Patch generated build wrappers in script when upstream generator lags runtime compatibility"
  prompts:
    - "Run e2e:doctor and report blockers before debugging Detox tests"
  anti_patterns:
    - "Assume Java version mismatch without validating Gradle wrapper compatibility"
    - "Rely on manual local.properties setup only"
  future_considerations:
    - "Remove wrapper patch when Expo/RN toolchain supports generated Gradle version with Java 21"
```
