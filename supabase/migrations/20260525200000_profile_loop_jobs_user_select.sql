-- Let signed-in users read their own profile loop jobs (match gallery still → loop MP4 on portrait change).

GRANT SELECT ON TABLE public.profile_loop_video_jobs TO authenticated;

DROP POLICY IF EXISTS profile_loop_video_jobs_select_own ON public.profile_loop_video_jobs;

CREATE POLICY profile_loop_video_jobs_select_own
  ON public.profile_loop_video_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON POLICY profile_loop_video_jobs_select_own ON public.profile_loop_video_jobs IS
  'Users may list completed loop jobs for their account to attach the right MP4 when picking a gallery still as profile portrait.';
