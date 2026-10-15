-- Lab edits keep running after the page closes.
-- subject_url is the picture being edited, so Gallery can show her while she gets ready.
-- notified_at marks the push that taps through to the finished picture.

ALTER TABLE public.studio_jobs
  ADD COLUMN IF NOT EXISTS subject_url text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

COMMENT ON COLUMN public.studio_jobs.subject_url IS
  'Storage or public URL of the picture this job is editing. Used for the in-progress card.';

COMMENT ON COLUMN public.studio_jobs.notified_at IS
  'When the ready push was sent. Null until the picture is saved.';

CREATE INDEX IF NOT EXISTS studio_jobs_runpod_idx
  ON public.studio_jobs (runpod_id);

CREATE INDEX IF NOT EXISTS studio_jobs_open_idx
  ON public.studio_jobs (status, created_at);
