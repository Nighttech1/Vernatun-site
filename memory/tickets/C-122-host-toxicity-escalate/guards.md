# Guards — C-122 Host escalate

1. `lounge_api.py`: action `escalate` → mute publish + append `escalation.log` + Trust −25 при `target_client_id`.
2. UI: кнопка Escalate у host для remote (класс `participant-host-btn--escalate`), видна без hover.
3. `postModeration` принимает `escalate` + optional client id.
4. Data-safety: нет wipe trust/chat.
