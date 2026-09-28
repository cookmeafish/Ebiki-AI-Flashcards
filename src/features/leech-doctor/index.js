// LEECH DOCTOR: finds the cards you keep failing (4+ lapses), diagnoses why, mentors you on the confusion,
// and proposes a card fix you accept or skip. Lives in the Practice hub.
import LeechScreen from './LeechScreen'

export default {
  id: 'leech-doctor',
  practiceActivities: [{ id: 'doctor', order: 30, icon: '🩺', titleKey: 'doc_title', descKey: 'doc_desc', Screen: LeechScreen }],
}
