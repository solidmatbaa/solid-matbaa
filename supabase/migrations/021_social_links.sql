-- Update default social links in site_content

UPDATE public.settings
SET site_content = jsonb_set(
  jsonb_set(
    COALESCE(site_content, '{}'::jsonb),
    '{instagram_url}',
    '"https://www.instagram.com/solid_matbaa"'::jsonb
  ),
  '{facebook_url}',
  '"https://www.facebook.com/profile.php?id=61584217430497&locale=ar_AR"'::jsonb
)
WHERE site_content IS NOT NULL;
