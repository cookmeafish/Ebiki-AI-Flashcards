# Teaching accuracy: regression cases (2026-11-15)

Real wrong answers independent judges caught in Ebi's replies (Chat, voice, Learn it, the lesson grader), on the
owner's own provider. Every later judge of teaching or voice asks these again (or the same shape) and counts
ACCURACY separately from style: a round never passes on style alone. Related: [[2026-11-15-voice-conversation]],
`src/utils/teachingStyle.test.js`, `src/utils/chatReply.js`, `src/features/kit/learnIt.js`.

| # | Ask (or the shape of it) | What Ebi said | The truth | Where |
|---|---|---|---|---|
| 1 | What does "madrugar" mean? | "a reflexive verb: me madrugo" | not reflexive in standard use: "madrugo" | Chat, language mode |
| 2 | What does "sobremesa" mean? | synonyms "tertulias", "charla" | neither means sobremesa (time chatting at the table after a meal) | Chat, language mode |
| 3 | Explain ser vs estar | "Son las tres" filed under permanent qualities; "ser = permanent" | time uses ser but is no permanent quality; the permanent/temporary rule breaks (está muerto, la fiesta es en casa) | Chat |
| 4 | Casual Spanish chat | "¿nadaron, o más bien relajarse?" | "¿nadaron, o más bien se relajaron?" | Chat, Ebi's own Spanish |
| 5 | A tú conversation | "¿Volvería a ese restaurante?" | "¿Volverías...?" (tú) | Voice |
| 6 | IDS vs IPS | "IDS catches things IPS might miss" | unsupported claim | Chat, general mode |
| 7 | Why rotate keys? | "old encrypted data becomes useless to them sooner" | data under a stolen key stays readable; rotation protects data encrypted after it | Chat, general mode |
| 8 | Is a background check a managerial control? | "yes, a person does it" | a person doing the work defines OPERATIONAL; the policy requiring it is managerial | Learn it |
| 9 | Is a firewall rule technical or managerial? | "a person deciding would be managerial or operational" | managerial is policy and oversight; a person doing a task is operational | Learn it |
| 10 | Which category is a policy written by HR? (answer: "a policy written by HR") | marked correct | an example names no category: wrong | Lesson grader (fixed: `judgeAnswer`) |
| 11 | Which category? (answer: an example of a different category) | "name the category" | say which category the example belongs to and why the right one fits | Lesson grader (fixed) |

What changed in the code for them: accuracy lines in Chat's prompt (the learner copies Ebi's sentences; state what a
control does AND does not do), Learn it gets the checked card plus its neighbouring cards and must not contradict
them (`learnNeighbours`), the grader names the real category. Still open (the owner's choice, it costs money on every
reply): a stronger model for chat and teaching roles, or a fact-check pass per reply.
