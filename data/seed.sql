-- FactoryFlow AI — demo seed data
-- Run AFTER init.sql: psql -d buildathon -f data/seed.sql
-- Provides enough data to demonstrate:
--   1. Fast path  (alarm E217 already has a validated known fix)
--   2. Deep path  (alarm E042 hits manual + incident history)
--   3. Knowledge compounding  (run E217 twice — second is visibly faster)

-- ── Manuals ──────────────────────────────────────────────────────────────────
INSERT INTO manuals (id, title, source_filename) VALUES
    (1, 'Packaging Line B — Operations & Maintenance Manual v4.2', 'packaging_line_b_manual.pdf'),
    (2, 'Press Machine Series 5000 — Service Manual', 'press_5000_service.pdf')
ON CONFLICT DO NOTHING;

-- ── Machines ─────────────────────────────────────────────────────────────────
INSERT INTO machines (id, name, machine_type, manual_doc_id) VALUES
    (1, 'Packaging Line B', 'Packaging Machine', 1),
    (2, 'Press Machine Line A', 'Press Machine', 2),
    (3, 'CNC Mill Unit 3', 'CNC Mill', NULL)
ON CONFLICT DO NOTHING;

-- ── Manual chunks (alarm_codes array enables exact match in retrieve_manual) ──
INSERT INTO manual_chunks (manual_id, section_title, content, alarm_codes) VALUES
(
    1,
    'Section 8.3 — Alarm E217: Film Tension Sensor Fault',
    'Alarm E217 is triggered when the film tension sensor on the primary feed roller reads outside the acceptable range (0.4–1.2 kN). Common causes:
1. Film roll installed with incorrect tension setting — check dancer arm position.
2. Tension sensor calibration drift — unit requires recalibration every 90 operating days.
3. Broken or kinked film path between dancer arm and seal head — inspect visually.
4. Sensor connector contamination (common in high-humidity environments).

Recommended resolution procedure:
Step 1: Stop machine. Set tension to manual mode via HMI Panel > Tension Control > Manual Override.
Step 2: Jog dancer arm through full travel. Listen for binding.
Step 3: Check sensor output on HMI diagnostic screen — value should track arm movement linearly.
Step 4: If sensor output is flat or erratic, replace Film Tension Sensor (Part #FTS-217B).
Step 5: Recalibrate via HMI Panel > Diagnostics > Sensor Cal > Film Tension. Accept default values unless film spec changed.
Step 6: Run 5-metre test cycle to confirm alarm clear.',
    ARRAY['E217']
),
(
    2,
    'Section 12.1 — Alarm E042: Hydraulic Pressure Fault',
    'Alarm E042 fires when hydraulic circuit pressure falls below 180 bar during a press stroke. This alarm protects the die and workpiece from incomplete forming.

Primary causes:
1. Hydraulic pump wear — check flow rate against spec (min 45 L/min at 200 bar).
2. Relief valve set too low or worn seal causing bypass — check valve setting (should be 210 bar).
3. Hydraulic fluid low — reservoir level sensor may lag actual level; check visually.
4. Internal leak in press cylinder seal — check for fluid under machine during stroke.

Diagnostic steps:
Step 1: Check hydraulic fluid level — add ISO 46 hydraulic oil if below MIN mark.
Step 2: Connect pressure gauge to test port TP-3 (left side panel). Stroke press manually.
Step 3: If pressure < 180 bar, isolate by closing valve V12 and testing pump output alone.
Step 4: Pump output < spec = pump replacement (Part #HYD-P5-042). Call OEM service.
Step 5: If pump is OK, inspect relief valve RV-7 — replace seal kit (Part #RV7-SK).',
    ARRAY['E042']
);

-- ── Resolved knowledge (E217 already validated — fast path demo) ──────────────
-- times_reused = 2 means it's been used twice before — search_known will find
-- this and route_known_fix will take the fast path immediately on E217.
INSERT INTO resolved_knowledge (alarm_code, machine_type, distilled_cause, distilled_fix, times_reused, last_used_at)
VALUES (
    'E217',
    'Packaging Machine',
    'Film tension sensor (FTS-217B) reading out of range — typically calibration drift after 90+ operating days or sensor connector contamination in humid environment.',
    '1. Stop machine and set tension to Manual Override (HMI > Tension Control > Manual Override).
2. Jog dancer arm through full travel — listen/feel for binding.
3. Check sensor output on HMI Diagnostics; if flat/erratic → replace FTS-217B.
4. Recalibrate: HMI > Diagnostics > Sensor Cal > Film Tension.
5. Run 5-metre test cycle to confirm alarm clear.',
    2,
    now() - interval '3 days'
);

-- ── Incident history (E042 has 3 prior occurrences — strong deep-path signal) ──
INSERT INTO incidents (machine_id, alarm_code, operator_input, shift, probable_cause, recommended_fix, confidence_score, estimated_downtime_minutes, resolution_status, created_at, resolved_at)
VALUES
(
    2, 'E042',
    'Press Line A alarm E042 came up during production run. Press stopped mid-stroke.',
    'Day',
    'Hydraulic pump output below spec after ~2,000 hours of service',
    'Replaced hydraulic pump (Part #HYD-P5-042). Bled system, ran 10 test strokes at full load.',
    0.91,
    140,
    'resolved',
    now() - interval '45 days',
    now() - interval '44 days' + interval '2 hours 20 minutes'
),
(
    2, 'E042',
    'E042 on Line A again. Happened twice this shift.',
    'Night',
    'Relief valve RV-7 seal bypass causing pressure drop under full stroke load',
    'Replaced RV-7 seal kit (Part #RV7-SK). Reset relief valve to 210 bar. Verified with pressure gauge at TP-3.',
    0.87,
    75,
    'resolved',
    now() - interval '20 days',
    now() - interval '20 days' + interval '1 hour 15 minutes'
),
(
    2, 'E042',
    'Press alarm E042 showed up. Fluid level looked OK visually.',
    'Evening',
    'Hydraulic fluid low — reservoir level sensor lag; actual level was borderline',
    'Added 4L ISO 46 hydraulic oil to reservoir. Cycled press 5 times — alarm cleared.',
    0.78,
    30,
    'resolved',
    now() - interval '8 days',
    now() - interval '8 days' + interval '30 minutes'
);
