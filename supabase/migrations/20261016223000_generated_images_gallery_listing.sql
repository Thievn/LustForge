-- Same-pose edits (clothes on or off, fix, mask, background) are a linked compare of the source.
-- A new pose is its own gallery picture, still pointing at source_image_url for reference.
alter table public.generated_images
  add column if not exists gallery_listing text;

alter table public.studio_jobs
  add column if not exists gallery_listing text;

comment on column public.generated_images.gallery_listing is
  'compare: open with the before/after slider against source_image_url. picture: own tile; source_image_url is reference only.';

comment on column public.studio_jobs.gallery_listing is
  'Copied onto generated_images when an edit settles. compare or picture.';
