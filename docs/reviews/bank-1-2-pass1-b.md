# Question bank 1.2, pass 1 (accuracy), part B

Pass 1 for the last 18 cards of objective 1.2 in package order (i1-2-4810105c Physical security through
i1-2-1d176e79 Honeytoken), 180 questions, in `dev/careers/sources/security-plus-sy0-701/bank/1-2.json`. Truth: the
cards in `public/careers/security-plus-sy0-701.json`, the chapter `knowledge/d1.md`, and the sources named per row.
Related: [plan](../plans/2026-11-16-exam-format-questions.md) Phase B, [1.1 pilot report](bank-pilot-1-1-report.md).

## Totals
- Checked: 180. PASS: 172. FIXED: 8 (one of them contested, rewritten to an uncontested example). DROPPED: 0. Refills needed: none.
- BEST questions in this part after the fixes: 13 (2 turned into plain questions).
- Build preview (`build-bank.mjs --preview --allow-short`): no problems; C10 warnings left for pass 3.
- p1 stamped on all 180 (run twice).

## Writer's flags
- i1-2-16c4c6d2.6 (BEST, IDS runner, near-zero false positives): PASS, sourced.
- i1-2-cd158454.2 (level 1 BEST, microwave covers more than infrared): FIXED; no source settles the comparison, so BEST was removed.
- Level 1 inference questions on infrared, microwave and ultrasonic: all answerable from the card (b1e0e898.3 by elimination).

## Sensor facts against vendor-independent sources
- PIR is passive, blocked by glass, most sensitive to motion across its zones; microwave and ultrasonic are active
  Doppler sensors, most sensitive to motion toward or away; microwave passes glass, drywall and wood but not metal;
  ultrasonic stays in the room. Consistent across d1 and vendor-independent comparisons
  (https://www.vesternet.com/blogs/smart-home/pir-vs-microwave-motion-sensors-which-works-better,
  https://www.rfwireless-world.com/terminology/microwave-sensor-vs-pir-sensor).
- CONTESTED and removed: "PIR range cannot be set electronically". PIR units with range potentiometers:
  https://www.wiltronics.com.au/wp-content/uploads/downloads/alh-pirmw-manual.pdf,
  https://alarmgrid.com/documents/honeywell-dt900-series-pir-and-microwave-adjustments-step-by-step.
  The chapter d1 "Infrared sensors" still says "Range is set by where it is mounted and aimed, not by an electronic
  setting"; the study guide should be corrected (not changed here: outside this pass).
- Not settled enough for a BEST edge: "microwave covers larger areas than infrared" (true in general; ranges overlap).

## For pass 3 (not accuracy)
- Stems with no person in a job: 1d27ddab.2, 2b388cf0.2, 3fd5834e.6, 84be52e0.2 (a visitor only), 36635eb8.9 (a budget review).
- 4810105c.8: partly flags uneven (see its row).

## Rows
| Question | Result | What and why | Source |
|---|---|---|---|
| i1-2-4810105c.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4810105c.8 | PASS | Key correct. For pass 3: cameras and the day-shift guard are as partly true as the steel door (each a single control) but are not flagged partly. | card keyPoints (layered defense) |
| i1-2-4810105c.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Physical access controls compared" (layering, detective sensors and cameras) |
| i1-2-4464ac34.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.8 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-4464ac34.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Bollards"; NIST SP 800-53 r5 PE-3(7) |
| i1-2-a47c7ca5.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.5 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-a47c7ca5.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access control vestibule"; NIST SP 800-53 r5 PE-3(8) |
| i1-2-bbe3e8cc.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.6 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-bbe3e8cc.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Fencing" |
| i1-2-0b16de98.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.5 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-0b16de98.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Video surveillance"; NIST SP 800-53 r5 PE-6 |
| i1-2-84be52e0.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.5 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-84be52e0.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security guards"; NIST SP 800-53 r5 PE-3(3) |
| i1-2-7daeebda.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.6 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-7daeebda.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Access badges" |
| i1-2-1d27ddab.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.8 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-1d27ddab.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Security lighting" |
| i1-2-92e8e207.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-92e8e207.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 sensors compared; ALH PIR/MW dual-tech manual |
| i1-2-b1e0e898.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.3 | PASS | Writer flag checked: "records no images" is not on the card, but each wrong option is false from the card alone, so a level 1 solver gets it by elimination; the fact is true (d1: a PIR sensor is not a camera). | d1 Infrared common confusions |
| i1-2-b1e0e898.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-b1e0e898.8 | PASS | Passive infrared sends nothing; ultrasonic and microwave transmit; microwave passes plasterboard. Edge settled by card and chapter. | d1 Infrared, Ultrasonic, Microwave |
| i1-2-b1e0e898.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Infrared sensors"; vendor-independent PIR comparisons |
| i1-2-1227072e.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-1227072e.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Pressure sensors" |
| i1-2-cd158454.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.2 | FIXED | BEST removed. The edge rested on "microwave covers larger areas than infrared", a generalization (long-range PIR units exist; sources give overlapping ranges), so no source settled the runner. Rewritten as a plain level 1 scenario (whole-floor motion detection); infrared taken out of the options, door contact switch (item null) added. | vesternet.com PIR vs microwave; rfwireless-world.com microwave vs PIR (overlapping ranges) |
| i1-2-cd158454.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.6 | FIXED (contested) | Runner why and edge said infrared range is set only by mounting, never by a setting. CONTESTED: many PIR detectors have a range potentiometer. Rewritten to an uncontested detail: one sensor must see through thin wooden partitions (microwave passes wood; infrared and ultrasonic do not). BEST dropped. | wiltronics.com.au alh-pirmw-manual.pdf; alarmgrid.com Honeywell DT900 adjustments; card definition; d1 Microwave strengths and limits |
| i1-2-cd158454.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Microwave sensors"; vendor range-adjustment manuals |
| i1-2-cd158454.9 | FIXED | Key "They cover larger areas than infrared" was the same unsettled generalization; replaced by "They detect motion from reflected signals" (card definition). Explain updated. | card definition |
| i1-2-3fd5834e.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-3fd5834e.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Ultrasonic sensors" |
| i1-2-16c4c6d2.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.6 | PASS | Writer flag checked: decoys giving far fewer false positives than an IDS is supported (no legitimate traffic reaches a decoy). Counter-views only say decoy alerts are not error-free, which "almost no" allows. The comparison is not contested. | d1 "Honeypot" why it matters; computerworld.com/article/2573345 (honeypots vs IDS false positives); lifars.com/2020/04/honeypots-honeynets |
| i1-2-16c4c6d2.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-16c4c6d2.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 deception compared; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.6 | FIXED | "Budget covers a single decoy machine" did not rule out a honeynet, which can run as virtual machines on one host (d1 Honeynet; 36635eb8.9 keys that fact). Now "only one decoy system, physical or virtual"; honeynet why and detail updated. | d1 "Honeynet" (virtual on one host) |
| i1-2-f7da1d02.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-f7da1d02.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeypot"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.5 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.6 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-36635eb8.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeynet"; NIST SP 800-53 r5 SC-26 |
| i1-2-2b388cf0.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-2b388cf0.1 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-2b388cf0.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-2b388cf0.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-2b388cf0.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-2b388cf0.5 | FIXED | Runner why and edge said a honeytoken alerts "only when its data is used". Canary-style document tokens alert on opening, so the absolute claim was arguable. Reworded to the course definition (honeytoken = planted data, alert on use or sighting; alert on opening the file = honeyfile). Key unchanged. | d1 "Honeyfile" and "Honeytoken" common confusions |
| i1-2-2b388cf0.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-2b388cf0.7 | FIXED | Log user "svc-scanner" gave a plausible legitimate reason to open the decoy (indexing and antivirus scanners open files), which weakened the key. Now user=svc-print. | d1 "Honeyfile" example |
| i1-2-2b388cf0.8 | FIXED | A wrong option why rested on "less likely" (a usually-judgment). Now it names the failed requirement: the shares and admin machines the intruder searches get no bait. | d1 "Honeyfile" how it works, step 2 |
| i1-2-2b388cf0.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeyfile" |
| i1-2-1d176e79.0 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.1 | FIXED | Ask "what can a honeytoken reveal that a honeyfile cannot" was arguable (a honeyfile with call-back content also reports where it was opened). Now "Which of the following is a honeytoken designed to reveal?"; option 0 why and explain adjusted. Key unchanged. | card keyPoints; d1 "Honeyfile" step 3 |
| i1-2-1d176e79.2 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.3 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.4 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.5 | PASS | Key, every why, explain, edge true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.6 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.7 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.8 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
| i1-2-1d176e79.9 | PASS | Key, every why, explain true; one defensible answer. | card + d1 "Honeytoken" |
